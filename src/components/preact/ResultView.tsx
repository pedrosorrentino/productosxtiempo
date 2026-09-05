import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact";
import { calc } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import { sameCurrency } from "../../lib/currencies.ts";
import {
  formatHumanDuration,
  formatHourlyWage,
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
import type { Product, UserState } from "../../lib/types.ts";
import {
  ageLine,
  ageLinePastRetirement,
  ageLineSmall,
  anchorLessThanOne,
  anchorSingular,
  anchors as anchorsI18n,
  board,
  categories,
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
import { CATEGORY_COLOR, CATEGORY_PATHS } from "./BoardRowCard.tsx";
import CompareStrip from "./CompareStrip.tsx";
import CountryPicker, { type PickerCountry } from "./CountryPicker.tsx";
import ChronoGauge from "./ChronoGauge.tsx";
import WorkCalendarGrid from "./WorkCalendarGrid.tsx";
import SalaryBenchmarkChart from "./SalaryBenchmarkChart.tsx";
import SavingsSimulator from "./SavingsSimulator.tsx";
import PriceInput from "./PriceInput.tsx";
import ShareButton from "./ShareButton.tsx";
import UserForm, { type UserFormFields } from "./UserForm.tsx";
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
  productShortName?: string | null;
  productCategory?: Product["category"] | null;
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
 * Isla del resultado en gramática de MARCADOR y TELEMETRÍA: placa de identidad,
 * odómetro monumental, disparador de dopamina con presets de sueldo en 1 clic,
 * palanca existencial de modos Trabajo vs Vida, diagnóstico citable E-E-A-T / IA,
 * magnitudes, anclas del día a día y comparador internacional cruzado.
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
  productShortName = null,
  productCategory = null,
  catalogPrice = null,
  priceConverted = false,
  catalogPriceDate = null,
  catalogPriceSource = null,
}: ResultViewProps) {
  const [state, setState] = useState<Partial<UserState>>({});
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  /** Presets dinámicos de sueldo adaptados a la economía del país actual. */
  const salaryPresets = useMemo(() => {
    const med = medianNetMonthly ?? 1800;
    const p1 = Math.round((med * 0.65) / 50) * 50;
    const p2 = Math.round((med * 0.85) / 50) * 50;
    const p3 = Math.round(med / 50) * 50;
    const p4 = Math.round((med * 1.35) / 50) * 50;
    const p5 = Math.round((med * 1.75) / 50) * 50;
    return Array.from(new Set([p1, p2, p3, p4, p5])).filter((n) => n > 0);
  }, [medianNetMonthly]);

  /** Límites mínimo y máximo para el slider continuo de nómina */
  const sliderMin = useMemo(() => {
    const med = medianNetMonthly ?? 1800;
    return Math.max(300, Math.round((med * 0.45) / 50) * 50);
  }, [medianNetMonthly]);

  const sliderMax = useMemo(() => {
    const med = medianNetMonthly ?? 1800;
    return Math.round((med * 2.8) / 50) * 50;
  }, [medianNetMonthly]);

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

  const applyPresetSalary = (amount: number) => {
    patch({ netMonthly: amount });
  };

  const onResetUserFields = () => {
    patch({ netMonthly: null });
  };

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
    <section class="mt-10 space-y-6" aria-label={cta.myData}>
      <div class={`board-plate p-5 sm:p-6 ${priceOverride != null ? "board-plate--active" : ""}`}>
        <div class="flex flex-wrap items-start gap-3">
          <span class="board-cat-icon shrink-0" style="background: #ffb020; color: #14191d">
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
            showLabel={productId == null}
          />
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-base-300">
        <div class="w-full sm:w-auto">
          <CountryPicker
            countries={pickerCountries}
            label={result.otherCountry}
            placeholder={countryName}
            hrefFor={hrefFor}
          />
        </div>
        <div class="board-share w-full sm:w-auto flex justify-end">
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
    <div class="space-y-8">
      {/* =========================================================================
          BLOQUE 1: TELEMETRÍA & IDENTIDAD DEL ÍTEM
          ========================================================================= */}
      <div class="board-plate p-5 sm:p-7 space-y-5">
        {/* Barra superior de telemetría */}
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300/80">
          {/* Izquierda: Píldora de Categoría + Precio Oficial */}
          <div class="flex items-center gap-2.5 flex-wrap">
            {productCategory && (
              <span
                class="board-cat-icon shrink-0"
                style={`background: ${CATEGORY_COLOR[productCategory] ?? "#3ec97e"}; color: #14191d`}
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
                  {CATEGORY_PATHS[productCategory]}
                </svg>
              </span>
            )}
            {productCategory && (
              <span class="font-board-mono text-xs uppercase tracking-wider font-semibold text-base-content/75">
                {categories[productCategory]}
              </span>
            )}
            {productCategory && <span class="text-base-300 font-board-mono">/</span>}
            <span class="font-board-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/25">
              {formatAmount(effectivePrice ?? catalogPrice ?? 0)} {currencySymbol}
            </span>
            {catalogPriceDate && (
              <span class="font-board-mono text-xs opacity-60">
                Ref. {catalogPriceDate}
              </span>
            )}
            {showConvertedBadge && (
              <span class="board-stamp text-info text-[10px] py-0.5" title={result.convertedPriceNote}>
                {board.esRefBadge}
              </span>
            )}
            {stalePriceDate != null && (
              <span class="board-stamp board-stamp-alert text-[10px] py-0.5" title={staleness.badgeTitle(stalePriceDate)}>
                {staleness.badge}
              </span>
            )}
          </div>

          {/* Derecha: Badge de Cotización Activa */}
          <div class="flex items-center gap-2">
            {state.netMonthly ? (
              <span class="inline-flex items-center gap-1.5 font-board-mono text-xs text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded">
                <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Cotizando con tu nómina
              </span>
            ) : (
              <span class="inline-flex items-center gap-1.5 font-board-mono text-xs text-base-content/70 bg-base-200 border border-base-300 px-2.5 py-1 rounded">
                Mediana de {countryName}
              </span>
            )}
          </div>
        </div>

        {/* Titular estilizado con pregunta natural y badge de tiempo */}
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1 max-w-2xl">
            <span class="font-board-mono text-xs uppercase tracking-widest text-base-content/60 block">
              Cotización laboral exacta · {productShortName ?? displayName}
            </span>
            <h1 class="font-signage uppercase text-3xl sm:text-4xl md:text-5xl leading-tight text-base-content">
              {productName ? `¿Cuánto tiempo cuesta ${displayName} en ${countryName}?` : (displayName ?? result.unnamedThing)}
            </h1>
            {!productCategory && <div class="mt-2">{priceLine}</div>}
          </div>

          {/* Badge de Impacto Héroe */}
          <div class="self-start lg:self-auto shrink-0 font-board-mono text-xs font-semibold px-3 py-2 rounded-lg bg-base-200/90 border border-base-300 text-base-content/90 flex items-center gap-2 shadow-xs">
            <span class="text-primary font-bold">⏱</span>
            <span>
              Equivale a <strong class="text-primary">{hero.value} {hero.unit}</strong> netos
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BLOQUE 2: EL NÚCLEO DE IMPACTO (Tacómetro Radial & Contador Cinético)
          ========================================================================= */}
      <section class="mt-4" aria-label={heroAria}>
        <ChronoGauge
          value={effectiveHeroValue}
          unit={effectiveHeroUnit}
          label={heroAria}
          pctMonth={computed && netMonthly && effectivePrice != null ? (effectivePrice / netMonthly) * 100 : 15}
          secondaryText={!isLifeMode && hero.next ? `= ${hero.next}` : null}
          fullPayTail={!isLifeMode ? home.fullPayTail(phrase) : null}
          isLifeMode={isLifeMode}
        />
      </section>

      {/* =========================================================================
          BLOQUE 3: DISPARADOR DE DOPAMINA SALARIAL (Ajuste de Nómina en 1 Clic)
          ========================================================================= */}
      <div class="board-plate p-5 sm:p-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-board-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2.5 py-0.5 rounded">
                {state.netMonthly ? "Cotizando con tus datos" : "Mediana nacional de referencia"}
              </span>
              <span class="font-board-mono text-xs text-base-content/80">
                {state.netMonthly
                  ? `Tu sueldo: ${state.netMonthly} ${currencySymbol}/mes (${formatHourlyWage(computed.hourlyWage, currencySymbol)}/h)`
                  : `${countryName}: ${medianNetMonthly ?? 1800} ${currencySymbol}/mes (${formatHourlyWage(computed.hourlyWage, currencySymbol)}/h)`}
              </span>
            </div>
            <h3 class="font-signage uppercase text-xl sm:text-2xl mt-2 text-base-content">
              ¿Quieres ver cuánto te cuesta a ti con tu sueldo real?
            </h3>
            <p class="font-board-mono text-xs opacity-80 mt-1">
              Pulsa un sueldo rápido para que el odómetro gire y recalcule el esfuerzo al instante:
            </p>
          </div>

          <div class="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFormOpen((prev) => !prev)}
              class="btn btn-sm bg-primary hover:bg-primary/80 text-neutral-900 font-board-mono text-xs uppercase font-bold tracking-wider shadow-md cursor-pointer"
            >
              {isFormOpen ? "Cerrar ▲" : "⚡ Ajustar mi nómina"}
            </button>
            {state.netMonthly && (
              <button
                type="button"
                onClick={onResetUserFields}
                class="btn btn-sm btn-ghost border border-base-300 text-base-content/70 hover:text-warning hover:border-warning font-board-mono text-xs uppercase cursor-pointer"
                title="Restablecer a la mediana nacional"
              >
                ↺ Mediana ({medianNetMonthly} {currencySymbol})
              </button>
            )}
          </div>
        </div>

        {/* Botones de Presets Rápidos */}
        <div class="mt-4 pt-3 border-t border-base-300/80 flex items-center gap-2 flex-wrap">
          <span class="font-board-mono text-xs opacity-75 mr-1">Elige un sueldo rápido:</span>
          {salaryPresets.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => applyPresetSalary(preset)}
              class={`px-3 py-1.5 rounded font-board-mono text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                state.netMonthly === preset
                  ? "bg-accent text-neutral-900 font-bold shadow-sm"
                  : "bg-base-100 hover:bg-primary hover:text-neutral-900 border border-base-300 hover:border-primary"
              }`}
            >
              {preset} {currencySymbol}/mes
            </button>
          ))}
        </div>

        {/* Slider Continuo de Nómina (Scrubber Táctil a 60 FPS) */}
        <div class="mt-4 pt-3 border-t border-base-300/80 space-y-2">
          <div class="flex items-center justify-between text-xs font-board-mono">
            <span class="opacity-80 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Desliza para simular en tiempo real:</span>
            </span>
            <span class="font-bold text-primary bg-base-200 px-2.5 py-0.5 rounded border border-base-300">
              {state.netMonthly ?? medianNetMonthly ?? 1800} {currencySymbol}/mes
            </span>
          </div>

          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={25}
            value={state.netMonthly ?? medianNetMonthly ?? 1800}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              if (Number.isFinite(val) && val > 0) {
                applyPresetSalary(val);
              }
            }}
            class="salary-slider"
            aria-label="Ajustar nómina mensual en tiempo real"
          />

          <div class="flex justify-between text-[11px] font-board-mono opacity-60">
            <span>{sliderMin} {currencySymbol}</span>
            <span>Mediana: {medianNetMonthly} {currencySymbol}</span>
            <span>{sliderMax} {currencySymbol}</span>
          </div>
        </div>

        {/* Formulario desplegable avanzado */}
        {isFormOpen && (
          <div class="mt-6 pt-5 border-t border-base-300">
            <UserForm
              countryCode={countryCode}
              countryNetMonthly={medianNetMonthly}
              countryWeeklyHours={legalWeeklyHours}
              currencySymbol={currencySymbol}
              age={edadValida}
              onChange={setUserFields}
            />
          </div>
        )}
      </div>

      {/* =========================================================================
          NUEVAS GRÁFICAS DE INTERACCIÓN & DOPAMINA VISUAL
          ========================================================================= */}
      {computed && effectivePrice != null && (
        <section class="space-y-4" aria-label="Visualizaciones interactivas de esfuerzo">
          {/* 1. Calendario del Mes Laboral (Días Cautivos vs Días Libres) */}
          <WorkCalendarGrid
            workdays8h={computed.workdays8h}
            hours={computed.hours}
            productName={displayName ?? "este producto"}
            currencySymbol={currencySymbol}
          />

          {/* 2. Gráfica Comparativa Salarial de Esfuerzo */}
          <SalaryBenchmarkChart
            productPrice={effectivePrice}
            currentNetMonthly={netMonthly ?? 1800}
            medianNetMonthly={medianNetMonthly ?? 1800}
            legalWeeklyHours={legalWeeklyHours}
            realAnnualHours={realAnnualHours}
            currencySymbol={currencySymbol}
            onSelectSalary={(salary) => applyPresetSalary(salary)}
          />

          {/* 3. Simulador de Ahorro y Fecha de Compra Libre de Deuda */}
          <SavingsSimulator
            productPrice={effectivePrice}
            netMonthly={netMonthly ?? 1800}
            currencySymbol={currencySymbol}
            productName={displayName ?? "este producto"}
          />
        </section>
      )}

      {/* =========================================================================
          BLOQUE 4: PALANCA EXISTENCIAL (Modo Trabajo vs Modo Tiempo de Vida)
          ========================================================================= */}
      <div class="space-y-4">
        <LifeBarControl
          age={edadValida}
          viewMode={viewMode}
          onAgeChange={onAgeChange}
          onViewModeChange={onViewModeChange}
          retirementAge={retirementAge}
        />

        {/* Visualización de Batería en Modo Trabajo */}
        {!isLifeMode && workImpact && (
          <div class="w-full space-y-3">
            <WorkBattery
              impact={workImpact}
              productName={displayName ?? undefined}
            />
          </div>
        )}

        {/* Visualización de Batería en Modo Vida */}
        {isLifeMode && lifeImpact && (
          <div class="w-full space-y-3">
            <LifeBattery
              age={edadValida}
              retirementAge={retirementAge}
              yearsFullPay={computed.yearsFullPay}
              pctCareerLeft={lifeImpact.pctCareerLeft}
              threat={lifeImpact.threat}
              onAgeChange={onAgeChange}
            />
            <div class={`p-4 rounded-lg border ${lifeImpact.threat.badgeClass}`}>
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xl shrink-0" aria-hidden="true">{lifeImpact.threat.emoji}</span>
                <span class="font-signage uppercase text-lg tracking-wider font-bold">
                  {lifeImpact.threat.label}
                </span>
                <span class="font-board-mono text-sm opacity-85 sm:ml-auto break-words">
                  {lifeImpact.threat.description}
                </span>
              </div>
              <p class="font-board-mono text-base leading-relaxed mt-1 break-words">
                {lifeImpact.verdict}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BLOQUE 5: DIAGNÓSTICO LABORAL OFICIAL (E-E-A-T & Motores de IA)
          ========================================================================= */}
      <section class="board-plate p-6 border-l-4 border-l-primary bg-base-200/70 shadow-sm" aria-label="Diagnóstico laboral oficial">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-base-300 mb-3 flex-wrap">
          <h2 class="font-board-mono text-xs uppercase tracking-[0.14em] text-primary font-bold">
            Diagnóstico Laboral Oficial · {displayName ?? result.unnamedThing} en {countryName}
          </h2>
          <span class="font-board-mono text-xs opacity-60">
            Percentil 50 (Mediana) · Horas reales OCDE
          </span>
        </div>

        <p class="text-base leading-relaxed text-base-content/95">
          En <strong>{countryName}</strong>, adquirir un <strong>{displayName ?? result.unnamedThing}</strong> con un precio de mercado de <strong>{formatAmount(effectivePrice ?? catalogPrice ?? 0)} {currencySymbol}</strong> requiere un esfuerzo laboral de <strong>{hero.value} {hero.unit}</strong> de trabajo íntegro (equivalente a <strong>{formatHours(computed.hours)} horas</strong> o <strong>{formatWorkdays(computed.workdays8h)} jornadas de 8 horas</strong>). Este cálculo se fundamenta en el salario neto mediano oficial de <strong>{medianNetMonthly ?? 1800} {currencySymbol}/mes</strong> y la semana legal de <strong>{legalWeeklyHours} horas</strong>, absorbiendo aproximadamente el <strong>{formatPercent(computed.pctRealYear ?? 0)}% del año laboral real</strong> de un empleado medio.
        </p>

        <div class="mt-4 pt-3 border-t border-base-300/80 flex flex-wrap items-center justify-between gap-2 text-xs font-board-mono opacity-80">
          <div class="flex items-center gap-4 flex-wrap">
            <span>{result.effortDisclaimer}</span>
            <span>{modeA.disclaimer}</span>
            {ageLineText && <span class="text-primary font-medium">{ageLineText}</span>}
          </div>
          {catalogPriceSource && (
            <span class="text-primary font-medium">
              Fuente oficial: {catalogPriceSource} {catalogPriceDate ? `· ${catalogPriceDate}` : ""}
            </span>
          )}
        </div>
      </section>

      {/* =========================================================================
          BLOQUE 6: DESGLOSE DE MAGNITUDES & ANCLAS CALLEJERAS
          ========================================================================= */}
      <section aria-label={result.breakdownTitle}>
        <h2 class="font-signage uppercase text-3xl md:text-4xl">
          {result.breakdownTitle}
        </h2>
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
      </section>

      {/* Bandas de señal: Anclas cotidianas */}
      {anchorBands.length > 0 && (
        <section aria-label={anchorsI18n.title}>
          <h2 class="font-signage uppercase text-3xl md:text-4xl">
            {anchorsI18n.title}
          </h2>
          <p class="mt-1 text-sm opacity-80 font-board-mono mb-4">
            ¿A cuánto equivale este importe en gastos cotidianos del país?
          </p>
          <div class="grid gap-2">
            {anchorBands.map((band) => {
              const parts = band.count ? band.text.split(band.count) : null;
              return (
                <div class="board-anchor" key={band.key}>
                  <span
                    class="board-cat-icon board-cat-icon--sm shrink-0"
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
                        <span class="font-board-mono text-primary tabular-nums font-bold">
                          {band.count}
                        </span>
                        {parts[1]}
                      </>
                    ) : (
                      band.text
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          BLOQUE 7: COMPARATIVA INTERNACIONAL & ACCIONES
          ========================================================================= */}
      {effectivePrice != null && (
        <section>
          <CompareStrip
            countries={countriesData}
            currentCountryCode={countryCode}
            price={effectivePrice}
            currencySymbol={currencySymbol}
            initialCode={state.compareCountryCode ?? null}
            userAge={edadValida}
          />
        </section>
      )}

      {/* Acciones: Cambiar precio, selector de país y compartir */}
      <section class="space-y-6 pt-4" aria-label={cta.myData}>
        <div class={`board-plate p-5 sm:p-6 ${priceOverride != null ? "board-plate--active" : ""}`}>
          <div class="flex flex-wrap items-start gap-3">
            <span class="board-cat-icon shrink-0" style="background: #ffb020; color: #14191d">
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
                <span class={`board-stamp ${priceOverride != null ? "text-primary" : "opacity-70"}`}>
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
              showLabel={productId == null}
            />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-base-300">
          <div class="w-full sm:w-auto">
            <CountryPicker
              countries={pickerCountries}
              label={result.otherCountry}
              placeholder={countryName}
              hrefFor={hrefFor}
            />
          </div>
          <div class="board-share w-full sm:w-auto flex justify-end">
            <ShareButton url={shareUrl} text={shareTextFor()} />
          </div>
        </div>
      </section>
    </div>
  );
}
