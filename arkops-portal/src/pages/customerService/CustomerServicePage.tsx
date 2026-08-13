/**
 * Customer Service — SLA monitor (positioning A: monitor + fallback + AI orchestration).
 *
 * Operators don't sit and answer messages here — the AI Agent does that. This page
 * answers the operator's real question: "are we hitting the platforms' response SLAs,
 * and which conversations does the AI need me to catch?" Three layers:
 *   ① SLA health board — first-response rate / avg / backlog / overdue / AI share,
 *      broken down per store (red where a store is failing its response SLA).
 *   ② fallback queue — only the pending conversations that need a human (AI can't
 *      resolve, or already overdue).
 *   ③ the full chat console stays one click away, in a drawer, for when you do step in.
 */
import { ClockCircleOutlined, MessageOutlined, RobotOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Drawer, Empty, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { customerServiceApi } from '../../api/customerService';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import type { AllMallId, CustomerSession, SessionStatus, Store } from '../../types/domain';
import {
  computeCsSla,
  metRateTone,
  pendingTone,
  pendingWaitSeconds,
  type CsSlaTone,
} from '../../utils/csSla';
import { ChatArea } from './ChatArea';
import { SessionList } from './SessionList';

const TONE_COLOR: Record<CsSlaTone, string> = {
  ok: 'var(--ark-green)',
  warning: 'var(--ark-orange)',
  breached: 'var(--ark-red)',
  none: 'var(--ark-muted)',
};

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

/** The old two-pane manual console, kept as an on-demand drawer for when a human steps in. */
function FullConsole({
  stores,
  initialSelectedId,
  initialStoreFilter,
}: {
  stores: Store[];
  initialSelectedId?: AllMallId;
  initialStoreFilter?: AllMallId;
}) {
  const [selectedId, setSelectedId] = useState<AllMallId | null>(initialSelectedId ?? null);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | undefined>(undefined);
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>(initialStoreFilter);
  const [search, setSearch] = useState('');

  const { data: sessions = [] } = useQuery({
    queryKey: ['customerSessions', statusFilter, storeFilter, search],
    queryFn: () => customerServiceApi.listSessions({ status: statusFilter, storeId: storeFilter, search }),
  });
  const selected = sessions.find((s) => s.id === selectedId) ?? (sessions.length > 0 ? sessions[0] : null);

  return (
    <div style={{ display: 'flex', height: '72vh', overflow: 'hidden' }}>
      <SessionList
        sessions={sessions}
        stores={stores}
        selectedId={selected?.id ?? null}
        statusFilter={statusFilter}
        storeFilter={storeFilter}
        search={search}
        onSelect={(s) => setSelectedId(s.id)}
        onStatusFilterChange={setStatusFilter}
        onStoreFilterChange={setStoreFilter}
        onSearchChange={setSearch}
      />
      <ChatArea session={selected} stores={stores} />
    </div>
  );
}

export function CustomerServicePage() {
  const { t } = useI18n();
  const { data: sessions = [] } = useQuery({
    queryKey: ['customerSessions', 'monitor'],
    queryFn: () => customerServiceApi.listSessions(),
    refetchInterval: 15000,
  });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });

  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleSeed, setConsoleSeed] = useState<{ sessionId?: AllMallId; storeId?: AllMallId }>({});

  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const summary = useMemo(() => computeCsSla(sessions), [sessions]);
  const byStore = useMemo(
    () =>
      stores
        .map((store) => ({ store, sla: computeCsSla(sessions.filter((s) => s.storeId === store.id)) }))
        .filter((row) => row.sla.total > 0),
    [stores, sessions]
  );

  // The fallback queue: pending conversations, worst first — needs-a-human and overdue
  // float to the top so the operator's attention lands where the AI couldn't cope.
  const queue = useMemo(() => {
    const rank = (s: CustomerSession) => {
      const tone = pendingTone(s);
      const toneScore = tone === 'breached' ? 2 : tone === 'warning' ? 1 : 0;
      return (s.needsHuman ? 4 : 0) + toneScore;
    };
    return sessions
      .filter((s) => s.status === 'pending_reply')
      .sort((a, b) => rank(b) - rank(a) || pendingWaitSeconds(b) - pendingWaitSeconds(a));
  }, [sessions]);

  if (stores.length === 0) {
    return <StoreConnectionEmptyState description={t('csmon.subtitle')} />;
  }

  const openConsole = (seed: { sessionId?: AllMallId; storeId?: AllMallId }) => {
    setConsoleSeed(seed);
    setConsoleOpen(true);
  };

  const metTone = metRateTone(summary.metRate);

  return (
    <div className="page-stack">
      <PageHeader
        title={t('csmon.title')}
        description={t('csmon.subtitle')}
        actions={
          <Button icon={<MessageOutlined />} onClick={() => openConsole({})}>
            {t('csmon.allSessions')}
          </Button>
        }
      />

      {/* ① SLA health board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 8 }}>
        <MetricCard
          title={t('csmon.metRate')}
          value={summary.metRate ?? 0}
          suffix="%"
          valueStyle={{ color: TONE_COLOR[metTone] }}
          helper={t('csmon.metRateHelper')}
        />
        <MetricCard title={t('csmon.avgFirstResponse')} value={summary.avgFirstResponse ?? 0} suffix="s" helper={t('csmon.avgHelper')} />
        <MetricCard title={t('csmon.backlog')} value={summary.pending} helper={t('csmon.backlogHelper')} />
        <MetricCard
          title={t('csmon.overtime')}
          value={summary.pendingBreached}
          valueStyle={{ color: summary.pendingBreached > 0 ? 'var(--ark-red)' : undefined }}
          helper={t('csmon.overtimeHelper')}
        />
        <MetricCard title={t('csmon.aiRate')} value={summary.aiRate ?? 0} suffix="%" valueStyle={{ color: 'var(--ark-blue)' }} helper={t('csmon.aiHelper')} />
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
        <ClockCircleOutlined /> {t('csmon.autoRefresh')}
      </Typography.Text>

      {/* Per-store SLA breakdown */}
      <Card size="small" title={t('csmon.byStore')} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {byStore.map(({ store, sla }) => {
            const tone = metRateTone(sla.metRate);
            return (
              <div key={store.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: TONE_COLOR[tone], flexShrink: 0 }} />
                <Typography.Text strong style={{ minWidth: 140 }}>{store.name}</Typography.Text>
                <Typography.Text style={{ color: TONE_COLOR[tone] }}>
                  {t('csmon.storeMetRate', { rate: sla.metRate ?? '—' })}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('csmon.storeAvg', { time: sla.avgFirstResponse != null ? fmtDuration(sla.avgFirstResponse) : '—' })}
                </Typography.Text>
                {sla.pending > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    · {t('csmon.storeBacklog', { count: sla.pending })}
                  </Typography.Text>
                )}
                {tone === 'breached' && (
                  <Button type="link" size="small" style={{ padding: 0, color: 'var(--ark-red)' }} onClick={() => openConsole({ storeId: store.id })}>
                    {t('csmon.goHandle')} →
                  </Button>
                )}
              </div>
            );
          })}
        </Space>
      </Card>

      {/* ② Fallback queue — only what needs a human */}
      <Card
        size="small"
        title={
          <Space>
            <ThunderboltOutlined style={{ color: 'var(--ark-orange)' }} />
            {t('csmon.queueTitle')}
            {queue.length > 0 && <Tag color="orange">{queue.length}</Tag>}
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: -4 }}>
          {t('csmon.queueDesc')}
        </Typography.Paragraph>
        {queue.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('csmon.queueEmpty')} />
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {queue.map((s) => {
              const tone = pendingTone(s);
              const waited = pendingWaitSeconds(s);
              const store = storeMap.get(s.storeId);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    padding: '10px 12px',
                    border: '1px solid var(--ark-border)',
                    borderLeft: `3px solid ${TONE_COLOR[tone]}`,
                    borderRadius: 8,
                    background: 'var(--ark-panel)',
                  }}
                >
                  <Typography.Text strong>{s.buyerName}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{store?.name}</Typography.Text>
                  {s.needsHuman ? (
                    <Tag icon={<UserOutlined />} color="orange">{t('csmon.needsHuman')}</Tag>
                  ) : (
                    <Tag icon={<RobotOutlined />}>{t('csmon.aiHandled')}</Tag>
                  )}
                  {s.tags.slice(0, 2).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                  <Typography.Text ellipsis style={{ flex: 1, minWidth: 120, color: 'var(--ark-muted)', fontSize: 12 }}>
                    {s.lastMessage}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 12, color: TONE_COLOR[tone], whiteSpace: 'nowrap' }}>
                    <ClockCircleOutlined /> {t('csmon.waited', { time: fmtDuration(waited) })}
                  </Typography.Text>
                  <Button size="small" type="primary" onClick={() => openConsole({ sessionId: s.id })}>
                    {t('csmon.reply')}
                  </Button>
                </div>
              );
            })}
          </Space>
        )}
      </Card>

      <Drawer
        title={consoleSeed.sessionId ? t('csmon.chatTitle') : t('csmon.allSessions')}
        placement="right"
        width={900}
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        <FullConsole
          key={consoleSeed.sessionId ?? consoleSeed.storeId ?? 'all'}
          stores={stores}
          initialSelectedId={consoleSeed.sessionId}
          initialStoreFilter={consoleSeed.storeId}
        />
      </Drawer>
    </div>
  );
}
