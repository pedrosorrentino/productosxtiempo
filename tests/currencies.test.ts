import { describe, it, expect } from "vitest";
import { convertCurrency, sameCurrency, EUR_RATES } from "../src/lib/currencies.ts";

describe("currencies module", () => {
  it("returns identical amount when currencies are the same", () => {
    expect(convertCurrency(100, "EUR", "EUR")).toBe(100);
    expect(convertCurrency(500, "USD", "USD")).toBe(500);
  });

  it("converts EUR to USD accurately", () => {
    const usdRate = EUR_RATES["USD"]; // 1.08
    expect(convertCurrency(100, "EUR", "USD")).toBe(100 * usdRate);
  });

  it("converts USD to EUR accurately", () => {
    expect(convertCurrency(108, "USD", "EUR")).toBeCloseTo(100, 2);
  });

  it("rounds large-unit currencies (CLP, COP, ARS) to integers", () => {
    const clpValue = convertCurrency(33.365, "EUR", "CLP");
    expect(Number.isInteger(clpValue)).toBe(true);

    const copValue = convertCurrency(10, "EUR", "COP");
    expect(Number.isInteger(copValue)).toBe(true);
  });

  it("sameCurrency detects identical and shared currencies", () => {
    expect(sameCurrency("ES", "FR")).toBe(true); // both EUR
    expect(sameCurrency("ES", "PT")).toBe(true); // both EUR
    expect(sameCurrency("ES", "ES")).toBe(true);
    expect(sameCurrency("ES", "CL")).toBe(false); // EUR vs CLP
    expect(sameCurrency("US", "MX")).toBe(false); // USD vs MXN
    expect(sameCurrency(null, "ES")).toBe(false);
  });
});
