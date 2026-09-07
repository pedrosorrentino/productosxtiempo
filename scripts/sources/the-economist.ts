import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

const BIG_MAC_URL =
  'https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/source-data/big-mac-source-data-v2.csv';

const COUNTRY_MAP: Record<string, string> = {
  ESP: 'ES',
  EUZ: 'ES',
  PRT: 'PT',
  FRA: 'FR',
  DEU: 'DE',
  ITA: 'IT',
  GBR: 'GB',
  USA: 'US',
  MEX: 'MX',
  ARG: 'AR',
  COL: 'CO',
  CHL: 'CL',
  CHE: 'CH',
};

export const theEconomistBigMacProvider: CatalogSourceProvider = {
  id: 'the-economist-big-mac',
  name: 'The Economist · Big Mac Index Oficial',
  description:
    'Sincroniza el precio real del Big Mac en moneda local para los países cubiertos a partir del repositorio oficial de The Economist en GitHub.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const updates: NormalizedPriceUpdate[] = [];

    try {
      const res = await fetch(BIG_MAC_URL, {
        signal: controller.signal,
        headers: { Accept: 'text/plain' },
      });

      if (!res.ok) {
        throw new Error(`GitHub respondió con HTTP ${res.status}`);
      }

      const csv = await res.text();
      const lines = csv.trim().split('\n');

      const latestByIso: Record<string, { price: number; date: string }> = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const iso = cols[1]?.trim();
        const price = parseFloat(cols[3]);
        const date = cols[7]?.trim();

        if (iso && !isNaN(price) && date) {
          if (!latestByIso[iso] || latestByIso[iso].date < date) {
            latestByIso[iso] = { price, date };
          }
        }
      }

      // 1. Precio base de España (o Eurozona)
      const euzPrice = latestByIso['EUZ']?.price ?? latestByIso['ESP']?.price ?? 6.19;
      const latestDate = (latestByIso['EUZ']?.date ?? new Date().toISOString()).slice(0, 7);

      updates.push({
        productId: 'menu-big-mac',
        productName: 'Menú Big Mac / Comida rápida',
        shortName: 'Menú Big Mac',
        category: 'dia-a-dia',
        countryCode: 'ES',
        value: Math.round(euzPrice * 100) / 100,
        date: latestDate,
        note: `Precio oficial de referencia del Big Mac (${euzPrice.toFixed(2)} €). Datos del índice oficial de The Economist.`,
        source: 'The Economist (Big Mac Index)',
        origin: 'local',
        visible: true,
      });

      // 2. Precios locales directos para otros países disponibles
      for (const [iso3, iso2] of Object.entries(COUNTRY_MAP)) {
        if (iso2 === 'ES') continue; // Ya añadido arriba como base
        const entry = latestByIso[iso3];
        if (entry && entry.price > 0) {
          updates.push({
            productId: 'menu-big-mac',
            countryCode: iso2,
            value: Math.round(entry.price * 100) / 100,
            date: entry.date.slice(0, 7),
            note: `Precio oficial en moneda local según The Economist Big Mac Index.`,
            source: 'The Economist (Big Mac Index)',
            origin: 'local',
          });
        }
      }
    } catch {
      // Si falla la red, el orquestador preservará los valores existentes
    } finally {
      clearTimeout(timeout);
    }

    return updates;
  },
};
