import { useState } from "preact/hooks";
import { calc } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import {
  formatHours,
  formatMinutes,
  formatMonths,
  formatPercent,
  formatWorkdays,
  formatYears,
  heroUnit,
} from "../../lib/format.ts";
import type { Country } from "../../lib/types.ts";
import { compare } from "../../i18n/es.ts";
import type { JSX } from "preact";

export interface CompareStripProps {
  /** Lista completa de países (para el select y las filas). */
  countries: Country[];
  /** País actual de la página: se excluye de la compara (ya cotiza arriba). */
  currentCountryCode: string;
  /**
   * Precio efectivo, en la moneda del país actual. Es el MISMO número en
   * todas las tarjetas: lo que cambia es el sueldo con el que se paga.
   */
  price: number;
  currencySymbol: string;
  /** Código inicial desde la URL (?pais=) o null → país aleatorio. */
  initialCode: string | null;
  /** Edad del usuario (va en la URL): para la línea "cuánta vida te quita". */
  userAge: number | null;
}

const MAX_CARDS = 3;

/**
 * Cifras de una tarjeta en dos renglones: horas de trabajo (cifra grande) y
 * la unidad hero (cifra menor). Sin truncados: cada parte va en su línea.
 */
const figures = (r: CalcResult): { main: string; unit: string } => {
  if (r.hours < 1) {
    return { main: `${formatMinutes(r.hours * 60)} min`, unit: "de trabajo" };
  }
  const hours = `${formatHours(r.hours)} h`;
  if (r.workdays8h < 1) {
    // Sub-jornada: la hora ya ES la unidad humana; no decir "0,4 jornadas".
    return { main: hours, unit: "de trabajo" };
  }
  const { unit } = heroUnit(r.workdays8h, r.monthsFullPay);
  if (unit === "jornadas") {
    return {
      main: hours,
      unit: `${formatWorkdays(r.workdays8h)} jornadas de 8 h`,
    };
  }
  if (unit === "meses") {
    return {
      main: hours,
      unit: `${formatMonths(r.monthsFullPay)} meses de sueldo entero`,
    };
  }
  return {
    main: hours,
    unit: `${formatYears(r.yearsFullPay)} años de sueldo entero`,
  };
};

type Card = {
  code: string;
  label: string;
  /** Sueldo neto mensual cotizado, formateado ("1.800 €"). */
  salary: string | null;
  /** Cifra de esfuerzo ("3213 h" + "18,5 meses de sueldo entero"). null → sin calcular. */
  figure: { main: string; unit: string } | null;
  /** Horas de esfuerzo (para la barra). null → sin texto. */
  hours: number | null;
  /** Barra de gauge relativa al máximo de la serie. */
  pct: number | null;
  /** % de vida del usuario que se lleva la compra (solo con edad). */
  life: { pct: string; years: string } | null;
};

/** Tarjetas con solo países con sueldo de referencia (fracaso silencioso:
 * un país sin mediana dejaría la tarjeta en "pon tu sueldo"). */
const poolOf = (
  countries: Country[],
  currentCountryCode: string,
): Country[] =>
  countries.filter(
    (c) => c.code !== currentCountryCode && c.medianNetMonthly != null,
  );

/**
 * Comparador a TODO EL ANCHO: el MISMO precio cotizado con la mediana de
 * hasta 3 países, uno por columna. Al entrar se muestra una tarjeta al azar
 * (o la que venga de ?pais=) y el resto de columnas en esqueleto que invita
 * a añadir más. Cada tarjeta cierra con su botón de quitar. Sin librerías.
 */
