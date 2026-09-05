/**
 * Motor de cálculo puro (SPEC-precio-en-tiempo §8, única fuente de verdad).
 * Sin Preact ni DOM: consumible en build time (Astro) y en cliente (islas).
 *
 * Decisión de diseño (documentada): los inputs inválidos LANZAN `CalcError`
 * en lugar de devolver null. La UI debe capturarlo y degradar con elegancia.
 * Razón: un input inválido (precio 0, sueldo 0, jornada imposible) indica un
 * formulario mal saneado aguas arriba; silenciarlo produciría números falsos
 * (Infinity/NaN) que se colarían en la UI.
 */

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const WEEKS_PER_MONTH = WEEKS_PER_YEAR / MONTHS_PER_YEAR; // 4.333...
export const STANDARD_DAY_HOURS = 8;

/** Límites de jornada semanales aceptados por `calc`. */
export const MIN_WEEKLY_HOURS = 1;
export const MAX_WEEKLY_HOURS = 80;

export type CalcInput = {
  price: number;
  netMonthly: number;
  weeklyHours: number;
  realAnnualHours: number | null;
  monthlySavings: number | null;
  age: number | null;
  retirementAge: number;
};

export type CalcResult = {
  hourlyWage: number;
  hours: number;
  workdays8h: number;
  weeks: number;
  monthsFullPay: number;
  yearsFullPay: number;
  monthsSaving: number | null;
  pctRealYear: number | null;
  yearsLeft: number | null;
  pctCareerLeft: number | null;
};

/** Error de validación de entrada del motor de cálculo. */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}

const isPositiveFinite = (n: number): boolean =>
  Number.isFinite(n) && n > 0;

/** Calcula el salario neto por hora a partir del sueldo mensual y la jornada semanal. */
export function calcHourlyWage(netMonthly: number, weeklyHours: number): number {
  return netMonthly / (weeklyHours * WEEKS_PER_MONTH);
}

/**
 * Calcula todas las magnitudes del producto a partir del precio y los datos
 * económicos del usuario (los suyos o los del país, resueltos con selectors).
 *
 * @throws {CalcError} si `price <= 0`, `netMonthly <= 0` o `weeklyHours`
 * está fuera de [1, 80], o si alguno no es finito.
 */
export function calc(input: CalcInput): CalcResult {
  if (!isPositiveFinite(input.price)) {
    throw new CalcError(`price inválido: ${input.price} (debe ser > 0)`);
  }
  if (!isPositiveFinite(input.netMonthly)) {
    throw new CalcError(`netMonthly inválido: ${input.netMonthly} (debe ser > 0)`);
  }
  if (
    !Number.isFinite(input.weeklyHours) ||
    input.weeklyHours < MIN_WEEKLY_HOURS ||
    input.weeklyHours > MAX_WEEKLY_HOURS
  ) {
    throw new CalcError(
      `weeklyHours inválido: ${input.weeklyHours} (debe estar entre ${MIN_WEEKLY_HOURS} y ${MAX_WEEKLY_HOURS})`,
    );
  }

  const hourlyWage = calcHourlyWage(input.netMonthly, input.weeklyHours);
  const hours = input.price / hourlyWage;
  const workdays8h = hours / STANDARD_DAY_HOURS;
  const weeks = hours / input.weeklyHours;
  const monthsFullPay = input.price / input.netMonthly;
  const yearsFullPay = input.price / (input.netMonthly * MONTHS_PER_YEAR);
  const monthsSaving =
    input.monthlySavings != null && input.monthlySavings > 0
      ? input.price / input.monthlySavings
      : null;
  const pctRealYear = input.realAnnualHours
    ? (hours / input.realAnnualHours) * 100
    : null;
  const yearsLeft =
    input.age != null ? Math.max(0, input.retirementAge - input.age) : null;
  const pctCareerLeft =
    yearsLeft != null && yearsLeft > 0
      ? (yearsFullPay / yearsLeft) * 100
      : null;

  return {
    hourlyWage,
    hours,
    workdays8h,
    weeks,
    monthsFullPay,
    yearsFullPay,
    monthsSaving,
    pctRealYear,
    yearsLeft,
    pctCareerLeft,
  };
}
