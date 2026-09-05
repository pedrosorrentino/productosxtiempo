import { useEffect, useRef, useState } from "preact/hooks";
import {
  formatHours,
  formatWorkdays,
  formatIntegerThousands,
} from "../../lib/format.ts";
import { lifeModeCopy, countryPage } from "../../i18n/es.ts";

export interface BenchmarkItem {
  key: string;
  name: string;
  icon: string;
  price: number;
}

export interface CountryHeroCenterProps {
  countryName: string;
  currencySymbol: string;
  medianNetMonthly: number | null;
  legalWeeklyHours: number;
  realAnnualHours: number | null;
  retirementAge: number;
  userNetMonthly: number | null;
  userWeeklyHours: number | null;
  userAge: number | null;
  viewMode: "work" | "life";
  onSalaryChange: (salary: number) => void;
  onHoursChange: (hours: number) => void;
  onAgeChange: (age: number) => void;
  onViewModeChange: (mode: "work" | "life") => void;
  benchmarks: BenchmarkItem[];
}

export default function CountryHeroCenter({
  countryName,
  currencySymbol,
  medianNetMonthly,
  legalWeeklyHours,
  realAnnualHours,
  retirementAge = 67,
  userNetMonthly,
  userWeeklyHours,
  userAge,
  viewMode,
  onSalaryChange,
  onHoursChange,
  onAgeChange,
  onViewModeChange,
  benchmarks,
}: CountryHeroCenterProps) {
  // Salario y jornada activas (usuario o referencia oficial)
  const activeSalary = userNetMonthly ?? medianNetMonthly ?? 1500;
  const activeHours = userWeeklyHours ?? legalWeeklyHours;
  const activeAge = userAge ?? 30;

  const isCustomSalary = userNetMonthly != null && userNetMonthly !== medianNetMonthly;

  // Cálculo del valor de la hora
  const hourlyWage = activeSalary > 0 && activeHours > 0
    ? (activeSalary * 12) / (52 * activeHours)
    : 10;

  // Interpolación cinemática suave del salario por hora (60 FPS)
  const [displayWage, setDisplayWage] = useState<number>(hourlyWage);
  const [pulse, setPulse] = useState<boolean>(false);
  const prevWageRef = useRef<number>(hourlyWage);

  useEffect(() => {
    if (Math.abs(prevWageRef.current - hourlyWage) < 0.01) return;
    const startVal = displayWage;
    const endVal = hourlyWage;
    prevWageRef.current = hourlyWage;

    setPulse(true);
    const pTimer = setTimeout(() => setPulse(false), 450);

    const startTime = performance.now();
    const duration = 380;

    let animId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayWage(startVal + (endVal - startVal) * ease);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayWage(endVal);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(pTimer);
    };
  }, [hourlyWage]);

  // Modo Vida: Semanas restantes de vida laboral
  const yearsUntilRetirement = Math.max(0, retirementAge - activeAge);
  const remainingWorkWeeks = Math.round(yearsUntilRetirement * 52);
  const totalLifetimeHoursWorked = Math.round(yearsUntilRetirement * 52 * activeHours);

  // Tacómetro SVG arc
  const arcTotalDeg = 240;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcTotalDeg / 360) * circumference;

  // Porcentaje relativo en tacómetro (clamp 0..100)
  // Referencia visual: 5 €/h es bajo (15%), 35 €/h es muy alto (95%)
  const wageRatio = Math.max(5, Math.min(40, hourlyWage));
  const wagePct = Math.min(100, Math.max(10, ((wageRatio - 5) / 35) * 100));
  const strokeOffset = arcLength - (wagePct / 100) * arcLength;

  // Formato número salario/hora con 2 decimales
  const formattedWage = displayWage.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Presets de salario
  const baseMed = medianNetMonthly ?? 1800;
  const presetLow = Math.round(baseMed * 0.65);
  const presetMed = baseMed;
  const presetHigh = Math.round(baseMed * 1.75);

  return (
    <div class="board-plate p-5 sm:p-7 relative overflow-hidden shadow-xl border border-base-300">
      {/* Fondo con brillo dinámico reactivo */}
      <div
        class={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          viewMode === "life"
            ? "bg-warning/15"
            : pulse
              ? "bg-primary/25"
              : "bg-primary/10"
        }`}
        aria-hidden="true"
      />

      {/* 1. TOP HEADER: Selector de Modo (Trabajo vs Tiempo de Vida) */}
      <div class="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-base-content/10">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span class="font-board-mono text-xs uppercase tracking-widest opacity-75">
            {viewMode === "work" ? "Mando de Esfuerzo y Salario" : "Terminal de Longevidad Laboral"}
          </span>
          {isCustomSalary && (
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-board-mono bg-primary text-primary-content tracking-wider uppercase">
              Personalizado
            </span>
          )}
        </div>

        {/* Conmutador táctil de Modo */}
        <div class="flex items-center gap-1 bg-base-300/80 p-1 rounded-lg border border-base-content/10 select-none">
          <button
            type="button"
            class={`flex items-center gap-2 px-3 py-1.5 rounded-md font-board-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              viewMode === "work"
                ? "bg-base-100 text-primary font-bold shadow"
                : "text-base-content/70 hover:text-base-content font-medium"
            }`}
            onClick={() => onViewModeChange("work")}
            title="Ver cotizaciones en horas y jornadas de trabajo"
          >
            <span>💼</span>
            <span>{lifeModeCopy.tabWork}</span>
          </button>

          <button
            type="button"
            class={`flex items-center gap-2 px-3 py-1.5 rounded-md font-board-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
              viewMode === "life"
                ? "bg-primary text-primary-content font-extrabold shadow"
                : "text-base-content/70 hover:text-base-content font-medium"
            }`}
            onClick={() => onViewModeChange("life")}
            title="Ver el coste en semanas y porcentaje de tu vida finita"
          >
            <span>⏳</span>
            <span>{lifeModeCopy.tabLife}</span>
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-error animate-ping ml-0.5" />
          </button>
        </div>
      </div>

      {/* 2. NÚCLEO VISUAL "BESTIA" SEGÚN MODO ACTIVO */}
      {viewMode === "work" ? (
        /* ================= MODO TRABAJO: TACÓMETRO RADIAL DE SALARIO HORARIO ================= */
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Tacómetro / Power Gauge de la Hora */}
          <div class="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div class="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
              <svg
                class="w-full h-full transform -rotate-120 drop-shadow-md"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                {/* Pista de fondo gris */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="12"
                  stroke-dasharray={`${arcLength} ${circumference}`}
                  stroke-linecap="round"
                  class="text-base-300 opacity-60"
                />
                {/* Arco animado reactivo */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="url(#wageGaugeGrad)"
                  stroke-width="12"
                  stroke-dasharray={`${arcLength} ${circumference}`}
                  stroke-dashoffset={strokeOffset}
                  stroke-linecap="round"
                  class="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="wageGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3ec97e" />
                    <stop offset="60%" stop-color="#ffb020" />
                    <stop offset="100%" stop-color="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Centro de datos del tacómetro */}
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pt-2">
                <span class="font-board-mono text-[11px] uppercase tracking-widest opacity-75 block">
                  Tu hora neta
                </span>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span
                    class={`font-signage text-4xl sm:text-5xl font-black tabular-nums tracking-tight transition-transform duration-200 ${
                      pulse ? "scale-105 text-primary" : "text-base-content"
                    }`}
                  >
                    {formattedWage}
                  </span>
                  <span class="font-signage text-xl sm:text-2xl text-primary font-bold">
                    {currencySymbol}
                  </span>
                </div>
                <span class="font-board-mono text-xs uppercase tracking-wider text-primary font-bold mt-0.5">
                  por hora trabajada
                </span>
                <span class="mt-1 px-2 py-0.5 rounded text-[10px] font-board-mono bg-base-300 text-base-content/80 border border-base-content/10">
                  {isCustomSalary ? "⚡ Nómina ajustada" : "📌 Mediana de referencia"}
                </span>
              </div>
            </div>

            {/* Subtexto aclaratorio */}
            <p class="mt-2 text-xs font-board-mono opacity-70 max-w-xs">
              {isCustomSalary
                ? `Calculado para ${activeSalary.toLocaleString("es-ES")} ${currencySymbol}/mes y ${activeHours} h/sem.`
                : countryPage.dataDisclaimer}
            </p>
          </div>

          {/* Panel Interactivo: Sliders, Presets y Métricas de Esfuerzo */}
          <div class="lg:col-span-7 space-y-5">
            {/* Métricas de conversión instantáneas */}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="board-cell p-3">
                <span class="font-board-mono text-[10px] uppercase opacity-75 block">1 Jornada (8h)</span>
                <span class="font-board-mono text-lg font-bold tabular-nums text-primary block mt-0.5">
                  {(hourlyWage * 8).toLocaleString("es-ES", { maximumFractionDigits: 0 })} {currencySymbol}
                </span>
              </div>
              <div class="board-cell p-3">
                <span class="font-board-mono text-[10px] uppercase opacity-75 block">1 Mes neto</span>
                <span class="font-board-mono text-lg font-bold tabular-nums block mt-0.5">
                  {activeSalary.toLocaleString("es-ES")} {currencySymbol}
                </span>
              </div>
              <div class="board-cell p-3">
                <span class="font-board-mono text-[10px] uppercase opacity-75 block">Semana legal</span>
                <span class="font-board-mono text-lg font-bold tabular-nums block mt-0.5">
                  {activeHours} h
                </span>
              </div>
              <div class="board-cell p-3">
                <span class="font-board-mono text-[10px] uppercase opacity-75 block">Año real OCDE</span>
                <span class="font-board-mono text-lg font-bold tabular-nums block mt-0.5">
                  {realAnnualHours ? `${formatIntegerThousands(realAnnualHours)} h` : "1.650 h"}
                </span>
              </div>
            </div>

            {/* Controles del Salario Neto */}
            <div class="bg-base-200/80 p-4 rounded-xl border border-base-300">
              <div class="flex items-center justify-between gap-2 mb-2">
                <label class="font-signage text-sm uppercase tracking-wider block">
                  Ajusta tu sueldo mensual neto
                </label>
                <div class="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="300"
                    max="20000"
                    step="50"
                    value={activeSalary}
                    onInput={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val > 0) onSalaryChange(val);
                    }}
                    class="input input-xs w-28 font-board-mono text-right font-bold bg-base-100 border-base-content/20 text-primary"
                    aria-label="Salario neto mensual en números"
                  />
                  <span class="font-board-mono text-xs font-bold text-primary">{currencySymbol}</span>
                </div>
              </div>

              {/* Slider interactivo suave */}
              <input
                type="range"
                min={Math.max(400, Math.round(baseMed * 0.35))}
                max={Math.round(baseMed * 3)}
                step="25"
                value={activeSalary}
                onInput={(e) => onSalaryChange(Number((e.target as HTMLInputElement).value))}
                class="range range-primary range-sm w-full cursor-pointer"
                aria-label="Ajustar sueldo con barra deslizante"
              />

              {/* Botones de presets rápidos */}
              <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-base-content/10">
                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    class={`px-2.5 py-1 rounded text-xs font-board-mono font-medium transition-all cursor-pointer ${
                      activeSalary === presetLow
                        ? "bg-primary text-primary-content font-bold shadow-xs"
                        : "bg-base-300/80 hover:bg-base-300 text-base-content/80"
                    }`}
                    onClick={() => onSalaryChange(presetLow)}
                  >
                    Inicial (~{presetLow} {currencySymbol})
                  </button>
                  <button
                    type="button"
                    class={`px-2.5 py-1 rounded text-xs font-board-mono font-medium transition-all cursor-pointer ${
                      activeSalary === presetMed && !isCustomSalary
                        ? "bg-primary text-primary-content font-bold shadow-xs"
                        : "bg-base-300/80 hover:bg-base-300 text-base-content/80"
                    }`}
                    onClick={() => onSalaryChange(presetMed)}
                  >
                    Mediana oficial ({presetMed} {currencySymbol})
                  </button>
                  <button
                    type="button"
                    class={`px-2.5 py-1 rounded text-xs font-board-mono font-medium transition-all cursor-pointer ${
                      activeSalary === presetHigh
                        ? "bg-primary text-primary-content font-bold shadow-xs"
                        : "bg-base-300/80 hover:bg-base-300 text-base-content/80"
                    }`}
                    onClick={() => onSalaryChange(presetHigh)}
                  >
                    Cualificado (~{presetHigh} {currencySymbol})
                  </button>
                </div>

                {isCustomSalary && (
                  <button
                    type="button"
                    class="text-xs font-board-mono text-primary hover:underline cursor-pointer"
                    onClick={() => onSalaryChange(presetMed)}
                  >
                    ↺ Restablecer mediana
                  </button>
                )}
              </div>
            </div>

            {/* Ajuste fino de horas semanales */}
            <div class="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-board-mono opacity-85">
              <span>Jornada de trabajo semanal:</span>
              <div class="flex items-center gap-1">
                {[35, 37.5, 40, 42].map((h) => (
                  <button
                    key={h}
                    type="button"
                    class={`px-2 py-0.5 rounded text-[11px] font-board-mono transition-colors cursor-pointer ${
                      activeHours === h
                        ? "bg-primary/20 text-primary font-bold border border-primary/40"
                        : "bg-base-300/60 hover:bg-base-300 text-base-content/70"
                    }`}
                    onClick={() => onHoursChange(h)}
                  >
                    {h} h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= MODO TIEMPO DE VIDA: TERMINAL EXISTENCIAL ================= */
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Gran Contador de Semanas Laborales Restantes */}
          <div class="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div class="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-dashed border-warning/40 flex flex-col items-center justify-center p-4 bg-base-200/60 shadow-inner">
              <span class="font-board-mono text-xs uppercase tracking-widest text-warning font-bold block">
                Semanas Laborables
              </span>
              <span class="font-signage text-5xl sm:text-6xl font-black tabular-nums tracking-tight text-warning mt-1 block">
                {remainingWorkWeeks.toLocaleString("es-ES")}
              </span>
              <span class="font-board-mono text-xs opacity-80 mt-1 block max-w-[11rem]">
                semanas de trabajo hasta tu jubilación oficial ({retirementAge} años)
              </span>
              <span class="mt-2 text-[10px] font-board-mono px-2 py-0.5 rounded bg-warning/20 text-warning font-semibold border border-warning/30">
                ~{totalLifetimeHoursWorked.toLocaleString("es-ES")} h de vida
              </span>
            </div>

            <p class="mt-3 text-xs font-board-mono opacity-70 max-w-xs">
              Esperanza de vida: ~83 años en {countryName}. Tu recurso más escaso no es el dinero, sino las semanas activas que te quedan.
            </p>
          </div>

          {/* Panel Interactivo de Edad y Batería de Vida */}
          <div class="lg:col-span-7 space-y-5">
            {/* Selector de edad interactivo */}
            <div class="bg-base-200/80 p-4 rounded-xl border border-base-300">
              <div class="flex items-center justify-between gap-2 mb-2">
                <div>
                  <span class="font-signage text-base uppercase tracking-wider block">
                    ¿Qué edad tienes actualmente?
                  </span>
                  <span class="font-board-mono text-xs opacity-75 block">
                    Te quedan ~{yearsUntilRetirement} años de actividad laboral
                  </span>
                </div>

                <div class="flex items-center gap-1.5 bg-base-100 p-1 rounded-lg border border-base-content/10">
                  <button
                    type="button"
                    class="w-7 h-7 rounded bg-base-200 hover:bg-primary hover:text-primary-content font-bold transition-all flex items-center justify-center cursor-pointer"
                    onClick={() => onAgeChange(Math.max(16, activeAge - 1))}
                  >
                    -
                  </button>
                  <span class="font-board-mono text-lg font-bold text-primary px-2 tabular-nums">
                    {activeAge} <span class="text-xs font-normal opacity-75">años</span>
                  </span>
                  <button
                    type="button"
                    class="w-7 h-7 rounded bg-base-200 hover:bg-primary hover:text-primary-content font-bold transition-all flex items-center justify-center cursor-pointer"
                    onClick={() => onAgeChange(Math.min(80, activeAge + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Slider de edad */}
              <input
                type="range"
                min="18"
                max="75"
                value={activeAge}
                onInput={(e) => onAgeChange(Number((e.target as HTMLInputElement).value))}
                class="range range-warning range-sm w-full cursor-pointer mt-1"
                aria-label="Ajustar edad en la barra deslizante"
              />

              <div class="flex justify-between text-[10px] font-board-mono opacity-60 mt-1">
                <span>18 años (Inicio laboral)</span>
                <span>40 años (Madurez)</span>
                <span>{retirementAge} años (Jubilación)</span>
              </div>
            </div>

            {/* Batería Visual de Vida Nacional */}
            <div class="bg-base-200/80 p-4 rounded-xl border border-base-300 space-y-3">
              <div class="flex items-center justify-between text-xs font-board-mono">
                <span class="font-bold uppercase tracking-wider">Batería de tu vida (Esperanza ~83 años)</span>
                <span class="text-warning font-bold">{Math.round((activeAge / 83) * 100)}% transcurrido</span>
              </div>

              {/* Barra segmentada */}
              <div class="h-6 w-full rounded-lg overflow-hidden bg-base-300 flex p-0.5 border border-base-content/10 gap-0.5">
                {/* Segmento 1: Años vividos */}
                <div
                  style={{ width: `${Math.min(100, (activeAge / 83) * 100)}%` }}
                  class="bg-neutral-content/40 h-full rounded-l transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-base-300 truncate px-1"
                  title={`${activeAge} años vividos`}
                >
                  {activeAge} a
                </div>

                {/* Segmento 2: Años de trabajo restantes */}
                <div
                  style={{ width: `${Math.max(0, (yearsUntilRetirement / 83) * 100)}%` }}
                  class="bg-warning h-full transition-all duration-300 flex items-center justify-center text-[10px] font-extrabold text-warning-content truncate px-1 shadow-sm"
                  title={`${yearsUntilRetirement} años de trabajo restantes`}
                >
                  {yearsUntilRetirement > 5 ? `${yearsUntilRetirement} a trabajo` : `${yearsUntilRetirement}a`}
                </div>

                {/* Segmento 3: Años de jubilación / libertad */}
                <div
                  style={{ width: `${Math.max(0, ((83 - Math.max(retirementAge, activeAge)) / 83) * 100)}%` }}
                  class="bg-accent/80 h-full rounded-r transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-accent-content truncate px-1"
                  title={`~${Math.max(0, 83 - Math.max(retirementAge, activeAge))} años de jubilación`}
                >
                  Libertad
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between text-[11px] font-board-mono opacity-80 pt-1">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-neutral-content/40 inline-block" />
                  Vivido: {activeAge} años
                </span>
                <span class="flex items-center gap-1.5 text-warning font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
                  Trabajo restante: {yearsUntilRetirement} años
                </span>
                <span class="flex items-center gap-1.5 text-accent font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                  Jubilación: ~{Math.max(0, 83 - Math.max(retirementAge, activeAge))} años
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BARÓMETRO DE ESFUERZO EN [PAÍS] (BENCHMARK RÁPIDO) */}
      <div class="mt-8 pt-6 border-t border-base-content/10">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h3 class="font-signage text-sm uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span>
            <span>El Barómetro de {countryName}: ¿Cuánto cuesta vivir aquí?</span>
          </h3>
          <span class="font-board-mono text-[11px] opacity-70">
            Recalculado con tu hora de {formattedWage} {currencySymbol}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {benchmarks.map((bm) => {
            const hoursRequired = bm.price / hourlyWage;
            let effortFormatted = "";
            if (hoursRequired < 1) {
              const mins = Math.max(1, Math.round(hoursRequired * 60));
              effortFormatted = `${mins} min`;
            } else if (hoursRequired < 8) {
              effortFormatted = `${formatHours(hoursRequired)} h`;
            } else {
              const days = hoursRequired / 8;
              effortFormatted = `${formatWorkdays(days)} j`;
            }

            return (
              <div
                key={bm.key}
                class="group p-3 rounded-lg bg-base-200/50 hover:bg-base-200 border border-base-300 hover:border-primary/50 transition-all shadow-xs"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xl" aria-hidden="true">{bm.icon}</span>
                  <span class="font-board-mono text-xs opacity-75 font-semibold">
                    {bm.price.toLocaleString("es-ES")} {currencySymbol}
                  </span>
                </div>
                <span class="font-bold text-xs text-base-content block mt-2 truncate">
                  {bm.name}
                </span>
                <div class="mt-1 flex items-baseline justify-between">
                  <span class="font-board-mono text-xs font-bold text-primary">
                    {effortFormatted}
                  </span>
                  <span class="text-[10px] font-board-mono opacity-60">
                    {viewMode === "life" ? "de tu vida" : "de curro"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
