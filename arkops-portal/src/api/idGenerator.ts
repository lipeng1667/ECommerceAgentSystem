/**
 * Unified ID generation utility for AllMall mock API layer.
 *
 * Provides consistent ID generation strategies across all mock API modules.
 * Each entity domain has a dedicated ID range to prevent collisions:
 *
 *   Stores:            1000 - 1999
 *   Connections:       2000 - 2999
 *   Tasks:             3000 - 3999
 *   Products (SPU):    4000 - 4499
 *   ProductListings:   4500 - 4899
 *   ProductMergeSuggestions: 4900 - 4999
 *   Approvals:         5000 - 5999
 *   AuditLogs:         6000 - 6999
 *   Policies:          8000 - 8999
 *   AutoSyncChanges:      9000 - 9299
 *   NewProductCandidates: 9300 - 9599
 *   FieldConflicts:       9600 - 9899
 *   Custom Models:  custom_<timestamp>
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

type EntityDomain =
  | 'stores' | 'connections' | 'tasks' | 'products' | 'productListings' | 'productMergeSuggestions'
  | 'approvals' | 'auditLogs' | 'policies' | 'autoSyncChanges' | 'newProductCandidates' | 'fieldConflicts' | 'models';

const ID_RANGES: Record<EntityDomain, { base: number; max: number }> = {
  stores:                  { base: 1000, max: 1999 },
  connections:             { base: 2000, max: 2999 },
  tasks:                   { base: 3000, max: 3999 },
  products:                { base: 4000, max: 4499 },
  productListings:         { base: 4500, max: 4899 },
  productMergeSuggestions: { base: 4900, max: 4999 },
  approvals:               { base: 5000, max: 5999 },
  auditLogs:               { base: 6000, max: 6999 },
  policies:                { base: 8000, max: 8999 },
  autoSyncChanges:         { base: 9000, max: 9299 },
  newProductCandidates:    { base: 9300, max: 9599 },
  fieldConflicts:          { base: 9600, max: 9899 },
  models:                  { base: 0, max: 0 }, // Uses custom_ prefix
};

/**
 * Generate the next sequential ID for a given entity domain.
 * IDs are auto-incremented within their dedicated range.
 */
export function nextId(domain: Exclude<EntityDomain, 'models'>, currentCount: number): number {
  const range = ID_RANGES[domain];
  const next = range.base + currentCount + 1;
  if (next > range.max) {
    console.warn(`[idGenerator] ID overflow for domain '${domain}': ${next} > ${range.max}`);
  }
  return next;
}

/**
 * Generate a unique ID for custom models (uses timestamp prefix).
 */
export function nextCustomModelId(): string {
  return `custom_${Date.now()}`;
}

/**
 * Generate a short random token for connect tokens.
 */
export function generateConnectToken(storeId: number): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `allmall_connect_${storeId}_${suffix}`;
}
