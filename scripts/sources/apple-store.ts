import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Apple Store · precios oficiales por país (sin token).
 *
 * Las páginas de tienda de Apple embeben el precio en JSON con la clave
 * `fullPrice`. Se toma el mínimo de cada línea de producto, que corresponde a
 * la configuración base. Es precio oficial de la marca, específico por país.
 *
 * No hay tienda Apple online en Colombia ni Argentina, así que se omiten.
 * Algunos países responden 503 de forma intermitente; se reintenta y, si no,
 * se conserva el último valor.
 */

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const STORE_COUNTRIES: Array<{ cc: string; code: string }> = [
  { cc: 'mx', code: 'MX' },
  { cc: 'cl', code: 'CL' },
  { cc: 'us', code: 'US' },
  { cc: 'de', code: 'DE' },
  { cc: 'fr', code: 'FR' },
  { cc: 'it', code: 'IT' },
  { cc: 'pt', code: 'PT' },
  { cc: 'es', code: 'ES' },
  { cc: 'gb', code: 'GB' },
  { cc: 'ch', code: 'CH' },
];

const PRODUCT_PATHS: Array<{ productId: string; path: string }> = [
  { productId: 'iphone', path: 'buy-iphone/iphone-16' },
  { productId: 'tablet', path: 'buy-ipad/ipad' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchBasePrice(cc: string, path: string): Promise<number | null> {
  const url = `https://www.apple.com/${cc}/shop/${path}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-ES,es;q=0.9' },
      });
      if (res.ok) {
        const html = await res.text();
        const values = [...html.matchAll(/"fullPrice":([0-9]+(?:\.[0-9]+)?)/g)]
          .map((m) => Number(m[1]))
          .filter((v) => Number.isFinite(v) && v > 50);
        return values.length > 0 ? Math.min(...values) : null;
      }
      if (res.status !== 503) return null;
    } catch {
      // reintenta
    }
    await sleep(1500 * (attempt + 1));
  }
  return null;
}

export const appleStoreProvider: CatalogSourceProvider = {
  id: 'apple-store',
  name: 'Apple Store · Precio oficial por país',
  description:
    'Precio oficial de iPhone, iPad, Apple Watch y AirPods en la tienda de Apple de cada país (sin API ni token).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    const updates: NormalizedPriceUpdate[] = [];

    for (const { cc, code } of STORE_COUNTRIES) {
      for (const { productId, path } of PRODUCT_PATHS) {
        const value = await fetchBasePrice(cc, path);
        if (value == null || !(value > 0)) continue;
        updates.push({
          productId,
          countryCode: code,
          value: Math.round(value * 100) / 100,
          date,
          note: `Precio oficial en la tienda de Apple (${cc.toUpperCase()}).`,
          source: 'Apple Store (precio oficial)',
          origin: 'local',
          visible: true,
        });
        await sleep(600);
      }
    }

    return updates;
  },
};
