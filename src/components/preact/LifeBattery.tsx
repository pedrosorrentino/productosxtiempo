import { formatPercent, formatYears } from "../../lib/format.ts";
import { lifeModeCopy } from "../../i18n/es.ts";
import type { ThreatLevel } from "../../lib/life.ts";

export interface LifeBatteryProps {
  age: number | null;
  retirementAge: number;
  yearsFullPay: number;
  pctCareerLeft: number | null;
  threat: ThreatLevel;
  onAgeChange?: (newAge: number) => void;
}

export default function LifeBattery({
  age,
  retirementAge,
  yearsFullPay,
  pctCareerLeft,
  threat,
  onAgeChange,
}: LifeBatteryProps) {
  const currentAge = age ?? 30;
  const isEstimated = age == null;
  const yearsLeft = Math.max(0, retirementAge - currentAge);
  const totalLife = Math.max(1, retirementAge);

  const livedPct = Math.min(100, Math.max(0, (currentAge / totalLife) * 100));
  const remainingWorkPct = Math.max(0, 100 - livedPct);
  
  // Porcentaje que consume de la carrera restante
  const effectivePctLeft = pctCareerLeft ?? (yearsLeft > 0 ? (yearsFullPay / yearsLeft) * 100 : 0);
  // Porcentaje del ancho total de la barra que ocupa el mordisco
  const biteTotalPct = Math.min(
    remainingWorkPct,
    (Math.min(100, effectivePctLeft) / 100) * remainingWorkPct,
  );
  const cleanRemainingPct = Math.max(0, remainingWorkPct - biteTotalPct);

  return (
    <div
      class={`board-plate p-4 transition-all duration-300 ${
        threat.id === "soul" ? "border-error/60 shadow-[0_0_15px_rgba(232,72,46,0.15)]" : ""
      }`}
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 rounded-full" style={`background: ${threat.color}`} />
          <span class="font-signage uppercase text-base tracking-wider text-base-content/95">
            {lifeModeCopy.lifeBatteryTitle}
          </span>
          {isEstimated && (
            <span class="font-board-mono text-xs uppercase tracking-wider px-2 py-0.5 bg-base-300 text-primary rounded">
              Ref. 30 años
            </span>
          )}
        </div>

        <div class="flex items-center gap-2">
          <span
            class={`font-board-mono text-xs uppercase px-2.5 py-1 rounded border flex items-center gap-1 font-bold ${threat.badgeClass}`}
            title={threat.description}
          >
            <span>{threat.emoji}</span>
            <span>{threat.label}</span>
          </span>
          {effectivePctLeft > 0 && (
            <span class="font-board-mono text-sm font-bold text-primary tabular-nums">
              -{formatPercent(effectivePctLeft)}% vida
            </span>
          )}
        </div>
      </div>

      {/* Contenedor de la Batería */}
      <div class="relative w-full h-8 sm:h-9 bg-base-300/80 rounded border border-base-content/15 p-0.5 overflow-hidden flex items-center">
        {/* Tramo 1: Vida ya vivida */}
        <div
          class="h-full bg-base-content/20 transition-all duration-500 relative group flex items-center justify-center overflow-hidden"
          style={`width: ${livedPct.toFixed(1)}%`}
          title={`Vivido: ${currentAge} años (${livedPct.toFixed(0)}%)`}
        >
          <span class="font-board-mono text-xs text-base-content/75 font-semibold truncate px-1 select-none">
            {livedPct > 15 ? `${currentAge}a vividos` : ""}
          </span>
        </div>

        {/* Tramo 2: Mordisco de la compra (Animado en rojo/fuego o color de alerta) */}
        <div
          class="h-full transition-all duration-500 relative flex items-center justify-center overflow-hidden"
          style={`width: ${biteTotalPct.toFixed(1)}%; background: ${threat.color};`}
          title={`Mordisco: ${formatYears(yearsFullPay)} (~${formatPercent(effectivePctLeft)}% de tu futuro)`}
        >
          <div
            class="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.5)_6px,rgba(0,0,0,0.5)_12px)] animate-[pulse_2s_ease-in-out_infinite]"
          />
          {biteTotalPct > 8 && (
            <span class="relative font-board-mono text-xs font-bold text-black truncate px-1 select-none">
              -{formatPercent(effectivePctLeft)}%
            </span>
          )}
        </div>

        {/* Tramo 3: Vida laboral restante limpia */}
        <div
          class="h-full bg-success/50 transition-all duration-500 flex items-center justify-center overflow-hidden"
          style={`width: ${cleanRemainingPct.toFixed(1)}%`}
          title={`Vida laboral restante: ~${yearsLeft} años`}
        >
          <span class="font-board-mono text-xs text-success-content font-medium truncate px-1 select-none">
            {cleanRemainingPct > 20 ? `${yearsLeft}a restantes` : ""}
          </span>
        </div>
      </div>

      {/* Leyenda y detalles */}
      <div class="flex flex-wrap items-center justify-between text-xs sm:text-sm font-board-mono text-base-content/80 mt-2.5 gap-x-4 gap-y-1">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-base-content/30 inline-block" />
            <span>Vivido: {currentAge}a</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-success/70 inline-block" />
            <span>Futuro: {yearsLeft}a</span>
          </span>
          <span class="flex items-center gap-1.5 text-primary font-bold">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style={`background: ${threat.color}`} />
            <span>Mordisco: {formatYears(yearsFullPay)}</span>
          </span>
        </div>

        {onAgeChange && (
          <div class="flex items-center gap-1.5 text-sm">
            <span class="opacity-80">Ajustar:</span>
            <button
              type="button"
              class="w-6 h-6 rounded bg-base-300 hover:bg-primary hover:text-primary-content transition-colors flex items-center justify-center leading-none font-bold text-base cursor-pointer"
              onClick={() => onAgeChange(Math.max(16, currentAge - 1))}
              title="Restar un año"
            >
              -
            </button>
            <span class="font-bold px-1 text-primary tabular-nums">{currentAge}</span>
            <button
              type="button"
              class="w-6 h-6 rounded bg-base-300 hover:bg-primary hover:text-primary-content transition-colors flex items-center justify-center leading-none font-bold text-base cursor-pointer"
              onClick={() => onAgeChange(Math.min(80, currentAge + 1))}
              title="Sumar un año"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
