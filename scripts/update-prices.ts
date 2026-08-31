import { readFileSync, writeFileSync } from "node:fs";

const PRODUCTS_PATH = "src/data/products.json";
const COUNTRIES_PATH = "src/data/countries.json";
const FRANKFURTER_URL = "https://api.frankfurter.app/latest";

const EUR_CODES = new Set(["ES", "PT", "FR", "DE", "IT"]);

interface ProductPrice {
  value: number;
  date: string;
  note: string;
  source: string;
  origin: "local" | "converted";
}

interface Product {
  id: string;
  name: string;
  shortName: string;
  category: string;
  prices: Record<string, ProductPrice>;
  visible: boolean;
}

interface Country {
  code: string;
  currency: string;
}

function roundDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function main(): Promise<void> {
  const products: Product[] = JSON.parse(
    readFileSync(PRODUCTS_PATH, "utf8"),
  );
  const countries: Country[] = JSON.parse(
    readFileSync(COUNTRIES_PATH, "utf8"),
  );

  const nonEURCountries = countries.filter((c) => !EUR_CODES.has(c.code));

  if (nonEURCountries.length === 0) {
    console.log("No hay países fuera de EUR que actualizar.");
    return;
  }

  const targetCurrencies = nonEURCountries.map((c) => c.currency);
  const currencySet = [...new Set(targetCurrencies)];

  let rates: Record<string, number> = {};

  try {
    const url = `${FRANKFURTER_URL}?from=EUR&to=${currencySet.join(",")}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Frankfurter.app respondió ${res.status}. Precios sin actualizar.`);
      return;
    }
    const data = await res.json();
    rates = data.rates ?? {};
    console.log(`Tipos de cambio obtenidos: ${JSON.stringify(rates)}`);
  } catch (err) {
    console.warn("No se pudo conectar con frankfurter.app. Precios sin actualizar.");
    return;
  }

  const date = new Date().toISOString().slice(0, 7);

  let updated = 0;

  for (const country of nonEURCountries) {
    const currency = country.currency;
    const rate = rates[currency];
    if (!rate) {
      console.warn(`Sin tasa para ${currency} (${country.code}). Saltando.`);
      continue;
    }

    for (const product of products) {
      const esPrice = product.prices["ES"];
      if (!esPrice) continue;

      const convertedValue = roundDecimals(esPrice.value * rate, 2);

      product.prices[country.code] = {
        value: convertedValue,
        date,
        note: `Precio convertido desde España (${esPrice.value} €). Edítalo.`,
        source: "Referencia de producto (convertido)",
        origin: "converted",
      };
      updated++;
    }
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n");
  console.log(`Actualizados ${updated} precios (${nonEURCountries.length} países).`);
}

main().catch((err) => {
  console.error("Error en update-prices:", err);
  process.exit(1);
});