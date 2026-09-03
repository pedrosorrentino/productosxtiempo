import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import { calc } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import { sameCurrency } from "../../lib/currencies.ts";
import {
  formatHumanDuration,
  formatHours,
  formatMinutes,
  formatMonths,
  formatPercent,
  formatWeeks,
  formatWorkdays,
  formatYears,
  heroUnit,
} from "../../lib/format.ts";
import anchorsData from "../../data/anchors.json";
import countriesData from "../../data/countries.json";
import { buildShareUrl, parseUserStateFromQuery } from "../../lib/urls.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import type { UserState } from "../../lib/types.ts";
import {
  ageLine,
  ageLinePastRetirement,
  ageLineSmall,
  anchorLessThanOne,
  anchorSingular,
  anchors as anchorsI18n,
  cta,
  heroUnits,
  home,
  modeA,
  noSalary,
  priceForm,
  result,
  shareText,
  staleness,
} from "../../i18n/es.ts";
import CompareStrip from "./CompareStrip.tsx";
import CountryPicker, { type PickerCountry } from "./CountryPicker.tsx";
import Odometer from "./Odometer.tsx";
import PriceInput from "./PriceInput.tsx";
import ShareButton from "./ShareButton.tsx";
import UserForm, { type UserFormFields } from "./UserForm.tsx";
import YearBar from "./YearBar.tsx";
import LifeBarControl from "./LifeBarControl.tsx";
import LifeBattery from "./LifeBattery.tsx";
import WorkBattery from "./WorkBattery.tsx";
import { computeLifeImpact } from "../../lib/life.ts";
import { computeWorkImpact } from "../../lib/work.ts";

export type AnchorTable = Record<
  string,
  {
    cafe: number | null;
    iphone: number | null;
    alquiler: number | null;
    menu: number | null;
    gasolina: number | null;
    pan: number | null;
    cine: number | null;
    cerveza: number | null;
  } | undefined
>;

const ANCHORS = anchorsData as AnchorTable;

/** Rango de edad del SPEC §6 (entero 16–80; fuera → ignorar). */
const MIN_AGE = 16;
const MAX_AGE = 80;

/** Corte de compra minúscula del SPEC §6: años de sueldo entero < 0.05. */
const MIN_YEARS_FOR_AGE_LINE = 0.05;

const nfCount1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const nfCount0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

/** Recuento de anclas: entero si ≥ 10, 1 decimal si < 10 (criterio SPEC §8). */
const formatAnchorCount = (n: number): string =>
  (n >= 10 ? nfCount0 : nfCount1).format(n);

/** Importe económico ("Si apartas 300 € al mes"): es-ES, máx. 2 decimales. */
const formatAmount = (n: number): string =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);

type Hero = { value: string; unit: string; next: string | null };

/** Hero automático (SPEC §8): minutos/horas → jornadas → meses → años.
 * Con singular cuando la cifra redondea a 1 ("1 hora", no "1 horas"). */
const computeHero = (r: CalcResult): Hero => {
  if (r.hours < 1) {
    // Fix M5: precio minúsculo (< ~0,1 €) → < 1 minuto; "0" redondo miente.
    // Sin `next`: "menos de 1 hora" ya no aporta contexto aquí.
    const minutes = formatMinutes(r.hours * 60);
    if (minutes === "0") {
      return { value: "menos de un", unit: "minuto", next: null };
    }
    return {
      value: minutes,
      unit: minutes === "1" ? "minuto" : heroUnits.minutos,
      // Pulido Task 6 (C1): para compras sub-hora (café), formatHours
      // redondearía a "0 horas". La siguiente unidad humana es "menos de
      // 1 hora" (SPEC §8: compras minúsculas se comunican en minutos).
      next: heroUnits.lessThanOneHour,
    };
  }
  if (r.workdays8h < 1) {
    const hours = formatHours(r.hours);
    return {
      value: hours,
      unit: hours === "1" ? "hora" : heroUnits.horas,
      next: `${formatWorkdays(r.workdays8h)} ${heroUnits.jornadas}`,
    };
  }
  const { unit } = heroUnit(r.workdays8h, r.monthsFullPay);
  if (unit === "jornadas") {
    return {
      value: formatWorkdays(r.workdays8h),
      unit: heroUnits.jornadas,
      next: `${formatMonths(r.monthsFullPay)} ${heroUnits.meses}`,
    };
  }
  if (unit === "meses") {
    return {
      value: formatMonths(r.monthsFullPay),
      unit: heroUnits.meses,
      next: `${formatYears(r.yearsFullPay)} ${heroUnits.años}`,
    };
  }
  return { value: formatYears(r.yearsFullPay), unit: heroUnits.años, next: null };
};

