/**
 * Tipos del modelo de datos (SPEC-precio-en-tiempo §7).
 * Los JSON de src/data se validan contra estos tipos.
 */

export type Country = {
  code: string;
  name: string;
  slug: string;
  currency: string;
  currencySymbol: string;
  legalWeeklyHours: number;
  legalDailyHours: number;
  realAnnualHours: number | null;
  medianNetMonthly: number | null;
  meanNetMonthly: number | null;
  minWageMonthly: number | null;
  retirementAge: number;
  salariesUpdatedAt: string;
  salariesSource: string;
  hoursUpdatedAt: string;
  hoursSource: string;
  informalityNote: string | null;
};

export type ProductPrice = {
  value: number;
  date: string;
  note: string;
  source: string;
  origin: "local" | "converted";
};

export type Product = {
  id: string;
  name: string;
  shortName: string;
  category: "vivienda" | "transporte" | "tecnologia" | "dia-a-dia" | "vida";
  prices: Record<string, ProductPrice>;
  visible: boolean;
};

export type UserState = {
  countryCode: string;
  netMonthly: number | null;
  weeklyHours: number | null;
  monthlySavings: number | null;
  age: number | null;
  priceOverride: number | null;
  productId: string | null;
  customLabel: string | null;
  compareCountryCode: string | null;
};
