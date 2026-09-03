/**
 * Cifra OG de un producto cotizado con la mediana del país (build time).
 * Única fuente compartida entre [country]/[product].astro (meta og:title)
 * y scripts/generate-og.ts (póster), para que tarjeta y póster no diverjan.
 * Devuelve null si el país no tiene mediana o el cálculo no cuadra: en ese
 * caso el póster degrada a "precio de referencia" sin cifra de esfuerzo.
 */
import { calc } from "./calc.ts";
import {
  formatHours,
  formatHumanDuration,
  formatMinutes,
  formatWorkdays,
} from "./format.ts";
import { getProductPrice } from "./selectors.ts";
import type { Country, Product } from "./types.ts";

export type OgQuote = {
  /** Precio de referencia formateado: "40.000 €". */
  priceText: string;
  /** Cifra grande del póster: "402" | "8" | "12". */
  digits: string;
  /** Unidad de la cifra: "jornadas de 8 h" | "horas" | "minutos". */
  unit: string;
  /** Frasa compacta para og:title: "402 jornadas" | "un día" | "unos 8 minutos". */
  effort: string;
};

/** Nombre apto para frase: se consume tal cual (sin artículo delante, así
 * no hay problema de género ni de nombres propios: "Tesla Model 3 cuesta…",
 * "Café en bar cuesta…"). */

const nfPrice = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});

/** Precio de referencia formateado ("33.365 €"): local o fallback ES convertido.
 * Null si el producto no tiene precio base. */
export function priceTextOf(product: Product, country: Country): string | null {
  const price = getProductPrice(product, country.code);
  return price == null ? null : `${nfPrice.format(price.value)} ${country.currencySymbol}`;
}

/** True si el precio mostrado es el fallback de España (SPEC §7) o convertido, no local. */
export function isConverted(product: Product, country: Country): boolean {
  return product.prices[country.code] == null || product.prices[country.code]?.origin === "converted";
}

export function ogQuote(product: Product, country: Country): OgQuote | null {
  const price = getProductPrice(product, country.code);
  if (price == null || country.medianNetMonthly == null) return null;
  let result;
  try {
    result = calc({
      price: price.value,
      netMonthly: country.medianNetMonthly,
      weeklyHours: country.legalWeeklyHours,
      realAnnualHours: null,
      monthlySavings: null,
      age: null,
      retirementAge: country.retirementAge,
    });
  } catch {
    return null;
  }
  const { hours, workdays8h, monthsFullPay, yearsFullPay } = result;
  let digits: string;
  let unit: string;
  if (hours < 1) {
    digits = formatMinutes(hours * 60);
    unit = digits === "1" ? "minuto" : "minutos";
  } else if (workdays8h < 1) {
    digits = formatHours(hours);
    unit = digits === "1" ? "hora" : "horas";
  } else {
    digits = formatWorkdays(workdays8h);
    unit = "jornadas de 8 h";
  }
  return {
    priceText: priceTextOf(product, country)!,
    digits,
    unit,
    effort: formatHumanDuration(hours, workdays8h, monthsFullPay, yearsFullPay),
  };
}
