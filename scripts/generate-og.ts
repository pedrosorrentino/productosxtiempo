/**
 * Generador de pósters OG (1200×630) en build time: un PNG único por página
 * (portada, ficha de país, ficha de producto) con los datos reales del
 * catálogo y la mediana de cada país. Estética "tablero": carbón-verdoso,
 * dígitos ámbar estilo flap, señalización Big Shoulders y mono Chivo Mono.
 *
 * Corre DESPUÉS de `astro build` (dist debe existir): `astro build && node
 * scripts/generate-og.ts`. Node 22.12+ ejecuta TS nativo; reutiliza
 * src/lib/{calc,format,ogQuote}.ts y src/i18n/es.ts tal cual.
 *
 * Salida: dist/og/index.png · dist/og/{pais}.png · dist/og/{pais}/{producto}.png
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { brand, board, og, result } from "../src/i18n/es.ts";
import { calc } from "../src/lib/calc.ts";
import { formatHourlyWage } from "../src/lib/format.ts";
import { isConverted, ogQuote, priceTextOf } from "../src/lib/ogQuote.ts";
import type { Country, Product } from "../src/lib/types.ts";

// ---- Datos y paleta del tema "board" (src/styles/global.css) ----
const countries: Country[] = JSON.parse(
  readFileSync("src/data/countries.json", "utf8"),
);
const products: Product[] = JSON.parse(
  readFileSync("src/data/products.json", "utf8"),
).filter((product: Product) => product.visible);

const BG = "#151a17";
const PLATE = "#1c231f";
const HAIR = "#28332d";
const CREAM = "#f2ead8";
const AMBER = "#ffb020";
const CREAM_SOFT = "rgba(242, 234, 216, 0.72)";
const CREAM_FAINT = "rgba(242, 234, 216, 0.6)";

const FONT_DIR = "src/assets/fonts";
const font = (file: string, weight: 400 | 500 | 700 | 800) => ({
  name: file.startsWith("BigShoulders") ? "Big Shoulders" : "Chivo Mono",
  data: readFileSync(join(FONT_DIR, file)),
  weight,
  style: "normal" as const,
});
const fonts = [
  font("BigShoulders-700.ttf", 700),
  font("BigShoulders-800.ttf", 800),
  font("ChivoMono-400.ttf", 400),
  font("ChivoMono-500.ttf", 500),
  font("ChivoMono-700.ttf", 700),
];

// ---- Composición (satori solo acepta flexbox) ----
type Style = Record<string, string | number>;
type Node = { type: string; props: { style: Style; children?: unknown } };
const h = (type: string, style: Style, children?: unknown): Node => ({
  type,
  props: { style, children },
});

const root = (children: unknown): Node =>
  h("div", {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "1200px",
    height: "630px",
    backgroundColor: BG,
    padding: "48px 64px 40px",
    fontFamily: "Chivo Mono",
  }, children);

/** Cabecera común: marca a la izquierda, dominio a la derecha. */
const header = (): Node =>
  h("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
    h("div", {
      fontFamily: "Big Shoulders",
      fontWeight: 800,
      fontSize: 44,
      color: CREAM,
      textTransform: "uppercase",
      letterSpacing: 3,
    }, brand.name),
    h("div", {
      fontSize: 20,
      color: AMBER,
      textTransform: "uppercase",
      letterSpacing: 2,
    }, brand.domain),
  ]);

/** La cifra protagonista en placa estilo flap (dígitos ámbar + unidad). */
const flap = (digits: string, unit: string): Node => {
  const size = digits.length <= 5 ? 150 : digits.length <= 8 ? 110 : 84;
  return h("div", {
    display: "flex",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: PLATE,
    border: `1px solid ${HAIR}`,
    borderRadius: 12,
    padding: "8px 40px",
    marginTop: 20,
  }, [
    h("div", {
      fontFamily: "Chivo Mono",
      fontWeight: 700,
      fontSize: size,
      color: AMBER,
      lineHeight: 1.1,
    }, digits),
    ...(unit
      ? [h("div", {
          fontFamily: "Big Shoulders",
          fontWeight: 700,
          fontSize: 52,
          color: CREAM,
          textTransform: "uppercase",
          marginLeft: 28,
          lineHeight: 1.1,
        }, unit)]
      : []),
  ]);
};

const lead = (text: string): Node =>
  h("div", { fontSize: 24, color: CREAM_SOFT, lineHeight: 1.35 }, text);

const hook = (text: string): Node =>
  h("div", {
    fontFamily: "Big Shoulders",
    fontWeight: 700,
    fontSize: 36,
    color: CREAM,
    lineHeight: 1.2,
    marginTop: 28,
    maxWidth: "900px",
  }, text);

