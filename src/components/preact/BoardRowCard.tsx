import type { JSX } from "preact";
import { formatPercent } from "../../lib/format.ts";
import { board, result } from "../../i18n/es.ts";
import type { Product } from "../../lib/types.ts";

export const nfPrice = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

/** Esmalte de cada categoría (iconos de color del tablero). */
export const CATEGORY_COLOR: Record<Product["category"], string> = {
  transporte: "#e8482e",
  tecnologia: "#4aa3ff",
  vivienda: "#3ec97e",
  vida: "#f26db6",
  "dia-a-dia": "#ffb020",
};

/** Trazos del icono por categoría, en un solo peso de línea. */
export const CATEGORY_PATHS: Record<Product["category"], JSX.Element> = {
  transporte: (
    <>
      <path d="M5 12l1.4-3.8A2 2 0 0 1 8.3 7h7.4a2 2 0 0 1 1.9 1.2L19 12" />
      <rect x="3" y="12" width="18" height="4" rx="1" />
      <circle cx="7" cy="18.5" r="1.5" />
      <circle cx="17" cy="18.5" r="1.5" />
    </>
  ),
  tecnologia: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  vivienda: (
    <>
      <path d="M3.5 10.5L12 3l8.5 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </>
  ),
  vida: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  "dia-a-dia": (
    <>
      <path d="M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
      <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M7.5 3.5v2M11 3.5v2M14.5 3.5v2" />
    </>
  ),
};

export function CategoryIcon({
  category,
  size = 22,
}: {
  category: Product["category"];
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width={2}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {CATEGORY_PATHS[category]}
    </svg>
  );
}

export interface BoardRowCardProps {
  href: string;
  name: string;
  /** Trazos del icono de categoría (la card los envuelve en svg de 16 px). */
  icon: JSX.Element;
  /** Esmalte de la categoría (fondo del icono y de la barra de sueldo). */
  color: string;
  /** Precio en moneda; null → sello de "sin precio local". */
  price: number | null;
  /** Símbolo junto al precio; lo resuelve el caller ("€" si es conversión). */
  priceSymbol: string | null;
  /** Sello que sustituye al precio cuando no hay dato local. */
  priceFallback: string | null;
  /** Badge "ref. España" cuando el precio viene convertido. */
  converted: boolean;
  /** Cotización derecha; null → CTA de precio libre. */
  rateText: string | null;
  rateUnit: string | null;
  rateCta: string | null;
  /** Años de sueldo entero del precio, sin tope (null → sin barras). */
  years: number | null;
  /** Edad del usuario (localStorage); null → sin barra de vida. */
  userAge: number | null;
  retirementAge?: number;
  hours?: number;
  viewMode?: "work" | "life";
  /** Si la cotización se ha actualizado recientemente. */
  isFresh?: boolean;
  /** Índice global de fila para el dibujado escalonado de barras. */
  rowI: number;
}

import { getThreatLevel } from "../../lib/life.ts";
import { getWorkEffortLevel } from "../../lib/work.ts";

/**
 * Card de item de la pizarra, ÚNICA para portada y ficha de país: nombre y
 * precio en una línea, barra "% de un año de sueldo" con su valor y, si hay
 * edad guardada, la barra "% de tus N años" con la vida que cuesta.
 */
