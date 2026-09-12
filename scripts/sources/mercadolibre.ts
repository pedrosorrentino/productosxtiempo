import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * MercadoLibre · precios de mercado reales en Latinoamérica.
 *
 * La API oficial exige un token OAuth. Se lee de `MELI_ACCESS_TOKEN`; si no
 * está definido, el proveedor se salta a sí mismo sin romper el sync.
 *
 * Estrategia: busca cada producto por término y toma la mediana de los
 * primeros resultados en la moneda del sitio (evita valores atípicos). Cubre
 * tecnología y movilidad en México, Colombia, Chile y Argentina.
 *
 * Para obtener un token: https://developers.mercadolibre.com/ (app + OAuth).
 */

const TOKEN = process.env.MELI_ACCESS_TOKEN ?? '';

const SITES: Record<string, string> = {
  MX: 'MLM',
  CO: 'MCO',
  CL: 'MLC',
  AR: 'MLA',
};

type MeliMapping = { productId: string; query: string };

const MAPPINGS: MeliMapping[] = [
  { productId: 'iphone', query: 'iphone nuevo' },
  { productId: 'portatil', query: 'notebook' },
  { productId: 'portatil-premium', query: 'macbook' },
  { productId: 'tablet', query: 'tablet' },
  { productId: 'televisor', query: 'smart tv 55 pulgadas' },
  { productId: 'auriculares', query: 'auriculares inalambricos' },
  { productId: 'movil-gama-media', query: 'celular gama media' },
  { productId: 'smartwatch', query: 'smartwatch' },
  { productId: 'consola', query: 'consola videojuegos' },
  { productId: 'moto-125', query: 'moto 125cc' },
  { productId: 'bici-urbana', query: 'bicicleta urbana' },
  { productId: 'patinete-electrico', query: 'monopatin electrico' },
];

type MeliSearchResponse = {
  results?: Array<{ price?: number; currency_id?: string }>;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

async function search(site: string, query: string): Promise<number | null> {
  const url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as MeliSearchResponse;
  const prices = (data.results ?? [])
    .map((r) => r.price)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  const value = median(prices);
  if (value == null) return null;
  // Redondeo razonable según magnitud de la moneda local.
  return value >= 1000 ? Math.round(value) : Math.round(value * 100) / 100;
}

export const mercadoLibreProvider: CatalogSourceProvider = {
  id: 'mercadolibre-market',
  name: 'MercadoLibre · Precios de mercado LatAm',
  description:
    'Precio mediano de mercado de tecnología y movilidad en MX, CO, CL y AR (API oficial de MercadoLibre; requiere MELI_ACCESS_TOKEN).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    if (!TOKEN) {
      console.log('   ℹ MercadoLibre: sin MELI_ACCESS_TOKEN, se omite.');
      return [];
    }

    const date = new Date().toISOString().slice(0, 7);
    const updates: NormalizedPriceUpdate[] = [];

    for (const [code, site] of Object.entries(SITES)) {
      for (const mapping of MAPPINGS) {
        try {
          const value = await search(site, mapping.query);
          if (value == null) continue;
          updates.push({
            productId: mapping.productId,
            countryCode: code,
            value,
            date,
            note: `Precio mediano de mercado (MercadoLibre ${site}).`,
            source: 'MercadoLibre (precio de mercado)',
            origin: 'local',
            visible: true,
          });
        } catch {
          // Sin conexión o rate limit: se conserva el último valor.
        }
      }
    }

    return updates;
  },
};