/** El valor del hero es rodable (dígitos y separadores) o frase ("menos de un"). */
const isRollable = (value: string): boolean => /^[\d.,]+$/.test(value);

export interface ResultViewProps {
  countryCode: string;
  countryName: string;
  countrySlug: string;
  currencySymbol: string;
  medianNetMonthly: number | null;
  legalWeeklyHours: number;
  realAnnualHours: number | null;
  retirementAge: number;
  /** null → precio libre (/[country]/precio). */
  productId?: string | null;
  productName?: string | null;
  /**
   * Precio del producto para el país, con el fallback ES ya resuelto en la
   * página .astro (SPEC §7). null → solo override del usuario.
   */
  catalogPrice?: number | null;
  /**
   * true → el precio mostrado viene del fallback ES. Se decide comparando el
   * país de origen del precio en la página (contrato: NUNCA fiarse solo del
   * `origin` del JSON, que puede decir "local" en un precio de ES usado en
   * otro país).
   */
  priceConverted?: boolean;
  /**
   * Fecha del precio del catálogo ("YYYY-MM"), SPEC §9/§13: si es anterior a
   * `staleness.cutoff` se pinta el badge "puede estar desfasado" (evaluación
   * en cliente, la única evaluación posible en una isla). El override del
   * usuario no lleva fecha: con override activo no se muestra. Touch
   * permitido y documentado por Task 7 (badge de caducidad del precio).
   */
  catalogPriceDate?: string | null;
  /** Fuente oficial del precio de catálogo. */
  catalogPriceSource?: string | null;
}

/**
 * Isla del resultado (SPEC §10) en gramática de MARCADOR: placa de identidad,
 * marcador gigante a flaps, retícula de magnitudes, anclas como bandas de
 * señal, modo B y comparador en placas gemelas y placa de acciones. Recálculo
 * EN VIVO sin botón Calcular: cada cambio de estado (precio, neto, horas,
 * ahorro) recalcula al instante, persiste en `cet:v1` y sincroniza la URL con
 * history.replaceState vía urls.ts.
 */
