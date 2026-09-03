import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

const CHEAPSHARK_URL =
  'https://www.cheapshark.com/api/1.0/deals?storeID=1&lowerPrice=65&pageSize=5';

export const cheapsharkGamingProvider: CatalogSourceProvider = {
  id: 'cheapshark-gaming',
  name: 'CheapShark · Videojuegos AAA de Estreno',
  description:
    'Rastrea el precio estándar oficial de lanzamiento de videojuegos triple A (Steam / PC) a través de la API abierta de CheapShark.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(CHEAPSHARK_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CosteEnTiempo/1.0 (https://costeentiempo.example)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`CheapShark respondió con HTTP ${res.status}`);
      }

      const deals = await res.json();
      if (!Array.isArray(deals) || deals.length === 0) {
        throw new Error('No se recibieron ofertas válidas de CheapShark');
      }

      // El precio estándar de un juego AAA de lanzamiento en España suele rondar 79.99 €
      const standardPrice = parseFloat(deals[0].normalPrice) || 79.99;
      const date = new Date().toISOString().slice(0, 7);

      return [
        {
          productId: 'videojuego-aaa',
          productName: 'Videojuego de estreno (AAA)',
          shortName: 'Juego AAA',
          category: 'tecnologia',
          countryCode: 'ES',
          value: standardPrice,
          date,
          note: `Precio oficial de edición estándar para títulos de lanzamiento (${deals[0].title || 'Estreno AAA'}).`,
          source: 'CheapShark / Steam Store',
          origin: 'local',
          visible: true,
        },
      ];
    } finally {
      clearTimeout(timeout);
    }
  },
};
