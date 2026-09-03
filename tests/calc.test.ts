import { describe, it, expect } from "vitest";
import {
  calc,
  CalcError,
  WEEKS_PER_MONTH,
  STANDARD_DAY_HOURS,
  MIN_WEEKLY_HOURS,
  MAX_WEEKLY_HOURS,
} from "../src/lib/calc.ts";

describe("calc engine", () => {
  const baseInput = {
    price: 33365,
    netMonthly: 1800,
    weeklyHours: 40,
    realAnnualHours: 1633,
    monthlySavings: 300,
    age: 32,
    retirementAge: 67,
  };

  it("calculates hourly wage using 52/12 weeks convention", () => {
    const result = calc(baseInput);
    const expectedWage = 1800 / (40 * WEEKS_PER_MONTH);
    expect(result.hourlyWage).toBeCloseTo(expectedWage, 5);
  });

  it("calculates hours and workdays based on standard 8h day", () => {
    const result = calc(baseInput);
    expect(result.hours).toBeCloseTo(baseInput.price / result.hourlyWage, 5);
    expect(result.workdays8h).toBeCloseTo(result.hours / STANDARD_DAY_HOURS, 5);
  });

  it("calculates full pay months and years", () => {
    const result = calc(baseInput);
    expect(result.monthsFullPay).toBeCloseTo(33365 / 1800, 5);
    expect(result.yearsFullPay).toBeCloseTo(33365 / (1800 * 12), 5);
  });

  it("calculates monthly savings duration", () => {
    const result = calc(baseInput);
    expect(result.monthsSaving).toBeCloseTo(33365 / 300, 5);
  });

  it("calculates career left and percentage correctly", () => {
    const result = calc(baseInput);
    expect(result.yearsLeft).toBe(35); // 67 - 32
    expect(result.pctCareerLeft).toBeCloseTo((result.yearsFullPay / 35) * 100, 5);
  });

  it("handles null savings and age gracefully", () => {
    const result = calc({
      ...baseInput,
      monthlySavings: null,
      age: null,
      realAnnualHours: null,
    });
    expect(result.monthsSaving).toBeNull();
    expect(result.yearsLeft).toBeNull();
    expect(result.pctCareerLeft).toBeNull();
    expect(result.pctRealYear).toBeNull();
  });

  it("throws CalcError for invalid price", () => {
    expect(() => calc({ ...baseInput, price: 0 })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, price: -50 })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, price: NaN })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, price: Infinity })).toThrow(CalcError);
  });

  it("throws CalcError for invalid netMonthly", () => {
    expect(() => calc({ ...baseInput, netMonthly: 0 })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, netMonthly: -100 })).toThrow(CalcError);
  });

  it("throws CalcError for weeklyHours outside [1, 80]", () => {
    expect(() => calc({ ...baseInput, weeklyHours: 0 })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, weeklyHours: 81 })).toThrow(CalcError);
    expect(() => calc({ ...baseInput, weeklyHours: MIN_WEEKLY_HOURS })).not.toThrow();
    expect(() => calc({ ...baseInput, weeklyHours: MAX_WEEKLY_HOURS })).not.toThrow();
  });
});
