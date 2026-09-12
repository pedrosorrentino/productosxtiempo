import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * CoinGecko · Bitcoin y Ethereum en la divisa de cada país.
 *
 * Un activo global cotiza en USD/EUR y se expresa en la divisa local. La API
 * pública devuelve todas las divisas en una sola llamada, así que la ficha de
 * cada país muestra el precio real de mercado en su moneda.
 */

const VS = 'eur,usd,gbp,mxn,cop,clp,ars,chf';
const URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=${VS}`;

const COUNTRY_CURRENCY: Record<string, string> = {
  ES: 'eur', PT: 'eur', FR: 'eur', DE: 'eur', IT: 'eur',
  GB: 'gbp', US: 'usd', MX: 'mxn', CO: 'cop', CL: 'clp', AR: 'ars', CH: 'chf',
};

const CURRENCY_SYMBOL: Record<string, string> = {
  eur: '€', usd: '$', gbp: '£', mxn: '$', cop: '$', clp: '$', ars: '$', chf: 'Fr.',
};

export const coinGeckoProvider: CatalogSourceProvider = {
  id: 'coingecko-crypto',
  name: 'CoinGecko · Bitcoin y Ethereum por país',
  description:
    'Cotización de mercado de 1 BTC y 1 ETH en la divisa local de cada país (API pública de CoinGecko).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    let data: any;
    try {
      const res = await fetch(URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      data = await res.json();
    } catch {
      // Sin conexión o rate limit: se conserva el último valor sincronizado.
      return [];
    }

    const updates: NormalizedPriceUpdate[] = [];
    for (const [code, currency] of Object.entries(COUNTRY_CURRENCY)) {
      const btc = data?.bitcoin?.[currency];
      const eth = data?.ethereum?.[currency];
      if (typeof btc !== 'number' || !(btc > 0)) continue;
      if (typeof eth !== 'number' || !(eth > 0)) continue;
      const symbol = CURRENCY_SYMBOL[currency] ?? currency.toUpperCase();

      updates.push({
        productId: 'bitcoin',
        productName: '1 Bitcoin (BTC)',
        shortName: '1 Bitcoin',
        category: 'vida',
        countryCode: code,
        value: Math.round(btc),
        date,
        note: `Cotización de mercado de 1 Bitcoin (${Math.round(btc).toLocaleString('es-ES')} ${symbol}).`,
        source: 'CoinGecko API (mercado)',
        origin: 'local',
        visible: true,
      });
      updates.push({
        productId: 'ethereum',
        productName: '1 Ethereum (ETH)',
        shortName: '1 Ethereum',
        category: 'vida',
        countryCode: code,
        value: Math.round(eth),
        date,
        note: `Cotización de mercado de 1 Ethereum (${Math.round(eth).toLocaleString('es-ES')} ${symbol}).`,
        source: 'CoinGecko API (mercado)',
        origin: 'local',
        visible: true,
      });
    }
    return updates;
  },
};
