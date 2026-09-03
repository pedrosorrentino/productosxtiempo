import { readFileSync, writeFileSync } from "node:fs";

const PRODUCTS_PATH = "src/data/products.json";
const COUNTRIES_PATH = "src/data/countries.json";
const FRANKFURTER_URL = "https://api.frankfurter.app/latest";

const EUR_CODES = new Set(["ES", "PT", "FR", "DE", "IT"]);

// Tasas de respaldo para monedas latinoamericanas no cotizadas por el BCE
const FALLBACK_RATES = {
  CLP: 1020,
  COP: 4400,
  ARS: 1150,
};

function roundValue(value, rate) {
  if (rate >= 100) {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}

async function main() {
  const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf8"));
  const countries = JSON.parse(readFileSync(COUNTRIES_PATH, "utf8"));

  const nonEURCountries = countries.filter((c) => !EUR_CODES.has(c.code));
  const eurOtherCountries = countries.filter((c) => EUR_CODES.has(c.code) && c.code !== "ES");

  const targetCurrencies = nonEURCountries.map((c) => c.currency);
  const currencySet = [...new Set(targetCurrencies)];

  let rates = { ...FALLBACK_RATES };

  try {
    const url = `${FRANKFURTER_URL}?from=EUR&to=${currencySet.join(",")}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      rates = { ...rates, ...(data.rates ?? {}) };
      console.log(`Tipos de cambio obtenidos: ${JSON.stringify(rates)}`);
    } else {
      console.warn(`Frankfurter.app respondió ${res.status}. Usando tasas de respaldo.`);
    }
  } catch (err) {
    console.warn("No se pudo conectar con frankfurter.app. Usando tasas de respaldo.");
  }

  const date = new Date().toISOString().slice(0, 7);
  let updated = 0;

  // Actualizar países fuera de EUR
  for (const country of nonEURCountries) {
    const currency = country.currency;
    const rate = rates[currency];
    if (!rate) {
      console.warn(`Sin tasa para ${currency} (${country.code}). Saltando.`);
      continue;
    }

    for (const product of products) {
      // Respetar precios locales manuales
      if (product.prices[country.code]?.origin === "local") {
        continue;
      }

      const esPrice = product.prices["ES"];
      if (!esPrice) continue;

      const convertedValue = roundValue(esPrice.value * rate, rate);

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

  // Asegurar precios de referencia para otros países EUR (PT, FR, DE, IT)
  for (const country of eurOtherCountries) {
    for (const product of products) {
      if (product.prices[country.code]) continue;
      const esPrice = product.prices["ES"];
      if (!esPrice) continue;
      product.prices[country.code] = {
        value: esPrice.value,
        date: esPrice.date,
        note: `Precio de referencia de España (${esPrice.value} €). Edítalo.`,
        source: "Referencia de producto (convertido)",
        origin: "converted",
      };
      updated++;
    }
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n");
  console.log(`Actualizados ${updated} precios en catálogo.`);
}

main().catch((err) => {
  console.error("Error en update-prices:", err);
  process.exit(1);
});