export default function CompareStrip({
  countries,
  currentCountryCode,
  price,
  currencySymbol,
  initialCode,
  userAge,
}: CompareStripProps) {
  const current = countries.find((c) => c.code === currentCountryCode);
  if (!current) return null;

  const pool = poolOf(countries, currentCountryCode);

  // Decisión documentada: la lista vive en estado local (hasta 3 códigos).
  // La URL solo transporta el primero (?pais=) para compartir; añadir/quito
  // las demás tarjetas no se persiste — sería ruido en el enlace.
  const [codes, setCodes] = useState<string[]>(() => {
    const fromUrl =
      initialCode != null && initialCode !== currentCountryCode
        ? pool.find((c) => c.code === initialCode)
        : null;
    if (fromUrl) return [fromUrl.code];
    if (pool.length === 0) return [];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return [pick.code];
  });

  const priceText = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(price);

  const nfSalary = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  });

  /** Tramos de vida a partir de años de sueldo: el % se calcula contra la
   * edad del usuario (misma lógica que YearBar — "de tus N años"). */
  const lifeOf = (r: CalcResult): { pct: string; years: string } | null => {
    if (userAge == null || r.yearsFullPay < 0.05) return null;
    return {
      pct: formatPercent((r.yearsFullPay / userAge) * 100),
      years: formatYears(r.yearsFullPay),
    };
  };

  const cardOf = (country: Country): Card => {
    const net = country.medianNetMonthly;
    const salary = net != null ? `${nfSalary.format(net)} ${currencySymbol}` : null;
    if (net == null) {
      return { code: country.code, label: country.name, salary, figure: null, hours: null, pct: null, life: null };
    }
    try {
      const r = calc({
        price,
        netMonthly: net,
        weeklyHours: country.legalWeeklyHours,
        realAnnualHours: null,
        monthlySavings: null,
        age: null,
        retirementAge: current.retirementAge,
      });
      return {
        code: country.code,
        label: country.name,
        salary,
        figure: figures(r),
        hours: r.hours,
        pct: null,
        life: lifeOf(r),
      };
    } catch {
      return { code: country.code, label: country.name, salary, figure: null, hours: null, pct: null, life: null };
    }
  };

  const cards: Card[] = codes
    .map((code) => countries.find((c) => c.code === code) ?? null)
    .filter((c): c is Country => c != null)
    .map(cardOf);

  // Gauge: % de horas de esfuerzo de cada tarjeta respecto al más lento.
  // Con una sola tarjeta no hay comparación: la barra no se pinta.
  const withPct: Card[] = cards.length >= 2
    ? (() => {
        const maxHours = Math.max(...cards.map((c) => c.hours ?? 0), 0);
        return cards.map((c) =>
          c.hours != null && maxHours > 0
            ? { ...c, pct: (c.hours / maxHours) * 100 }
            : c,
        );
      })()
    : cards;

  const options = countries.filter(
    (c) => c.code !== currentCountryCode && !codes.includes(c.code),
  );

  const onSelect = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    if (value === "") return;
    setCodes((prev) =>
      prev.length < MAX_CARDS && !prev.includes(value) ? [...prev, value] : prev,
    );
  };

  const removeCard = (code: string): void =>
    setCodes((prev) => prev.filter((c) => c !== code));

  const emptySlots = MAX_CARDS - cards.length;

  return (
    <section class="mt-14" aria-label={compare.title}>
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h2 class="font-signage uppercase text-3xl md:text-4xl">
            {compare.title}
          </h2>
          <p class="mt-1 text-base opacity-80">
            {compare.samePrice(`${priceText} ${currencySymbol}`)}
          </p>
        </div>
        <div>
          <label
            class="font-board-mono text-xs uppercase tracking-[0.14em] opacity-70 block mb-1"
            for="compare-country"
          >
            {compare.selectLabel}
          </label>
          {cards.length < MAX_CARDS && options.length > 0 ? (
            <select
              id="compare-country"
              class="select w-full md:w-48 font-board-mono"
              value=""
              onChange={onSelect}
            >
              <option value="">{compare.selectPlaceholder}</option>
              {options.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          ) : (
            <p class="font-board-mono text-xs opacity-75 md:w-48">
              {compare.maxReached}
            </p>
          )}
        </div>
      </div>

      <div class="mt-6 grid gap-1.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {withPct.map((card) => (
          <div class="board-plate p-5 relative" key={card.code}>
            <button
              type="button"
              class="board-card-remove"
              aria-label={compare.removeCard(card.label)}
              onClick={() => removeCard(card.code)}
            >
              <svg
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
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <h3 class="font-signage uppercase text-2xl pr-8">{card.label}</h3>
            {card.salary != null && (
              <p class="mt-1 font-board-mono text-xs uppercase tracking-[0.14em] opacity-70">
                {card.salary} · {compare.salaryLabel}
              </p>
            )}
            {card.figure != null ? (
              <>
                <p class="mt-4 font-board-mono text-2xl tabular-nums leading-none text-primary">
                  {card.figure.main}
                </p>
                <p class="mt-1 font-board-mono text-base tabular-nums text-primary">
                  {card.figure.unit}
                </p>
                {card.pct != null && (
                  <div class="mt-5">
                    <div class="flex justify-between font-board-mono text-xs uppercase tracking-[0.12em] opacity-80 mb-1">
                      <span>{compare.gaugeLabel}</span>
                      <span>{formatPercent(card.pct)}%</span>
                    </div>
                    <div
                      class="h-2 border border-base-300 bg-base-200"
                      role="img"
                      aria-label={compare.gaugeAria(card.label, formatPercent(card.pct))}
                    >
                      <div
                        class="board-pct-fill h-full bg-primary"
                        style={`width: ${Math.min(100, card.pct).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                )}
                {card.life != null && (
                  <p class="mt-3 font-board-mono text-xs opacity-75">
                    {compare.lifeLine(card.life.pct, card.life.years)}
                  </p>
                )}
              </>
            ) : (
              <p class="mt-3 text-sm opacity-80">
                <span class="font-board-mono text-sm block mb-1">
                  {compare.addRow(`${priceText} ${currencySymbol}`)}
                </span>
                <a href={`/${current.slug}/precio`} class="link link-primary">
                  {compare.putYourSalary}
                </a>
              </p>
            )}
          </div>
        ))}

        {/* ---- Esqueletos: columnas libres que invitan a añadir ---- */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            class="board-plate border-dashed border-base-300 p-5 min-h-[11rem] flex flex-col items-center justify-center text-center gap-2 opacity-70"
            key={`empty-${i}`}
            aria-label={compare.emptySlots}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width={2}
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <p class="font-board-mono text-sm uppercase tracking-[0.12em]">
              {compare.emptySlots}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