/** Pie común: nota de datos a la izquierda, corte de datos a la derecha. */
const footer = (left: string, right: string): Node =>
  h("div", {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: `1px solid ${HAIR}`,
    paddingTop: 20,
    fontSize: 18,
    color: CREAM_FAINT,
  }, [h("div", {}, left), h("div", {}, right)]);

// ---- Pósters por tipo de página ----

function homePoster(heroProduct: Product, heroCountry: Country): Node {
  const quote = ogQuote(heroProduct, heroCountry);
  const nProducts = products.length;
  const nCountries = countries.length;
  return root([
    header(),
    h("div", { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }, [
      lead(board.heroLead("Tesla Model 3", heroCountry.name)),
      flap(quote?.digits ?? "—", quote?.unit ?? ""),
      hook(og.poster.hookHome),
    ]),
    footer(
      og.poster.homeFooter(nProducts, nCountries),
      brand.promise,
    ),
  ]);
}

function countryPoster(country: Country): Node {
  // Misma hora de referencia que la ficha del país: calc con price=1
  // (NUNCA la mediana mensual, que no es un valor por hora).
  const wageText =
    country.medianNetMonthly != null
      ? formatHourlyWage(
          calc({
            price: 1,
            netMonthly: country.medianNetMonthly,
            weeklyHours: country.legalWeeklyHours,
            realAnnualHours: country.realAnnualHours,
            monthlySavings: null,
            age: null,
            retirementAge: country.retirementAge,
          }).hourlyWage,
          country.currencySymbol,
        )
      : null;
  const hasWage = wageText != null;
  const children = [
    lead(
      hasWage
        ? `Viviendo en ${country.name}, 1 hora de trabajo vale`
        : `Ficha de ${country.name}`,
    ),
    hasWage
      ? flap(wageText!.replace(` ${country.currencySymbol}`, ""), board.rateUnit(country.currencySymbol))
      : h("div", {
          fontFamily: "Chivo Mono",
          fontWeight: 700,
          fontSize: 56,
          color: AMBER,
          marginTop: 20,
        }, og.poster.noWage),
    hook(og.poster.hookCountry),
  ];
  return root([
    header(),
    h("div", { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }, children),
    footer(
      `jornada de ${country.legalWeeklyHours} h semanales` +
        (hasWage
          ? ` · mediana ${new Intl.NumberFormat("es-ES").format(country.medianNetMonthly!)} ${country.currencySymbol}/mes`
          : ""),
      `ref. ${country.salariesUpdatedAt}`,
    ),
  ]);
}

function productPoster(product: Product, country: Country): Node {
  const quote = ogQuote(product, country);
  // Sin mediana (AR/CO) el póster degrada al precio de referencia, nunca a
  // un flap vacío.
  const priceText = quote?.priceText ?? priceTextOf(product, country);
  const children = [
    lead(board.heroLead(product.shortName, country.name)),
    quote
      ? flap(quote.digits, quote.unit)
      : priceText
        ? flap(priceText, "")
        : h("div", {
            fontFamily: "Chivo Mono",
            fontWeight: 700,
            fontSize: 56,
            color: AMBER,
            marginTop: 20,
          }, og.poster.noWage),
    hook(og.poster.hookProduct),
  ];
  return root([
    header(),
    h("div", { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }, children),
    footer(
      priceText
        ? `${priceText} · ${isConverted(product, country) ? result.convertedBadge : "precio local"}`
        : og.poster.noWage,
      `ref. ${country.salariesUpdatedAt}`,
    ),
  ]);
}

// ---- Render y escritura ----

const OUT_DIR = "dist/og";

async function renderPng(node: Node, path: string): Promise<void> {
  const svg = await satori(node, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
    .render()
    .asPng();
  const file = join(OUT_DIR, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png);
  process.stdout.write(`og/${path}\n`);
}

const heroProduct =
  products.find((product) => product.id === "tesla-model-3") ?? products[0];
const heroCountry = countries.find((country) => country.code === "ES") ?? countries[0];

await renderPng(homePoster(heroProduct, heroCountry), "index.png");
for (const country of countries) {
  await renderPng(countryPoster(country), `${country.slug}.png`);
  for (const product of products) {
    // Mismo criterio que getStaticPaths de [country]/[product]: sin precio
    // base (local o ES) no hay página → no hay póster.
    const price = product.prices[country.code] ?? product.prices["ES"];
    if (!price) continue;
    await renderPng(
      productPoster(product, country),
      `${country.slug}/${product.id}.png`,
    );
  }
}
