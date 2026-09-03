import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

const MITECO_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

// Capacidad estándar de un depósito de turismo medio (45 litros)
const LITROS_DEPOSITO = 45;

export const mitecoFuelProvider: CatalogSourceProvider = {
  id: 'miteco-combustibles',
  name: 'MITECO · Carburantes Oficiales',
  description:
    'Calcula el precio medio de la Gasolina 95 E5 en las estaciones de servicio de España a partir de los datos abiertos del Ministerio.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(MITECO_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`MITECO respondió con HTTP ${res.status}`);
      }

      const data = await res.json();
      const list = data?.ListaEESSPrecio;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Formato de datos no reconocido en la respuesta de MITECO');
      }

      const prices = list
        .map((item: Record<string, string>) =>
          parseFloat((item['Precio Gasolina 95 E5'] || '').replace(',', '.'))
        )
        .filter((val: number) => !isNaN(val) && val > 0.6 && val < 3.5);

      if (prices.length === 0) {
        throw new Error('No se encontraron precios válidos de Gasolina 95');
      }

      const avgLiterPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const roundedAvg = Math.round(avgLiterPrice * 1000) / 1000;
      const tankPrice = Math.round(roundedAvg * LITROS_DEPOSITO * 100) / 100;
      const date = new Date().toISOString().slice(0, 7);

      return [
        {
          productId: 'deposito-gasolina',
          countryCode: 'ES',
          value: tankPrice,
          date,
          note: `Depósito medio de ${LITROS_DEPOSITO} L de Gasolina 95 E5 (${roundedAvg.toFixed(2)} €/L). Datos oficiales de ${prices.length.toLocaleString('es-ES')} estaciones.`,
          source: 'MITECO (Gobierno de España)',
          origin: 'local',
        },
      ];
    } finally {
      clearTimeout(timeout);
    }
  },
};
