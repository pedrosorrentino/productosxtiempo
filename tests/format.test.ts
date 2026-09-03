import { describe, it, expect } from "vitest";
import {
  formatHourlyWage,
  formatHours,
  formatIntegerThousands,
  formatMinutes,
  minutesPhrase,
  hoursPhrase,
  formatWorkdays,
  formatWeeks,
  formatMonths,
  formatYears,
  formatPercent,
  humanYearsShortcut,
  heroUnit,
  formatHumanDuration,
} from "../src/lib/format.ts";

describe("format utilities", () => {
  it("formats hourly wage with correct decimals and currency symbol", () => {
    expect(formatHourlyWage(10.38, "€")).toBe("10,38 €");
    expect(formatHourlyWage(25.4, "€")).toBe("25,4 €");
  });

  it("formats integer thousands with grouping separator", () => {
    expect(formatIntegerThousands(1633)).toBe("1.633");
  });

  it("formats duration helpers and numbers with appropriate decimals", () => {
    expect(formatHours(5.23)).toBe("5");
    expect(formatMinutes(12.7)).toBe("13");
    expect(formatWorkdays(5.2)).toBe("5,2");
    expect(formatWorkdays(15.2)).toBe("15");
    expect(formatWeeks(3.45)).toBe("3,5");
    expect(formatMonths(7.82)).toBe("7,8");
    expect(formatYears(2.34)).toBe("2,3");
    expect(formatPercent(12.34)).toBe("12");
    expect(formatPercent(5.2)).toBe("5");
    expect(formatPercent(1.4)).toBe("1,4");
  });

  it("formats minutesPhrase correctly for edge cases", () => {
    expect(minutesPhrase(0.2)).toBe("menos de un minuto");
    expect(minutesPhrase(1)).toBe("un minuto");
    expect(minutesPhrase(5)).toBe("5 minutos");
  });

  it("formats hoursPhrase correctly", () => {
    expect(hoursPhrase(1)).toBe("una hora");
    expect(hoursPhrase(3)).toBe("3 horas");
  });

  it("handles humanYearsShortcut thresholds", () => {
    expect(humanYearsShortcut(1.0, 12)).toBe("un año");
    expect(humanYearsShortcut(1.5, 18)).toBe("un año y medio");
    expect(humanYearsShortcut(2.5, 30)).toBe("dos años y medio");
    expect(humanYearsShortcut(5.0, 60)).toBeNull();
  });

  it("determines heroUnit correctly based on workdays and months", () => {
    expect(heroUnit(5, 0.5)).toEqual({ unit: "jornadas" });
    expect(heroUnit(20, 5)).toEqual({ unit: "meses" });
    expect(heroUnit(100, 30)).toEqual({ unit: "años" });
  });

  describe("formatHumanDuration priority tiers", () => {
    it("tier 1: hours < 1 returns minutes", () => {
      expect(formatHumanDuration(0.005, 0.0006, 0.0001, 0.00001)).toBe("menos de un minuto");
      expect(formatHumanDuration(1 / 60, 0.002, 0.0003, 0.00002)).toBe("un minuto");
      expect(formatHumanDuration(15 / 60, 0.03, 0.004, 0.0003)).toBe("unos 15 minutos");
    });

    it("tier 2: workdays < 1 returns hours", () => {
      expect(formatHumanDuration(1, 0.125, 0.02, 0.001)).toBe("una hora");
      expect(formatHumanDuration(4, 0.5, 0.08, 0.006)).toBe("unas 4 horas");
    });

    it("tier 3: workdays < 1.5 returns day shortcuts", () => {
      expect(formatHumanDuration(8, 1, 0.15, 0.01)).toBe("un día");
      expect(formatHumanDuration(10, 1.25, 0.2, 0.015)).toBe("un día y pico");
    });

    it("tier 4: workdays < 15 returns workdays", () => {
      expect(formatHumanDuration(40, 5, 0.8, 0.06)).toBe("5,0 jornadas");
      expect(formatHumanDuration(96, 12, 1.8, 0.15)).toBe("12 jornadas");
    });

    it("tier 5: months < 2 returns weeks or almost two months", () => {
      expect(formatHumanDuration(200, 25, 1.5, 0.125)).toBe("6,5 semanas");
      expect(formatHumanDuration(280, 35, 1.9, 0.158)).toBe("casi dos meses");
    });

    it("tier 6: years < 1.8 returns months or shortcuts", () => {
      expect(formatHumanDuration(1600, 200, 12, 1.0)).toBe("un año");
      expect(formatHumanDuration(2400, 300, 18, 1.5)).toBe("un año y medio");
    });

    it("tier 7: large values return years or two and a half years shortcut", () => {
      expect(formatHumanDuration(4000, 500, 30, 2.5)).toBe("dos años y medio");
      expect(formatHumanDuration(8000, 1000, 60, 5.0)).toBe("5,0 años");
    });
  });
});
