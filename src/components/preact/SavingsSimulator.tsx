import { useState } from "preact/hooks";

export interface SavingsSimulatorProps {
  productPrice: number;
  netMonthly: number;
  currencySymbol: string;
  productName?: string;
}

const PRESET_PCTS = [10, 15, 20, 30, 50];

/**
 * Simulador de Capacidad de Ahorro y Fecha de Compra.
 * Responde a la pregunta psicológica clave: "¿Cuándo podré comprármelo sin endeudarme ni sufrir?".
 * Permite seleccionar un porcentaje de ahorro mensual y proyecta la fecha exacta de compra libre de deuda.
 */
export default function SavingsSimulator({
  productPrice,
  netMonthly,
  currencySymbol,
  productName = "este producto",
}: SavingsSimulatorProps) {
  const [selectedPct, setSelectedPct] = useState(20);

  const monthlySavingsAmount = Math.round(netMonthly * (selectedPct / 100));
  const monthsNeeded = monthlySavingsAmount > 0 ? productPrice / monthlySavingsAmount : 0;
  const roundedMonths = monthsNeeded.toFixed(1).replace(".", ",");

  // Proyección de la fecha en el calendario
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(monthsNeeded * 30.4));
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const targetDateFormatted = `${monthNames[targetDate.getMonth()]} de ${targetDate.getFullYear()}`;

  return (
    <div class="board-plate p-5 sm:p-6 transition-all duration-300">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-300">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-info" />
            <span class="font-board-mono text-xs uppercase tracking-widest text-info font-bold">
              Planificación financiera
            </span>
          </div>
          <h3 class="font-signage uppercase text-2xl text-base-content mt-1">
            Simulador de Ahorro Libre de Deuda
          </h3>
          <p class="font-board-mono text-sm opacity-80 mt-0.5">
            ¿Cuánto tardarías en comprar {productName} apartando una parte de tu nómina?
          </p>
        </div>

        {/* Cifra de meses destacados */}
        <div class="bg-base-200/90 px-4 py-2 rounded-lg border border-base-300 w-full sm:w-auto self-start sm:self-auto shrink-0 font-board-mono text-center sm:text-right">
          <span class="text-xs uppercase opacity-75 block">Plazo de ahorro</span>
          <strong class="text-primary text-base sm:text-lg font-bold">
            {monthsNeeded < 1 ? "Menos de 1 mes" : `${roundedMonths} meses`}
          </strong>
        </div>
      </div>

      {/* Selector de % de Ahorro */}
      <div class="mt-4 space-y-2">
        <span class="font-board-mono text-sm font-medium opacity-85 block">Elige tu ahorro mensual:</span>
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          {PRESET_PCTS.map((pct) => (
            <button
              type="button"
              key={pct}
              onClick={() => setSelectedPct(pct)}
              class={`min-h-11 inline-flex items-center justify-center px-3 py-2 rounded-lg font-board-mono text-xs sm:text-sm font-semibold cursor-pointer transition-all text-center ${
                pct === 50 ? "col-span-2 sm:col-span-1" : ""
              } ${
                selectedPct === pct
                  ? "bg-info text-neutral-900 font-bold shadow-sm"
                  : "bg-base-200 hover:bg-base-300 text-base-content border border-base-300"
              }`}
            >
              {pct}% ({Math.round(netMonthly * (pct / 100))} {currencySymbol}/mes)
            </button>
          ))}
        </div>
      </div>

      {/* Panel de Resultado Proyectado */}
      <div class="mt-5 p-4 sm:p-5 rounded-lg bg-base-200/50 border border-base-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-base sm:text-lg font-bold text-base-content">
              📅 Fecha estimada de compra:
            </span>
            <strong class="font-board-mono text-primary text-base sm:text-lg font-bold capitalize">
              {targetDateFormatted}
            </strong>
          </div>
          <p class="text-xs sm:text-sm font-board-mono opacity-85 leading-relaxed">
            Apartando <strong>{monthlySavingsAmount} {currencySymbol} al mes</strong> ({selectedPct}% de tu sueldo),
            acumulas los <strong>{productPrice} {currencySymbol}</strong> en {roundedMonths} meses al contado.
          </p>
        </div>

        <div class="shrink-0 flex items-center gap-1.5 font-board-mono text-xs sm:text-sm text-accent bg-accent/10 border border-accent/30 px-3.5 py-2 rounded-lg font-medium">
          <span>✓</span>
          <span>Sin préstamos ni intereses</span>
        </div>
      </div>
    </div>
  );
}
