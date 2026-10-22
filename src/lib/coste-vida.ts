/**
 * Coste de vivir un mes en cada país, medido en horas de trabajo.
 *
 * Vive aquí y no dentro de la página porque lo usan dos: `/vivir-un-mes/`
 * (comparación entre países) y `/vivir-en/<país>/` (una página por país). Si
 * estuviera duplicado, las dos cifras podrían separarse con el tiempo.
 *
 * Regla de siempre: solo entra un precio si está TOMADO EN EL PAÍS (`origin`
 * `local`). Si falta un componente se calcula con lo que hay y se dice cuál
 * falta; nunca se rellena con la conversión de otro país.
 */
import type { Country, Product } from './types.ts';
import { calcHourlyWage, WEEKS_PER_MONTH } from './calc.ts';
import { referenceSalary } from './selectors.ts';

/** Los cinco gastos del mes, en el orden en que se leen. */
export const COMPONENTES = [
  { id: 'alquiler-piso', etiqueta: 'Alquiler', factor: 1 },
  { id: 'cesta-semanal', etiqueta: 'Compra semanal', factor: WEEKS_PER_MONTH },
  { id: 'luz-gas-mes', etiqueta: 'Luz y gas', factor: 1 },
  { id: 'fibra-mes', etiqueta: 'Internet', factor: 1 },
  { id: 'abono-transporte', etiqueta: 'Abono de transporte', factor: 1 },
] as const;

export type FilaCosteVida = {
  country: Country;
  ref: NonNullable<ReturnType<typeof referenceSalary>>;
  items: Array<{ etiqueta: string; importe: number }>;
  faltan: string[];
  total: number;
  hora: number;
  horas: number;
  parteDelSueldo: number;
  masPesado: { etiqueta: string; importe: number };
  completa: boolean;
  noAlcanza: boolean;
  sueldoOrientativo: boolean;
};

/** Filas de coste de vida, de más barata a más cara en horas. */
export function costeDeVida(countries: Country[], products: Product[]): FilaCosteVida[] {
  const buscar = (id: string) => products.find((p) => p.id === id && p.visible);

  return countries
    .map((c): FilaCosteVida | null => {
      const ref = referenceSalary(c);
      if (!ref) return null;
      const hora = calcHourlyWage(ref.monthly, c.legalWeeklyHours);
      const items: Array<{ etiqueta: string; importe: number }> = [];
      const faltan: string[] = [];
      for (const comp of COMPONENTES) {
        const p = buscar(comp.id);
        const precio = p?.prices[c.code];
        if (!p || !precio || precio.origin !== 'local') {
          faltan.push(comp.etiqueta);
          continue;
        }
        items.push({ etiqueta: comp.etiqueta, importe: precio.value * comp.factor });
      }
      if (items.length < 3) return null;
      const total = items.reduce((s, i) => s + i.importe, 0);
      const horas = total / hora;
      const parteDelSueldo = total / ref.monthly;
      return {
        country: c,
        ref,
        items,
        faltan,
        total,
        hora,
        horas,
        parteDelSueldo,
        masPesado: [...items].sort((a, b) => b.importe - a.importe)[0],
        completa: faltan.length === 0,
        noAlcanza: parteDelSueldo > 1,
        sueldoOrientativo: c.salaryDataKind === 'orientativo',
      };
    })
    .filter((x): x is FilaCosteVida => x !== null)
    .sort((a, b) => a.horas - b.horas);
}
