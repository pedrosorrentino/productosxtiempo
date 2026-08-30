import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { calc, WEEKS_PER_MONTH } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
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
import type { HeroUnit } from "../../lib/format.ts";
import anchorsData from "../../data/anchors.json";
import countriesData from "../../data/countries.json";
import { buildShareUrl, parseUserStateFromQuery } from "../../lib/urls.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import type { UserState } from "../../lib/types.ts";
import {
  anchors as anchorsI18n,
  cta,
  heroUnits,
  home,
  modeA,
  modeB,
  modeBTitle,
  noSalary,
  priceForm,
  result,
} from "../../i18n/es.ts";
import CountryPicker, { type PickerCountry } from "./CountryPicker.tsx";
import PriceInput from "./PriceInput.tsx";
import ShareButton from "./ShareButton.tsx";
import UserForm, { type UserFormFields } from "./UserForm.tsx";
import YearBar from "./YearBar.tsx";

type AnchorTable = Record<
  string,
  { cafe: number | null; iphone: number | null; alquiler: number | null } | undefined
>;

const ANCHORS = anchorsData as AnchorTable;

const nfCount1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const nfCount0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

/** Recuento de anclas: entero si ≥ 10, 1 decimal si < 10 (criterio SPEC §8). */
const formatAnchorCount = (n: number): string =>
  (n >= 10 ? nfCount0 : nfCount1).format(n);

/** Importe económico ("Si apartas 300 € al mes"): es-ES, máx. 2 decimales. */
const formatAmount = (n: number): string =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);

/**
 * Modo B (SPEC §10.5): resultado en meses/años de CALENDARIO con formato
 * humano. Atajos de copy de la tabla SPEC §8 reutilizados para el calendario.
 */
const humanCalendar = (months: number): string => {
  if (months < 1) return `${formatWeeks(months * WEEKS_PER_MONTH)} semanas`;
  if (months < 12) return `${formatMonths(months)} meses`;
  const years = months / 12;
  if (months >= 11 && months <= 13) return "un año";
  if (years >= 0.9 && years <= 1.15) return "un año";
  if (years >= 1.4 && years <= 1.7) return "un año y medio";
  if (years >= 2.4 && years <= 2.7) return "dos años y medio";
  return `${formatYears(years)} años`;
};

type Hero = { value: string; unit: string; next: string | null };

