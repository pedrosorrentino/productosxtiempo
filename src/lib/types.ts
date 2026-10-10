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
  /** Etiqueta corta de la fuente del sueldo, para citarla en el copy. */
  salarySourceLabel?: string;
  /** Enlace a la página oficial donde se publica el dato. */
  salariesSourceUrl?: string;
  /** publicado = mediana neta oficial; estimado = bruto oficial pasado a neto; orientativo = referencia de la web. */
  salaryDataKind?: string;
  hoursUpdatedAt: string;
  hoursSource: string;
  informalityNote: string | null;
  pppFactor?: number | null;
  inflationRate?: number | null;
};

export type SalaryPreset = {
  id: string;
  label: string;
  shortLabel: string;
  monthlyNet: number;
  source: string;
  description: string;
  icon?: string;
};

export type ProductPrice = {
  value: number;
  date: string;
  note: string;
  source: string;
  origin: "local" | "converted";
  /** Página exacta donde se puede comprobar este precio concreto. */
  url?: string;
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
  viewMode?: "work" | "life";
};
