import { existsSync, readFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

const QUEUE_PATH = 'scripts/data/incoming-products.json';

export const manualQueueProvider: CatalogSourceProvider = {
  id: 'manual-incoming-queue',
  name: 'Cola de Nuevos Productos / Webhook Queue',
  description:
    'Lee productos o precios pendientes en scripts/data/incoming-products.json para incorporarlos automáticamente al catálogo sin tocar código TypeScript.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    if (!existsSync(QUEUE_PATH)) {
      return [];
    }

    try {
      const raw = readFileSync(QUEUE_PATH, 'utf8').trim();
      if (!raw) return [];

      const items = JSON.parse(raw);
      if (!Array.isArray(items)) {
        console.warn('La cola incoming-products.json no es un array válido. Saltando.');
        return [];
      }

      const date = new Date().toISOString().slice(0, 7);
      const updates: NormalizedPriceUpdate[] = items.map((item) => ({
        productId: item.productId || item.id,
        productName: item.productName || item.name,
        shortName: item.shortName,
        category: item.category || 'dia-a-dia',
        countryCode: item.countryCode || 'ES',
        value: Number(item.value || item.price),
        date: item.date || date,
        note: item.note || 'Añadido mediante sincronización de catálogo.',
        source: item.source || 'Referencia de catálogo',
        origin: 'local',
        visible: item.visible !== false,
      }));

      return updates;
    } catch (err) {
      console.warn('Error leyendo scripts/data/incoming-products.json:', err);
      return [];
    }
  },
};
