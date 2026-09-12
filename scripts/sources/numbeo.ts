import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

/**
 * Numbeo · coste de la vida por país.
 *
 * Numbeo publica, por país, precios medios reales en moneda local de una cesta
 * amplia (comida, transporte, suministros, ocio, vivienda). Es dato
 * colaborativo, no estadística oficial: se etiqueta como tal en `source` para
 * que la ficha no lo presente como fuente oficial.
 *
 * Cada fila de Numbeo se mapea a uno o varios productos del catálogo con un
 * factor de conversión documentado (p. ej. leche 1 L → 12 L/mes).
 *
 * Resiliencia:
 * - Caché diaria en scripts/data/numbeo-cache.json: si ya se descargó hoy, se
 *   reutiliza y no se vuelve a pedir.
 * - Ante un HTTP 429 se detiene el barrido (seguir insistiendo prolonga el
 *   bloqueo) y se usa la última copia cacheada disponible.
 *
 * Argentina queda fuera: Numbeo la publica en USD y el sitio cotiza en ARS,
 * así que conserva el fallback de conversión hasta tener fuente local.
 */

const NUMBEO_BASE = 'https://www.numbeo.com/cost-of-living/country_result.jsp?country=';
const CACHE_PATH = 'scripts/data/numbeo-cache.json';

const USER_AGENT =
  'PrecioEnTiempoBot/1.0 (+https://precioentiempo.com; contacto@precioentiempo.com)';

const COUNTRIES: Array<{ code: string; numbeo: string }> = [
  { code: 'ES', numbeo: 'Spain' },
  { code: 'PT', numbeo: 'Portugal' },
  { code: 'FR', numbeo: 'France' },
  { code: 'DE', numbeo: 'Germany' },
  { code: 'IT', numbeo: 'Italy' },
  { code: 'GB', numbeo: 'United Kingdom' },
  { code: 'US', numbeo: 'United States' },
  { code: 'MX', numbeo: 'Mexico' },
  { code: 'CO', numbeo: 'Colombia' },
  { code: 'CL', numbeo: 'Chile' },
  { code: 'CH', numbeo: 'Switzerland' },
];

const DECIMAL_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF']);

const COUNTRY_CURRENCY: Record<string, string> = {
  ES: 'EUR', PT: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR',
  GB: 'GBP', US: 'USD', MX: 'MXN', CO: 'COP', CL: 'CLP', CH: 'CHF',
};

type ParsedItem = { label: string; value: number };
type Cache = { date: string; countries: Record<string, ParsedItem[]> };

type Mapping = {
  match: string;
  productId: string;
  factor: number;
  note?: string;
};

const MAPPINGS: Mapping[] = [
  { match: 'Meal at an Inexpensive Restaurant', productId: 'menu-del-dia', factor: 1 },
  { match: 'Combo Meal at McDonald', productId: 'menu-big-mac', factor: 1 },
  { match: 'Cappuccino', productId: 'cafe', factor: 1 },
  { match: 'Domestic Draft Beer (0.5 Liter)', productId: 'cana', factor: 1 },
  { match: 'Domestic Beer (0.5 Liter Bottle)', productId: 'cerveza-pack', factor: 4, note: 'pack de 6×33 cl estimado desde botella de 0,5 L' },
  { match: 'Milk (Regular, 1 Liter)', productId: 'leche-mes', factor: 12, note: 'consumo de 12 L al mes' },
  { match: 'Fresh White Bread (500 g Loaf)', productId: 'barra-de-pan', factor: 0.5, note: 'barra ~250 g estimada desde hogaza de 500 g' },
  { match: 'White Rice (1 kg)', productId: 'arroz-kilo', factor: 1 },
  { match: 'Eggs (12, Large Size)', productId: 'huevos-docena', factor: 1 },
  { match: 'Chicken Fillets (1 kg)', productId: 'pechuga-pollo-kilo', factor: 1 },
  { match: 'Gasoline (1 Liter)', productId: 'deposito-gasolina', factor: 50, note: 'depósito de 50 L' },
  { match: 'Volkswagen Golf 1.5', productId: 'volkswagen-golf', factor: 1 },
  { match: 'Volkswagen Golf 1.5', productId: 'coche-compacto', factor: 1 },
  { match: 'Toyota Corolla Sedan 1.6', productId: 'toyota-corolla', factor: 1 },
  { match: 'Basic Utilities for 85 m2 Apartment', productId: 'luz-gas-mes', factor: 1 },
  { match: 'Mobile Phone Plan', productId: 'linea-movil', factor: 1 },
  { match: 'Broadband Internet', productId: 'fibra-mes', factor: 1 },
  { match: 'Monthly Fitness Club Membership', productId: 'gimnasio-anual', factor: 12, note: '12 mensualidades' },
  { match: 'Cinema Ticket', productId: 'entrada-cine', factor: 1 },
  { match: 'Private Full-Day Preschool', productId: 'guarderia-mes', factor: 1 },
  { match: 'Nike Running Shoes', productId: 'zapatillas-deportivas', factor: 1 },
  { match: '1 Bedroom Apartment in City Centre', productId: 'alquiler-piso', factor: 1 },
  { match: 'Monthly Public Transport Pass', productId: 'abono-transporte', factor: 1 },
  { match: 'Price per Square Meter to Buy Apartment in City Centre', productId: 'casa-media', factor: 100, note: 'vivienda tipo de 100 m²' },
];

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseItems(html: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const block = row[1];
    const labelMatch = block.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    const valueMatch = block.match(/<span class="first_currency">([\s\S]*?)<\/span>/);
    if (!labelMatch || !valueMatch) continue;
    const label = decodeEntities(labelMatch[1].replace(/<[^>]+>/g, '')).trim();
    const raw = decodeEntities(valueMatch[1].replace(/<[^>]+>/g, '')).trim();
    const value = Number.parseFloat(raw.replace(/[^\d.,]/g, '').replace(/,/g, ''));
    if (label && Number.isFinite(value) && value > 0) out.push({ label, value });
  }
  return out;
}

