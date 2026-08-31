/**
 * Copy de UI en español (SPEC §3, §6, §12, §15, §16). Tono seco, claro,
 * un poco ingenioso. Cero moralina. Los strings con cifras van como funciones
 * parametrizadas; las cifras llegan ya redondeadas según la tabla de §8 o se
 * formatean aquí con los helpers de lib/format.
 */
import {
  formatPercent,
  formatWorkdays,
  formatYears,
  hoursPhrase,
  minutesPhrase,
} from "../lib/format.ts";
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
  changePriceTitle: "El precio que tú pagas",
  changePriceNote:
    "Si el tuyo es otro, escríbelo aquí: toda la página se recalcula al instante.",
  changePriceLive: "tu precio en uso",
  changePriceRef: "precio de referencia",
  method: "Método",
  share: "Compartir",
  shareCopied: "Enlace copiado",
  shareCopyFailed: "No se pudo copiar el enlace",
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
  age: "Tu edad (opcional)",
  /** Aviso de moneda del neto: la cifra se escribe en la divisa del país. */
  netCurrencyNote: (symbol: string): string => `En ${symbol}, como el resto del país.`,
  /** Sello de la placa: la unidad en la que se piden las cifras. */
  currencyStamp: (symbol: string): string => `en ${symbol}`,
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
  unnamedThing: "Esta cosa",
};

/**
 * Anclas de comparación (SPEC §10.8): el producto expresado en unidades del
 * día a día del país. `count` llega ya redondeado (entero si ≥ 10, 1 decimal
 * si < 10). Para recuentos < 1 (decisión documentada): "menos de un {cosa}"
 * — un decimal mostraría "0,0 cafés", que miente al decir cero.
 * Para recuento exacto 1 (hallazgo Task 6): singular — "equivale a 1 café",
 * no "1 cafés".
 */
const anchorCount = (count: string, one: string, many: string): string =>
  count === "1" ? `1 ${one}` : `${count} ${many}`;

export const anchors = {
  title: "En unidades de tu día a día",
  cafe: (count: string): string => `equivale a ${anchorCount(count, "café", "cafés")}`,
  iphone: (count: string): string => `equivale a ${anchorCount(count, "iPhone", "iPhones")}`,
  alquiler: (count: string): string =>
    `equivale a ${anchorCount(count, "mes de alquiler", "meses de alquiler")}`,
  menu: (count: string): string =>
    `equivale a ${anchorCount(count, "menú del día", "menús del día")}`,
  gasolina: (count: string): string =>
    `equivale a ${anchorCount(count, "tanque de gasolina", "tanques de gasolina")}`,
  lessThanOne: (thing: string): string => `menos de un ${thing}`,
};

/** Barra del año laboral (SPEC §11): un rectángulo = 1 año laboral de referencia. */
export const yearBar = {
  title: "La compra frente a tu año de sueldo",
  detail:
    "1 barra llena = 12 meses de sueldo entero. El relleno marca cuánto de ese año de sueldo se lleva esta compra.",
  detailRealHours: (hours: number): string =>
    `1 barra llena = 12 meses de sueldo entero (${hours} h reales al año). El relleno marca cuánto de ese año de sueldo se lleva esta compra.`,
  overflow: (years: string): string => `Se pasa de un año entero: esta compra son ${years} de sueldo.`,
  fillLabel: (pct: string): string => `La compra ocupa el ${pct}% de un año de sueldo entero.`,
  ariaFill: (pct: string): string =>
    `Barra: la compra ocupa el ${pct}% de un año de sueldo entero.`,
  /** Barra de vida (solo con edad): cuánto de la vida del usuario se lleva la compra. */
  lifeTitle: "Y en tu vida",
  lifeLabel: (age: number): string => `% de tus ${age} años`,
  lifeYearsLabel: (years: string): string => `son ${years} años de tu vida`,
  lifeFillLabel: (age: number, pct: string, years: string): string =>
    `De tus ${age} años de vida, la compra ocupa el ${pct}%: ${years} años.`,
  lifeAria: (age: number, pct: string): string =>
    `De tus ${age} años de vida, la compra ocupa el ${pct}%`,
};

