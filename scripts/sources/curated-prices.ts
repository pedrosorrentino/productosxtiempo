import { existsSync, readFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Curado manual · precios reales con fuente.
 *
 * Canal para los productos que ninguna API pública cubre (suscripciones,
 * seguros, servicios profesionales, vehículos concretos…). Cada entrada vive
 * en `scripts/data/curated-prices.json` con `source`, `date` y, si aplica,
 * `url`: es la única fuente de verdad manual y se versiona en git.
 */

const PATH = 'scripts/data/curated-prices.json';

type CuratedEntry = {
  productId: string;
  countryCode: string;
  value: number;
  date?: string;
  source: string;
  url?: string;
  note?: string;
};

export const curatedPricesProvider: CatalogSourceProvider = {
  id: 'curated-manual',
  name: 'Curado manual · precios reales con fuente',
  description:
    'Precios reales verificados a mano (suscripciones, servicios y bienes sin API) desde scripts/data/curated-prices.json.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    if (!existsSync(PATH)) return [];
    const parsed = JSON.parse(readFileSync(PATH, 'utf8')) as { prices?: CuratedEntry[] };
    const today = new Date().toISOString().slice(0, 7);

    return (parsed.prices ?? [])
      .filter((e) => e.productId && e.countryCode && e.value > 0 && e.source)
      .map((e) => ({
        productId: e.productId,
        countryCode: e.countryCode,
        value: e.value,
        date: e.date ?? today,
        note: [e.note, e.url ? `Fuente: ${e.url}` : null].filter(Boolean).join(' ') ||
          'Precio verificado manualmente.',
        source: e.source,
        origin: 'local' as const,
        visible: true,
      }));
  },
};
