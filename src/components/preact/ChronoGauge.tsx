import { useEffect, useRef, useState } from "preact/hooks";

export interface ChronoGaugeProps {
  /** Cifra principal formateada (ej. "27,4" o "120") */
  value: string;
  /** Unidad del hero (ej. "horas", "jornadas", "meses") */
  unit: string;
  /** Frase para accesibilidad */
  label: string;
  /** Porcentaje de la nómina mensual que absorbe el producto (0 a 100+) */
  pctMonth?: number | null;
  /** Equivalencia secundaria (ej. "= 3,4 jornadas de 8 h") */
  secondaryText?: string | null;
  /** Frase de cola explicativa */
  fullPayTail?: string | null;
  /** Si estamos en modo vida consciente */
  isLifeMode?: boolean;
}

/**
 * Tacómetro Radial de Esfuerzo & Contador Cinético de Alta Precisión.
 * Reemplaza al antiguo Odometer split-flap con un diseño hipermoderno:
 * - Arco circular reactivo tipo velocímetro/cronógrafo (240°) con gradiente de color según el impacto.
 * - Contador numérico con interpolación fluida a 60 FPS mediante requestAnimationFrame.
 * - Micro-destello ("glow pulse") cuando el valor asienta tras un cambio de nómina o precio.
 */
export default function ChronoGauge({
  value,
  unit,
  label,
  pctMonth = 15,
  secondaryText = null,
  fullPayTail = null,
  isLifeMode = false,
}: ChronoGaugeProps) {
  // Parsing numérico para interpolación fluida
  const numericTarget = parseFloat(value.replace(",", "."));
  const isNumeric = Number.isFinite(numericTarget);

  const [displayValue, setDisplayValue] = useState<number>(isNumeric ? numericTarget : 0);
  const [pulse, setPulse] = useState(false);
  const prevTargetRef = useRef(numericTarget);

  // Interpolación numérica cinemática fluida
  useEffect(() => {
    if (!isNumeric) return;
    if (prevTargetRef.current === numericTarget) return;

    const startVal = displayValue;
    const endVal = numericTarget;
    prevTargetRef.current = numericTarget;

    setPulse(true);
    const pulseTimer = setTimeout(() => setPulse(false), 500);

    const startTime = performance.now();
    const duration = 420; // ms de transición suave

    let animId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing cúbico desacelerado (ease-out cubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + (endVal - startVal) * ease);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(pulseTimer);
    };
  }, [numericTarget, isNumeric]);

  // Formato para mostrar los dígitos interpolados
  const formattedDisplay = isNumeric
    ? displayValue >= 100
      ? Math.round(displayValue).toString()
      : displayValue.toFixed(1).replace(".", ",")
    : value;

  // Cálculo del arco del tacómetro (240 grados, apertura abajo)
  const arcTotalDeg = 240;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcTotalDeg / 360) * circumference;

  // Porcentaje clamp 0 a 100 para la aguja/arco
  const safePct = Math.max(0, Math.min(100, pctMonth ?? 15));
  const strokeOffset = arcLength - (safePct / 100) * arcLength;

  // Selección de color según el porcentaje de la nómina
  let arcColor = "#3ec97e"; // Verde esmeralda: gasto ligero (< 15%)
  let impactBadge = "Impacto Ligero";
  let badgeClass = "text-accent bg-accent/10 border-accent/30";

  if (safePct >= 15 && safePct < 40) {
    arcColor = "#ffb020"; // Ámbar: impacto moderado
    impactBadge = "Impacto Moderado";
    badgeClass = "text-primary bg-primary/10 border-primary/30";
  } else if (safePct >= 40 && safePct < 85) {
    arcColor = "#f97316"; // Naranja: alto impacto
    impactBadge = "Alto Impacto";
    badgeClass = "text-warning bg-warning/10 border-warning/30";
  } else if (safePct >= 85) {
    arcColor = "#e8482e"; // Rojo: sobreesfuerzo vital
    impactBadge = "Sobreesfuerzo Vital";
    badgeClass = "text-error bg-error/10 border-error/30";
  }

  return (
    <div
      class="board-plate p-5 sm:p-7 relative overflow-hidden transition-all duration-300 shadow-lg border border-base-300"
      aria-label={label}
    >
      {/* Fondo con brillo reactivo tenue */}
      <div
        class={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          pulse ? "opacity-30" : "opacity-10"
        }`}
        style={{ background: arcColor }}
      />

      <div class="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        {/* Izquierda: Tacómetro Radial SVG */}
        <div class="relative flex items-center justify-center shrink-0">
          <svg
            width="170"
            height="170"
            viewBox="0 0 140 140"
            class="transform -rotate-120 drop-shadow-md"
            aria-hidden="true"
          >
            {/* Pista de fondo (fondo oscuro) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              stroke-width="9"
              stroke-dasharray={`${arcLength} ${circumference}`}
              stroke-linecap="round"
              class="text-base-300/70"
            />

            {/* Arco dinámico con el valor actual */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={arcColor}
              stroke-width="10"
              stroke-dasharray={`${arcLength} ${circumference}`}
              stroke-dashoffset={strokeOffset}
              stroke-linecap="round"
              class="transition-all duration-500 ease-out"
              style={{
                filter: pulse ? `drop-shadow(0 0 8px ${arcColor})` : "none",
              }}
            />
          </svg>

          {/* Centro del Tacómetro: % de la Nómina */}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pt-2">
            <span class="font-board-mono text-[11px] uppercase tracking-wider text-base-content/70">
              Absorbe
            </span>
            <span
              class="font-signage text-3xl font-bold leading-none my-0.5 tracking-tight"
              style={{ color: arcColor }}
            >
              {safePct >= 100 ? "+100%" : `${Math.round(safePct)}%`}
            </span>
            <span class="font-board-mono text-[10px] text-base-content/60">
              de tu mes
            </span>
          </div>
        </div>

        {/* Centro/Derecha: Cifra Heroica Gigante con Micro-Animación */}
        <div class="flex-1 text-center lg:text-left min-w-0">
          <div class="flex items-center justify-center lg:justify-start gap-2 mb-2 flex-wrap">
            <span class={`font-board-mono text-xs uppercase px-2.5 py-0.5 rounded border font-bold ${badgeClass}`}>
              {impactBadge}
            </span>
            <span class="font-board-mono text-xs text-base-content/65">
              Esfuerzo real requerido
            </span>
          </div>

          <div class="flex items-baseline justify-center lg:justify-start gap-3 flex-wrap">
            <span
              class={`font-signage tracking-tight leading-none text-[clamp(4.2rem,11vw,7.8rem)] select-none transition-all duration-300 ${
                pulse
                  ? "text-primary scale-[1.02] drop-shadow-[0_0_15px_rgba(255,176,32,0.4)]"
                  : "text-base-content"
              }`}
            >
              {formattedDisplay}
            </span>

            <span class="font-signage uppercase text-primary text-[clamp(1.8rem,4.5vw,3.2rem)] font-bold leading-none">
              {unit}
            </span>
          </div>

          {/* Subtítulos humanos y equivalencias */}
          {!isLifeMode && fullPayTail && (
            <p class="mt-2 text-base sm:text-lg opacity-90 break-words font-medium">
              {fullPayTail}
            </p>
          )}

          {!isLifeMode && secondaryText && (
            <p class="mt-1 font-board-mono text-sm opacity-85 text-primary/90 flex items-center justify-center lg:justify-start gap-1.5">
              <span class="text-xs">⚡</span>
              <span>{secondaryText}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