export const noSalary = {
  title: "Este país aún no tiene sueldo de referencia",
  body: "Pon tu sueldo y el precio, y lo calculamos igual.",
  goToCountry: "Ir a la ficha del país",
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
 * sueldo entero. La línea de esfuerzo usa la unidad correcta según magnitud
 * (decisión documentada): jornadas solo si workdays8h ≥ 1; debajo, horas;
 * compras sub-hora, minutos — nunca "0,1 jornadas". La línea de edad solo se
 * incluye si hay edad y la compra no es minúscula (yearsFullPay ≥ 0.05,
 * mismo corte que la línea sutil de SPEC §6).
 */
export const shareText = (input: {
  productName: string;
  countryName: string;
  hours: number;
  workdays8h: number;
  fullPayPhrase: string;
  age?: number | null;
  yearsFullPay?: number | null;
  domain?: string;
}): string => {
  const effortLine =
    input.hours < 1
      ? minutesPhrase(input.hours * 60) // pulido Task 8: "un minuto", no "1 minutos"
      : input.workdays8h < 1
        ? hoursPhrase(input.hours) // pulido Task 8: "una hora", no "1 horas"
        : `${formatWorkdays(input.workdays8h)} jornadas de 8 h`;

  const lines: string[] = [
    `${input.productName} · ${input.countryName}`,
    effortLine,
  ];

  const phrase = input.fullPayPhrase;
  const fullPayLine =
    phrase === "un año y medio"
      ? "Año y medio de sueldo entero"
      : `${capitalize(phrase)} de sueldo entero`;
  lines.push(fullPayLine);

  if (
    input.age != null &&
    input.yearsFullPay != null &&
    input.yearsFullPay >= 0.05
  ) {
    lines.push(
      `A los ${input.age} años: ${formatYears(input.yearsFullPay)} años de vida trabajando`,
    );
  }

  lines.push(input.domain ?? brand.domain);
  return lines.join("\n");
};

/** Pie legal (SPEC §16, versión reducida: 3 líneas en vez de 5). */
export const legalFooter: readonly string[] = [
  "Estimación educativa de esfuerzo laboral, no un consejo de compra.",
  "Salarios y precios son orientativos: sustitúyelos por tus cifras.",
  "El cálculo se hace en tu dispositivo; no guardamos tus datos.",
];

/**
 * Badge de caducidad (SPEC §9, §13). Un dato con fecha anterior al corte
 * (18 meses) se marca "puede estar desfasado". Consumido por
 * StaleDataBadge.astro (build time, ficha de país) y por ResultView
 * (cliente, fecha del precio del catálogo).
 *
 * Decisión documentada: el corte es una constante FIJA, no `new Date()`:
 * un badge dependiente de la hora de compilación haría el build no
 * reproducible (misma entrada, distinta salida según el día). El corte
 * 2026-02 = fecha del spec (2026-08) menos 18 meses. Para moverlo,
 * actualizar `cutoff`.
 *
 * La comparación es lexicográfica y es segura para "YYYY-MM" y "YYYY":
 * "2024" < "2026-02", "2025-12" < "2026-02", "2026-01" < "2026-02",
 * "2026-02" < "2026-02" es false (exactamente 18 meses aún no caduca).
 */
export const staleness = {
  badge: "puede estar desfasado",
  /** title del badge con la fecha del dato (pulido Task 8: cliente y build iguales). */
  badgeTitle: (date: string): string => `Dato de ${date}`,
  cutoff: "2026-02",
};

/** Copy del 404 (SPEC §4: seco, claro, un poco ingenioso, cero moralina). */
export const notFound = {
  code: "404",
  title: "Esta página no existe, pero tu hora sigue valiendo lo mismo.",
  body: "Ni rastro del enlace. En vez de perseguirlo, gasta ese rato en algo medible: elige una cosa y mira cuánto tiempo cuesta.",
  homeCta: "Volver al inicio",
  priceCta: "Calcular un precio en España",
};

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
  lessThanOneHour: string;
} = {
  jornadas: "jornadas de 8 h",
  meses: "meses de sueldo entero",
  años: "años de sueldo entero",
  minutos: "minutos",
  horas: "horas",
  lessThanOneHour: "menos de 1 hora",
};

/**
 * Sustantivo singular de cada ancla (pulido Task 8: antes hardcodeado en
 * ResultView). Los plurales viven dentro de las frases de `anchors`.
 */
export const anchorSingular = {
  cafe: "café",
  iphone: "iPhone",
  alquiler: "mes de alquiler",
  menu: "menú del día",
  gasolina: "tanque de gasolina",
} as const;

/**
 * Comparador simple (SPEC §5): el MISMO precio calculado con distintos
 * sueldos. Tarjetas a todo el ancho: una por sujeto ("tú", país actual y un
 * segundo país elegible) con la cifra de esfuerzo y barra de gauge; el
 * select de otro país cierra la serie. Sin librerías, sin dashboard.
 */
export const compare = {
  title: "El mismo precio, otros países",
  samePrice: (amount: string): string =>
    `Este precio (${amount}) calculado con cada sueldo:`,
  you: "Tú",
  putYourSalary: "pon tu sueldo",
  selectLabel: "Añadir otro país",
  selectPlaceholder: "Elige un país",
  /** Select agotado: ya hay 3 tarjetas en la comparación. */
  maxReached: "Ya hay 3 países comparando.",
  /** Esqueleto de las columnas libres. */
  emptySlots: "Añade más países para comparar",
  /** Etiqueta de bloques: el sueldo con el que cotiza cada tarjeta. */
  salaryLabel: "sueldo neto mensual",
  /** Etiqueta del gauge: el relleno compara contra quien más tarda en pagarlo. */
  gaugeLabel: "vs. el país más lento",
  gaugeAria: (label: string, pct: string): string =>
    `Con el sueldo de ${label}, la compra tarda el ${pct}% de lo que tarda el país más lento de la comparación.`,
  /** Tarjeta vacía para invitar a añadir una fila más. */
  addRow: (amount: string): string => `Añade un sueldo y cotiza ${amount} con él`,
  /** Quitar la tarjeta del comparador. */
  removeCard: (name: string): string => `Quitar la tarjeta de ${name}`,
  /** Cuánta vida deja en el usuario esta compra (solo con edad). */
  lifeLine: (pct: string, years: string): string =>
    `Te quita ≈ ${pct}% de tu vida: ${years} años.`,
  lifeAria: (pct: string): string => `La compra ocupa el ${pct}% de tu vida`,
};

