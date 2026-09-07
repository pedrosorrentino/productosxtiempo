import type { CatalogSourceProvider } from './types.ts';
import { theEconomistBigMacProvider } from './the-economist.ts';
import { mercadonaStaplesProvider } from './mercadona.ts';
import { mitecoFuelProvider } from './miteco.ts';
import { eurostatProvider } from './eurostat.ts';
import { worldBankMacroProvider } from './worldbank.ts';
import { coinGeckoProvider } from './coingecko.ts';
import { supermarketStaplesProvider } from './supermarket.ts';
import { cheapsharkGamingProvider } from './cheapshark.ts';
import { curatedServicesProvider } from './curated-services.ts';
import { automotiveProvider } from './automotive.ts';
import { manualQueueProvider } from './manual-queue.ts';

/**
 * Registro de proveedores de datos externos.
 * Para añadir una nueva fuente, simplemente crea un archivo en `scripts/sources/`
 * que implemente `CatalogSourceProvider` y añádelo a este array.
 */
export const CATALOG_PROVIDERS: CatalogSourceProvider[] = [
  theEconomistBigMacProvider,
  mercadonaStaplesProvider,
  mitecoFuelProvider,
  eurostatProvider,
  worldBankMacroProvider,
  coinGeckoProvider,
  supermarketStaplesProvider,
  cheapsharkGamingProvider,
  curatedServicesProvider,
  automotiveProvider,
  manualQueueProvider,
];


