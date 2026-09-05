import { useEffect, useState } from "preact/hooks";
import { calc } from "../../lib/calc.ts";
import type { CalcResult } from "../../lib/calc.ts";
import { convertCurrency } from "../../lib/currencies.ts";
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

export interface CompareStripProps {
  /** Lista completa de países (para el select y las filas). */
  countries: Country[];
  /** País actual de la página: se excluye de la compara (ya cotiza arriba). */
  currentCountryCode: string;
  /**
   * Precio efectivo, en la moneda del país actual.
   * Se convierte proporcionalmente a la divisa de cada país comparado.
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
 * Comparador a TODO EL ANCHO: el precio cotizado con la mediana de
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const priceText = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(price);

  const nfSalary = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  });

  // Países disponibles para añadir en el modal:
  // - No el país actual de la página (evita duplicar información)
  // - No países ya añadidos a la comparativa
  // - Solo países con sueldo mediano fiable
  const availableCountries = countries.filter(
    (c) =>
      c.code !== currentCountryCode &&
      !codes.includes(c.code) &&
      c.medianNetMonthly != null,
  );

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

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
    const salary = net != null ? `${nfSalary.format(net)} ${country.currencySymbol}` : null;
    if (net == null) {
      return { code: country.code, label: country.name, salary, figure: null, hours: null, pct: null, life: null };
    }
    const convertedPrice = convertCurrency(price, current.currency, country.currency);
    try {
      const r = calc({
        price: convertedPrice,
        netMonthly: net,
        weeklyHours: country.legalWeeklyHours,
        realAnnualHours: null,
        monthlySavings: null,
        age: null,
        retirementAge: country.retirementAge,
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
          {cards.length >= MAX_CARDS ? (
            <span class="font-board-mono text-xs opacity-75">
              {compare.maxReached}
            </span>
          ) : (
            <span class="font-board-mono text-xs opacity-75">
              {cards.length} / {MAX_CARDS} países comparados
            </span>
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
              <p class="mt-1 font-board-mono text-sm uppercase tracking-[0.08em] opacity-80">
                {card.salary} · {compare.salaryLabel}
              </p>
            )}
            {card.figure != null ? (
              <>
                <p class="mt-4 font-board-mono text-2xl tabular-nums leading-none text-primary">
                  {card.figure.main}
                </p>
                <p class="mt-1 font-board-mono text-base tabular-nums text-primary break-words">
                  {card.figure.unit}
                </p>
                {card.pct != null && (
                  <div class="mt-5">
                    <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-85 font-medium mb-1">
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
                  <p class="mt-3 font-board-mono text-sm opacity-85 break-words">
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

        {/* ---- Esqueletos interactivos: al pulsar abren el modal para añadir país ---- */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <button
            type="button"
            class="board-plate border-dashed border-base-300 hover:border-primary/80 hover:bg-base-200/50 p-5 min-h-[11rem] flex flex-col items-center justify-center text-center gap-3 opacity-75 hover:opacity-100 transition-all duration-150 cursor-pointer group select-none w-full"
            key={`empty-${i}`}
            aria-label="Añadir país para comparar"
            onClick={() => setIsModalOpen(true)}
          >
            <div class="w-10 h-10 rounded-full border border-dashed border-base-content/25 group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width={2}
                stroke-linecap="round"
                stroke-linejoin="round"
                class="group-hover:text-primary transition-colors text-base-content/75"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p class="font-board-mono text-sm uppercase tracking-[0.12em] group-hover:text-primary transition-colors font-medium">
                {compare.emptySlots}
              </p>
              <span class="font-board-mono text-xs opacity-60 block mt-1">
                Pulsa para elegir país
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Modal para seleccionar país */}
      {isModalOpen && (
        <div
          class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div class="board-plate border border-base-300 bg-base-100 shadow-2xl p-5 sm:p-6 relative max-w-lg w-full max-h-[85vh] flex flex-col">
            {/* Cabecera del modal */}
            <div class="flex items-start justify-between gap-4 pb-4 border-b border-base-300">
              <div>
                <h3 id="compare-modal-title" class="font-signage uppercase text-2xl sm:text-3xl text-primary leading-none">
                  Añadir país a la comparativa
                </h3>
                <p class="font-board-mono text-xs opacity-75 mt-1.5 leading-relaxed">
                  Elige un país para cotizar {priceText} {currencySymbol} con su salario neto mediano:
                </p>
              </div>
              <button
                type="button"
                class="board-card-remove static w-8 h-8 rounded hover:bg-base-300 flex items-center justify-center transition-colors text-base-content/80 hover:text-base-content shrink-0 cursor-pointer"
                aria-label="Cerrar modal"
                onClick={() => setIsModalOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Lista de países filtrados */}
            <div class="overflow-y-auto py-3 space-y-2 flex-1 overscroll-contain pr-1">
              {availableCountries.length > 0 ? (
                availableCountries.map((c) => {
                  const convertedVal = convertCurrency(price, current.currency, c.currency);
                  const convertedFormatted = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(convertedVal);
                  return (
                    <button
                      type="button"
                      key={c.code}
                      class="w-full flex items-center justify-between p-3 rounded border border-base-300 bg-base-200/60 hover:bg-base-200 hover:border-primary/50 transition-all text-left group cursor-pointer"
                      onClick={() => {
                        setCodes((prev) =>
                          prev.length < MAX_CARDS && !prev.includes(c.code) ? [...prev, c.code] : prev,
                        );
                        setIsModalOpen(false);
                      }}
                    >
                      <div class="min-w-0 flex-1 pr-3">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                            {c.name}
                          </span>
                          <span class="font-board-mono text-[11px] px-1.5 py-0.2 rounded bg-base-300/80 text-base-content/75 font-semibold">
                            {c.code}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-board-mono text-xs opacity-80 mt-1">
                          <span>
                            Mediana: <strong class="text-base-content font-semibold">{nfSalary.format(c.medianNetMonthly!)} {c.currencySymbol}/mes</strong>
                          </span>
                          <span aria-hidden="true" class="opacity-40">·</span>
                          <span>
                            Precio: <strong class="text-base-content font-semibold">{convertedFormatted} {c.currencySymbol}</strong>
                          </span>
                        </div>
                      </div>
                      <span class="font-board-mono text-xs font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-content transition-all shrink-0">
                        + Añadir
                      </span>
                    </button>
                  );
                })
              ) : (
                <div class="p-6 text-center text-sm font-board-mono opacity-75">
                  Ya has añadido todos los países disponibles para comparar.
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div class="pt-3 border-t border-base-300 flex justify-between items-center text-xs font-board-mono opacity-70">
              <span>{availableCountries.length} {availableCountries.length === 1 ? "país disponible" : "países disponibles"}</span>
              <button
                type="button"
                class="hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
