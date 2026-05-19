/**
 * Stock status helpers - Domain Layer
 */

import type { StockStatus } from '../../application/dto/MaterialDTO';

export function getStockStatus(quantity: number, minimum: number): StockStatus {
  if (quantity < minimum) return 'out-of-stock';
  if (quantity <= 2 * minimum) return 'low-stock';
  return 'in-stock';
}

export function computeMaterialKpi(
  materials: Array<{ quantity: number; minimum: number }>
): { total: number; inStock: number; lowStock: number; outOfStock: number } {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const m of materials) {
    const status = getStockStatus(m.quantity, m.minimum);
    if (status === 'in-stock') inStock += 1;
    else if (status === 'low-stock') lowStock += 1;
    else outOfStock += 1;
  }

  return {
    total: materials.length,
    inStock,
    lowStock,
    outOfStock,
  };
}
