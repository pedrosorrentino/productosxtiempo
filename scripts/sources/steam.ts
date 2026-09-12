import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Steam · precio regional real de un lanzamiento AAA.
 *
 * La API pública de Steam (`appdetails`) devuelve el precio de la tienda en la
 * moneda local de cada país según el parámetro `cc`. Gratis y sin credenciales.
 * `final` viene en unidades menores: se divide entre 100.
 */

const APP_ID = 1091500; // Cyberpunk 2077 (lanzamiento AAA)
const ENDPOINT = `https://store.steampowered.com/api/appdetails?appids=${APP_ID}&filters=price_overview`;

const STEAM_REGIONS: Record<string, string> = {
  es: 'ES', pt: 'PT', fr: 'FR', de: 'DE', it: 'IT',
  gb: 'GB', us: 'US', mx: 'MX', ar: 'AR', co: 'CO', cl: 'CL', ch: 'CH',
};

export const steamProvider: CatalogSourceProvider = {
  id: 'steam-regional',
  name: 'Steam · Precio regional de videojuego AAA',
  description:
    'Precio oficial de un lanzamiento AAA en la tienda de Steam por país (API pública de Steam).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    const updates: NormalizedPriceUpdate[] = [];

    await Promise.all(
      Object.entries(STEAM_REGIONS).map(async ([cc, code]) => {
        try {
          const res = await fetch(`${ENDPOINT}&cc=${cc}`, {
            headers: { 'User-Agent': 'PrecioEnTiempo/1.0', Accept: 'application/json' },
          });
          if (!res.ok) return;
          const data = (await res.json()) as Record<string, any>;
          const price = data?.[APP_ID]?.data?.price_overview;
          if (!price || typeof price.final !== 'number') return;

          updates.push({
            productId: 'videojuego-aaa',
            productName: 'Videojuego de estreno (AAA)',
            shortName: 'Videojuego AAA',
            category: 'tecnologia',
            countryCode: code,
            value: Math.round(price.final) / 100,
            date,
            note: `Precio oficial en Steam (${price.final_formatted}).`,
            source: 'Steam (tienda oficial)',
            origin: 'local',
            visible: true,
          });
        } catch {
          // Sin conexión o región sin precio: se conserva el último valor.
        }
      }),
    );

    return updates;
  },
};
