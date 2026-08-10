/**
 * Customer Service Page — V1.0
 * Dual-pane layout: SessionList (left) + ChatArea (right).
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { customerServiceApi } from '../../api/customerService';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { ChatArea } from './ChatArea';
import { SessionList } from './SessionList';
import type { AllMallId, CustomerSession, SessionStatus } from '../../types/domain';

export function CustomerServicePage() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<AllMallId | null>(null);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | undefined>(undefined);
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data: sessions = [] } = useQuery({
    queryKey: ['customerSessions', statusFilter, storeFilter, search],
    queryFn: () => customerServiceApi.listSessions({ status: statusFilter, storeId: storeFilter, search }),
    refetchInterval: 15000, // auto-refresh every 15s
  });

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });

  // Auto-select first session when filter changes reset the selection
  const selected = sessions.find((s) => s.id === selectedId) ?? (sessions.length > 0 ? sessions[0] : null);
  // If the selected session is no longer in the filtered list, auto-pick first
  if (selectedId && !selected) {
    const first = sessions[0];
    if (first && first.id !== selectedId) setSelectedId(first.id);
  }

  const handleSelect = (session: CustomerSession) => {
    setSelectedId(session.id);
  };

  const pendingCount = sessions.filter((s) => s.status === 'pending_reply').length;

  if (stores.length === 0) {
    return <StoreConnectionEmptyState description={t('cs.noSessions')} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={t('nav.customerService')}
        description={t('cs.subtitle', { total: sessions.length, pending: pendingCount })}
      />
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', marginTop: 0 }}>
        <SessionList
          sessions={sessions}
          stores={stores}
          selectedId={selectedId}
          statusFilter={statusFilter}
          storeFilter={storeFilter}
          search={search}
          onSelect={handleSelect}
          onStatusFilterChange={setStatusFilter}
          onStoreFilterChange={setStoreFilter}
          onSearchChange={setSearch}
        />
        <ChatArea
          session={selected}
          stores={stores}
        />
      </div>
    </div>
  );
}
