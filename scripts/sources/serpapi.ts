import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * SerpApi · Google Shopping (plan gratuito: 250 búsquedas/mes).
 *
 * Presupuesto: cada par producto×país cuesta 1 búsqueda. Para no agotar la cuota:
 * - Caché en `scripts/data/serpapi-cache.json` con TTL de 30 días.
 * - Tope por ejecución (`SERPAPI_MAX_CALLS`, por defecto 10).
 * - Reserva de seguridad: si a la cuenta le quedan ≤ `SERPAPI_RESERVE` (20)
 *   búsquedas, el proveedor no gasta nada.
 * - Objetivos priorizados desde GSC en `scripts/data/serpapi-targets.json`
 *   (páginas con más impresiones). Si no existe, usa una lista por defecto.
 *
 * Requiere `SERPAPI_KEY` en `.env` (no se versiona).
 */

const CACHE_PATH = 'scripts/data/serpapi-cache.json';
const TARGETS_PATH = 'scripts/data/serpapi-targets.json';
const TTL_DAYS = 30;
const DEFAULT_MAX_CALLS = 10;
const DEFAULT_RESERVE = 20;

type CountryConfig = {
  gl: string;
  hl: string;
  domain: string;
  decimals: boolean;
};

const COUNTRIES: Record<string, CountryConfig> = {
  ES: { gl: 'es', hl: 'es', domain: 'google.es', decimals: true },
  PT: { gl: 'pt', hl: 'pt', domain: 'google.pt', decimals: true },
  FR: { gl: 'fr', hl: 'fr', domain: 'google.fr', decimals: true },
  DE: { gl: 'de', hl: 'de', domain: 'google.de', decimals: true },
  IT: { gl: 'it', hl: 'it', domain: 'google.it', decimals: true },
  GB: { gl: 'uk', hl: 'en', domain: 'google.co.uk', decimals: true },
  US: { gl: 'us', hl: 'en', domain: 'google.com', decimals: true },
  MX: { gl: 'mx', hl: 'es', domain: 'google.com.mx', decimals: true },
  CO: { gl: 'co', hl: 'es', domain: 'google.com.co', decimals: false },
  CL: { gl: 'cl', hl: 'es', domain: 'google.cl', decimals: false },
  AR: { gl: 'ar', hl: 'es', domain: 'google.com.ar', decimals: false },
  CH: { gl: 'ch', hl: 'de', domain: 'google.ch', decimals: true },
};

/** Fallback si no hay archivo de objetivos generado desde GSC. */
const FALLBACK_PRODUCTS = [
  'iphone', 'portatil', 'tablet', 'televisor', 'auriculares', 'movil-gama-media',
  'consola', 'smartwatch', 'cafe', 'arroz-kilo', 'aceite-oliva', 'huevos-docena',
  'barra-de-pan', 'leche-mes',
];
const FALLBACK_QUERIES: Record<string, string> = {
  iphone: 'iphone', portatil: 'laptop', tablet: 'tablet', televisor: 'smart tv 55 inch',
  auriculares: 'wireless earbuds', 'movil-gama-media': 'mid range smartphone',
  consola: 'game console', smartwatch: 'smartwatch', cafe: 'ground coffee 500g',
  'arroz-kilo': 'rice 1kg', 'aceite-oliva': 'olive oil 1 liter', 'huevos-docena': 'eggs 12 dozen',
  'barra-de-pan': 'bread loaf', 'leche-mes': 'milk 1 liter',
};
const FALLBACK_COUNTRIES = ['CO', 'AR', 'CL', 'MX', 'ES'];

