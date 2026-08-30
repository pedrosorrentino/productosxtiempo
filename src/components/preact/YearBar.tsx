import { formatPercent, formatYears } from "../../lib/format.ts";
import { yearBar } from "../../i18n/es.ts";

export interface YearBarProps {
  yearsFullPay: number;
  realAnnualHours: number | null;
}

/**
 * Barra del año laboral (SPEC §11): un rectángulo = 1 año laboral de
 * referencia; el relleno es min(1, yearsFullPay). Si yearsFullPay > 1 se
 * muestra una barra llena + texto "desborda a X años" (la opción "una barra
 * + texto" de la spec: evita pilas de N rectángulos para compras grandes).
 * Divs puros, sin librería de charts.
 */
export default function YearBar({ yearsFullPay, realAnnualHours }: YearBarProps) {
  const fill = Math.min(1, Math.max(0, yearsFullPay));
  const pct = formatPercent(fill * 100);
  const detail =
    realAnnualHours != null
      ? yearBar.detailRealHours(realAnnualHours)
      : yearBar.detail;

  return (
    <section class="mt-8">
      <h2 class="text-lg font-bold">{yearBar.title}</h2>
      <p class="text-sm opacity-70">{detail}</p>
      <div
        class="mt-2 h-6 w-full overflow-hidden rounded-box border border-base-content/20 bg-base-200"
        role="img"
        aria-label={yearBar.ariaFill(pct)}
      >
        <div class="h-full bg-primary" style={`width: ${(fill * 100).toFixed(1)}%`} />
      </div>
      {yearsFullPay > 1 && (
        <p class="mt-1 text-sm font-medium">{yearBar.overflow(formatYears(yearsFullPay))}</p>
      )}
    </section>
  );
}
