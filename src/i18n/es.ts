/**
 * Copy de UI en español (SPEC §3, §6, §12, §15, §16). Tono seco, claro,
 * un poco ingenioso. Cero moralina. Los strings con cifras van como funciones
 * parametrizadas; las cifras llegan ya redondeadas según la tabla de §8 o se
 * formatean aquí con los helpers de lib/format.
 */
import { formatPercent, formatWorkdays, formatYears } from "../lib/format.ts";
import type { HeroUnit } from "../lib/format.ts";
import type { Product } from "../lib/types.ts";

export const brand = {
  name: "Coste en tiempo",
  promise: "El precio de las cosas, medido en tu tiempo.",
  subtitle:
    "Elige un país o pon tu sueldo. Elige una cosa. Te decimos cuántas horas de trabajo representa.",
  domain: "costeentiempo.example",
};

export const cta = {
  preferOwnSalary: "Prefiero poner mi sueldo",
  countryData: "Sueldo de referencia de este país",
  myData: "Mis datos",
  changePrice: "Cambia el precio si el tuyo es otro.",
  method: "Método",
  share: "Compartir",
  shareCopied: "Enlace copiado",
};

/** Copy de la home (SPEC §10): picker de país y ejemplo calculado en build time. */
export const home = {
  countryLabel: "Tu país",
  countryPlaceholder: "Elige tu país",
  exampleLead: (productName: string, countryName: string): string =>
    `Ejemplo: un ${productName} en ${countryName} son`,
  workdaysUnit: "jornadas de 8 h",
  fullPayTail: (phrase: string): string => `— ${phrase} de sueldo entero.`,
};

/** Resumen en vivo del formulario: “Tu hora vale 10,38 €”. */
export const hourValue = (formattedWage: string): string =>
  `Tu hora vale ${formattedWage}`;

export const userForm = {
  netMonthly: "Neto al mes",
  weeklyHours: "Horas a la semana",
  monthlySavings: "Ahorro al mes (opcional)",
  age: "Tu edad (opcional, para el contexto de vida laboral)",
};

export const modeA = {
  title: "Sueldo entero (techo teórico)",
  disclaimer: "Nadie destina el 100 % del sueldo a una sola cosa.",
  footnote: "Esto asume que no comes ni pagas piso.",
};

/** Título del modo B: “Si apartas 300 € al mes”. */
export const modeBTitle = (formattedAmount: string): string =>
  `Si apartas ${formattedAmount} al mes`;

export const modeB = {
  inputLabel: "¿Cuánto apartas al mes?",
  emptyState: "Si apartas algo al mes, esto es lo que tardas sin tocar el sueldo.",
};

export const result = {
  effortDisclaimer: "Cálculo de esfuerzo laboral, no de si deberías comprarlo.",
  convertedPriceNote:
    "Precio de referencia de España convertido. Cámbialo si conoces el de tu país.",
  convertedBadge: "precio de referencia de España",
  breakdownTitle: "Desglose",
  hoursLabel: "Horas de trabajo",
  workdaysLabel: "Jornadas de 8 h",
  weeksLabel: "Semanas",
  monthsFullPayLabel: "Meses de sueldo entero",
  yearsFullPayLabel: "Años de sueldo entero",
  pctRealYearLabel: "% del año laboral real",
  invalidInput: "Revisa los datos: algo no cuadra entre sueldo, horas y precio.",
  otherCountry: "Otro país",
};

/**
 * Anclas de comparación (SPEC §10.8): el producto expresado en unidades del
 * día a día del país. `count` llega ya redondeado (entero si ≥ 10, 1 decimal
 * si < 10).
 */
export const anchors = {
  title: "En unidades de tu día a día",
  cafe: (count: string): string => `equivale a ${count} cafés`,
  iphone: (count: string): string => `equivale a ${count} iPhones`,
  alquiler: (count: string): string => `equivale a ${count} meses de alquiler`,
};

/** Barra del año laboral (SPEC §11): un rectángulo = 1 año laboral de referencia. */
export const yearBar = {
  title: "Tu año laboral",
  detail: "1 rectángulo = 12 meses de sueldo entero",
  detailRealHours: (hours: number): string =>
    `1 rectángulo = 12 meses de sueldo entero (${hours} h reales al año)`,
  overflow: (years: string): string => `desborda a ${years} años`,
  ariaFill: (pct: string): string => `Barra del año laboral: ocupa el ${pct}%`,
};

export const noSalary = {
  title: "Este país aún no tiene sueldo de referencia",
  body: "Pon tu sueldo y el precio, y lo calculamos igual.",
  goToCountry: "Ir a la ficha del país",
};

export const age = {
  label: "Tu edad (opcional, para el contexto de vida laboral)",
};

/**
 * Línea de edad por defecto (SPEC §6):
 * “A tus 32 años, esto son un año y medio de vida trabajando — cerca del 4 %
 * de los 35 años laborales que te quedan.”
 * `pct` se formatea aquí (entero si ≥ 2, 1 decimal si < 2).
 */