export default function BoardRowCard({
  href,
  name,
  icon,
  color,
  price,
  priceSymbol,
  priceFallback,
  converted,
  rateText,
  rateUnit,
  rateCta,
  years,
  userAge,
  retirementAge = 67,
  hours,
  viewMode = "work",
  isFresh = false,
  rowI,
}: BoardRowCardProps) {
  const isLifeMode = viewMode === "life";
  const workEffort = getWorkEffortLevel(hours ?? 0);
  const salaryPct = years != null ? years * 100 : null;
  const currentAge = userAge ?? 30;
  const yearsLeft = Math.max(0, retirementAge - currentAge);
  const pctCareerLeft =
    years != null && yearsLeft > 0 ? (years / yearsLeft) * 100 : null;
  const threat = getThreatLevel(
    pctCareerLeft,
    hours ?? (years != null ? years * 1800 : 0),
    years ?? 0,
  );

  return (
    <a class="board-row" style={`--row-i: ${rowI}`} href={href}>
      <span
        class="board-cat-icon board-cat-icon--sm"
        style={`background: ${color}; color: #14191d`}
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
          {icon}
        </svg>
      </span>
      <span class="min-w-0">
        <span class="flex items-baseline gap-2">
          <span class="min-w-0 truncate font-medium flex items-center gap-1.5">
            <span class="truncate">{name}</span>
            {isFresh && !converted && (
              <span
                class="inline-flex items-center text-primary shrink-0 opacity-80"
                title="Cotización reciente"
                aria-label="Cotización reciente"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2l2.4 7.2 7.6 2.4-7.6 2.4-2.4 7.2-2.4-7.2-7.6-2.4 7.6-2.4z" />
                </svg>
              </span>
            )}
          </span>
          <span class="font-board-mono text-sm opacity-85 whitespace-nowrap shrink-0">
            {price != null ? (
              <>
                {nfPrice.format(price)} {priceSymbol}
              </>
            ) : (
              <span class="board-stamp text-info">{priceFallback}</span>
            )}
            {converted && (
              <span title={result.convertedPriceNote} class="ml-1">
                {board.esRefBadge}
              </span>
            )}
          </span>
        </span>
        {isLifeMode ? (
          /* Modo Vida activo: la barra de vida es la protagonista absoluta */
          <span class="flex items-center gap-2 mt-1.5">
            <span class="font-board-mono text-xs uppercase tracking-[0.06em] opacity-90 w-60 shrink-0 whitespace-nowrap flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full inline-block" style={`background: ${threat.color}`} />
              <span class="font-bold text-base-content">
                {pctCareerLeft != null
                  ? `${formatPercent(pctCareerLeft)}% de tu futuro (${yearsLeft}a)`
                  : `${formatPercent(salaryPct ?? 0)}% de 1 año`}
              </span>
            </span>
            <span
              class="flex-1 h-[5px] bg-base-300 rounded overflow-hidden"
              aria-hidden="true"
            >
              <span
                class="board-pct-fill board-bar-draw block h-full"
                style={`width: ${Math.min(100, pctCareerLeft ?? salaryPct ?? 0).toFixed(1)}%; background: ${threat.color}`}
              />
            </span>
          </span>
        ) : (
          /* Modo Trabajo clásico */
          <>
            {salaryPct != null && (
              <span class="flex items-center gap-2 mt-1.5">
                <span class="font-board-mono text-xs uppercase tracking-[0.06em] opacity-80 w-60 shrink-0 whitespace-nowrap">
                  {board.salaryBarLabel(formatPercent(salaryPct))}
                </span>
                <span
                  class="flex-1 h-[4px] bg-base-300 overflow-hidden"
                  aria-hidden="true"
                >
                  <span
                    class="board-pct-fill board-bar-draw block h-full"
                    style={`width: ${Math.min(100, salaryPct).toFixed(1)}%; background: ${workEffort.barColor}`}
                  />
                </span>
              </span>
            )}
            {pctCareerLeft != null && userAge != null && (
              <span class="flex items-center gap-2 mt-1">
                <span class="font-board-mono text-xs uppercase tracking-[0.06em] opacity-80 w-60 shrink-0 whitespace-nowrap">
                  {formatPercent(pctCareerLeft)}% de tu vida restante
                </span>
                <span
                  class="flex-1 h-[4px] bg-base-300 overflow-hidden"
                  title={`${formatPercent(pctCareerLeft)}% de tus años restantes`}
                >
                  <span
                    class="board-pct-fill board-bar-draw block h-full bg-primary"
                    style={`width: ${Math.min(100, pctCareerLeft).toFixed(1)}%`}
                  />
                </span>
              </span>
            )}
          </>
        )}
      </span>
      <span class="text-right flex flex-col items-end justify-center">
        {isLifeMode && pctCareerLeft != null ? (
          <>
            <span class="font-board-mono text-2xl md:text-3xl tabular-nums leading-none block font-bold" style={`color: ${threat.color}`}>
              -{formatPercent(pctCareerLeft)}%
            </span>
            <span class="font-board-mono text-xs uppercase tracking-[0.08em] opacity-85 mt-0.5">
              de tu vida
            </span>
            <span
              class={`inline-flex items-center gap-1 font-board-mono text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded border mt-1 select-none ${threat.badgeClass}`}
            >
              <span>{threat.emoji}</span>
              <span>{threat.shortLabel}</span>
            </span>
          </>
        ) : rateText != null ? (
          <>
            <span class="font-board-mono text-2xl md:text-3xl tabular-nums leading-none block text-primary">
              {rateText}
            </span>
            <span class="font-board-mono text-sm uppercase tracking-[0.08em] opacity-80">
              {rateUnit}
            </span>
            <span
              class={`inline-flex items-center gap-1 font-board-mono text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded border mt-1 select-none ${workEffort.badgeClass}`}
            >
              <span>{workEffort.emoji}</span>
              <span>{workEffort.shortLabel}</span>
            </span>
          </>
        ) : (
          <span class="font-board-mono text-sm uppercase tracking-[0.08em] opacity-80 inline-block mt-1">
            {rateCta} →
          </span>
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
    </a>
  );
}
