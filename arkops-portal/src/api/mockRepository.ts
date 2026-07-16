/**
 * Mock data repository utilities for AllMall API layer.
 *
 * Provides array manipulation helpers for the in-memory mock data store.
 * All functions operate via in-place mutation to maintain reference integrity
 * across module-level shared arrays.
 *
 * Author: AI Optimization
 * Created: 2026-07-16 (enhanced with transaction support and find helpers)
 */

/**
 * Insert an item at the beginning of the array (in-place).
 * Returns the inserted item.
 */
export function insertFirst<T>(items: T[], item: T): T {
  items.splice(0, 0, item);
  return item;
}

/**
 * Append an item to the end of the array (in-place).
 * Returns the appended item.
 */
export function appendItem<T>(items: T[], item: T): T {
  items.push(item);
  return item;
}

/**
 * Replace the first item matching the predicate (in-place).
 * Supports both direct value replacement and functional updates.
 * Returns the new value, or undefined if no match was found.
 */
export function replaceItem<T>(
  items: T[],
  predicate: (item: T) => boolean,
  nextValue: T | ((current: T) => T)
): T | undefined {
  const index = items.findIndex(predicate);
  if (index === -1) return undefined;
  const next = typeof nextValue === 'function'
    ? (nextValue as (current: T) => T)(items[index])
    : nextValue;
  items.splice(index, 1, next);
  return next;
}

/**
 * Remove all items matching the predicate (in-place).
 */
export function removeWhere<T>(items: T[], predicate: (item: T) => boolean): void {
  items.splice(0, items.length, ...items.filter((item) => !predicate(item)));
}

/**
 * Find an item by predicate, or return a default value if not found.
 */
export function findOrDefault<T>(items: T[], predicate: (item: T) => boolean, defaultValue: T): T {
  return items.find(predicate) ?? defaultValue;
}

/**
 * Batch update helper: applies the same update function to all matching items.
 * Useful for batch operations like batchResolve/batchIgnore.
 */
export function batchUpdate<T>(
  items: T[],
  predicate: (item: T) => boolean,
  update: (current: T) => T
): T[] {
  const updated: T[] = [];
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i])) {
      const next = update(items[i]);
      items.splice(i, 1, next);
      updated.push(next);
    }
  }
  return updated;
}

/**
 * Clone an array (shallow copy) to prevent mutation of shared state.
 */
export function cloneItems<T>(items: T[]): T[] {
  return [...items];
}