/** Campo "esta cosa cuesta" + nombre opcional (SPEC §10). */
export const priceForm = {
  priceLabel: "Esta cosa cuesta",
  nameLabel: "Nombre (opcional)",
  pricePlaceholder: "33365",
  namePlaceholder: "p. ej. Tesla Model 3",
  submit: "Calcular en mi tiempo",
  enterPricePrompt: "Escribe cuánto cuesta y te decimos cuánto tiempo de trabajo es.",
  /** Placa llamativa de la ficha de país. */
  priceTitle: "¿Cuánto cuesta otra cosa?",
  priceNote:
    "Escribe el precio de cualquier cosa y te decimos cuántas horas de trabajo te cuesta, con tu sueldo o el de este país.",
  priceStamp: "lo calculamos al momento",
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
  /**
   * Pulido Task 8: las jornadas que se salen de la referencia habitual de
   * 40 h (FR 35, CO 42, CL 44) antes eran invisibles para el usuario.
   */
  weeklyHoursNote: (hours: number): string =>
    `Jornada legal de ${hours} h semanales, distinta de la referencia de 40 h: los cálculos de este país usan su jornada.`,
};

/** Copy del tablero de cotizaciones (portada rediseñada). Mismo tono: seco,
 * claro, un poco ingenioso, cero moralina. */
export const board = {
  /** Placa de operación: país con el que cotiza el tablero. */
  operatingLabel: "Viviendo en",
  detectedStamp: "detectado",
  savedStamp: "tu elección",
  medianStamp: "mediana del país",
  changeCountryLabel: "Cambiar país",
  countryFile: (name: string): string => `Ficha de ${name}`,

  /** Chip de la placa de operación: falta el neto del usuario y se le invita
   * a bajarlo a "Tu tipo de cambio". */
  addYourDataStamp: "añade tus datos",

  /** Navegación del pie: lista de países. */
  footerCountriesLabel: "Todos los países",
  /** Cotización héroe a dígitos rodantes. */
  heroLead: (productName: string, countryName: string): string =>
    `1 ${productName} en ${countryName} son`,
  priceRefLabel: "precio de referencia",
  esRefBadge: "ref. España",
  tickerLabel: "Cotizaciones del tablero",

  /** Pizarra completa de cotizaciones. */
  boardTitle: "La pizarra",
  boardSubtitle: "El catálogo va rotando, cotizado en jornadas de 8 h.",
  rateUnitShort: "jornadas",
  salaryUnitShort: "meses de sueldo",
  yearsUnitShort: "años de sueldo",

  /** Panel de tipo de cambio personal. */
  exchangeTitle: "Tu tipo de cambio",
  exchangeSubtitle: (countryName: string): string =>
    `Ahora mismo cotizamos con la mediana neta de ${countryName}. Pon tu nómina y la pizarra se recalcula al instante.`,
  yourDataStamp: "cotizando con tus datos",

  /** CTA final. */
  effortLine: result.effortDisclaimer,

  /** Ficha de país en gramática de marcador. */
  countryBoard: (name: string): string => `La pizarra de ${name}`,
  /** Subtítulo de la pizarra del país: ahí sí se lista el catálogo entero,
   * sin la rotación de la portada. */
  countryBoardSubtitle: "Todo el catálogo del país, cotizado en jornadas de 8 h.",
  rateUnit: (symbol: string): string => `${symbol} / hora`,

  /** Vida (solo con edad en "Tu tipo de cambio"): barra que muestra lo que la
   * compra cuesta en años de la vida del usuario. El total de la barra es su
   * edad. */
  lifeBarLabel: (age: number): string => `% de tus ${age} años`,
  lifeBarAria: (age: number, pct: string): string =>
    `De tus ${age} años de vida, esta compra ocupa el ${pct}%`,

  /** Etiquetas de fila en la pizarra: el valor delante ("4% de un año de
   * sueldo", "2% de tus 42 años"). La barra de fila de sueldo muestra la
   * fracción de UN año de sueldo entero que se come el precio (se satura en
   * 100); la de vida, la fracción de la edad del usuario. */
  salaryBarLabel: (pct: string): string => `${pct}% de un año de sueldo`,
  lifeBarRowLabel: (age: number, pct: string): string => `${pct}% de tus ${age} años`,
};