/** Hero automático (SPEC §8): minutos/horas → jornadas → meses → años. */
const computeHero = (r: CalcResult): Hero => {
  if (r.hours < 1) {
    return {
      value: formatMinutes(r.hours * 60),
      unit: heroUnits.minutos,
      next: `${formatHours(r.hours)} ${heroUnits.horas}`,
    };
  }
  if (r.workdays8h < 1) {
    return {
      value: formatHours(r.hours),
      unit: heroUnits.horas,
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
}

/**
 * Isla del resultado (SPEC §10): hero automático, frase humana, disclaimers,
 * desglose, modo B con ahorro, YearBar, anclas y acciones. Recálculo EN VIVO
 * sin botón Calcular: cada cambio de estado (precio, neto, horas, ahorro)
 * recalcula al instante, persiste en `cet:v1` y sincroniza la URL con
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
}: ResultViewProps) {
  const [state, setState] = useState<Partial<UserState>>({});
  const [mounted, setMounted] = useState(false);
  const [savingsText, setSavingsText] = useState("");
  const savingsDirty = useRef(false);

  // Montaje: storage + query params (los params PISAN el storage, SPEC §7).
  // El override de precio guardado está ligado al producto en que se creó
  // (productId en storage): solo sobrevive en la misma página.
  useEffect(() => {
    const fromQuery = parseUserStateFromQuery(
      new URLSearchParams(location.search),
    );
    const saved = loadUserState() ?? {};
    const overrideApplies = (saved.productId ?? null) === (productId ?? null);
    const base: Partial<UserState> = { ...saved };
    if (!overrideApplies) {
      delete base.priceOverride;
      delete base.customLabel;
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

  // El input de ahorro (modo B) adopta el estado externo solo mientras el
  // usuario no lo esté editando (mismo patrón que PriceInput).
  useEffect(() => {
    if (!savingsDirty.current) {
      setSavingsText(
        state.monthlySavings != null ? String(state.monthlySavings) : "",
      );
    }
  }, [state.monthlySavings]);

  const priceOverride = state.priceOverride ?? null;
  const effectivePrice = priceOverride ?? catalogPrice ?? null;
  const netMonthly = state.netMonthly ?? medianNetMonthly;
  const weeklyHours = state.weeklyHours ?? legalWeeklyHours;
  const savings = state.monthlySavings ?? null;
  const age = state.age ?? null;
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

  const onSavingsInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value;
    savingsDirty.current = true;
    setSavingsText(raw);
    const value = Number(raw);
    const parsed =
      raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
    patch({ monthlySavings: parsed });
  };

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
  const header = (
    <>
      <p class="text-sm uppercase tracking-wide opacity-70">
        {[displayName, countryName].filter(Boolean).join(" · ")}
      </p>
      {showConvertedBadge && (
        <div class="mt-2">
          <span class="badge badge-warning badge-outline">
            {result.convertedBadge}
          </span>
          <div role="alert" class="alert alert-warning mt-2 py-2 text-sm">
            <span>{result.convertedPriceNote}</span>
          </div>
        </div>
      )}
    </>
  );

  // Skeleton SSR/pre-hidratación (SPEC §10.11): contenedor neutro de altura
  // mínima. Elección documentada: skeleton estático de daisyUI (nada de
  // spinners); evita el flash de la pantalla vacía y el CLS al hidratar.
  if (!mounted) {
    return <div class="skeleton h-72 w-full" aria-hidden="true" />;
  }

  const shareUrl =
    typeof location !== "undefined"
      ? `${location.origin}${buildShareUrl(location.pathname, state)}`
      : buildShareUrl("/", state);

  const actions = (
    <section class="mt-10 space-y-6">
      <div class="card bg-base-200 p-5">
        <p class="mb-3 text-sm opacity-80">{cta.changePrice}</p>
        <PriceInput
          slug={countrySlug}
          currencySymbol={currencySymbol}
          initialPrice={effectivePrice}
          initialLabel={productId == null ? (state.customLabel ?? null) : null}
          onPriceChange={setPrice}
          onLabelChange={productId == null ? setLabel : undefined}
        />
      </div>

      <div class="collapse collapse-arrow bg-base-200">
        <input type="checkbox" aria-label={cta.myData} />
        <div class="collapse-title text-lg font-medium">{cta.myData}</div>
        <div class="collapse-content">
          <UserForm
            countryCode={countryCode}
            countryNetMonthly={medianNetMonthly}
            countryWeeklyHours={legalWeeklyHours}
            currencySymbol={currencySymbol}
            onChange={setUserFields}
          />
        </div>
      </div>

      <div class="grid items-end gap-4 sm:grid-cols-2">
        <CountryPicker
          countries={pickerCountries}
          label={result.otherCountry}
          placeholder={countryName}
          hrefFor={hrefFor}
        />
        <ShareButton url={shareUrl} />
      </div>
    </section>
  );

  if (!computed) {
    return (
      <div>
        {header}
        {netMonthly == null ? (
          <div role="alert" class="alert alert-warning mt-4">
            <div>
              <h2 class="font-bold">{noSalary.title}</h2>
              <p class="text-sm">{noSalary.body}</p>
              <a class="link text-sm" href={`/${countrySlug}`}>
                {noSalary.goToCountry}
              </a>
            </div>
          </div>
        ) : invalid ? (
          <div role="alert" class="alert alert-warning mt-4">
            <span>{result.invalidInput}</span>
          </div>
        ) : (
          <p class="mt-2 text-lg">{priceForm.enterPricePrompt}</p>
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
  const modeBHuman =
    computed.monthsSaving != null ? humanCalendar(computed.monthsSaving) : null;
  const subheroParts: string[] = [];
  if (hero.next) subheroParts.push(hero.next);
  if (savings != null && modeBHuman) {
    subheroParts.push(
      `${modeBTitle(`${formatAmount(savings)} ${currencySymbol}`)}: ${modeBHuman}`,
    );
  }

  return (
    <div>
      {header}
      <p class="mt-4 text-5xl md:text-6xl font-bold tabular-nums">{hero.value}</p>
      <p class="mt-1 text-xl font-medium">{hero.unit}</p>
      {subheroParts.length > 0 && (
        <p class="mt-1 text-base opacity-90">{subheroParts.join(" · ")}</p>
      )}
      <p class="mt-3 text-lg">{home.fullPayTail(phrase)}</p>
      <div class="mt-3 space-y-1 text-sm opacity-80">
        <p>{result.effortDisclaimer}</p>
        <p>{modeA.disclaimer}</p>
        <p>{modeA.footnote}</p>
      </div>

      <section class="mt-8">
        <h2 class="text-lg font-bold">{result.breakdownTitle}</h2>
        <dl class="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt class="text-sm opacity-70">{result.hoursLabel}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatHours(computed.hours)}
            </dd>
          </div>
          <div>
            <dt class="text-sm opacity-70">{result.workdaysLabel}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatWorkdays(computed.workdays8h)}
            </dd>
          </div>
          <div>
            <dt class="text-sm opacity-70">{result.weeksLabel}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatWeeks(computed.weeks)}
            </dd>
          </div>
          <div>
            <dt class="text-sm opacity-70">{result.monthsFullPayLabel}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatMonths(computed.monthsFullPay)}
            </dd>
          </div>
          <div>
            <dt class="text-sm opacity-70">{result.yearsFullPayLabel}</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {formatYears(computed.yearsFullPay)}
            </dd>
          </div>
          {realAnnualHours != null && computed.pctRealYear != null && (
            <div>
              <dt class="text-sm opacity-70">{result.pctRealYearLabel}</dt>
              <dd class="text-lg font-semibold tabular-nums">
                {formatPercent(computed.pctRealYear)}%
              </dd>
            </div>
          )}
        </dl>
      </section>

      <YearBar
        yearsFullPay={computed.yearsFullPay}
        realAnnualHours={realAnnualHours}
      />

      <section class="card mt-8 bg-base-200 p-5">
        <label class="label pl-0" for="modeb-savings">
          {modeB.inputLabel}
        </label>
        <input
          id="modeb-savings"
          type="number"
          inputmode="decimal"
          min="1"
          class="input w-full max-w-xs"
          value={savingsText}
          onInput={onSavingsInput}
        />
        {savings != null && modeBHuman ? (
          <div class="mt-3">
            <p class="font-medium">
              {modeBTitle(`${formatAmount(savings)} ${currencySymbol}`)}
            </p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{modeBHuman}</p>
          </div>
        ) : (
          <p class="mt-2 text-sm opacity-70">{modeB.emptyState}</p>
        )}
      </section>

      {(() => {
        const row = ANCHORS[countryCode];
        if (!row || effectivePrice == null) return null;
        const entries: Array<{ key: string; value: number | null; phrase: (n: string) => string }> = [
          { key: "cafe", value: row.cafe, phrase: anchorsI18n.cafe },
          { key: "iphone", value: row.iphone, phrase: anchorsI18n.iphone },
          { key: "alquiler", value: row.alquiler, phrase: anchorsI18n.alquiler },
        ];
        const rows = entries
          .filter((e) => e.value != null && e.value > 0)
          .map((e) => ({ key: e.key, text: e.phrase(formatAnchorCount(effectivePrice / (e.value as number))) }));
        if (rows.length === 0) return null;
        return (
          <section class="mt-8">
            <h2 class="text-lg font-bold">{anchorsI18n.title}</h2>
            <ul class="mt-2 space-y-1">
              {rows.map((r) => (
                <li key={r.key}>{r.text}</li>
              ))}
            </ul>
          </section>
        );
      })()}

      {actions}
    </div>
  );
}
