import type { WorkImpact } from "../../lib/work.ts";

export interface WorkBatteryProps {
  impact: WorkImpact;
  salaryPct?: number | null;
  productName?: string;
}

export default function WorkBattery({
  impact,
  productName,
}: WorkBatteryProps) {
  const { effort, hours, alarmsCount, coffeeCount, payoffSchedule, salaryLabel } = impact;

  // Límite de bloques para visualizar (hasta 8 bloques de jornada)
  const totalBlocks = Math.max(1, Math.min(8, impact.shiftsBlocks));

  return (
    <div
      class={`board-plate p-4 md:p-5 transition-all duration-300 ${
        effort.id === "galley" || effort.id === "titan"
          ? "border-error/60 shadow-[0_0_15px_rgba(232,72,46,0.12)]"
          : ""
      }`}
    >
      {/* Cabecera del Grado de Esfuerzo */}
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div class="flex items-center gap-2 min-w-0 max-w-full">
          <span class="inline-block w-3 h-3 rounded-full shrink-0" style={`background: ${effort.color}`} />
          <span class="font-signage uppercase text-base md:text-lg tracking-wider text-base-content/95 truncate">
            Escala de Sudor {productName ? `· ${productName}` : "Laboral"}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <span
            class={`font-board-mono text-xs uppercase px-2.5 py-1 rounded border flex items-center gap-1.5 font-bold shrink-0 ${effort.badgeClass}`}
            title={effort.description}
          >
            <span>{effort.emoji}</span>
            <span>{effort.label}</span>
          </span>
          {salaryLabel && (
            <span class="font-board-mono text-xs font-semibold px-2 py-0.5 bg-base-300 text-primary rounded shrink-0 break-words">
              {salaryLabel}
            </span>
          )}
        </div>
      </div>

      {/* Visualizador de Turnos / Barra de Bloques de Trabajo */}
      <div class="space-y-1.5 mb-3">
        <div class="flex justify-between items-center text-xs sm:text-sm font-board-mono opacity-85 flex-wrap gap-1">
          <span class="flex items-center gap-1.5 flex-wrap min-w-0">
            <span class="shrink-0">⚙️</span>
            <span>Carga horaria efectiva:</span>
            <strong class="text-primary font-bold">{hours.toFixed(1).replace(".", ",")} horas</strong>
          </span>
          <span class="text-xs uppercase font-semibold tracking-wider text-base-content/75 shrink-0">
            {impact.workdaysFormatted}
          </span>
        </div>

        {/* Medidor tipo LED Industrial con bloques */}
        <div class="grid grid-cols-8 gap-1 h-3.5 bg-base-300/80 p-0.5 rounded border border-base-content/15 w-full">
          {Array.from({ length: 8 }).map((_, i) => {
            const isFilled = i < totalBlocks;
            return (
              <div
                key={i}
                class={`h-full rounded-sm transition-all duration-300 ${
                  isFilled
                    ? "shadow-sm animate-[pulse_3s_ease-in-out_infinite]"
                    : "bg-base-content/10"
                }`}
                style={{
                  background: isFilled ? effort.color : undefined,
                  opacity: isFilled ? 0.95 : 0.25,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Métricas cotidianas de esfuerzo */}
      <div class="space-y-2 py-2.5 border-y border-base-300 text-xs sm:text-sm font-board-mono">
        {/* Fila 1: Dos micro-métricas simétricas (despertador y café) */}
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-2 p-2 bg-base-200/60 rounded min-w-0">
            <span class="text-lg shrink-0" aria-hidden="true">⏰</span>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-base-content block leading-tight truncate">
                {alarmsCount} {alarmsCount === 1 ? "madrugón" : "madrugones"}
              </span>
              <span class="text-[0.6875rem] sm:text-xs opacity-75 block truncate">de despertador</span>
            </div>
          </div>

          <div class="flex items-center gap-2 p-2 bg-base-200/60 rounded min-w-0">
            <span class="text-lg shrink-0" aria-hidden="true">☕</span>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-base-content block leading-tight truncate">
                ~{coffeeCount} {coffeeCount === 1 ? "café" : "cafés"}
              </span>
              <span class="text-[0.6875rem] sm:text-xs opacity-75 block truncate">frente al monitor</span>
            </div>
          </div>
        </div>

        {/* Fila 2: Meta de amortización destacada (ancho completo, legible, multilínea si hace falta) */}
        <div class="flex items-start sm:items-center gap-2.5 p-2 sm:p-2.5 bg-base-200/60 rounded border border-base-content/10 min-w-0">
          <span class="text-base sm:text-lg shrink-0 mt-0.5 sm:mt-0 text-primary" aria-hidden="true">🏁</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="text-[0.6875rem] uppercase tracking-[0.08em] opacity-75 font-semibold shrink-0">
                Meta de amortización:
              </span>
              <span class="font-bold text-primary break-words text-xs sm:text-sm">
                {payoffSchedule}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sentencia de curro con punchline */}
      <div class="mt-3 flex items-start gap-2.5 min-w-0">
        <span class="text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">{effort.emoji}</span>
        <p class="font-board-mono text-sm sm:text-base text-base-content/90 leading-relaxed min-w-0 break-words flex-1">
          {effort.punchline}
        </p>
      </div>
    </div>
  );
}
