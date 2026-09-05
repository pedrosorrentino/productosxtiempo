export interface WorkCalendarGridProps {
  /** Jornadas de 8 horas requeridas (ej. 3.4 o 12.1) */
  workdays8h: number;
  /** Horas totales de trabajo */
  hours: number;
  /** Nombre del producto */
  productName?: string;
  /** Moneda del país */
  currencySymbol?: string;
}

const TOTAL_MONTH_WORKDAYS = 22; // Estándar de días laborables en un mes (jornadas de 8h = ~176h)

/**
 * Gráfica interactiva del Mes Laboral.
 * Muestra una cuadrícula de 22 días laborables donde los días necesarios para pagar
 * el producto se iluminan como "Días Cautivos" (ámbar/rojo) frente a los "Días Libres" (verde).
 * Al cambiar el sueldo con los controles interactivos, los días se recalculan en tiempo real.
 */
export default function WorkCalendarGrid({
  workdays8h,
  hours,
  productName = "este producto",
}: WorkCalendarGridProps) {
  const safeWorkdays = Math.max(0, workdays8h);
  const fullLockedDays = Math.min(TOTAL_MONTH_WORKDAYS, Math.floor(safeWorkdays));
  const partialFraction = safeWorkdays - fullLockedDays;
  const hasPartial = fullLockedDays < TOTAL_MONTH_WORKDAYS && partialFraction > 0.05;
  const partialIndex = hasPartial ? fullLockedDays : -1;

  const freeDaysCount = Math.max(
    0,
    TOTAL_MONTH_WORKDAYS - fullLockedDays - (hasPartial ? 1 : 0),
  );

  const exceedsMonth = safeWorkdays > TOTAL_MONTH_WORKDAYS;
  const monthsRequired = (safeWorkdays / TOTAL_MONTH_WORKDAYS).toFixed(1).replace(".", ",");

  return (
    <div class="board-plate p-5 sm:p-6 transition-all duration-300">
      {/* Cabecera */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-300">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span class="font-board-mono text-xs uppercase tracking-widest text-primary font-bold">
              Impacto en tu jornada mensual
            </span>
          </div>
          <h3 class="font-signage uppercase text-2xl text-base-content mt-1">
            Calendario del Mes Laboral
          </h3>
          <p class="font-board-mono text-xs opacity-75 mt-0.5">
            ¿Cuántos días de tu mes trabajas exclusivamente para pagar {productName}?
          </p>
        </div>

        {/* Resumen numérico rápido */}
        <div class="flex items-center justify-around sm:justify-start gap-3 bg-base-200/80 px-3.5 py-2 rounded-lg border border-base-300 w-full sm:w-auto shrink-0 font-board-mono text-xs">
          <div class="text-center sm:text-right">
            <span class="opacity-70 block text-[10px] uppercase">Días dedicados</span>
            <strong class="text-primary text-sm font-bold">
              {safeWorkdays >= 10 ? safeWorkdays.toFixed(0) : safeWorkdays.toFixed(1).replace(".", ",")} d
            </strong>
          </div>
          <div class="w-px h-6 bg-base-content/15" />
          <div class="text-center sm:text-left">
            <span class="opacity-70 block text-[10px] uppercase">Días libres</span>
            <strong class="text-accent text-sm font-bold">
              {exceedsMonth ? "0 d" : `${freeDaysCount} d`}
            </strong>
          </div>
        </div>
      </div>

      {/* Alerta si supera el mes completo */}
      {exceedsMonth && (
        <div class="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded font-board-mono text-xs text-secondary-content flex items-center gap-2.5">
          <span class="text-base shrink-0">⏳</span>
          <div>
            <strong>Supera el mes laboral completo:</strong> Este importe requiere{" "}
            <strong>{monthsRequired} meses íntegros de trabajo</strong> (todo el salario neto acumulado
            sin destinar un solo céntimo a otros gastos).
          </div>
        </div>
      )}

      {/* Cuadrícula de 22 Días Laborables del Mes (Semana Laboral L-V) */}
      <div class="mt-5">
        {/* Cabecera de días laborables (Lun a Vie) en móviles y tablets */}
        <div class="grid grid-cols-5 lg:hidden gap-1.5 mb-1.5 text-center font-board-mono text-[10px] uppercase font-bold text-base-content/60">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
        </div>

        <div class="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-11 gap-1.5 sm:gap-2">
          {Array.from({ length: TOTAL_MONTH_WORKDAYS }).map((_, index) => {
            const dayNum = index + 1;
            const isFullLocked = index < fullLockedDays;
            const isPartial = index === partialIndex;
            const isFree = !isFullLocked && !isPartial;

            let bgClass = "bg-base-200/60 border-base-300 text-base-content/40";
            let statusText = "Libre";
            let icon = "✨";

            if (isFullLocked) {
              bgClass =
                "bg-primary/20 border-primary/50 text-primary font-bold shadow-xs hover:bg-primary/30";
              statusText = "Dedicado";
              icon = "🔒";
            } else if (isPartial) {
              bgClass =
                "bg-warning/15 border-warning/40 text-warning font-semibold hover:bg-warning/25";
              statusText = `${Math.round(partialFraction * 100)}% día`;
              icon = "⚙️";
            } else if (isFree) {
              bgClass =
                "bg-accent/10 border-accent/30 text-accent/90 hover:bg-accent/20";
              statusText = "Tu dinero";
              icon = "🌱";
            }

            return (
              <div
                key={dayNum}
                class={`p-1.5 sm:p-2 rounded border flex flex-col justify-between min-h-[46px] sm:min-h-[64px] transition-all duration-200 ${bgClass}`}
                title={`Día laborable ${dayNum}: ${statusText}`}
              >
                <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-board-mono">
                  <span class="opacity-80 font-medium">d{dayNum}</span>
                  <span class="text-xs">{icon}</span>
                </div>
                <div class="font-board-mono text-[9px] sm:text-[10px] uppercase tracking-wider truncate mt-0.5 leading-tight">
                  {statusText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda explicativa interactiva */}
        <div class="mt-4 pt-3 border-t border-base-300/60 flex flex-wrap items-center justify-between gap-3 text-xs font-board-mono">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="flex items-center gap-1.5 text-primary">
              <span class="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Días dedicados a {productName}</span>
            </span>
            <span class="flex items-center gap-1.5 text-accent">
              <span class="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>Días de nómina libre para vivir</span>
            </span>
          </div>

          <span class="opacity-70 text-[11px]">
            * Basado en mes estándar de 22 jornadas de 8h ({hours.toFixed(1).replace(".", ",")} h totales)
          </span>
        </div>
      </div>
    </div>
  );
}
