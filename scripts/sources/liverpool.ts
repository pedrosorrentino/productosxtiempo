import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Liverpool México · precios de tienda reales (sin token).
 *
 * Liverpool renderiza los precios con JavaScript, así que el HTML inicial no
 * los trae. Se usa el lector `r.jina.ai`, que renderiza la página y devuelve el
 * markdown con los precios en MXN; se toma la mediana de los precios de la
 * página de resultados. Solo México.
 */

const JINA_PREFIX = 'https://r.jina.ai/';

const SEARCH = (query: string) =>
  `https://www.liverpool.com.mx/tienda?s=${encodeURIComponent(query)}`;

const QUERIES: Array<{ productId: string; query: string }> = [
  { productId: 'portatil', query: 'laptop' },
  { productId: 'portatil-premium', query: 'macbook' },
  { productId: 'televisor', query: 'smart tv' },
  { productId: 'auriculares', query: 'audifonos' },
  { productId: 'movil-gama-media', query: 'celular' },
  { productId: 'consola', query: 'consola' },
  { productId: 'smartwatch', query: 'smartwatch' },
];

const PRICE_RE = /\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/g;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function fetchPrices(query: string): Promise<number | null> {
  const res = await fetch(`${JINA_PREFIX}${SEARCH(query)}`, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(70000),
  });
  if (!res.ok) return null;
  const text = await res.text();

  const prices: number[] = [];
  for (const match of text.matchAll(PRICE_RE)) {
    const value = Number(match[1].replace(/,/g, ''));
    // Descarta accesorios baratos para que la mediana refleje los equipos.
    if (Number.isFinite(value) && value > 500) prices.push(value);
  }
  return median(prices);
}

export const liverpoolProvider: CatalogSourceProvider = {
  id: 'liverpool-mx',
  name: 'Liverpool México · Precios de tienda',
  description:
    'Precio mediano de tienda en México (MXN) de tecnología y electrónica, vía lector con render de JavaScript.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    const updates: NormalizedPriceUpdate[] = [];

    for (const { productId, query } of QUERIES) {
      try {
        const value = await fetchPrices(query);
        if (value != null && value > 0) {
          updates.push({
            productId,
            countryCode: 'MX',
            value: Math.round(value),
            date,
            note: `Precio mediano de tienda en Liverpool México (MXN).`,
            source: 'Liverpool México (precio de tienda)',
            origin: 'local',
            visible: true,
          });
        }
      } catch {
        // Timeout o límite del lector: se conserva el último valor.
      }
      await sleep(1200);
    }

    return updates;
  },
};
