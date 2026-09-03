import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Product } from '../src/lib/types.ts';
import { CATALOG_PROVIDERS } from './sources/index.ts';
import type { NormalizedPriceUpdate } from './sources/types.ts';

const PRODUCTS_PATH = 'src/data/products.json';
const COUNTRIES_PATH = 'src/data/countries.json';
const DATA_DIR = 'scripts/data';
const INCOMING_QUEUE_PATH = `${DATA_DIR}/incoming-products.json`;
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

const EUR_CODES = new Set(['ES', 'PT', 'FR', 'DE', 'IT']);

const FALLBACK_RATES: Record<string, number> = {
  CLP: 1020,
  COP: 4400,
  ARS: 1150,
};

function roundValue(value: number, rate: number): number {
  if (rate >= 100) {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}

async function fetchExchangeRates(targetCurrencies: string[]): Promise<Record<string, number>> {
  let rates = { ...FALLBACK_RATES };
  try {
    const unique = [...new Set(targetCurrencies)];
    const url = `${FRANKFURTER_URL}?from=EUR&to=${unique.join(',')}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> };
      rates = { ...rates, ...(data.rates ?? {}) };
      console.log('✔ Tipos de cambio obtenidos del Banco Central Europeo (Frankfurter).');
    } else {
      console.warn(`Frankfurter respondió ${res.status}. Usando tasas de respaldo.`);
    }
  } catch {
    console.warn('Sin conexión con Frankfurter. Usando tasas de respaldo.');
  }
  return rates;
}

async function main() {
  console.log('═════════════════════════════════════════════════════════════');
  console.log('   SINCRONIZADOR DE CATÁLOGO · EL TABLERO DE COTIZACIONES    ');
  console.log('═════════════════════════════════════════════════════════════');

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(INCOMING_QUEUE_PATH)) {
    writeFileSync(INCOMING_QUEUE_PATH, '[]\n', 'utf8');
  }

  const rawProducts = readFileSync(PRODUCTS_PATH, 'utf8');
  const products: Product[] = JSON.parse(rawProducts);
  const countries = JSON.parse(readFileSync(COUNTRIES_PATH, 'utf8'));

  const enabledProviders = CATALOG_PROVIDERS.filter((p) => p.enabled);
  console.log(`📡 Consultando ${enabledProviders.length} proveedores en paralelo...\n`);

  const results = await Promise.allSettled(
    enabledProviders.map(async (provider) => {
      const startTime = Date.now();
      const updates = await provider.fetchPrices();
      const elapsed = Date.now() - startTime;
      return { provider, updates, elapsed };
    })
  );

  const collectedUpdates: NormalizedPriceUpdate[] = [];

  results.forEach((res, idx) => {
    const provider = enabledProviders[idx];
    if (res.status === 'fulfilled') {
      const { updates, elapsed } = res.value;
      console.log(
        `✔ [${provider.name}] → ${updates.length} actualización/es en ${elapsed} ms.`
      );
      collectedUpdates.push(...updates);
    } else {
      console.warn(
        `✖ [${provider.name}] Falló (${res.reason?.message || res.reason}). Se conserva último valor.`
      );
    }
  });

  console.log(`\n📦 Integrando ${collectedUpdates.length} actualizaciones en products.json...`);

  let newProductsCount = 0;
  let updatedProductsCount = 0;

  for (const update of collectedUpdates) {
    let product = products.find((p) => p.id === update.productId);

    if (!product) {
      product = {
        id: update.productId,
        name: update.productName || update.productId,
        shortName: update.shortName || update.productName || update.productId,
        category: update.category || 'dia-a-dia',
        prices: {},
        visible: update.visible ?? true,
      };
      products.push(product);
      newProductsCount++;
    } else {
      if (update.productName && !product.name) product.name = update.productName;
      if (update.shortName && !product.shortName) product.shortName = update.shortName;
      if (update.category && !product.category) product.category = update.category;
    }

    product.prices[update.countryCode] = {
      value: update.value,
      date: update.date,
      note: update.note,
      source: update.source,
      origin: update.origin,
    };
    updatedProductsCount++;
  }

  // Conversión internacional de monedas
  console.log('\n💱 Calculando conversión automática de divisas para 11 países...');
  const nonEURCountries = countries.filter((c: { code: string }) => !EUR_CODES.has(c.code));
  const eurOtherCountries = countries.filter(
    (c: { code: string }) => EUR_CODES.has(c.code) && c.code !== 'ES'
  );

  const targetCurrencies: string[] = nonEURCountries.map((c: { currency: string }) => c.currency);
  const rates = await fetchExchangeRates(targetCurrencies);
  const dateStr = new Date().toISOString().slice(0, 7);

  let conversionsCount = 0;

  for (const country of nonEURCountries) {
    const rate = rates[country.currency];
    if (!rate) continue;

    for (const product of products) {
      if (product.prices[country.code]?.origin === 'local') continue;
      const esPrice = product.prices['ES'];
      if (!esPrice) continue;

      const convertedValue = roundValue(esPrice.value * rate, rate);
      product.prices[country.code] = {
        value: convertedValue,
        date: esPrice.date || dateStr,
        note: `Precio convertido desde España (${esPrice.value} €). Edítalo.`,
        source: esPrice.source ? `${esPrice.source} (convertido)` : 'Referencia de producto (convertido)',
        origin: 'converted',
      };
      conversionsCount++;
    }
  }

  for (const country of eurOtherCountries) {
    for (const product of products) {
      if (product.prices[country.code]) continue;
      const esPrice = product.prices['ES'];
      if (!esPrice) continue;

      product.prices[country.code] = {
        value: esPrice.value,
        date: esPrice.date || dateStr,
        note: `Precio de referencia de España (${esPrice.value} €). Edítalo.`,
        source: esPrice.source ? `${esPrice.source} (convertido)` : 'Referencia de producto (convertido)',
        origin: 'converted',
      };
      conversionsCount++;
    }
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n', 'utf8');

  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`✨ Sincronización completada con éxito:`);
  console.log(`   - Productos nuevos creados: ${newProductsCount}`);
  console.log(`   - Precios base actualizados: ${updatedProductsCount}`);
  console.log(`   - Precios internacionales convertidos: ${conversionsCount}`);
  console.log(`   - Total productos en catálogo: ${products.length}`);
  console.log('═════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Error fatal en sync-catalog:', err);
  process.exit(1);
});
