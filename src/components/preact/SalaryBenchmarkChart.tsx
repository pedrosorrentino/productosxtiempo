import { useMemo } from "preact/hooks";
import { calcHourlyWage } from "../../lib/calc.ts";
import { formatHours, formatHourlyWage } from "../../lib/format.ts";

export interface SalaryBenchmarkChartProps {
  productPrice: number;
  currentNetMonthly: number;
  medianNetMonthly: number;
  legalWeeklyHours: number;
  realAnnualHours?: number | null;
  currencySymbol: string;
  onSelectSalary?: (salary: number) => void;
}

interface BenchmarkTier {
  id: string;
  name: string;
  description: string;
  salary: number;
  hourlyWage: number;
  hoursNeeded: number;
  isUser: boolean;
}

/**
 * Gráfico Comparativo de Salarios (Benchmark Bar Chart).
 * Compara el esfuerzo laboral para adquirir el producto según la escala retributiva del país:
 * - Salario Mínimo / Básico
 * - Salario Mediano Nacional
 * - Tu Nómina Actual (interactiva)
 * - Salario Percentil 90 (Top 10%)
 * Permite hacer clic en cualquier nivel para adoptarlo como nómina activa al instante.
 */
export default function SalaryBenchmarkChart({
  productPrice,
  currentNetMonthly,
  medianNetMonthly,
  legalWeeklyHours,
  realAnnualHours,
  currencySymbol,
  onSelectSalary,
}: SalaryBenchmarkChartProps) {
  const tiers: BenchmarkTier[] = useMemo(() => {
    // Estimaciones según la distribución salarial típica OCDE/Eurostat
    const smiEstimated = Math.round((medianNetMonthly * 0.62) / 25) * 25;
    const p90Estimated = Math.round((medianNetMonthly * 1.95) / 50) * 50;

    const list = [
      {
        id: "smi",
        name: "Salario Mínimo (SMI)",
        description: "Base retributiva legal",
        salary: smiEstimated,
        isUser: false,
      },
      {
        id: "median",
        name: "Salario Mediano Nacional",
        description: "El 50% de los trabajadores gana menos",
        salary: medianNetMonthly,
        isUser: currentNetMonthly === medianNetMonthly,
      },
      {
        id: "user",
        name: "Tu Salario Configurado",
        description: "Cotización personalizada en vivo",
        salary: currentNetMonthly,
        isUser: true,
      },
      {
        id: "p90",
        name: "Percentil 90 (Top 10%)",
        description: "Tramo retributivo alto",
        salary: p90Estimated,
        isUser: false,
      },
    ];

    // Si el usuario coincide con la mediana, evitamos duplicar la fila
    const filtered =
      currentNetMonthly === medianNetMonthly
        ? list.filter((t) => t.id !== "user")
        : list;

    // Ordenamos por salario ascendente
    filtered.sort((a, b) => a.salary - b.salary);

    return filtered.map((item) => {
      const wage = calcHourlyWage(item.salary, legalWeeklyHours);
      const hours = wage > 0 ? productPrice / wage : 0;
      return {
        ...item,
        hourlyWage: wage,
        hoursNeeded: hours,
      };
    });
  }, [
    productPrice,
    currentNetMonthly,
    medianNetMonthly,
    legalWeeklyHours,
    realAnnualHours,
  ]);

  const maxHours = Math.max(...tiers.map((t) => t.hoursNeeded), 1);

  return (
    <div class="board-plate p-5 sm:p-6 transition-all duration-300">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-base-300">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
            <span class="font-board-mono text-xs uppercase tracking-widest text-accent font-bold">
              Escala retributiva
            </span>
          </div>
          <h3 class="font-signage uppercase text-2xl text-base-content mt-1">
            Comparativa de Esfuerzo según tu Salario
          </h3>
          <p class="font-board-mono text-xs opacity-75 mt-0.5">
            Pulsa en cualquier tramo para ver cómo cambia la cotización con ese sueldo:
          </p>
        </div>

        <span class="font-board-mono text-xs text-base-content/60 self-start sm:self-auto">
          Menos horas = Mayor poder adquisitivo
        </span>
      </div>

      <div class="mt-5 space-y-3.5">
        {tiers.map((tier) => {
          // Ancho de la barra: mayor esfuerzo = barra más ancha
          const pctWidth = Math.min(100, Math.max(12, (tier.hoursNeeded / maxHours) * 100));
          const isActive = tier.salary === currentNetMonthly;

          return (
            <div
              key={tier.id}
              onClick={() => onSelectSalary?.(tier.salary)}
              class={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary/10 border-primary/60 shadow-sm"
                  : "bg-base-200/40 border-base-300/80 hover:bg-base-200 hover:border-base-content/30"
              }`}
              title={`Clic para simular con ${tier.salary} ${currencySymbol}/mes`}
            >
              <div class="flex items-center justify-between gap-2 flex-wrap text-xs font-board-mono mb-1.5">
                <div class="flex items-center gap-2">
                  <span
                    class={`font-bold uppercase ${
                      isActive ? "text-primary" : "text-base-content"
                    }`}
                  >
                    {tier.name}
                  </span>
                  {isActive && (
                    <span class="px-1.5 py-0.2 bg-primary text-neutral-900 rounded font-bold text-[10px]">
                      ACTIVO
                    </span>
                  )}
                  <span class="opacity-60 text-[11px] hidden sm:inline">
                    · {tier.salary} {currencySymbol}/mes ({formatHourlyWage(tier.hourlyWage, currencySymbol)}/h)
                  </span>
                </div>

                <div class="text-right">
                  <strong class={`text-sm font-bold ${isActive ? "text-primary" : "text-base-content"}`}>
                    {formatHours(tier.hoursNeeded)} h
                  </strong>
                  <span class="opacity-70 text-[11px] ml-1">de trabajo</span>
                </div>
              </div>

              {/* Barra de progreso interactiva */}
              <div class="h-3 w-full bg-base-300/80 rounded-full overflow-hidden p-0.5 border border-base-content/10">
                <div
                  class={`h-full rounded-full transition-all duration-500 ${
                    isActive
                      ? "bg-primary shadow-[0_0_8px_rgba(255,176,32,0.6)]"
                      : "bg-base-content/40"
                  }`}
                  style={{ width: `${pctWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
