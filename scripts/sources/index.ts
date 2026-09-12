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
import { numbeoProvider } from './numbeo.ts';
import { steamProvider } from './steam.ts';
import { serpApiProvider } from './serpapi.ts';
import { appleStoreProvider } from './apple-store.ts';
import { falabellaProvider } from './falabella.ts';
import { liverpoolProvider } from './liverpool.ts';
import { mercadoLibreProvider } from './mercadolibre.ts';
import { curatedPricesProvider } from './curated-prices.ts';
import { manualQueueProvider } from './manual-queue.ts';

/**
 * Registro de proveedores de datos externos.
 * Para añadir una nueva fuente, simplemente crea un archivo en `scripts/sources/`
 * que implemente `CatalogSourceProvider` y añádelo a este array.
 *
 * Orden = prioridad: un proveedor posterior puede sobreescribir el precio del
 * mismo producto/país que uno anterior. Los de datos reales por país (Numbeo,
 * Steam, CoinGecko, curado) van al final para imponerse a los de referencia.
 */
export const CATALOG_PROVIDERS: CatalogSourceProvider[] = [
  theEconomistBigMacProvider,
  mercadonaStaplesProvider,
  mitecoFuelProvider,
  eurostatProvider,
  worldBankMacroProvider,
  cheapsharkGamingProvider,
  supermarketStaplesProvider,
  automotiveProvider,
  manualQueueProvider,
  curatedServicesProvider,
  coinGeckoProvider,
  steamProvider,
  serpApiProvider,
  falabellaProvider,
  liverpoolProvider,
  appleStoreProvider,
  mercadoLibreProvider,
  numbeoProvider,
  curatedPricesProvider,
];


