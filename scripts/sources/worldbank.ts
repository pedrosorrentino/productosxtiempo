import { readFileSync, writeFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

const COUNTRIES_PATH = 'src/data/countries.json';
const MACRO_PATH = 'src/data/macro.json';

const ISO2_TO_ISO3: Record<string, string> = {
  ES: 'ESP',
  PT: 'PRT',
  FR: 'FRA',
  DE: 'DEU',
  IT: 'ITA',
  GB: 'GBR',
  US: 'USA',
  MX: 'MEX',
  AR: 'ARG',
  CO: 'COL',
  CL: 'CHL',
  CH: 'CHE',
};

const ISO3_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_ISO3).map(([k, v]) => [v, k])
);

export const worldBankMacroProvider: CatalogSourceProvider = {
  id: 'worldbank-macro',
  name: 'Banco Mundial · Indicadores Macro (PPA e Inflación)',
  description:
    'Sincroniza factores de Paridad de Poder Adquisitivo (PPA / PPP) e inflación oficial desde la Open Data API del Banco Mundial.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const iso3List = Object.values(ISO2_TO_ISO3).join(';');
      const pppUrl = `https://api.worldbank.org/v2/country/${iso3List}/indicator/PA.NUS.PPP?format=json&date=2023`;

      const res = await fetch(pppUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const items = data?.[1];

        if (Array.isArray(items) && items.length > 0) {
          const macroData = JSON.parse(readFileSync(MACRO_PATH, 'utf8'));
          const countriesData = JSON.parse(readFileSync(COUNTRIES_PATH, 'utf8'));

          for (const item of items) {
            const iso3 = item.countryiso3code;
            const iso2 = ISO3_TO_ISO2[iso3];
            const pppVal = typeof item.value === 'number' ? Math.round(item.value * 100) / 100 : null;

            if (iso2 && pppVal !== null && macroData[iso2]) {
              macroData[iso2].pppFactor = pppVal;
              const country = countriesData.find((c: { code: string }) => c.code === iso2);
              if (country) {
                country.pppFactor = pppVal;
              }
            }
          }

          writeFileSync(MACRO_PATH, JSON.stringify(macroData, null, 2) + '\n', 'utf8');
          writeFileSync(COUNTRIES_PATH, JSON.stringify(countriesData, null, 2) + '\n', 'utf8');
        }
      }
    } catch {
      // Si falla la red o hay timeout, se mantienen los valores locales existentes en macro.json
    } finally {
      clearTimeout(timeout);
    }

    // Este proveedor actualiza metadatos macroeconómicos, no requiere productos de inventario directo
    return [];
  },
};
