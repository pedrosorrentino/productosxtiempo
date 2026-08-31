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
  /** Índice global de fila para el dibujado escalonado de barras. */
  rowI: number;
}

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
  rowI,
}: BoardRowCardProps) {
  const salaryPct = years != null ? years * 100 : null;
  const lifePct =
    years != null && userAge != null && years >= 0.05 ? (years / userAge) * 100 : null;

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
          <span class="min-w-0 truncate font-medium">{name}</span>
          <span class="font-board-mono text-xs opacity-75 whitespace-nowrap shrink-0">
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
        {salaryPct != null && (
          <span class="flex items-center gap-2 mt-1.5">
            <span class="font-board-mono text-[0.625rem] uppercase tracking-[0.1em] opacity-70 w-52 shrink-0 whitespace-nowrap">
              {board.salaryBarLabel(formatPercent(salaryPct))}
            </span>
            <span
              class="flex-1 h-[3px] bg-base-300 overflow-hidden"
              aria-hidden="true"
            >
              <span
                class="board-pct-fill board-bar-draw block h-full"
                style={`width: ${Math.min(100, salaryPct).toFixed(1)}%; background: ${color}`}
              />
            </span>
          </span>
        )}
        {lifePct != null && userAge != null && (
          <span class="flex items-center gap-2 mt-1">
            <span class="font-board-mono text-[0.625rem] uppercase tracking-[0.1em] opacity-70 w-52 shrink-0 whitespace-nowrap">
              {board.lifeBarRowLabel(userAge, formatPercent(lifePct))}
            </span>
            <span
              class="flex-1 h-[3px] bg-base-300 overflow-hidden"
              title={board.lifeBarAria(userAge, formatPercent(lifePct))}
            >
              <span
                class="board-pct-fill board-bar-draw block h-full bg-primary"
                style={`width: ${Math.min(100, lifePct).toFixed(1)}%`}
              />
            </span>
          </span>
        )}
      </span>
      <span class="text-right">
        {rateText != null ? (
          <>
            <span class="font-board-mono text-2xl md:text-3xl tabular-nums leading-none block text-primary">
              {rateText}
            </span>
            <span class="font-board-mono text-xs uppercase tracking-[0.1em] opacity-75">
              {rateUnit}
            </span>
          </>
        ) : (
          <span class="font-board-mono text-xs uppercase tracking-[0.1em] opacity-75 inline-block mt-1">
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
