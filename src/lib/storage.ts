/**
 * Persistencia local del estado de usuario (SPEC §7): localStorage clave
 * `cet:v1`. Tolerante a JSON corrupto (try/catch → null) y a entornos sin
 * localStorage (SSR / modo privado).
 */
import type { UserState } from "./types.ts";

export const STORAGE_KEY = "cet:v1";

const MIN_AGE = 16;
const MAX_AGE = 80;
const MAX_WEEKLY_HOURS = 80;

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

/**
 * Filtra un objeto arbitrario dejando solo los campos conocidos de UserState
 * con tipos y rangos válidos (merge parcial tolerante).
 */
function sanitizeUserState(raw: unknown): Partial<UserState> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }
  const input = raw as Record<string, unknown>;
  const state: Partial<UserState> = {};

  const netMonthly = input.netMonthly;
  if (netMonthly === null || isFinitePositive(netMonthly)) {
    state.netMonthly = netMonthly;
  }

  const weeklyHours = input.weeklyHours;
  if (weeklyHours === null) {
    state.weeklyHours = null;
  } else if (
    isFinitePositive(weeklyHours) &&
    weeklyHours >= 1 &&
    weeklyHours <= MAX_WEEKLY_HOURS
  ) {
    state.weeklyHours = weeklyHours;
  }

  const monthlySavings = input.monthlySavings;
  if (monthlySavings === null || isFinitePositive(monthlySavings)) {
    state.monthlySavings = monthlySavings;
  }

  const age = input.age;
  if (age === null) {
    state.age = null;
  } else if (
    typeof age === "number" &&
    Number.isInteger(age) &&
    age >= MIN_AGE &&
    age <= MAX_AGE
  ) {
    state.age = age;
  }

  const priceOverride = input.priceOverride;
  if (priceOverride === null || isFinitePositive(priceOverride)) {
    state.priceOverride = priceOverride;
  }

  if (isNonEmptyString(input.countryCode)) state.countryCode = input.countryCode;
  if (isNullableString(input.productId)) state.productId = input.productId;
  if (isNullableString(input.customLabel)) state.customLabel = input.customLabel;
  if (isNullableString(input.compareCountryCode)) {
    state.compareCountryCode = input.compareCountryCode;
  }
  if (input.viewMode === "work" || input.viewMode === "life") {
    state.viewMode = input.viewMode;
  }

  return state;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Carga el estado guardado. Devuelve null si no hay nada o el JSON es inválido. */
export function loadUserState(): Partial<UserState> | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const state = sanitizeUserState(parsed);
    return Object.keys(state).length > 0 ? state : null;
  } catch {
    return null;
  }
}

/** Fusiona el estado dado con el guardado y persiste el resultado. */
export function saveUserState(state: Partial<UserState>): void {
  const storage = getLocalStorage();
  if (!storage) return;
  const incoming = sanitizeUserState(state);
  const existing = sanitizeUserState(loadUserState());
  const merged: Partial<UserState> = { ...existing, ...incoming };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cet:statechange", { detail: merged }));
    }
  } catch {
    // Cuota llena o storage no disponible: se ignora sin romper la UI.
  }
}
