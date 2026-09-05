import { formatPercent } from "../../lib/format.ts";
import type { ThreatLevel } from "../../lib/life.ts";

export interface LifeWeeksGridProps {
  userAge: number;
  retirementAge: number;
  yearsFullPay: number;
  pctCareerLeft: number | null;
  lifeWeeksCost: number;
  threat: ThreatLevel;
  productName?: string;
  onAgeChange?: (age: number) => void;
}

const PRESET_AGES = [20, 25, 30, 35, 40, 50, 60];

/**
 * Matriz de Semanas de Vida ("Life in Weeks").
 * Inspirado en el concepto viral de Tim Urban / Wait But Why:
 * Muestra el tiempo finito de vida consciente que le queda al usuario hasta la jubilación
 * y resalta visualmente el "mordisco" exacto que este producto le arranca a su juventud.
 */
export default function LifeWeeksGrid({
  userAge,
  retirementAge,
  yearsFullPay,
  pctCareerLeft,
  lifeWeeksCost,
  threat,
  productName = "este producto",
  onAgeChange,
}: LifeWeeksGridProps) {
  const yearsLeft = Math.max(0, retirementAge - userAge);
  const totalRemainingWeeks = Math.round(yearsLeft * 52);
  const livedWeeks = Math.round(userAge * 52);

  // Estimaciones existenciales
  const weekendCount = Math.round(lifeWeeksCost);
  const vacationWeeks = Math.max(1, Math.round(lifeWeeksCost / 2));

  // Bloques de años restantes para visualización tipo matriz (máximo 40 bloques representativos)
  const displayYearBlocks = Math.min(45, yearsLeft);
  const yearsEaten = yearsFullPay;

  return (
    <div class="board-plate p-5 sm:p-6 transition-all duration-300 border-l-4 border-l-secondary shadow-lg">
      {/* Cabecera */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-300">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span class="font-board-mono text-xs uppercase tracking-widest text-secondary font-bold">
              Perspectiva existencial · Nivel: {threat.label}
            </span>
          </div>
          <h3 class="font-signage uppercase text-2xl sm:text-3xl text-base-content mt-1">
            Matriz de Semanas de Vida Consciente
          </h3>
          <p class="font-board-mono text-xs opacity-75 mt-0.5">
            A tus {userAge} años has vivido {livedWeeks.toLocaleString()} semanas. Te quedan ~{yearsLeft} años ({totalRemainingWeeks.toLocaleString()} semanas) de trabajo hasta los {retirementAge}.
          </p>
        </div>

        {/* Badge de Mordisco */}
        <div class="bg-base-200/90 px-3.5 py-2 rounded-lg border border-base-300 self-start sm:self-auto shrink-0 font-board-mono text-right">
          <span class="text-[10px] uppercase opacity-70 block">Mordisco a tu futuro</span>
          <strong class="text-secondary text-base font-bold tabular-nums">
            -{lifeWeeksCost >= 1 ? `${lifeWeeksCost.toFixed(1).replace(".", ",")} semanas` : `${(lifeWeeksCost * 7).toFixed(0)} días`}
          </strong>
        </div>
      </div>

      {/* Selector Rápido de Edad */}
      {onAgeChange && (
        <div class="mt-4 pt-1 flex items-center gap-2 flex-wrap text-xs font-board-mono">
          <span class="opacity-75 mr-1">Cambia tu edad al instante:</span>
          {PRESET_AGES.map((age) => (
            <button
              type="button"
              key={age}
              onClick={() => onAgeChange(age)}
              class={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                userAge === age
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-base-200 hover:bg-base-300 text-base-content border border-base-300"
              }`}
            >
              {age} años
            </button>
          ))}
        </div>
      )}

      {/* Visualización de Bloques de Años Restantes */}
      <div class="mt-5 space-y-3">
        <div class="flex justify-between items-center text-xs font-board-mono opacity-80">
          <span>Cada casilla representa 1 año entero de tu vida activa restante:</span>
          <span class="font-bold text-secondary">{displayYearBlocks} años por vivir</span>
        </div>

        <div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-1.5 p-3 rounded-lg bg-base-200/60 border border-base-300">
          {Array.from({ length: displayYearBlocks }).map((_, index) => {
            const isEaten = index < Math.ceil(yearsEaten);
            return (
              <div
                key={index}
                class={`h-8 rounded flex flex-col items-center justify-center text-[10px] font-board-mono transition-all duration-300 ${
                  isEaten
                    ? "bg-secondary text-white font-bold shadow-[0_0_10px_rgba(232,72,46,0.5)] animate-pulse"
                    : "bg-accent/15 border border-accent/30 text-accent"
                }`}
                title={
                  isEaten
                    ? `Año ${index + 1}: Consumido por el pago de ${productName}`
                    : `Año ${index + 1}: Tuyo para disfrutar`
                }
              >
                <span>{index + 1}a</span>
                <span>{isEaten ? "💀" : "🌱"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarjetas de Equivalencias Existenciales */}
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-board-mono">
        <div class="p-3 rounded-lg bg-base-200/50 border border-base-300">
          <span class="text-base block mb-1">🏖️</span>
          <strong class="text-base-content block text-sm font-bold">
            ~{vacationWeeks} {vacationWeeks === 1 ? "quincena" : "quincenas"}
          </strong>
          <span class="opacity-75">de vacaciones de verano entregadas a cambio.</span>
        </div>

        <div class="p-3 rounded-lg bg-base-200/50 border border-base-300">
          <span class="text-base block mb-1">☕</span>
          <strong class="text-base-content block text-sm font-bold">
            ~{weekendCount} fines de semana
          </strong>
          <span class="opacity-75">completos de descanso libre absorbidos.</span>
        </div>

        <div class="p-3 rounded-lg bg-base-200/50 border border-base-300">
          <span class="text-base block mb-1">⚡</span>
          <strong class="text-secondary block text-sm font-bold">
            {pctCareerLeft != null ? `${formatPercent(pctCareerLeft)}%` : "Impacto vital"}
          </strong>
          <span class="opacity-75">de todo el tiempo laboral que te queda en el mundo.</span>
        </div>
      </div>
    </div>
  );
}
