/**
 * URL compartible (SPEC §7): `/es/espana/tesla-model-3?neto=2400&horas=40&…`
 * Los params pisan localStorage para esa visita (así el share funciona).
 */
import type { UserState } from "./types.ts";

const MIN_AGE = 16;
const MAX_AGE = 80;
const MAX_LABEL_LENGTH = 60;

const toPositiveNumber = (raw: string | null): number | null => {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const toWeeklyHours = (raw: string | null): number | null => {
  const value = toPositiveNumber(raw);
  return value !== null && value >= 1 && value <= 80 ? value : null;
};

const toAge = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value)) return null;
  return value >= MIN_AGE && value <= MAX_AGE ? value : null;
};

const toLabel = (raw: string | null): string | null => {
  if (raw === null) return null;
  const value = raw.trim();
  return value === "" ? null : value.slice(0, MAX_LABEL_LENGTH);
};

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: number | string,
): void => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return;
    if (key === "edad") {
      if (!Number.isInteger(value)) return;
    } else if (value <= 0) {
      return;
    }
  }
  const str = typeof value === "number" ? String(value) : value.trim();
  if (str === "") return;
  params.set(key, str);
};

/**
 * Construye la URL compartible: `pathname` + query con los valores presentes
 * y válidos del estado. Params: neto, horas, ahorro, edad, precio, nombre,
 * pais (comparación). No incluye dominio; la isla añade el origen al compartir.
 */
export function buildShareUrl(
  pathname: string,
  state: Partial<UserState>,
): string {
  const params = new URLSearchParams();
  if (state.netMonthly != null) appendParam(params, "neto", state.netMonthly);
  if (state.weeklyHours != null) appendParam(params, "horas", state.weeklyHours);
  if (state.monthlySavings != null) appendParam(params, "ahorro", state.monthlySavings);
  if (state.age != null) appendParam(params, "edad", state.age);
  if (state.priceOverride != null) appendParam(params, "precio", state.priceOverride);
  if (state.customLabel != null) appendParam(params, "nombre", state.customLabel);
  if (state.compareCountryCode != null) appendParam(params, "pais", state.compareCountryCode);
  const query = params.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

/**
 * Lee el estado de usuario desde los query params. Valida y sanea: solo
 * acepta números finitos positivos (horas 1–80, edad entera 16–80) y strings
 * no vacíos; los params ausentes o inválidos se omiten. Sin params → objeto
 * vacío.
 */
export function parseUserStateFromQuery(
  searchParams: URLSearchParams,
): Partial<UserState> {
  const state: Partial<UserState> = {};

  const netMonthly = toPositiveNumber(searchParams.get("neto"));
  if (netMonthly !== null) state.netMonthly = netMonthly;

  const weeklyHours = toWeeklyHours(searchParams.get("horas"));
  if (weeklyHours !== null) state.weeklyHours = weeklyHours;

  const monthlySavings = toPositiveNumber(searchParams.get("ahorro"));
  if (monthlySavings !== null) state.monthlySavings = monthlySavings;

  const age = toAge(searchParams.get("edad"));
  if (age !== null) state.age = age;

  const priceOverride = toPositiveNumber(searchParams.get("precio"));
  if (priceOverride !== null) state.priceOverride = priceOverride;

  const customLabel = toLabel(searchParams.get("nombre"));
  if (customLabel !== null) state.customLabel = customLabel;

  const compareCountryCode = toLabel(searchParams.get("pais"));
  if (compareCountryCode !== null) state.compareCountryCode = compareCountryCode;

  return state;
}
