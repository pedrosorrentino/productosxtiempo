import type { Product } from './types.ts';

/**
 * Determina si una fecha (formato YYYY-MM o ISO) es reciente (fresca).
 * Por defecto, considera fresco cualquier dato del mes en curso o del mes anterior.
 */
export function isFreshDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month)) return false;

  const diffMonths = (currentYear - year) * 12 + (currentMonth - month);
  return diffMonths === 0;
}

/**
 * Encuentra el producto más recientemente cotizado o actualizado para un país dado.
 */
export function getLatestUpdatedProduct(
  products: Product[],
  countryCode: string
): { product: Product; date: string; source: string } | null {
  const candidates = products
    .map((p) => {
      const price = p.prices[countryCode] || p.prices['ES'];
      if (!price || !price.date) return null;
      return {
        product: p,
        date: price.date,
        source: price.source || 'Catálogo',
      };
    })
    .filter((c): c is { product: Product; date: string; source: string } => c !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0];
}