function readCache(): Cache {
  if (!existsSync(CACHE_PATH)) return { date: '', countries: {} };
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as Cache;
  } catch {
    return { date: '', countries: {} };
  }
}

function writeCache(cache: Cache): void {
  mkdirSync('scripts/data', { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

async function fetchCountry(numbeoName: string): Promise<ParsedItem[]> {
  const res = await fetch(`${NUMBEO_BASE}${encodeURIComponent(numbeoName)}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  });
  if (res.status === 429) throw Object.assign(new Error('rate-limited'), { rateLimited: true });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseItems(await res.text());
}

function roundFor(currency: string, value: number): number {
  return DECIMAL_CURRENCIES.has(currency)
    ? Math.round(value * 100) / 100
    : Math.round(value);
}

export const numbeoProvider: CatalogSourceProvider = {
  id: 'numbeo-cost-of-living',
  name: 'Numbeo · Coste de la vida por país',
  description:
    'Extrae precios medios reales en moneda local (cesta, transporte, suministros, ocio y vivienda) de Numbeo y los mapea al catálogo.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);
    const cache = readCache();
    let cacheDirty = false;
    let blocked = false;

    for (const country of COUNTRIES) {
      const cachedToday = cache.date === today && cache.countries[country.code];
      if (!cachedToday) {
        if (blocked) continue;
        try {
          cache.countries[country.code] = await fetchCountry(country.numbeo);
          cacheDirty = true;
        } catch (err) {
          if ((err as any).rateLimited) {
            console.warn(`   ⚠ Numbeo: límite alcanzado, usando caché para el resto.`);
            blocked = true;
          } else {
            console.warn(`   ⚠ Numbeo ${country.code}: ${(err as Error).message}`);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    if (cacheDirty) {
      cache.date = today;
      writeCache(cache);
    }

    const updates: NormalizedPriceUpdate[] = [];
    for (const country of COUNTRIES) {
      const items = cache.countries[country.code];
      if (!items) continue;
      const currency = COUNTRY_CURRENCY[country.code];
      for (const mapping of MAPPINGS) {
        const item = items.find((i) =>
          i.label.toLowerCase().includes(mapping.match.toLowerCase()),
        );
        if (!item) continue;
        const value = roundFor(currency, item.value * mapping.factor);
        if (!(value > 0)) continue;
        const suffix = mapping.note ? ` (${mapping.note})` : '';
        updates.push({
          productId: mapping.productId,
          countryCode: country.code,
          value,
          date,
          note: `Precio medio de mercado en ${country.numbeo}${suffix}.`,
          source: 'Numbeo (coste de la vida, colaborativo)',
          origin: 'local',
          visible: true,
        });
      }
    }

    return updates;
  },
};
