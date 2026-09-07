/**
 * Script de compilación y respaldo de pósters OpenGraph (1200×630).
 * Utiliza el motor centralizado src/lib/ogRenderer.ts para garantizar total paridad
 * visual entre los endpoints de Astro y los archivos estáticos en dist/og/.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  renderHomeOgPng,
  renderCountryOgPng,
  renderProductOgPng,
} from "../src/lib/ogRenderer.ts";
import type { Country, Product } from "../src/lib/types.ts";

const countries: Country[] = JSON.parse(
  readFileSync("src/data/countries.json", "utf8"),
);
const products: Product[] = JSON.parse(
  readFileSync("src/data/products.json", "utf8"),
).filter((product: Product) => product.visible);

const OUT_DIR = "dist/og";

async function savePng(bufferPromise: Promise<Uint8Array>, relativePath: string): Promise<void> {
  const png = await bufferPromise;
  const file = join(OUT_DIR, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png);
  process.stdout.write(`og/${relativePath}\n`);
}

const heroProduct =
  products.find((product) => product.id === "tesla-model-3") ?? products[0];
const heroCountry = countries.find((country) => country.code === "ES") ?? countries[0];

await savePng(renderHomeOgPng(heroProduct, heroCountry), "index.png");

for (const country of countries) {
  await savePng(renderCountryOgPng(country), `${country.slug}.png`);
  for (const product of products) {
    const price = product.prices[country.code] ?? product.prices["ES"];
    if (!price) continue;
    await savePng(
      renderProductOgPng(product, country),
      `${country.slug}/${product.id}.png`,
    );
  }
}
