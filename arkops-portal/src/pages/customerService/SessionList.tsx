/**
 * Session List — V1.0 Customer Service left panel.
 * Shows searchable, filterable session list with status + store filters.
 */
import { SearchOutlined, CustomerServiceOutlined, ShopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Badge, Input, Segmented, Select, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useI18n } from '../../app/i18n';
import type { AllMallId, CustomerSession, SessionStatus, Store } from '../../types/domain';

dayjs.extend(relativeTime);

interface Props {
  sessions: CustomerSession[];
  stores: Store[];
  selectedId: AllMallId | null;
  statusFilter: SessionStatus | undefined;
  storeFilter: AllMallId | undefined;
  search: string;
  onSelect: (session: CustomerSession) => void;
  onStatusFilterChange: (status: SessionStatus | undefined) => void;
  onStoreFilterChange: (storeId: AllMallId | undefined) => void;
  onSearchChange: (search: string) => void;
}

const STATUS_OPTIONS: { value: SessionStatus | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'cs.filterAll' },
  { value: 'pending_reply', labelKey: 'cs.filterPending' },
  { value: 'replied', labelKey: 'cs.filterReplied' },
  { value: 'closed', labelKey: 'cs.filterClosed' },
];

export function SessionList({
  sessions, stores, selectedId, statusFilter, storeFilter, search,
  onSelect, onStatusFilterChange, onStoreFilterChange, onSearchChange,
}: Props) {
  const { t } = useI18n();

  const storeById = new Map(stores.map((s) => [s.id, s]));

  return (
    <div style={{
      width: 340, minWidth: 300, borderRight: '1px solid var(--ark-border-soft)',
      display: 'flex', flexDirection: 'column', background: 'var(--ark-bg-sink)',
    }}>
      {/* Filters */}
      <div style={{ padding: '10px 12px 6px' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('cs.searchPlaceholder')}
          allowClear
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <Segmented
            size="small"
            block
            value={statusFilter ?? 'all'}
            onChange={(val) => onStatusFilterChange(val === 'all' ? undefined : val as SessionStatus)}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            style={{ flex: 1 }}
          />
          <Select
            size="small"
            value={storeFilter}
            onChange={onStoreFilterChange}
            allowClear
            placeholder={t('cs.filterByStore')}
            style={{ width: 110 }}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--ark-text-secondary)' }}>
            <CustomerServiceOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <Typography.Text type="secondary">{t('cs.noSessions')}</Typography.Text>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = session.id === selectedId;
            const isPending = session.status === 'pending_reply';
            const store = storeById.get(session.storeId);
            const timeAgo = dayjs(session.lastMessageAt).fromNow();

            return (
              <div
                key={session.id}
                onClick={() => onSelect(session)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--ark-border-soft)',
                  background: isSelected ? 'var(--ark-bg-selected)' : undefined,
                  borderLeft: isSelected ? '3px solid var(--ark-purple)' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <Typography.Text strong ellipsis style={{ fontSize: 13, maxWidth: 140 }}>
                      {session.buyerName}
                    </Typography.Text>
                    {session.tags.length > 0 && (
                      <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }} color={isPending ? 'red' : 'default'}>
                        {session.tags[0]}
                      </Tag>
                    )}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 6 }}>
                    {timeAgo}
                  </Typography.Text>
                </div>
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 1 }}
                  style={{ fontSize: 12, marginBottom: 4, lineHeight: '18px' }}
                >
                  {session.lastMessage}
                </Typography.Paragraph>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text style={{ fontSize: 11, color: 'var(--ark-text-tertiary)' }}>
                    <ShopOutlined style={{ marginRight: 2 }} />
                    {store ? store.name : '-'}
                  </Typography.Text>
                  <Space size={4}>
                    {isPending && (
                      <Badge status="error" />
                    )}
                    {session.unreadCount > 0 && (
                      <Badge count={session.unreadCount} size="small" style={{ fontSize: 10 }} />
                    )}
                  </Space>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--ark-border-soft)',
        display: 'flex', justifyContent: 'space-between', fontSize: 11,
        color: 'var(--ark-text-tertiary)',
      }}>
        <span>{t('cs.totalSessions', { count: sessions.length })}</span>
        <span style={{ color: 'var(--ark-red)' }}>
          <ExclamationCircleOutlined style={{ marginRight: 2 }} />
          {t('cs.pendingCount', { count: sessions.filter((s) => s.status === 'pending_reply').length })}
        </span>
      </div>
    </div>
  );
}
