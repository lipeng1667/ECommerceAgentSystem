/**
 * File: storeScope.tsx
 * Purpose: Shell-level persistent store-scope filter (UX decision D3). The workspace
 * stays global while a single shell filter narrows every consuming page to one store.
 * The scope is persisted to localStorage and exposed via React context so pages
 * (dashboard, orders, products, ...) consume one shared source of truth instead of
 * maintaining their own store filters.
 *
 * Author: Michael Lee
 * Created: 2026-07-22 (WS-E, E6)
 *
 * Main exports:
 * - StoreScopeProvider: mounts inside QueryClientProvider (needs react-query for the store list).
 * - useStoreScope: hook returning { scope, setScope, stores, activeStore, isAllStores }.
 * - StoreScope: `'all' | AllMallId` — the persisted scope value.
 *
 * Usage (consumers, e.g. WS-C dashboard):
 *   const { scope, activeStore, isAllStores } = useStoreScope();
 *   const visible = isAllStores ? rows : rows.filter((r) => r.storeId === scope);
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storesApi } from '../api/stores';
import type { AllMallId, Store } from '../types/domain';

/** 'all' = no scoping (default); otherwise the id of the single store in scope. */
export type StoreScope = 'all' | AllMallId;

const STORE_SCOPE_STORAGE_KEY = 'allmall-portal-store-scope';

interface StoreScopeContextValue {
  /** Current scope: 'all' or a store id. */
  scope: StoreScope;
  /** Change the scope; persisted to localStorage. */
  setScope: (scope: StoreScope) => void;
  /** All stores available as scope options (from storesApi.list). */
  stores: Store[];
  /** The store record matching the scope, or null when scope is 'all' / unresolved. */
  activeStore: Store | null;
  /** Convenience flag: true when scope === 'all'. */
  isAllStores: boolean;
}

const StoreScopeContext = createContext<StoreScopeContextValue | undefined>(undefined);

function getStoredScope(): StoreScope {
  if (typeof window === 'undefined') return 'all';
  const stored = window.localStorage.getItem(STORE_SCOPE_STORAGE_KEY);
  if (!stored || stored === 'all') return 'all';
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : 'all';
}

function persistScope(scope: StoreScope): void {
  window.localStorage.setItem(STORE_SCOPE_STORAGE_KEY, String(scope));
}

/**
 * Provides the persistent store-scope filter to the whole authenticated app.
 * Must be mounted inside QueryClientProvider (fetches the store list via react-query).
 */
export function StoreScopeProvider({ children }: PropsWithChildren) {
  const [scope, setScopeState] = useState<StoreScope>(getStoredScope);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', 'scope-options'],
    queryFn: storesApi.list,
    staleTime: 30_000
  });

  // If the persisted store no longer exists (revoked/removed), fall back to 'all'.
  useEffect(() => {
    if (scope !== 'all' && stores.length > 0 && !stores.some((store) => store.id === scope)) {
      persistScope('all');
      setScopeState('all');
    }
  }, [scope, stores]);

  const value = useMemo<StoreScopeContextValue>(() => {
    const activeStore = scope === 'all' ? null : stores.find((store) => store.id === scope) ?? null;
    return {
      scope,
      setScope: (nextScope) => {
        persistScope(nextScope);
        setScopeState(nextScope);
      },
      stores,
      activeStore,
      isAllStores: scope === 'all'
    };
  }, [scope, stores]);

  return <StoreScopeContext.Provider value={value}>{children}</StoreScopeContext.Provider>;
}

/** Access the shell-level store scope. Throws when used outside StoreScopeProvider. */
export function useStoreScope() {
  const context = useContext(StoreScopeContext);
  if (!context) {
    throw new Error('useStoreScope must be used inside StoreScopeProvider');
  }
  return context;
}
