/**
 * Motor de Generación Dinámica de Imágenes OpenGraph (OG) de Alto Impacto (1200×630).
 * Diseñado con estética de infografía financiera premium (Bloomberg / Visual Capitalist / Board):
 * - Tri-card board con cifras de esfuerzo (Jornadas, Horas, Meses de nómina).
 * - Coincidencia 100% matemática con el cálculo del portal (usando realAnnualHours de la OCDE).
 * - Tipografía display de gran impacto y llamada a la acción irresistible para viralidad en redes.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { brand } from "../i18n/es.ts";
import { calc } from "./calc.ts";
import { formatMonths, formatWorkdays, formatIntegerThousands } from "./format.ts";
import { getProductPrice } from "./selectors.ts";
import type { Country, Product } from "./types.ts";

// Paleta de color premium de alto contraste y legibilidad social
const BG = "#0c100d";
const BOARD_BG = "#131b15";
const BORDER_MAIN = "#283b2e";
const CREAM = "#f5eee0";
const CREAM_SOFT = "rgba(245, 238, 224, 0.82)";
const CREAM_MUTED = "rgba(245, 238, 224, 0.55)";
const AMBER = "#ffb020";
const AMBER_BG = "rgba(255, 176, 32, 0.14)";
const AMBER_BORDER = "rgba(255, 176, 32, 0.4)";
const EMERALD = "#3ec97e";
const EMERALD_BG = "rgba(62, 201, 126, 0.12)";
const EMERALD_BORDER = "rgba(62, 201, 126, 0.35)";

type Style = Record<string, string | number>;
type SatoriNode = { type: string; props: { style: Style; children?: unknown } };

const h = (type: string, style: Style, children?: unknown): SatoriNode => ({
  type,
  props: { style, children },
});

// Cache de fuentes tipográficas
let cachedFonts: { name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: "normal" }[] | null = null;

function getFonts() {
  if (cachedFonts) return cachedFonts;
  const FONT_DIR = join(process.cwd(), "src/assets/fonts");
  const load = (file: string, weight: 400 | 500 | 700 | 800) => ({
    name: file.startsWith("BigShoulders") ? "Big Shoulders" : "Chivo Mono",
    data: readFileSync(join(FONT_DIR, file)),
    weight,
    style: "normal" as const,
  });

  cachedFonts = [
    load("BigShoulders-700.ttf", 700),
    load("BigShoulders-800.ttf", 800),
    load("ChivoMono-400.ttf", 400),
    load("ChivoMono-500.ttf", 500),
    load("ChivoMono-700.ttf", 700),
  ];
  return cachedFonts;
}

/** Marco exterior elegante de 1200x630 */
const root = (children: unknown): SatoriNode =>
  h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "1200px",
      height: "630px",
      backgroundColor: BG,
      border: "10px solid #18231c",
      padding: "36px 48px 30px",
      fontFamily: "Chivo Mono",
    },
    children,
  );

/** Barra superior con marca y dominio */
const header = (badge = "CÁLCULO DE ESFUERZO LABORAL"): SatoriNode =>
  h("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
    h("div", { display: "flex", alignItems: "center", gap: 14 }, [
      h(
        "div",
        {
          fontFamily: "Big Shoulders",
          fontWeight: 800,
          fontSize: 38,
          color: CREAM,
          textTransform: "uppercase",
          letterSpacing: 2,
        },
        brand.name,
      ),
      h(
        "div",
        {
          backgroundColor: AMBER_BG,
          border: `1px solid ${AMBER_BORDER}`,
          color: AMBER,
          fontSize: 12,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 4,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        },
        badge,
      ),
    ]),
    h(
      "div",
      {
        fontSize: 18,
        color: AMBER,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
      },
      brand.domain,
    ),
  ]);

/**
 * PÓSTER DE PRODUCTO: El corazón viral del portal
 * Muestra el producto, el precio oficial y el desglose de esfuerzo (Jornadas, Horas, Meses)
 */
