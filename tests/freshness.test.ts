import { describe, it, expect } from 'vitest';
import { isFreshDate, getLatestUpdatedProduct } from '../src/lib/freshness.ts';
import type { Product } from '../src/lib/types.ts';

describe('freshness utility', () => {
  it('detects current or recent month as fresh', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = `${currentYear}-${currentMonth}`;

    expect(isFreshDate(currentDate)).toBe(true);
    expect(isFreshDate('2020-01')).toBe(false);
    expect(isFreshDate(null)).toBe(false);
    expect(isFreshDate('')).toBe(false);
  });

  it('finds latest updated product', () => {
    const mockProducts: Product[] = [
      {
        id: 'p1',
        name: 'Producto 1',
        shortName: 'P1',
        category: 'dia-a-dia',
        visible: true,
        prices: {
          ES: { value: 10, date: '2026-05', note: '', source: 'A', origin: 'local' },
        },
      },
      {
        id: 'p2',
        name: 'Producto 2',
        shortName: 'P2',
        category: 'tecnologia',
        visible: true,
        prices: {
          ES: { value: 50, date: '2026-09', note: '', source: 'B', origin: 'local' },
        },
      },
    ];

    const latest = getLatestUpdatedProduct(mockProducts, 'ES');
    expect(latest).not.toBeNull();
    expect(latest?.product.id).toBe('p2');
    expect(latest?.date).toBe('2026-09');
  });
});