type Target = { country: string; productId: string; query: string; factor?: number };
type CacheEntry = { value: number; date: string; fetchedAt: string; rejected?: boolean };
type Cache = { prices: Record<string, CacheEntry> };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadKey(): string {
  if (!process.env.SERPAPI_KEY) {
    try {
      process.loadEnvFile('.env');
    } catch {
      // sin .env: se tratará como no configurado
    }
  }
  return process.env.SERPAPI_KEY ?? '';
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeCache(cache: Cache): void {
  mkdirSync('scripts/data', { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

/** Valor vigente del catálogo por `PAIS:producto`, para validar plausibilidad. */
function loadCurrentValues(): Record<string, number> {
  try {
    const products = JSON.parse(readFileSync('src/data/products.json', 'utf8')) as Array<{
      id: string;
      prices: Record<string, { value: number }>;
    }>;
    const map: Record<string, number> = {};
    for (const p of products) {
      for (const [cc, pr] of Object.entries(p.prices ?? {})) {
        if (pr?.value > 0) map[`${cc}:${p.id}`] = pr.value;
      }
    }
    return map;
  } catch {
    return {};
  }
}

function isFresh(entry: CacheEntry, now: number): boolean {
  const fetched = Date.parse(`${entry.fetchedAt}T00:00:00Z`);
  return Number.isFinite(fetched) && now - fetched < TTL_DAYS * 86_400_000;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function loadTargets(): Target[] {
  const parsed = readJson<{ targets?: Target[] }>(TARGETS_PATH, {});
  if (parsed.targets && parsed.targets.length > 0) return parsed.targets;
  const targets: Target[] = [];
  for (const country of FALLBACK_COUNTRIES) {
    for (const productId of FALLBACK_PRODUCTS) {
      targets.push({ country, productId, query: FALLBACK_QUERIES[productId] ?? productId });
    }
  }
  return targets;
}

async function remainingSearches(key: string): Promise<number | null> {
  try {
    const res = await fetch(`https://serpapi.com/account?api_key=${key}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { total_searches_left?: number };
    return typeof data.total_searches_left === 'number' ? data.total_searches_left : null;
  } catch {
    return null;
  }
}

async function searchPrice(
  key: string,
  query: string,
  cfg: CountryConfig,
): Promise<{ value: number | null; billed: boolean }> {
  const url =
    `https://serpapi.com/search?engine=google_shopping` +
    `&q=${encodeURIComponent(query)}&gl=${cfg.gl}&hl=${cfg.hl}` +
    `&google_domain=${cfg.domain}&api_key=${key}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 429) {
        await sleep(2500 * (attempt + 1));
        continue; // 429 no consume búsqueda
      }
      if (!res.ok) return { value: null, billed: true };
      const data = (await res.json()) as {
        shopping_results?: Array<{ extracted_price?: number }>;
      };
      const raw = (data.shopping_results ?? [])
        .map((r) => r.extracted_price)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      if (raw.length === 0) return { value: null, billed: true };
      // Recorte de outliers: descarta packs/bultos muy por encima del precio unitario.
      const sorted = [...raw].sort((a, b) => a - b);
      const p20 = sorted[Math.floor(sorted.length * 0.2)] ?? sorted[0];
      const kept = sorted.filter((v) => v <= p20 * 4);
      return { value: median(kept), billed: true };
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return { value: null, billed: false };
}

export const serpApiProvider: CatalogSourceProvider = {
  id: 'serpapi-shopping',
  name: 'SerpApi · Google Shopping (presupuesto controlado)',
  description:
    'Precio mediano de Google Shopping para los productos/paises mas vistos en GSC. Con caché de 30 días, tope por ejecución y reserva de cuota.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const key = loadKey();
    if (!key) {
      console.log('   ℹ SerpApi: sin SERPAPI_KEY, se omite.');
      return [];
    }

    const maxCalls = Number(process.env.SERPAPI_MAX_CALLS) || DEFAULT_MAX_CALLS;
    const reserve = Number(process.env.SERPAPI_RESERVE) || DEFAULT_RESERVE;

    const left = await remainingSearches(key);
    const budget = left == null ? maxCalls : Math.max(0, Math.min(maxCalls, left - reserve));
    if (budget <= 0) {
      console.log(
        `   ⚠ SerpApi: sin cuota (quedan ${left ?? '?'}); se aplican solo los precios ya cacheados.`,
      );
    }

    const date = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const cache = readJson<Cache>(CACHE_PATH, { prices: {} });
    const targets = loadTargets();
    const currentValues = loadCurrentValues();
    let calls = 0;
    let dirty = false;
    let discarded = 0;

    for (const target of targets) {
      const cfg = COUNTRIES[target.country];
      if (!cfg) continue;
      const cacheKey = `${target.country}:${target.productId}`;
      const cached = cache.prices[cacheKey];
      if (cached && isFresh(cached, now)) continue;
      if (calls >= budget) break;

      const { value, billed } = await searchPrice(key, target.query, cfg);
      if (billed) calls++;
      if (!billed) {
        await sleep(1000); // error transitorio: no se cachea, se reintentará
        continue;
      }

      if (value != null && value > 0) {
        const scaled = value * (target.factor ?? 1);
        const rounded = cfg.decimals ? Math.round(scaled * 100) / 100 : Math.round(scaled);
        const current = currentValues[cacheKey];
        const ratio = current && current > 0 ? rounded / current : 1;
        if (ratio < 0.25 || ratio > 4) {
          // Implausible frente al valor vigente (pack, unidad distinta, accesorio).
          cache.prices[cacheKey] = { value: rounded, date, fetchedAt: today, rejected: true };
          discarded++;
        } else {
          cache.prices[cacheKey] = { value: rounded, date, fetchedAt: today };
        }
      } else {
        // Búsqueda sin resultados: se cachea como descartada para no repetir cuota.
        cache.prices[cacheKey] = { value: 0, date, fetchedAt: today, rejected: true };
        discarded++;
      }
      dirty = true;
      writeCache(cache); // guarda al instante: un corte no pierde cuota
      await sleep(1000);
    }

    if (dirty) writeCache(cache);
    if (calls > 0) {
      console.log(
        `   · SerpApi: ${calls} búsquedas usadas (quedan ${left == null ? '?' : left - calls})` +
          `${discarded > 0 ? `, ${discarded} descartadas por implausibles/sin resultado` : ''}.`,
      );
    }

    const updates: NormalizedPriceUpdate[] = [];
    for (const target of targets) {
      const cached = cache.prices[`${target.country}:${target.productId}`];
      if (!cached || cached.rejected) continue;
      updates.push({
        productId: target.productId,
        countryCode: target.country,
        value: cached.value,
        date: cached.date,
        note: `Precio mediano de Google Shopping (${target.country}).`,
        source: 'Google Shopping (vía SerpApi)',
        origin: 'local',
        visible: true,
      });
    }
    return updates;
  },
};