export function generateProductPoster(product: Product, country: Country): SatoriNode {
  const price = getProductPrice(product, country.code);
  const formattedPrice = price != null ? `${new Intl.NumberFormat("es-ES").format(price.value)} ${country.currencySymbol}` : null;
  const isLocal = price != null && (product.prices[country.code] != null && product.prices[country.code]?.origin !== "converted");

  let calcResult = null;
  if (price != null && country.medianNetMonthly != null) {
    try {
      calcResult = calc({
        price: price.value,
        netMonthly: country.medianNetMonthly,
        weeklyHours: country.legalWeeklyHours,
        realAnnualHours: country.realAnnualHours,
        monthlySavings: null,
        age: null,
        retirementAge: country.retirementAge,
      });
    } catch {
      calcResult = null;
    }
  }

  // Cifras exactas formateadas
  const workdaysStr = calcResult ? formatWorkdays(calcResult.workdays8h) : "—";
  const hoursStr = calcResult ? formatIntegerThousands(Math.round(calcResult.hours)) : (price ? `${formatIntegerThousands(price.value)}` : "—");
  const monthsStr = calcResult ? formatMonths(calcResult.monthsFullPay) : "—";

  return root([
    header("ESFUERZO LABORAL REAL"),

    // Bloque Central: Identidad del producto y tablero de cifras
    h("div", { display: "flex", flexDirection: "column", gap: 16, marginTop: 4, marginBottom: 4 }, [
      // Metadatos de producto (Categoría, País, Precio)
      h("div", { display: "flex", alignItems: "center", justifyContent: "space-between" }, [
        h("div", { display: "flex", alignItems: "center", gap: 10 }, [
          h(
            "div",
            {
              backgroundColor: isLocal ? EMERALD_BG : AMBER_BG,
              border: `1px solid ${isLocal ? EMERALD_BORDER : AMBER_BORDER}`,
              color: isLocal ? EMERALD : AMBER,
              fontSize: 12,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 3,
              textTransform: "uppercase",
            },
            isLocal ? "PVP OFICIAL VERIFICADO" : "CONVERTIDO CON BCE",
          ),
          h(
            "div",
            { fontSize: 16, color: CREAM_SOFT, fontWeight: 500 },
            `${product.category.toUpperCase()} · ${country.name.toUpperCase()}${formattedPrice ? ` · ${formattedPrice}` : ""}`,
          ),
        ]),
        h(
          "div",
          {
            fontSize: 14,
            color: CREAM_MUTED,
            textTransform: "uppercase",
            letterSpacing: 1,
          },
          `Sueldo mediano: ${new Intl.NumberFormat("es-ES").format(country.medianNetMonthly ?? 0)} ${country.currencySymbol}/mes`,
        ),
      ]),

      // Título destacado del producto
      h(
        "div",
        {
          fontFamily: "Big Shoulders",
          fontWeight: 800,
          fontSize: product.name.length > 30 ? 46 : 56,
          color: CREAM,
          textTransform: "uppercase",
          letterSpacing: 2,
          lineHeight: 1.05,
        },
        product.name,
      ),

      // Pregunta gancho
      h(
        "div",
        {
          fontSize: 20,
          color: AMBER,
          fontWeight: 500,
          letterSpacing: 0.5,
        },
        `¿Cuántas jornadas y horas de tu vida necesitas trabajar para pagarlo?`,
      ),

      // TABLERO DE IMPACTO VIRAL (3 Pilares alineados)
      h(
        "div",
        {
          display: "flex",
          backgroundColor: BOARD_BG,
          border: `2px solid ${BORDER_MAIN}`,
          borderRadius: 16,
          padding: "16px 28px",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
        },
        [
          // Pilar 1: Jornadas de 8 horas (El protagonista indiscutible)
          h("div", { display: "flex", flexDirection: "column", flex: 1.2 }, [
            h("div", { fontSize: 12, color: AMBER, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }, "JORNADAS DE TRABAJO"),
            h(
              "div",
              {
                fontFamily: "Chivo Mono",
                fontWeight: 700,
                fontSize: 84,
                color: AMBER,
                lineHeight: 1,
                marginTop: 2,
              },
              workdaysStr,
            ),
            h("div", { fontFamily: "Big Shoulders", fontWeight: 700, fontSize: 26, color: CREAM, textTransform: "uppercase", marginTop: 4 }, "Jornadas de 8 horas"),
          ]),

          // Divisor vertical 1
          h("div", { width: 2, height: 110, backgroundColor: BORDER_MAIN, marginLeft: 20, marginRight: 24 }),

          // Pilar 2: Horas de trabajo
          h("div", { display: "flex", flexDirection: "column", flex: 1 }, [
            h("div", { fontSize: 12, color: EMERALD, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }, "TIEMPO EN HORAS"),
            h(
              "div",
              {
                fontFamily: "Chivo Mono",
                fontWeight: 700,
                fontSize: 54,
                color: EMERALD,
                lineHeight: 1.05,
                marginTop: 6,
              },
              hoursStr,
            ),
            h("div", { fontFamily: "Big Shoulders", fontWeight: 700, fontSize: 24, color: CREAM, textTransform: "uppercase", marginTop: 6 }, "Horas de tu vida"),
          ]),

          // Divisor vertical 2
          h("div", { width: 2, height: 110, backgroundColor: BORDER_MAIN, marginLeft: 20, marginRight: 24 }),

          // Pilar 3: Meses de nómina entera
          h("div", { display: "flex", flexDirection: "column", flex: 1 }, [
            h("div", { fontSize: 12, color: CREAM_MUTED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }, "NÓMINAS MEDIANAS"),
            h(
              "div",
              {
                fontFamily: "Chivo Mono",
                fontWeight: 700,
                fontSize: 54,
                color: CREAM,
                lineHeight: 1.05,
                marginTop: 6,
              },
              monthsStr,
            ),
            h("div", { fontFamily: "Big Shoulders", fontWeight: 700, fontSize: 24, color: CREAM, textTransform: "uppercase", marginTop: 6 }, "Meses de sueldo"),
          ]),
        ],
      ),
    ]),

    // Pie de cartel con llamada a la acción irresistible
    h(
      "div",
      {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${BORDER_MAIN}`,
        paddingTop: 14,
      },
      [
        h("div", { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: CREAM_MUTED }, [
          h("div", { width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD }),
          h("div", {}, `Datos: INE / Eurostat / OCDE (${country.salariesUpdatedAt})`),
        ]),
        h(
          "div",
          {
            backgroundColor: AMBER,
            color: "#0c100d",
            fontFamily: "Big Shoulders",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 1,
            padding: "6px 20px",
            borderRadius: 6,
            textTransform: "uppercase",
          },
          "CALCULA TU CASO CON TU NÓMINA EN PRECIOENTIEMPO.COM",
        ),
      ],
    ),
  ]);
}

/** PÓSTER DE PAÍS: Radiografía económica y valor de la hora de trabajo */
export function generateCountryPoster(country: Country): SatoriNode {
  const wage = country.medianNetMonthly != null && country.realAnnualHours != null
    ? (country.medianNetMonthly * 12) / country.realAnnualHours
    : null;
  const wageFormatted = wage != null ? `${wage.toFixed(2).replace(".", ",")} ${country.currencySymbol}/h` : "—";
  const salaryFormatted = country.medianNetMonthly != null ? `${new Intl.NumberFormat("es-ES").format(country.medianNetMonthly)} ${country.currencySymbol}/mes` : "—";

  return root([
    header(`RADIOGRAFÍA ECONÓMICA · ${country.name.toUpperCase()}`),
    h("div", { display: "flex", flexDirection: "column", gap: 20, justifyContent: "center", flex: 1 }, [
      h("div", { fontSize: 24, color: CREAM_SOFT }, `Viviendo y trabajando en ${country.name}:`),
      h(
        "div",
        {
          fontFamily: "Big Shoulders",
          fontWeight: 800,
          fontSize: 60,
          color: CREAM,
          textTransform: "uppercase",
          letterSpacing: 2,
        },
        "¿CUÁNTO VALE REALMENTE 1 HORA DE TU VIDA?",
      ),
      h(
        "div",
        {
          display: "flex",
          backgroundColor: BOARD_BG,
          border: `2px solid ${BORDER_MAIN}`,
          borderRadius: 16,
          padding: "24px 36px",
          alignItems: "center",
          gap: 36,
        },
        [
          h("div", { display: "flex", flexDirection: "column" }, [
            h("div", { fontSize: 14, color: AMBER, fontWeight: 700, letterSpacing: 1.5 }, "VALOR NETO POR HORA (MEDIANA)"),
            h("div", { fontFamily: "Chivo Mono", fontWeight: 700, fontSize: 80, color: AMBER, lineHeight: 1, marginTop: 4 }, wageFormatted),
          ]),
          h("div", { width: 2, height: 90, backgroundColor: BORDER_MAIN }),
          h("div", { display: "flex", flexDirection: "column" }, [
            h("div", { fontSize: 14, color: CREAM_MUTED, fontWeight: 700, letterSpacing: 1.5 }, "SALARIO MEDIANO OFICIAL"),
            h("div", { fontFamily: "Chivo Mono", fontWeight: 700, fontSize: 44, color: CREAM, lineHeight: 1.1, marginTop: 4 }, salaryFormatted),
            h("div", { fontSize: 13, color: CREAM_MUTED, marginTop: 4 }, `Jornada anual efectiva: ${country.realAnnualHours ?? 1688} horas (OCDE)`),
          ]),
        ],
      ),
    ]),
    h(
      "div",
      {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${BORDER_MAIN}`,
        paddingTop: 14,
      },
      [
        h("div", { fontSize: 14, color: CREAM_MUTED }, `Fuente: Estadísticas Oficiales del Mercado de Trabajo (${country.salariesUpdatedAt})`),
        h("div", { color: AMBER, fontWeight: 700, fontSize: 16 }, "DESCUBRE CUÁNTO VALE TU TIEMPO EN PRECIOENTIEMPO.COM"),
      ],
    ),
  ]);
}

/** PÓSTER DE PORTADA: El hero principal de la web */
export function generateHomePoster(heroProduct: Product, heroCountry: Country): SatoriNode {
  return generateProductPoster(heroProduct, heroCountry);
}

/** Renderiza cualquier SatoriNode a un buffer PNG (1200x630) compatible con Response */
export async function renderNodeToPng(node: SatoriNode): Promise<Uint8Array> {
  const fonts = getFonts();
  const svg = await satori(node, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
    .render()
    .asPng();
  return new Uint8Array(png);
}

export async function renderHomeOgPng(heroProduct: Product, heroCountry: Country): Promise<Uint8Array> {
  return renderNodeToPng(generateHomePoster(heroProduct, heroCountry));
}

export async function renderCountryOgPng(country: Country): Promise<Uint8Array> {
  return renderNodeToPng(generateCountryPoster(country));
}

export async function renderProductOgPng(product: Product, country: Country): Promise<Uint8Array> {
  return renderNodeToPng(generateProductPoster(product, country));
}
