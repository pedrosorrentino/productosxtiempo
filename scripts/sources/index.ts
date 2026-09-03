import type { CatalogSourceProvider } from './types.ts';
import { mitecoFuelProvider } from './miteco.ts';
import { cheapsharkGamingProvider } from './cheapshark.ts';
import { supermarketStaplesProvider } from './supermarket.ts';
import { manualQueueProvider } from './manual-queue.ts';

/**
 * Registro de proveedores de datos externos.
 * Para añadir una nueva fuente, simplemente crea un archivo en `scripts/sources/`
 * que implemente `CatalogSourceProvider` y añádelo a este array.
 */
export const CATALOG_PROVIDERS: CatalogSourceProvider[] = [
  mitecoFuelProvider,
  cheapsharkGamingProvider,
  supermarketStaplesProvider,
  manualQueueProvider,
];
