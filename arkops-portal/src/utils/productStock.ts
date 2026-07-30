/**
 * File: productStock.ts
 * Purpose: Shared stock-level rule for products, used by the products page and the
 * Action Inbox so both agree on what counts as low/out of stock (mirrors orderSla.ts).
 *
 * Author: TBD
 * Created: 2026-07-29
 *
 * Main exports:
 * - getProductStockLevel: healthy / low / out for a product's shared stock pool.
 */
import type { Product } from '../types/domain';

/** Stock level below which a product's shared pool counts as low. */
export const LOW_STOCK_THRESHOLD = 50;

export function getProductStockLevel(product: Product): 'healthy' | 'low' | 'out' {
  if (product.totalStock <= 0) return 'out';
  if (product.totalStock < LOW_STOCK_THRESHOLD) return 'low';
  return 'healthy';
}
