import { lifeModeCopy } from "../../i18n/es.ts";

export interface LifeBarControlProps {
  age: number | null;
  viewMode: "work" | "life";
  onAgeChange: (age: number | null) => void;
  onViewModeChange: (mode: "work" | "life") => void;
  retirementAge?: number;
}

export default function LifeBarControl({
  age,
  viewMode,
  onAgeChange,
  onViewModeChange,
  retirementAge = 67,
}: LifeBarControlProps) {
  const currentAge = age ?? 30;
  const isEstimated = age == null;
  const yearsLeft = Math.max(0, retirementAge - currentAge);

  return (
    <div class="board-plate p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-primary bg-base-200/90 shadow-md">
      {/* Selector rápido de edad */}
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl" aria-hidden="true">⏳</span>
          <div>
            <span class="font-signage uppercase text-base tracking-wider block leading-none">
              {lifeModeCopy.agePrompt}
            </span>
            <span class="font-board-mono text-xs text-base-content/75 block leading-tight mt-0.5">
              {isEstimated ? "Toca para personalizar tu vida" : `Te quedan ~${yearsLeft} años hasta jubilarte`}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-base-300/80 rounded-md p-1 border border-base-content/10">
          <button
            type="button"
            class="w-7 h-7 rounded bg-base-200 hover:bg-primary hover:text-primary-content font-bold transition-all text-sm flex items-center justify-center cursor-pointer select-none active:scale-95"
            onClick={() => onAgeChange(Math.max(16, currentAge - 1))}
            title="Restar 1 año"
          >
            -
          </button>
          <div class="px-2 text-center min-w-[3.5rem]">
            <span class="font-board-mono text-base font-bold text-primary tabular-nums block leading-tight">
              {currentAge}
            </span>
            <span class="font-board-mono text-xs uppercase opacity-75 block leading-tight">
              {lifeModeCopy.ageYearsOld}
            </span>
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded bg-base-200 hover:bg-primary hover:text-primary-content font-bold transition-all text-sm flex items-center justify-center cursor-pointer select-none active:scale-95"
            onClick={() => onAgeChange(Math.min(80, currentAge + 1))}
            title="Sumar 1 año"
          >
            +
          </button>
        </div>

        {/* Range slider fino para cambios rápidos */}
        <input
          type="range"
          min="18"
          max="70"
          value={currentAge}
          onInput={(e) => onAgeChange(Number((e.target as HTMLInputElement).value))}
          class="range range-primary range-xs w-24 sm:w-32 opacity-80 hover:opacity-100 cursor-pointer hidden md:inline-block"
          aria-label="Ajustar edad"
        />
      </div>

      {/* Conmutador de Modo: Trabajo vs Tiempo de Vida */}
      <div class="flex items-center gap-1.5 bg-base-300/80 p-1 rounded-lg border border-base-content/10 select-none">
        <button
          type="button"
          class={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-board-mono text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            viewMode === "work"
              ? "bg-base-100 text-primary font-bold shadow"
              : "text-base-content/75 hover:text-base-content font-medium"
          }`}
          onClick={() => onViewModeChange("work")}
          title={lifeModeCopy.toggleToWorkTip}
        >
          <span>💼</span>
          <span>{lifeModeCopy.tabWork}</span>
        </button>

        <button
          type="button"
          class={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-board-mono text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
            viewMode === "life"
              ? "bg-primary text-primary-content font-extrabold shadow"
              : "text-base-content/75 hover:text-base-content font-medium"
          }`}
          onClick={() => onViewModeChange("life")}
          title={lifeModeCopy.toggleToLifeTip}
        >
          <span>⏳</span>
          <span>{lifeModeCopy.tabLife}</span>
          <span class="inline-block w-2 h-2 rounded-full bg-error animate-ping ml-0.5" />
        </button>
      </div>
    </div>
  );
}
