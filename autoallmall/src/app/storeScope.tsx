import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export interface StoreInfo {
  id: string;
  name: string;
  platform: string;
  platformIcon: string;
  status: 'connected' | 'disconnected';
}

interface StoreScopeContextType {
  storeId: string | null;
  setStoreId: (id: string | null) => void;
  stores: StoreInfo[];
}

const StoreScopeContext = createContext<StoreScopeContextType | null>(null);

export const ALL_STORES = '__all__';

export function StoreScopeProvider({ children, stores }: { children: React.ReactNode; stores: StoreInfo[] }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const value = useMemo(() => ({ storeId, setStoreId, stores }), [storeId, setStoreId, stores]);
  return <StoreScopeContext.Provider value={value}>{children}</StoreScopeContext.Provider>;
}

export function useStoreScope(): StoreScopeContextType {
  const ctx = useContext(StoreScopeContext);
  if (!ctx) throw new Error('useStoreScope must be used within StoreScopeProvider');
  return ctx;
}
