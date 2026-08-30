import { useEffect, useState } from "preact/hooks";
import {
  calc,
  MIN_WEEKLY_HOURS,
  MAX_WEEKLY_HOURS,
} from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import {
  formatHumanDuration,
  formatHours,
  formatMinutes,
  formatMonths,
  formatWorkdays,
  formatYears,
  heroUnit,
} from "../../lib/format.ts";
import type { HeroUnit } from "../../lib/format.ts";
import { parseUserStateFromQuery } from "../../lib/urls.ts";
import { loadUserState } from "../../lib/storage.ts";
import type { UserState } from "../../lib/types.ts";
import {
  cta,
  heroUnits,
  home,
  noSalary,
  priceForm,
  result,
} from "../../i18n/es.ts";
import PriceInput from "./PriceInput.tsx";

export interface ResultViewProps {
  countryCode: string;
  countryName: string;
  countrySlug: string;
  currencySymbol: string;
  medianNetMonthly: number | null;
  legalWeeklyHours: number;
  realAnnualHours: number | null;
  retirementAge: number;
}

const formatHeroValue = (unit: HeroUnit, value: CalcResult): string => {
  if (unit === "jornadas") return formatWorkdays(value.workdays8h);
  if (unit === "meses") return formatMonths(value.monthsFullPay);
  return formatYears(value.yearsFullPay);
};

/**
 * STUB de Task 4 — Task 5 la expande (desglose completo, modo B, YearBar,
 * anclas, acciones). Flujo punta a punta del precio libre: lee query params
 * (precio, nombre, neto…) + localStorage (query pisa storage, SPEC §7) +
 * props del país, calcula con `calc` y pinta hero + frase humana + disclaimer
 * fijo + PriceInput inline con recálculo en vivo.
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
}: ResultViewProps) {
  const [state, setState] = useState<Partial<UserState>>({});

  useEffect(() => {
    const fromQuery = parseUserStateFromQuery(new URLSearchParams(location.search));
    const saved = loadUserState();
    setState({ ...saved, ...fromQuery });
  }, [countryCode]);

  const price = state.priceOverride ?? null;
  const label = state.customLabel ?? null;
  const netMonthly = state.netMonthly ?? medianNetMonthly;
  const weeklyHours = state.weeklyHours ?? legalWeeklyHours;

  let computed: CalcResult | null = null;
  if (
    price != null &&
    netMonthly != null &&
    weeklyHours >= MIN_WEEKLY_HOURS &&
    weeklyHours <= MAX_WEEKLY_HOURS
  ) {
    try {
      computed = calc({
        price,
        netMonthly,
        weeklyHours,
        realAnnualHours,
        monthlySavings: state.monthlySavings ?? null,
        age: state.age ?? null,
        retirementAge,
      });
    } catch {
      computed = null;
    }
  }

  const setPrice = (value: number | null) =>
    setState((prev) => ({ ...prev, priceOverride: value }));
  const setLabel = (value: string | null) =>
    setState((prev) => ({ ...prev, customLabel: value }));

  if (computed) {
    const hero =
      computed.hours < 1
        ? { value: formatMinutes(computed.hours * 60), unit: heroUnits.minutos }
        : computed.workdays8h < 1
          ? { value: formatHours(computed.hours), unit: heroUnits.horas }
          : (() => {
              const { unit } = heroUnit(computed.workdays8h, computed.monthsFullPay);
              return { value: formatHeroValue(unit, computed), unit: heroUnits[unit] };
            })();
    const phrase = formatHumanDuration(
      computed.hours,
      computed.workdays8h,
      computed.monthsFullPay,
      computed.yearsFullPay,
    );

    return (
      <div>
        {label && (
          <p class="text-sm uppercase tracking-wide opacity-70">
            {label} · {countryName}
          </p>
        )}
        <p class="mt-2 text-5xl md:text-6xl font-bold tabular-nums">{hero.value}</p>
        <p class="mt-1 text-xl font-medium">{hero.unit}</p>
        <p class="mt-2 text-lg">{home.fullPayTail(phrase)}</p>
        <p class="mt-4 text-sm opacity-80">{result.effortDisclaimer}</p>
        <div class="mt-6 card bg-base-200 p-5">
          <p class="text-sm opacity-80 mb-3">{cta.changePrice}</p>
          <PriceInput
            slug={countrySlug}
            currencySymbol={currencySymbol}
            initialPrice={price}
            initialLabel={label}
            onPriceChange={setPrice}
            onLabelChange={setLabel}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {netMonthly == null ? (
        <div role="alert" class="alert alert-warning">
          <div>
            <h2 class="font-bold">{noSalary.title}</h2>
            <p class="text-sm">{noSalary.body}</p>
            <a class="link text-sm" href={`/${countrySlug}`}>
              {noSalary.goToCountry}
            </a>
          </div>
        </div>
      ) : (
        <div>
          <h1 class="text-2xl font-bold">{countryName}</h1>
          <p class="mt-2 text-lg">{priceForm.enterPricePrompt}</p>
        </div>
      )}
      <p class="mt-4 text-sm opacity-80">{result.effortDisclaimer}</p>
      <div class="mt-6 card bg-base-200 p-5">
        <PriceInput
          slug={countrySlug}
          currencySymbol={currencySymbol}
          initialPrice={price}
          initialLabel={label}
          onPriceChange={setPrice}
          onLabelChange={setLabel}
        />
      </div>
    </div>
  );
}
