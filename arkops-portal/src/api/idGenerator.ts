/**
 * Unified ID generation utility for AllMall mock API layer.
 *
 * Provides consistent ID generation strategies across all mock API modules.
 * Each entity domain has a dedicated ID range to prevent collisions:
 *
 *   Stores:        1000 - 1999
 *   Connections:   2000 - 2999
 *   Tasks:         3000 - 3999
 *   Approvals:     5000 - 5999
 *   AuditLogs:     6000 - 6999
 *   Policies:      8000 - 8999
 *   Custom Models:  custom_<timestamp>
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

type EntityDomain = 'stores' | 'connections' | 'tasks' | 'approvals' | 'auditLogs' | 'policies' | 'models';

const ID_RANGES: Record<EntityDomain, { base: number; max: number }> = {
  stores:      { base: 1000, max: 1999 },
  connections: { base: 2000, max: 2999 },
  tasks:       { base: 3000, max: 3999 },
  approvals:   { base: 5000, max: 5999 },
  auditLogs:   { base: 6000, max: 6999 },
  policies:    { base: 8000, max: 8999 },
  models:      { base: 0, max: 0 }, // Uses custom_ prefix
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
