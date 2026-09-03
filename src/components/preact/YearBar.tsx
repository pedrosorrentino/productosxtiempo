import { formatPercent, formatYears } from "../../lib/format.ts";
import { yearBar } from "../../i18n/es.ts";

export interface YearBarProps {
  yearsFullPay: number;
  realAnnualHours: number | null;
  /** Edad del usuario (20–80 validada fuera). Con edad se añade la barra de
   * vida: cuánto de ese tiempo cuesta la compra (misma fórmula que la pizarra:
   * yearsFullPay / edad). */
  userAge: number | null;
}

/**
 * Barra del año laboral (SPEC §11): un rectángulo = 1 año laboral de
 * referencia; el relleno es min(1, yearsFullPay). Si yearsFullPay > 1 se
 * muestra una barra llena + texto "desborda a X años" (la opción "una barra
 * + texto" de la spec: evita pilas de N rectángulos para compras grandes).
 * Con edad: segunda barra con el % de la vida del usuario (mismo corte
 * yearsFullPay >= 0.05 que la línea de edad de ResultView: un "0,0 %"
 * miente igual que "0,0 cafés"). Divs puros, sin librería de charts.
 */
export default function YearBar({
  yearsFullPay,
  realAnnualHours,
  userAge,
}: YearBarProps) {
  const fill = Math.min(1, Math.max(0, yearsFullPay));
  const pct = formatPercent(fill * 100);
  const detail =
    realAnnualHours != null
      ? yearBar.detailRealHours(realAnnualHours)
      : yearBar.detail;
  const hasLifeBar = userAge != null && yearsFullPay >= 0.05;
  const lifePct = hasLifeBar ? (yearsFullPay / userAge) * 100 : null;

  return (
    <section class="mt-8">
      <h2 class="font-signage uppercase text-2xl md:text-3xl">{yearBar.title}</h2>
      <p class="mt-1 text-sm opacity-85">{detail}</p>
      <div
        class="mt-2 h-6 w-full overflow-hidden border border-base-300 bg-base-200"
        role="img"
        aria-label={yearBar.ariaFill(pct)}
      >
        <div class="h-full bg-primary" style={`width: ${(fill * 100).toFixed(1)}%`} />
      </div>
      {yearsFullPay > 1 && (
        <p class="mt-1.5 font-board-mono text-sm uppercase tracking-[0.08em] font-semibold text-primary">
          {yearBar.overflow(formatYears(yearsFullPay))}
        </p>
      )}
      <p class="mt-1 font-board-mono text-sm font-medium opacity-85">
        {yearBar.fillLabel(pct)}
      </p>
      {hasLifeBar && lifePct != null && (
        <div class="mt-5">
          <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 font-medium mb-1">
            <span class="font-signage uppercase text-xl leading-none">{yearBar.lifeTitle}</span>
            <span class="font-board-mono text-primary font-bold">{formatPercent(lifePct)}%</span>
          </div>
          <div
            class="h-3 w-full overflow-hidden border border-base-300 bg-base-200"
            role="img"
            aria-label={yearBar.lifeAria(userAge, formatPercent(lifePct))}
          >
            <div
              class="h-full bg-primary"
              style={`width: ${Math.min(100, lifePct).toFixed(1)}%`}
            />
          </div>
          <p class="mt-1.5 font-board-mono text-sm opacity-85">
            {yearBar.lifeFillLabel(userAge, formatPercent(lifePct), formatYears(yearsFullPay))}
          </p>
        </div>
      )}
    </section>
  );
}