export default function ResultView({
  countryCode,
  countryName,
  countrySlug,
  currencySymbol,
  medianNetMonthly,
  legalWeeklyHours,
  realAnnualHours,
  retirementAge,
  productId = null,
  productName = null,
  catalogPrice = null,
  priceConverted = false,
  catalogPriceDate = null,
  catalogPriceSource = null,
}: ResultViewProps) {
  const [state, setState] = useState<Partial<UserState>>({});
  const [mounted, setMounted] = useState(false);

  // Montaje: storage + query params (los params PISAN el storage, SPEC §7).
  // El override de precio guardado está ligado al producto Y al país en que
  // se creó (productId + countryCode en storage): pulido Task 8 — sin el
  // chequeo de país, un override en la moneda de A sobrevivía a saltar por
  // URL directa al mismo producto en B (misma página, otra moneda). El
  // override que viaja en la URL (?precio=) no se toca: es el share (§12).
  useEffect(() => {
    const fromQuery = parseUserStateFromQuery(
      new URLSearchParams(location.search),
    );
    const saved = loadUserState() ?? {};
    const overrideApplies =
      (saved.productId ?? null) === (productId ?? null) &&
      (saved.countryCode ?? null) === countryCode;
    const base: Partial<UserState> = { ...saved };
    if (!overrideApplies) {
      delete base.priceOverride;
      delete base.customLabel;
    }
    // Si el país guardado usa otra divisa, no arrastrar el sueldo o ahorro en otra moneda
    if (saved.countryCode && !sameCurrency(saved.countryCode, countryCode)) {
      delete base.netMonthly;
      delete base.monthlySavings;
    }
    if (productId != null) {
      // En una página de producto el nombre lo pone el catálogo.
      delete base.customLabel;
    }
    setState({ ...base, ...fromQuery });
    setMounted(true);
  }, [countryCode, productId]);

  // Persistencia + URL compartible en cada cambio de estado (SPEC §7, §12).
  useEffect(() => {
    if (!mounted) return;
    const persistable: Partial<UserState> = {
      ...state,
      countryCode,
      productId: productId ?? null,
      customLabel: productId == null ? (state.customLabel ?? null) : null,
    };
    saveUserState(persistable);
    history.replaceState(null, "", buildShareUrl(location.pathname, persistable));
  }, [state, mounted, countryCode, productId]);

  const priceOverride = state.priceOverride ?? null;
  const effectivePrice = priceOverride ?? catalogPrice ?? null;
  const netMonthly = state.netMonthly ?? medianNetMonthly;
  const weeklyHours = state.weeklyHours ?? legalWeeklyHours;
  const savings = state.monthlySavings ?? null;
  const age = state.age ?? null;
  // SPEC §6: solo edad entera 16–80 pinta la línea; fuera de rango → ignorar
  // (defensa extra: storage y URL ya saneada, pero la regla vive aquí también).
  const edadValida =
    age != null &&
    Number.isInteger(age) &&
    age >= MIN_AGE &&
    age <= MAX_AGE
      ? age
      : null;
  const displayName = productId != null ? productName : (state.customLabel ?? null);

  // Recálculo en vivo; CalcError capturada → estado vacío, nunca crash.
  let computed: CalcResult | null = null;
  let invalid = false;
  if (effectivePrice != null && netMonthly != null) {
    try {
      computed = calc({
        price: effectivePrice,
        netMonthly,
        weeklyHours,
        realAnnualHours,
        monthlySavings: savings,
        age,
        retirementAge,
      });
    } catch {
      computed = null;
      invalid = true;
    }
  }

  const patch = (next: Partial<UserState>) =>
    setState((prev) => ({ ...prev, ...next }));
  const setPrice = (value: number | null) => patch({ priceOverride: value });
  const setLabel = (value: string | null) => patch({ customLabel: value });
  const setUserFields = (fields: UserFormFields) => patch(fields);

  const viewMode = state.viewMode ?? (edadValida != null ? "life" : "work");
  const isLifeMode = viewMode === "life";

  const onAgeChange = (newAge: number | null) => {
    patch({ age: newAge, viewMode: "life" });
  };
  const onViewModeChange = (mode: "work" | "life") => {
    patch({ viewMode: mode });
  };

  const lifeImpact = computed
    ? computeLifeImpact({
        hours: computed.hours,
        yearsFullPay: computed.yearsFullPay,
        weeklyHours,
        userAge: edadValida,
        retirementAge,
      })
    : null;

  const workImpact = computed
    ? computeWorkImpact({
        hours: computed.hours,
        workdays: computed.workdays8h,
        netMonthly,
        weeklyHours,
        price: effectivePrice ?? undefined,
      })
    : null;

  const pickerCountries: PickerCountry[] = countriesData.map((c) => ({
    name: c.name,
    slug: c.slug,
  }));
  // Otro país: conserva neto/horas/ahorro/edad (son independientes de la
  // moneda), suelta el precio y el nombre (atados al país/producto actual).
  const hrefFor = (slug: string): string =>
    buildShareUrl(`/${slug}/${productId ?? "precio"}`, {
      ...state,
      priceOverride: null,
      customLabel: productId == null ? (state.customLabel ?? null) : null,
    });

  const showConvertedBadge =
    effectivePrice != null && priceConverted && priceOverride == null;
  // Badge de caducidad (SPEC §9/§13): solo con el precio del catálogo en uso
  // (el override del usuario no tiene fecha). Comparación lexicográfica
  // segura para "YYYY-MM"; mismo corte fijo que StaleDataBadge.astro.
  const stalePriceDate =
    effectivePrice != null &&
    priceOverride == null &&
    catalogPriceDate != null &&
    catalogPriceDate < staleness.cutoff
      ? catalogPriceDate
      : null;

  // Renderizado inmediato en SSR con datos del catálogo; reacciona al montar si hay datos locales.

  const shareUrl =
    typeof location !== "undefined"
      ? `${location.origin}${buildShareUrl(location.pathname, state)}`
      : buildShareUrl("/", state);

  // Texto de reparto (SPEC §12) con el builder de i18n; la URL canónica
  // (paso 1) la añade ShareButton al compartir. Sin resultado calculado no
  // hay texto: ShareButton comparte solo la URL.
  const shareTextFor = (): string | undefined => {
    const c = computed;
    if (!c) return undefined;
    return shareText({
      productName: displayName ?? result.unnamedThing,
      countryName,
      hours: c.hours,
      workdays8h: c.workdays8h,
      fullPayPhrase: formatHumanDuration(
        c.hours,
        c.workdays8h,
        c.monthsFullPay,
        c.yearsFullPay,
      ),
      age: edadValida,
      yearsFullPay: c.yearsFullPay,
    });
  };

  const priceLine = (
    <p class="font-board-mono text-sm md:text-base opacity-90 flex flex-wrap items-center gap-x-3 gap-y-1">
      {effectivePrice != null && (
        <>
          <span>
            {formatAmount(effectivePrice)} {currencySymbol}
          </span>
          <span aria-hidden="true" class="text-secondary">·</span>
        </>
      )}
      <span>{countryName}</span>
      {showConvertedBadge && (
        <span class="board-stamp text-info" title={result.convertedPriceNote}>
          {result.convertedBadge}
        </span>
      )}
      {stalePriceDate != null && (
        <span class="board-stamp board-stamp-alert" title={staleness.badgeTitle(stalePriceDate)}>
          {staleness.badge} · {stalePriceDate}
        </span>
      )}
    </p>
  );

  const actions = (
    <section class="mt-10 space-y-4" aria-label={cta.myData}>
      <div class={`board-plate p-5 ${priceOverride != null ? "board-plate--active" : ""}`}>
        <div class="flex flex-wrap items-start gap-3">
          <span class="board-cat-icon" style="background: #ffb020; color: #14191d">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width={2}
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-signage uppercase text-2xl">{cta.changePriceTitle}</h3>
              <span
                class={`board-stamp ${priceOverride != null ? "text-primary" : "opacity-70"}`}
              >
                {priceOverride != null ? cta.changePriceLive : cta.changePriceRef}
              </span>
            </div>
            <p class="mt-1 text-sm opacity-80 max-w-2xl">{cta.changePriceNote}</p>
          </div>
        </div>
        <div class="mt-4">
          <PriceInput
            slug={countrySlug}
            currencySymbol={currencySymbol}
            initialPrice={effectivePrice}
            initialLabel={productId == null ? (state.customLabel ?? null) : null}
            onPriceChange={setPrice}
            onLabelChange={productId == null ? setLabel : undefined}
            // Pulido Task 8: en páginas de producto el nombre lo pone el
            // catálogo; el campo "Nombre (opcional)" era inerte aquí.
            showLabel={productId == null}
          />
        </div>
      </div>

      <details class="board-plate board-details p-5">
        <summary class="cursor-pointer font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 select-none font-semibold">
          <svg
            class="board-caret"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width={2}
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          {cta.myData}
        </summary>
        <div class="mt-4">
          <UserForm
            countryCode={countryCode}
            countryNetMonthly={medianNetMonthly}
            countryWeeklyHours={legalWeeklyHours}
            currencySymbol={currencySymbol}
            age={edadValida}
            onChange={setUserFields}
          />
        </div>
      </details>

      <div class="grid items-end gap-4 sm:grid-cols-2">
        <CountryPicker
          countries={pickerCountries}
          label={result.otherCountry}
          placeholder={countryName}
          hrefFor={hrefFor}
        />
        <div class="board-share">
          <ShareButton url={shareUrl} text={shareTextFor()} />
        </div>
      </div>
    </section>
  );

  if (!computed) {
    return (
      <div>
        <div class="board-plate p-5">
          <h1 class="font-signage uppercase text-3xl md:text-5xl leading-none">
            {displayName ?? result.unnamedThing}
          </h1>
          <div class="mt-2">{priceLine}</div>
        </div>
        {netMonthly == null ? (
          <div role="alert" class="board-plate p-5 mt-4">
            <h2 class="font-signage uppercase text-2xl">{noSalary.title}</h2>
            <p class="text-sm opacity-80 mt-1">{noSalary.body}</p>
            <a class="board-navlink inline-block mt-3" href={`/${countrySlug}`}>
              {noSalary.goToCountry}
            </a>
          </div>
        ) : invalid ? (
          <div role="alert" class="board-plate p-5 mt-4">
            <span>{result.invalidInput}</span>
          </div>
        ) : (
          <p class="mt-4 text-lg">{priceForm.enterPricePrompt}</p>
        )}
        <p class="mt-4 text-sm opacity-80">{result.effortDisclaimer}</p>
        {actions}
      </div>
    );
  }

  const hero = computeHero(computed);
  const phrase = formatHumanDuration(
    computed.hours,
    computed.workdays8h,
    computed.monthsFullPay,
    computed.yearsFullPay,
  );

  // Línea sutil de vida laboral (SPEC §6, orden EXACTO de casos):
  // 1. sin edad → nada; edad fuera de 16–80 → ignorada (edadValida null)
  // 2. aniosRestantesTrabajo ≤ 0 → frase "la jubilación de referencia ya
  //    quedó atrás" (el orden de la spec pone este caso antes del corte de
  //    compra minúscula)
  // 3. yearsFullPay < 0.05 → compra minúscula, no pintar
  // 4. pct < 1 → ageLineSmall
  // 5. default → ageLine con fraseAnios de formatHumanDuration y pct según §8
  //    (formatPercent: entero si ≥ 2). aniosSueldoEntero ES yearsFullPay del
  //    modo A; NO se inventa otra unidad.
  let ageLineText: string | null = null;
  if (edadValida != null) {
    const aniosRestantesTrabajo = Math.max(0, retirementAge - edadValida);
    if (aniosRestantesTrabajo <= 0) {
      ageLineText = ageLinePastRetirement(edadValida);
    } else if (computed.yearsFullPay < MIN_YEARS_FOR_AGE_LINE) {
      ageLineText = null;
    } else {
      const pct = (computed.yearsFullPay / aniosRestantesTrabajo) * 100;
      ageLineText =
        pct < 1
          ? ageLineSmall(edadValida, aniosRestantesTrabajo)
          : ageLine(edadValida, phrase, pct, aniosRestantesTrabajo);
    }
  }

  const effectiveHeroValue =
    isLifeMode && lifeImpact?.pctCareerLeft != null
      ? formatPercent(lifeImpact.pctCareerLeft)
      : isLifeMode && lifeImpact
      ? formatPercent(lifeImpact.lifeWeeksCost)
      : hero.value;

  const effectiveHeroUnit =
    isLifeMode
      ? lifeImpact?.pctCareerLeft != null
        ? "% de tu vida laboral"
        : "semanas de vida"
      : hero.unit;

  const heroAria = `${effectiveHeroValue} ${effectiveHeroUnit}`;

  // Celdas de la retícula: jornadas manda (celda ámbar), % del año lleva
  // dígito ámbar; el resto, crema. Mismas cifras del desglose del SPEC.
  const cells: Array<{
    key: string;
    label: string;
    text: string;
    variant?: "fill" | "rate";
  }> = [
    {
      key: "workdays",
      label: result.workdaysLabel,
      text: formatWorkdays(computed.workdays8h),
      variant: "fill",
    },
    { key: "hours", label: result.hoursLabel, text: formatHours(computed.hours) },
    { key: "weeks", label: result.weeksLabel, text: formatWeeks(computed.weeks) },
    {
      key: "months",
      label: result.monthsFullPayLabel,
      text: formatMonths(computed.monthsFullPay),
    },
    {
      key: "years",
      label: result.yearsFullPayLabel,
      text: formatYears(computed.yearsFullPay),
    },
  ];
  if (realAnnualHours != null && computed.pctRealYear != null) {
    cells.push({
      key: "pct",
      label: result.pctRealYearLabel,
      text: `${formatPercent(computed.pctRealYear)}%`,
      variant: "rate",
    });
  }

  // Anclas del día a día (SPEC §10.8), como bandas de señal.
  const anchorRow = ANCHORS[countryCode];
  const anchorBands: Array<{
    key: string;
    text: string;
    count: string | null;
    color: string;
    path: JSX.Element;
  }> = [];
  if (anchorRow && effectivePrice != null) {
    const entries: Array<{
      key: string;
      value: number | null;
      singular: string;
      phrase: (n: string) => string;
      less?: string;
      color: string;
      path: JSX.Element;
    }> = [
      // Pulido Task 8: el sustantivo singular vive en i18n
      // (anchorSingular), no hardcodeado aquí.
      {
        key: "cafe",
        value: anchorRow.cafe,
        singular: anchorSingular.cafe,
        phrase: anchorsI18n.cafe,
        color: "#ffb020",
        path: (
          <>
            <path d="M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
            <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
            <path d="M7.5 3.5v2M11 3.5v2M14.5 3.5v2" />
          </>
        ),
      },
      {
        key: "iphone",
        value: anchorRow.iphone,
        singular: anchorSingular.iphone,
        phrase: anchorsI18n.iphone,
        color: "#4aa3ff",
        path: (
          <>
            <rect x="7" y="2.5" width="10" height="19" rx="2" />
            <path d="M11 18.5h2" />
          </>
        ),
      },
      {
        key: "alquiler",
        value: anchorRow.alquiler,
        singular: anchorSingular.alquiler,
        phrase: anchorsI18n.alquiler,
        color: "#3ec97e",
        path: (
          <>
            <path d="M3.5 10.5L12 3l8.5 7.5" />
            <path d="M5.5 9.5V21h13V9.5" />
          </>
        ),
      },
      {
        key: "menu",
        value: anchorRow.menu,
        singular: anchorSingular.menu,
        phrase: anchorsI18n.menu,
        color: "#f26db6",
        path: (
          <>
            <path d="M4 11h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2z" />
            <path d="M2 11h20M8 7v4M12 7v4M16 7v4" />
          </>
        ),
      },
      {
        key: "gasolina",
        value: anchorRow.gasolina,
        singular: anchorSingular.gasolina,
        phrase: anchorsI18n.gasolina,
        color: "#e8c52e",
        path: (
          <>
            <path d="M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
            <path d="M3 21h12M13 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8.5L17.5 6" />
            <path d="M8 7.5h3" />
          </>
        ),
      },
      {
        key: "pan",
        value: anchorRow.pan,
        singular: anchorSingular.pan,
        phrase: anchorsI18n.pan,
        color: "#c9a86a",
        path: (
          <>
            <path d="M4 11a8 4.5 0 0 1 16 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z" />
            <path d="M9.5 9 8 13.5M14 9l-1.5 4.5" />
          </>
        ),
      },
      {
        key: "cine",
        value: anchorRow.cine,
        singular: anchorSingular.cine,
        phrase: anchorsI18n.cine,
        color: "#9a6bff",
        path: (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7.5 5v14M16.5 5v14" />
            <path d="M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21" />
          </>
        ),
      },
      {
        key: "cerveza",
        value: anchorRow.cerveza,
        singular: anchorSingular.cerveza,
        phrase: anchorsI18n.cerveza,
        less: anchorLessThanOne.cerveza,
        color: "#e8722e",
        path: (
          <>
            <path d="M6 8h9v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8z" />
            <path d="M15 10h2.5A2.5 2.5 0 0 1 20 12.5v2a2.5 2.5 0 0 1-2.5 2.5H15" />
            <path d="M6.5 8a2.5 2.5 0 0 1 2.2-2.4 3.2 3.2 0 0 1 4.1.6A2.6 2.6 0 0 1 15 8" />
            <path d="M9 12v6M12 12v6" />
          </>
        ),
      },
    ];
    // Pulido Task 6 (C2): recuento < 1 → "menos de un {ancla}" (decisión
    // documentada): con 1 decimal, un café frente a un iPhone diría
    // "equivale a 0,0 iPhones", que dice cero donde la verdad es
    // "menos de uno".
    for (const e of entries) {
      if (e.value == null || e.value <= 0) continue;
      const count = effectivePrice / e.value;
      anchorBands.push({
        key: e.key,
        color: e.color,
        path: e.path,
        count: count < 1 ? null : formatAnchorCount(count),
        text:
          count < 1
            ? e.less ?? anchorsI18n.lessThanOne(e.singular)
            : e.phrase(formatAnchorCount(count)),
      });
    }
  }

  return (
    <div>
      {/* ---- Placa de identidad ---- */}
      <div class="board-plate p-5">
        <h1 class="font-signage uppercase text-3xl md:text-5xl leading-none">
          {displayName ?? result.unnamedThing}
        </h1>
        <div class="mt-2">{priceLine}</div>
      </div>

      {/* ---- Control de Vida & Modo ---- */}
      <div class="mt-4">
        <LifeBarControl
          age={edadValida}
          viewMode={viewMode}
          onAgeChange={onAgeChange}
          onViewModeChange={onViewModeChange}
          retirementAge={retirementAge}
        />
      </div>

      {/* ---- Marcador gigante ---- */}
      <section class="mt-8" aria-label={heroAria}>
        <div class="flex items-end gap-4 md:gap-6 flex-wrap">
          {isRollable(effectiveHeroValue) ? (
            <Odometer
              value={effectiveHeroValue}
              label={heroAria}
              class="text-[clamp(4rem,14vw,10rem)] leading-none"
            />
          ) : (
            <p
              class="font-signage text-[clamp(3rem,10vw,7rem)] leading-none"
              aria-label={heroAria}
            >
              {effectiveHeroValue}{" "}
              <span class="text-primary">{effectiveHeroUnit}</span>
            </p>
          )}
          {isRollable(effectiveHeroValue) && (
            <span class="font-signage uppercase text-primary text-[clamp(1.5rem,4vw,3rem)] leading-none pb-1 md:pb-3">
              {effectiveHeroUnit}
            </span>
          )}
        </div>
        {!isLifeMode && (
          <p class="mt-4 text-lg md:text-xl opacity-90">{home.fullPayTail(phrase)}</p>
        )}
        {!isLifeMode && hero.next && (
          <p class="mt-1 font-board-mono text-sm opacity-85">= {hero.next}</p>
        )}

        {/* Sección de Esfuerzo Laboral (Modo Trabajo con Dopamina) */}
        {!isLifeMode && workImpact && (
          <div class="mt-6 w-full max-w-4xl space-y-3">
            <WorkBattery
              impact={workImpact}
              productName={displayName ?? undefined}
            />
          </div>
        )}

        {/* Sección de Impacto Vital (Batería + Sentencia) */}
        {isLifeMode && lifeImpact && (
          <div class="mt-6 w-full max-w-4xl space-y-3">
            <LifeBattery
              age={edadValida}
              retirementAge={retirementAge}
              yearsFullPay={computed.yearsFullPay}
              pctCareerLeft={lifeImpact.pctCareerLeft}
              threat={lifeImpact.threat}
              onAgeChange={onAgeChange}
            />
            <div class={`p-4 rounded-lg border ${lifeImpact.threat.badgeClass}`}>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl" aria-hidden="true">{lifeImpact.threat.emoji}</span>
                <span class="font-signage uppercase text-lg tracking-wider font-bold">
                  {lifeImpact.threat.label}
                </span>
                <span class="font-board-mono text-sm opacity-85 ml-auto">
                  {lifeImpact.threat.description}
                </span>
              </div>
              <p class="font-board-mono text-base leading-relaxed mt-1">
                {lifeImpact.verdict}
              </p>
            </div>
          </div>
        )}

        <div class="mt-4 board-plate p-4 max-w-4xl">
          <span class="font-board-mono text-xs uppercase tracking-[0.1em] text-primary font-semibold block mb-1.5">
            Condiciones de cotización
          </span>
          <div class="space-y-1.5 font-board-mono text-sm opacity-90">
            <p>{result.effortDisclaimer}</p>
            <p>{modeA.disclaimer}</p>
            <p>{modeA.footnote}</p>
            {ageLineText && <p class="text-primary font-medium">{ageLineText}</p>}
            {catalogPriceSource && effectivePrice === catalogPrice && (
              <p class="text-primary pt-1 border-t border-base-300 font-medium">
                Fuente oficial: {catalogPriceSource} {catalogPriceDate ? `· ${catalogPriceDate}` : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---- Retícula de magnitudes ---- */}
      <section class="mt-10" aria-label={result.breakdownTitle}>
        <h2 class="font-signage uppercase text-3xl md:text-4xl">
          {result.breakdownTitle}
        </h2>
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {cells.map((cell) => (
            <div
              key={cell.key}
              class={`board-cell ${cell.variant === "fill" ? "board-cell--fill" : ""} ${cell.variant === "rate" ? "board-cell--rate" : ""}`}
            >
              <span class="font-board-mono text-xs uppercase tracking-[0.08em] opacity-85 block">
                {cell.label}
              </span>
              <span class="font-board-mono text-2xl md:text-3xl tabular-nums leading-tight block mt-1">
                {cell.text}
              </span>
            </div>
          ))}
        </div>
        <YearBar
          yearsFullPay={computed.yearsFullPay}
          realAnnualHours={realAnnualHours}
          userAge={edadValida}
        />
      </section>

      {/* ---- Bandas de señal: anclas ---- */}
      {anchorBands.length > 0 && (
        <section class="mt-10" aria-label={anchorsI18n.title}>
          <h2 class="font-signage uppercase text-3xl md:text-4xl">
            {anchorsI18n.title}
          </h2>
          <div class="mt-4 grid gap-1.5">
            {anchorBands.map((band) => {
              // La cifra viaja en voz contadora (mono tabular ámbar), el resto
              // de la frase en cuerpo: se parte por el recuento formateado.
              const parts = band.count ? band.text.split(band.count) : null;
              return (
                <div class="board-anchor" key={band.key}>
                  <span
                    class="board-cat-icon board-cat-icon--sm"
                    style={`background: ${band.color}; color: #14191d`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width={2}
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      {band.path}
                    </svg>
                  </span>
                  <span class="min-w-0 font-medium">
                    {parts && parts.length === 2 ? (
                      <>
                        {parts[0]}
                        <span class="font-board-mono text-primary tabular-nums board-mono-dense">
                          {band.count}
                        </span>
                        {parts[1]}
                      </>
                    ) : (
                      band.text
                    )}
                  </span>
                  <span class="board-row-arrow" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width={2}
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Comparador de nóminas (a todo el ancho) ---- */}
      {effectivePrice != null && (
        <CompareStrip
          countries={countriesData}
          currentCountryCode={countryCode}
          price={effectivePrice}
          currencySymbol={currencySymbol}
          initialCode={state.compareCountryCode ?? null}
          userAge={edadValida}
        />
      )}

      {actions}
    </div>
  );
}
