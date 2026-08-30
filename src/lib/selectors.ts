/**
 * Selectores puros sobre los JSON de datos y el estado de usuario (SPEC §7).
 * Regla del producto: País = atajo, datos del usuario = verdad.
 */
import type {
  Country,
  Product,
  ProductPrice,
  UserState,
} from "./types.ts";

/** País por código ("ES"). */
export function getCountry(
  countries: Country[],
  code: string,
): Country | undefined {
  return countries.find((c) => c.code === code);
}

/** País por slug ("espana"). */
export function getCountryBySlug(
  countries: Country[],
  slug: string,
): Country | undefined {
  return countries.find((c) => c.slug === slug);
}

/** Producto por id ("tesla-model-3"). */
export function getProduct(
  products: Product[],
  id: string,
): Product | undefined {
  return products.find((p) => p.id === id);
}

/**
 * Precio de un producto para un país. Si el país no tiene precio propio y
 * existe precio de España, devuelve el precio ES tal cual; el etiquetado
 * `origin: "converted"` para la UI lo hace la isla (aviso correspondiente).
 */
export function getProductPrice(
  product: Product,
  countryCode: string,
): ProductPrice | undefined {
  const local = product.prices[countryCode];
  if (local) return local;
  const upper = countryCode.toUpperCase();
  if (upper !== countryCode) return product.prices[upper];
  if (upper !== "ES") return product.prices["ES"];
  return undefined;
}

/** Sueldo neto mensual efectivo: el del usuario o la mediano del país. */
export function effectiveNetMonthly(
  country: Country,
  userState: Partial<UserState>,
): number | null {
  return userState.netMonthly ?? country.medianNetMonthly;
}

/** Jornada semanal efectiva: la del usuario o la legal del país. */
export function effectiveWeeklyHours(
  country: Country,
  userState: Partial<UserState>,
): number {
  return userState.weeklyHours ?? country.legalWeeklyHours;
}

/** Precio efectivo: override del usuario, o el precio del producto para el país. */
export function effectivePrice(
  product: Product,
  country: Country,
  userState: Partial<UserState>,
): number | null {
  return userState.priceOverride ?? getProductPrice(product, country.code)?.value ?? null;
}