export const ageLine = (
  edad: number,
  fraseAnios: string,
  pct: number,
  aniosRestantes: number,
): string =>
  `A tus ${edad} años, esto son ${fraseAnios} de vida trabajando — cerca del ${formatPercent(pct)}% de los ${aniosRestantes} años laborales que te quedan.`;

/**
 * Línea de edad para compras menores del 1 % (SPEC §6). Nota: el copy exige
 * la edad y el % es fijo (“menos de un 1 %”), por eso la firma es
 * (edad, aniosRestantes) y no (pct, aniosRestantes).
 */
export const ageLineSmall = (
  edad: number,
  aniosRestantes: number,
): string =>
  `A tus ${edad} años, esto es menos de un 1 % de los ${aniosRestantes} años laborales de referencia que quedan.`;

/** Línea de edad cuando la jubilación de referencia ya pasó (SPEC §6). */
export const ageLinePastRetirement = (edad: number): string =>
  `A tus ${edad} años usamos solo el esfuerzo en horas y sueldo; la edad de jubilación de referencia de este país ya quedó atrás.`;

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Texto para compartir (SPEC §12), como builder:
 *
 * ```
 * Tesla Model 3 · España
 * 402 jornadas de 8 h
 * Año y medio de sueldo entero
 * A los 32 años: 1,5 años de vida trabajando
 * costeentiempo.example
 * ```
 *
 * `fullPayPhrase` es la frase de duración de `formatHumanDuration` para el
 * sueldo entero. La línea de edad solo se incluye si hay edad.
 */
export const shareText = (input: {
  productName: string;
  countryName: string;
  workdays8h: number;
  fullPayPhrase: string;
  age?: number | null;
  yearsFullPay?: number | null;
  domain?: string;
}): string => {
  const lines: string[] = [
    `${input.productName} · ${input.countryName}`,
    `${formatWorkdays(input.workdays8h)} jornadas de 8 h`,
  ];

  const phrase = input.fullPayPhrase;
  const fullPayLine =
    phrase === "un año y medio"
      ? "Año y medio de sueldo entero"
      : `${capitalize(phrase)} de sueldo entero`;
  lines.push(fullPayLine);

  if (input.age != null && input.yearsFullPay != null) {
    lines.push(
      `A los ${input.age} años: ${formatYears(input.yearsFullPay)} años de vida trabajando`,
    );
  }

  lines.push(input.domain ?? brand.domain);
  return lines.join("\n");
};

/** Pie legal completo (SPEC §16, texto exacto). */
export const legalFooter: readonly string[] = [
  "Esta web ofrece una estimación educativa de esfuerzo laboral.",
  "No es un consejo de compra, ahorro ni inversión.",
  "Los salarios y precios son aproximados y pueden estar desactualizados.",
  "Tú puedes y debes sustituirlos por tus cifras reales.",
  "El cálculo se hace en tu dispositivo. No guardamos tu sueldo ni tu edad.",
];

/** Labels ES de las categorías del catálogo (SPEC §7, Product.category). */
export const categories: Record<Product["category"], string> = {
  vivienda: "Vivienda",
  transporte: "Transporte",
  tecnologia: "Tecnología",
  "dia-a-dia": "Día a día",
  vida: "Vida",
};

/** Unidades del número hero (SPEC §8). Las claves pequeñas cubren compras minúsculas. */
export const heroUnits: Record<HeroUnit, string> & {
  minutos: string;
  horas: string;
} = {
  jornadas: "jornadas de 8 h",
  meses: "meses de sueldo entero",
  años: "años de sueldo entero",
  minutos: "minutos",
  horas: "horas",
};

/** Campo "esta cosa cuesta" + nombre opcional (SPEC §10). */
export const priceForm = {
  priceLabel: "Esta cosa cuesta",
  nameLabel: "Nombre (opcional)",
  pricePlaceholder: "33365",
  namePlaceholder: "p. ej. Tesla Model 3",
  submit: "Calcular en mi tiempo",
  enterPricePrompt: "Escribe cuánto cuesta y te decimos cuánto tiempo de trabajo es.",
};

/** Copy de la ficha de país (SPEC §9, §10). */
export const countryPage = {
  hourlyWageLabel: "Hora de referencia",
  weeklyHoursLabel: "Jornada semanal",
  dailyHoursLabel: "Jornada diaria",
  realAnnualHoursLabel: "Horas reales al año",
  dataFrom: (date: string): string => `Datos de ${date}`,
  sourceLabel: "Fuente",
  dataDisclaimer: "Sueldo de referencia de esta web, no tu nómina.",
  toggleTitle: "Dato del país / mis datos",
  catalogTitle: "Catálogo",
  noLocalPriceBadge: "sin precio local",
  noLocalPriceCta: "pon el precio en tu moneda",
};
