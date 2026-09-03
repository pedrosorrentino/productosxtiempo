/**
 * Tasas de cambio y utilidades de conversión multidivisa.
 * Base de referencia: 1 EUR.
 */

export const EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  CHF: 0.95,
  MXN: 19.5,
  CLP: 1020,
  COP: 4400,
  ARS: 1150,
};

export const COUNTRY_CURRENCIES: Record<string, string> = {
  ES: "EUR",
  PT: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  GB: "GBP",
  US: "USD",
  MX: "MXN",
  AR: "ARS",
  CO: "COP",
  CL: "CLP",
  CH: "CHF",
};

/**
 * Convierte un importe de una divisa a otra usando las tasas de referencia.
 * Si alguna divisa no se encuentra, devuelve el valor original.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  if (fromCurrency === toCurrency || !Number.isFinite(amount)) {
    return amount;
  }

  const fromRate = EUR_RATES[fromCurrency.toUpperCase()];
  const toRate = EUR_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    return amount;
  }

  // Convertir origen a EUR, luego EUR a destino
  const inEur = amount / fromRate;
  const inTarget = inEur * toRate;

  // Redondeo según magnitud de la moneda:
  // Monedas con unidades grandes (CLP, COP, ARS) se redondean a enteros;
  // el resto a 2 decimales.
  if (toRate >= 100) {
    return Math.round(inTarget);
  }
  return Math.round(inTarget * 100) / 100;
}

/**
 * Comprueba si dos códigos de país comparten la misma divisa.
 */
export function sameCurrency(codeA?: string | null, codeB?: string | null): boolean {
  if (!codeA || !codeB) return false;
  if (codeA === codeB) return true;
  const currA = COUNTRY_CURRENCIES[codeA.toUpperCase()];
  const currB = COUNTRY_CURRENCIES[codeB.toUpperCase()];
  return currA != null && currB != null && currA === currB;
}
