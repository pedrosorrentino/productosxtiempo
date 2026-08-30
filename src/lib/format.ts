/**
 * Redondeo y frases humanas (SPEC-precio-en-tiempo §8, tabla de redondeo,
 * prioridad de `formatHumanDuration` y tabla de atajos de copy).
 *
 * Formato numérico: `Intl.NumberFormat('es-ES')` (coma decimal, punto de
 * millar). Los strings con moneda reciben el símbolo como parámetro (símbolo
 * del país, p. ej. "€" o "$").
 */
import { WEEKS_PER_MONTH } from "./calc.ts";

const esES = (minDecimals: number, maxDecimals: number): Intl.NumberFormat =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

const nf0 = esES(0, 0);
const nf1 = esES(1, 1);
const nf2 = esES(2, 2);

const formatDecimals = (value: number, decimals: number): string => {
  const formatter = decimals === 0 ? nf0 : decimals === 1 ? nf1 : nf2;
  return formatter.format(value);
};

/** €/hora: 2 decimales si < 20; 1 decimal si ≥ 20. Símbolo como parámetro. */
export function formatHourlyWage(wage: number, currencySymbol: string): string {
  const decimals = wage < 20 ? 2 : 1;
  return `${formatDecimals(wage, decimals)} ${currencySymbol}`;
}

/** Horas: entero. */
export function formatHours(hours: number): string {
  return formatDecimals(hours, 0);
}

/** Minutos (compras minúsculas): entero. */
export function formatMinutes(minutes: number): string {
  return formatDecimals(minutes, 0);
}

/** Jornadas: 1 decimal si < 10; entero si ≥ 10. */
export function formatWorkdays(workdays: number): string {
  return formatDecimals(workdays, workdays < 10 ? 1 : 0);
}

/** Semanas: 1 decimal si < 10; entero si ≥ 10. */
export function formatWeeks(weeks: number): string {
  return formatDecimals(weeks, weeks < 10 ? 1 : 0);
}

/** Meses: 1 decimal. */
export function formatMonths(months: number): string {
  return formatDecimals(months, 1);
}

/** Años: 1 decimal. */
export function formatYears(years: number): string {
  return formatDecimals(years, 1);
}

/** %: entero si ≥ 2; 1 decimal si < 2. */
export function formatPercent(percent: number): string {
  return formatDecimals(percent, percent >= 2 ? 0 : 1);
}

/**
 * Atajos de copy de la tabla SPEC §8, en UNA sola fuente (decisión
 * documentada, Task 6): la consumen `formatHumanDuration` (modo A) y el
 * calendario del modo B en ResultView. Devuelve la frase del atajo o null
 * si ninguno aplica.
 */
export function humanYearsShortcut(
  years: number,
  months: number,
): string | null {
  if (years >= 0.9 && years <= 1.15) return "un año";
  if (months >= 11 && months <= 13) return "un año";
  if (years >= 1.4 && years <= 1.7) return "un año y medio";
  if (years >= 2.4 && years <= 2.7) return "dos años y medio";
  return null;
}

export type HeroUnit = "jornadas" | "meses" | "años";

/** Unidad hero automática (SPEC §8 "Unidad hero"). */
export function heroUnit(
  workdays8h: number,
  monthsFullPay: number,
): { unit: HeroUnit } {
  if (workdays8h < 15) return { unit: "jornadas" };
  if (monthsFullPay < 24) return { unit: "meses" };
  return { unit: "años" };
}

/**
 * Frase humana de duración según la prioridad EXACTA del SPEC §8:
 *
 * 1. horas < 1 → minutos ("unos 8 minutos")
 * 2. jornadas < 1 → "unas X horas" (sub-jornada)
 * 3. jornadas < 1.5 → "un día" (≈ 1 jornada) o "un día y pico"
 * 4. jornadas < 15 → "X jornadas"
 * 5. meses sueldo entero < 2 → semanas o "casi dos meses"
 * 6. años sueldo entero < 1.8 → meses, con atajos "un año" (0.9–1.15 años,
 *    11–13 meses) y "un año y medio" (1.4–1.7 años)
 * 7. resto → "X años", con atajo "dos años y medio" (2.4–2.7 años)
 *
 * Nota de diseño: el SPEC lista "unas X horas" para jornadas < 1.5 y también
 * "un día y pico" para jornadas 1..1.5; el solape se resuelve hacia el copy
 * de días (los ejemplos de comprobación del motor piden 8 h → "un día"),
 * de modo que ambos atajos quedan vivos y ninguno es código muerto.
 */
export function formatHumanDuration(
  hours: number,
  workdays8h: number,
  monthsFullPay: number,
  yearsFullPay: number,
): string {
  if (hours < 1) {
    return `unos ${formatMinutes(hours * 60)} minutos`;
  }
  if (workdays8h < 1) {
    return `unas ${formatHours(hours)} horas`;
  }
  if (workdays8h < 1.5) {
    return workdays8h <= 1.05 ? "un día" : "un día y pico";
  }
  if (workdays8h < 15) {
    return `${formatWorkdays(workdays8h)} jornadas`;
  }
  if (monthsFullPay < 2) {
    if (monthsFullPay >= 1.8) return "casi dos meses";
    return `${formatWeeks(monthsFullPay * WEEKS_PER_MONTH)} semanas`;
  }
  if (yearsFullPay < 1.8) {
    const shortcut = humanYearsShortcut(yearsFullPay, monthsFullPay);
    if (shortcut) return shortcut;
    return `${formatMonths(monthsFullPay)} meses`;
  }
  const shortcut = humanYearsShortcut(yearsFullPay, monthsFullPay);
  if (shortcut) return shortcut;
  return `${formatYears(yearsFullPay)} años`;
}
