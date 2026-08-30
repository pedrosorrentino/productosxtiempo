import { calc } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import {
  formatHours,
  formatMinutes,
  formatMonths,
  formatWorkdays,
  formatYears,
  heroUnit,
} from "../../lib/format.ts";
import type { Country } from "../../lib/types.ts";
import { compare, heroUnits } from "../../i18n/es.ts";
import type { JSX } from "preact";

export interface CompareStripProps {
  /** Lista completa de países (para el select y las filas). */
  countries: Country[];
  /** País de la página actual: su fila usa su sueldo de referencia y jornada. */
  currentCountryCode: string;
  currentCountryName: string;
  /**
   * Precio efectivo, en la moneda de referencia del país actual. Es el MISMO
   * número en todas las filas (el producto es internacional): lo que cambia
   * es el sueldo con el que se paga. El etiquetado converted, si procede, ya
   * lo pinta el header de ResultView — aquí no se duplica.
   */
  price: number;
  currencySymbol: string;
  /**
   * Fila "Tú": neto ESTRICTO del usuario. Sin él no hay fila propia (los
   * datos de referencia ya están en la fila del país, y duplicarla diría lo
   * mismo dos veces). Las horas sí son las efectivas (usuario o jornada).
   * Fix M4: nunca es null (el caller pasa `state.weeklyHours ?? legal`),
   * por eso el tipo es `number`.
   */
  youNetMonthly: number | null;
  youWeeklyHours: number;
  /** País de comparación elegido (código). null o inválido → sin tercera fila. */
  compareCode: string | null;
  onSelectCompare: (code: string | null) => void;
}

/** Cifras de una fila: horas (o minutos) y la unidad hero según magnitud. */
const figures = (r: CalcResult): string => {
  if (r.hours < 1) {
    return `${formatMinutes(r.hours * 60)} min`;
  }
  if (r.workdays8h < 1) {
    // Sub-jornada: la hora ya ES la unidad humana; no decir "0,4 jornadas".
    return `${formatHours(r.hours)} h`;
  }
  const { unit } = heroUnit(r.workdays8h, r.monthsFullPay);
  if (unit === "jornadas") {
    return `${formatHours(r.hours)} h · ${formatWorkdays(r.workdays8h)} ${heroUnits.jornadas}`;
  }
  if (unit === "meses") {
    return `${formatHours(r.hours)} h · ${formatMonths(r.monthsFullPay)} ${heroUnits.meses}`;
  }
  return `${formatHours(r.hours)} h · ${formatYears(r.yearsFullPay)} ${heroUnits.años}`;
};

type Row = { label: string; text: string | null };

/**
 * Comparador simple (SPEC §5): bloque compacto dentro de ResultView — el
 * MISMO precio calculado con el sueldo del usuario, el de referencia del
 * país actual y el de un segundo país elegible. Una fila por sujeto, máximo
 * tres, más el select. Sin librerías. El país sin sueldo de referencia
 * (medianNetMonthly null) muestra "pon tu sueldo" y no calcula.
 */
export default function CompareStrip({
  countries,
  currentCountryCode,
  currentCountryName,
  price,
  currencySymbol,
  youNetMonthly,
  youWeeklyHours,
  compareCode,
  onSelectCompare,
}: CompareStripProps) {
  const current = countries.find((c) => c.code === currentCountryCode);
  if (!current) return null;

  const selected =
    compareCode != null && compareCode !== currentCountryCode
      ? (countries.find((c) => c.code === compareCode) ?? null)
      : null;

  const rowFor = (label: string, net: number | null, hours: number): Row => {
    if (net == null) return { label, text: null };
    try {
      const r = calc({
        price,
        netMonthly: net,
        weeklyHours: hours,
        realAnnualHours: null,
        monthlySavings: null,
        age: null,
        retirementAge: current.retirementAge,
      });
      return { label, text: figures(r) };
    } catch {
      // Datos de referencia imposibles (defensa): fila sin cálculo, sin crash.
      return { label, text: null };
    }
  };

  const rows: Row[] = [];
  if (youNetMonthly != null) {
    rows.push(rowFor(compare.you, youNetMonthly, youWeeklyHours));
  }
  if (current.medianNetMonthly != null) {
    rows.push(
      rowFor(currentCountryName, current.medianNetMonthly, current.legalWeeklyHours),
    );
  } else if (youNetMonthly == null) {
    // Sin referencia del país ni datos del usuario: la única fila posible pide el sueldo.
    rows.push({ label: currentCountryName, text: null });
  }
  if (selected) {
    rows.push(
      rowFor(selected.name, selected.medianNetMonthly, selected.legalWeeklyHours),
    );
  }

  const options = countries.filter((c) => c.code !== currentCountryCode);
  const priceText = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(price);

  const onSelect = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    onSelectCompare(value === "" ? null : value);
  };

  return (
    <section class="card bg-base-200 mt-8 p-5">
      <h2 class="text-lg font-bold">{compare.title}</h2>
      <p class="text-sm opacity-70">
        {compare.samePrice(`${priceText} ${currencySymbol}`)}
      </p>
      <ul class="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.label}
            class="flex flex-wrap items-baseline justify-between gap-x-3"
          >
            <span class="font-medium">{row.label}</span>
            <span class="tabular-nums">
              {row.text ?? (
                // Fix M4: affordance real — el UserForm vive en /{slug}/precio.
                <a
                  href={`/${current.slug}/precio`}
                  class="link link-primary"
                >
                  {compare.putYourSalary}
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div class="mt-4">
        <label class="label pl-0" for="compare-country">
          {compare.selectLabel}
        </label>
        <select
          id="compare-country"
          class="select w-full max-w-xs"
          value={selected?.code ?? ""}
          onChange={onSelect}
        >
          <option value="">{compare.selectPlaceholder}</option>
          {options.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
