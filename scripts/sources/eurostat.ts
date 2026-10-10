import { readFileSync, writeFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Eurostat · suministros del hogar y salario mínimo legal.
 *
 * Dos datasets oficiales, por país, sin estimaciones:
 *  - `nrg_pc_204`: precio de la electricidad para consumidores domésticos, €/kWh con
 *    impuestos, banda de consumo 2.500-4.999 kWh/año (el hogar tipo europeo).
 *  - `nrg_pc_202`: precio del gas natural para consumidores domésticos, €/kWh con
 *    impuestos, banda 20-199 GJ/año.
 *
 * La factura mensual se calcula con un consumo declarado y constante para todos los
 * países (250 kWh/mes de luz, 625 kWh/mes de gas ≈ 7.500 kWh/año), de modo que lo
 * único que cambia entre países es el precio oficial, no el supuesto de consumo.
 *
 * Antes esto era una constante escrita a mano (0,245 €/kWh) y una factura de gas de
 * 55 € fija solo para España: la ficha comparaba un dato inventado con un dato real.
 */

const COUNTRIES_PATH = 'src/data/countries.json';
const MACRO_PATH = 'src/data/macro.json';

const KWH_MES_LUZ = 250;
const KWH_MES_GAS = 625;

/** Países de la web que Eurostat cubre (miembros de la UE). */
const EU_COUNTRIES = ['ES', 'PT', 'FR', 'DE', 'IT'];

const BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

const EUROS = (v: number, dec = 2): number => Math.round(v * 10 ** dec) / 10 ** dec;

type Serie = Record<string, number>;

/**
 * Baja un dataset de Eurostat y devuelve { país: valor } de la última mitad de año
 * disponible. Devuelve {} si la respuesta no tiene la forma esperada.
 */
async function serie(dataset: string, band: string, dimBand: string): Promise<Serie> {
  const params = new URLSearchParams({ format: 'JSON', lang: 'EN', currency: 'EUR', unit: 'KWH', tax: 'I_TAX' });
  params.set(dimBand, band);
  for (const geo of EU_COUNTRIES) params.append('geo', geo);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${BASE}/${dataset}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return {};
    const d = (await res.json()) as any;
    const geoIndex: Record<string, number> = d?.dimension?.geo?.category?.index ?? {};
    const timeIndex: Record<string, number> = d?.dimension?.time?.category?.index ?? {};
    const tiempos = Object.keys(timeIndex).sort((a, b) => timeIndex[a] - timeIndex[b]);
    const geoSize = Object.keys(geoIndex).length;
    const timeSize = tiempos.length;

    const out: Serie = {};
    for (const [code, gi] of Object.entries(geoIndex)) {
      // El último periodo con dato para ese país (puede no ser el más reciente global).
      for (let ti = timeSize - 1; ti >= 0; ti--) {
        const flat = ti * geoSize + gi;
        const v = d?.value?.[String(flat)];
        if (typeof v === 'number' && v > 0) {
          out[code] = v;
          break;
        }
      }
    }
    return out;
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

async function salarioMinimoES(): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      `${BASE}/earn_mw_cur?currency=EUR&geo=ES`,
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as any;
    const timeIndex: Record<string, number> = d?.dimension?.time?.category?.index ?? {};
    const tiempos = Object.keys(timeIndex).sort((a, b) => timeIndex[a] - timeIndex[b]);
    const last = tiempos[tiempos.length - 1];
    const v = d?.value?.[String(timeIndex[last])];
    return typeof v === 'number' && v > 800 ? v : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const eurostatProvider: CatalogSourceProvider = {
  id: 'eurostat-official',
  name: 'Eurostat · Suministros del hogar y SMI',
  description:
    'Precios oficiales de electricidad (nrg_pc_204) y gas natural (nrg_pc_202) para consumidores domésticos, por país, y salario mínimo legal (earn_mw_cur).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    const updates: NormalizedPriceUpdate[] = [];

    // 1. Salario mínimo legal de España (se guarda en countries.json y macro.json).
    const smi = await salarioMinimoES();
    if (smi !== null) {
      try {
        const countriesData = JSON.parse(readFileSync(COUNTRIES_PATH, 'utf8'));
        const macroData = JSON.parse(readFileSync(MACRO_PATH, 'utf8'));
        const es = countriesData.find((c: { code: string }) => c.code === 'ES');
        if (es) es.minWageMonthly = smi;
        if (macroData['ES']) macroData['ES'].minWageMonthly = smi;
        writeFileSync(COUNTRIES_PATH, JSON.stringify(countriesData, null, 2) + '\n', 'utf8');
        writeFileSync(MACRO_PATH, JSON.stringify(macroData, null, 2) + '\n', 'utf8');
      } catch {
        // Si los ficheros no están donde se espera, se sigue con los suministros.
      }
    }

    // 2. Electricidad doméstica por país.
    const luz = await serie('nrg_pc_204', 'KWH2500-4999', 'nrg_cons');
    for (const [code, kwh] of Object.entries(luz)) {
      updates.push({
        productId: 'factura-luz-mes',
        productName: 'Factura de la luz doméstica (mes)',
        shortName: 'Factura de la luz (mes)',
        category: 'vivienda',
        countryCode: code,
        value: EUROS(kwh * KWH_MES_LUZ),
        date,
        note: `Hogar de ${KWH_MES_LUZ} kWh/mes al precio doméstico oficial de ${EUROS(kwh, 4)} €/kWh, impuestos incluidos.`,
        source: 'Eurostat nrg_pc_204 (electricidad doméstica, con impuestos)',
        origin: 'local',
        visible: true,
      });
    }

    // 3. Gas natural doméstico por país.
    const gas = await serie('nrg_pc_202', 'GJ20-199', 'nrg_cons');
    for (const [code, kwh] of Object.entries(gas)) {
      updates.push({
        productId: 'factura-gas-mes',
        productName: 'Factura del gas doméstico (mes)',
        shortName: 'Factura del gas (mes)',
        category: 'vivienda',
        countryCode: code,
        value: EUROS(kwh * KWH_MES_GAS),
        date,
        note: `Hogar de ${KWH_MES_GAS} kWh/mes de gas (cocina, agua caliente y calefacción) al precio doméstico oficial de ${EUROS(kwh, 4)} €/kWh, impuestos incluidos.`,
        source: 'Eurostat nrg_pc_202 (gas natural doméstico, con impuestos)',
        origin: 'local',
        visible: true,
      });
    }

    return updates;
  },
};
