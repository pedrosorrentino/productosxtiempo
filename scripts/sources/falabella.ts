import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Falabella Chile · precios de tienda reales (sin token).
 *
 * La página de búsqueda embebe un JSON en `<script id="__NEXT_DATA__">` con los
 * resultados; se toma el precio vigente (`prices[0].price[0]`) de cada resultado
 * y la mediana. Solo Chile: la web de Colombia responde 403 (protección Akamai)
 * incluso con cookies.
 */

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const SEARCH = (query: string) =>
  `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(query)}`;

const QUERIES: Array<{ productId: string; query: string }> = [
  { productId: 'portatil', query: 'notebook' },
  { productId: 'portatil-premium', query: 'macbook' },
  { productId: 'televisor', query: 'smart tv' },
  { productId: 'auriculares', query: 'auriculares' },
  { productId: 'movil-gama-media', query: 'celular' },
  { productId: 'consola', query: 'consola' },
  { productId: 'smartwatch', query: 'smartwatch' },
];

const NEXT_DATA_RE = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function fetchPrices(query: string): Promise<number | null> {
  const res = await fetch(SEARCH(query), {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-CL,es;q=0.9' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(NEXT_DATA_RE);
  if (!match) return null;

  let results: any[] = [];
  try {
    results = JSON.parse(match[1])?.props?.pageProps?.results ?? [];
  } catch {
    return null;
  }

  const prices = results
    .map((r) => {
      const raw = r?.prices?.[0]?.price;
      const first = Array.isArray(raw) ? raw[0] : raw;
      return Number(String(first).replace(/[^\d]/g, ''));
    })
    .filter((v) => Number.isFinite(v) && v > 1000);

  return median(prices);
}

export const falabellaProvider: CatalogSourceProvider = {
  id: 'falabella-cl',
  name: 'Falabella Chile · Precios de tienda',
  description:
    'Precio mediano de tienda en Chile (CLP) de tecnología y electrónica, leído del JSON embebido de Falabella.',
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
            countryCode: 'CL',
            value: Math.round(value),
            date,
            note: `Precio mediano de tienda en Falabella Chile (CLP).`,
            source: 'Falabella Chile (precio de tienda)',
            origin: 'local',
            visible: true,
          });
        }
      } catch {
        // Sin conexión: se conserva el último valor.
      }
      await sleep(800);
    }

    return updates;
  },
};
