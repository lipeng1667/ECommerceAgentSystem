/**
 * File: OrderAutomationPage.tsx
 * Purpose: Route-level orders page — the merchant's order fulfilment workbench.
 *
 * Author: Li Peng
 * Created: 2026-07-01
 *
 * Main exports:
 * - OrderAutomationPage: page component for /orders.
 *
 * Major updates:
 * - 2026-07-27: D8/O0 — switched from inline mock data to ordersApi + TanStack Query.
 * - 2026-07-28: D8/O1-O4 — digest card + auto-handled log, SLA countdown, recommendations,
 *   visual alignment with products/stores, default-tab switching, inbox-ready exceptions.
 */
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MailOutlined,
  RightOutlined,
  SearchOutlined,
  SecurityScanOutlined,
  ShoppingCartOutlined,
  StopOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { AllMallId, Order, OrderExceptionType, OrderStatus } from '../../types/domain';
import { AUTO_FLOW_ORDER_STATUSES, EXCEPTION_ORDER_STATUSES } from '../../types/domain';
import { parseAllMallId } from '../../utils/id';

type TabFilter = 'all' | 'exception' | 'auto';
type RiskyActionType = 'cancel_refund' | 'fraud_release';
type TranslateFn = ReturnType<typeof useI18n>['t'];

/**
 * The shipping deadline only means anything before the parcel leaves: once an order is
 * shipped, completed or cancelled there is nothing left to miss. Scoping it here keeps
 * finished orders from showing a red 已超时 and hijacking the sort order.
 */
const SLA_TRACKED_STATUSES: OrderStatus[] = ['auto_processing', 'awaiting_shipment', 'exception', 'fraud_blocked'];

/** Exception types offered in the filter — the ones the mock engine can produce. */
const EXCEPTION_TYPE_OPTIONS: OrderExceptionType[] = ['address_invalid', 'fraud_suspected', 'out_of_stock', 'payment_failed', 'buyer_dispute'];

const SLA_CRITICAL_MS = 2 * 3600_000;
const SLA_WARNING_MS = 6 * 3600_000;

type SlaTone = 'none' | 'ok' | 'warning' | 'critical' | 'breached';
interface SlaInfo { remainingMs: number; tone: SlaTone; label: string }

function getSlaForOrder(order: Order, now: dayjs.Dayjs, t: TranslateFn): SlaInfo {
  if (!order.shipDeadlineAt || !SLA_TRACKED_STATUSES.includes(order.status)) {
    return { remainingMs: Number.MAX_SAFE_INTEGER, tone: 'none', label: '' };
  }
  const remainingMs = dayjs(order.shipDeadlineAt).diff(now);
  if (remainingMs <= 0) return { remainingMs, tone: 'breached', label: t('ordersv2.slaBreached') };
  const hours = Math.floor(remainingMs / 3600_000);
  const minutes = Math.floor((remainingMs % 3600_000) / 60_000);
  if (remainingMs <= SLA_CRITICAL_MS) return { remainingMs, tone: 'critical', label: t('ordersv2.slaMinutesLeft', { minutes: Math.ceil(remainingMs / 60_000) }) };
  if (remainingMs <= SLA_WARNING_MS) return { remainingMs, tone: 'warning', label: t('ordersv2.slaHoursLeft', { hours, minutes }) };
  return { remainingMs, tone: 'ok', label: t('ordersv2.slaHoursLeftShort', { hours }) };
}

const SLA_TONE_COLOR: Record<SlaTone, string> = {
  breached: 'var(--ark-red)',
  critical: 'var(--ark-orange)',
  warning: 'var(--ark-amber)',
  ok: 'var(--ark-muted)',
  none: 'var(--ark-muted)',
};

/** Needs-me first, then urgency, then newest — the order a merchant works in. */
function priorityRank(order: Order, sla: SlaInfo): number {
  if (EXCEPTION_ORDER_STATUSES.includes(order.status)) return 0;
  if (sla.tone === 'breached' || sla.tone === 'critical') return 1;
  if (sla.tone === 'warning') return 2;
  return 3;
}

export function OrderAutomationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [searchKw, setSearchKw] = useState('');
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>(
    parseAllMallId(searchParams.get('store') ?? undefined)
  );
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState<OrderExceptionType | undefined>();
  const [slaFilter, setSlaFilter] = useState<'at_risk' | 'breached' | undefined>();
  // Deep-link: /orders?order=<id> opens that order's detail modal on mount.
  const orderFromUrl = parseAllMallId(searchParams.get('order') ?? undefined);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: RiskyActionType; order: Order } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [digestExpanded, setDigestExpanded] = useState(false);

  // ---- Data layer ----------------------------------------------------------
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: syncResult } = useQuery({ queryKey: ['orderSync'], queryFn: ordersApi.getSyncResult });
  const storeNamesById = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);
  const storeNameOf = (order: Order) => storeNamesById.get(order.storeId) ?? '-';

  const resyncMutation = useMutation({
    mutationFn: ordersApi.resync,
    onSuccess: (result) => {
      queryClient.setQueryData(['orderSync'], result);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // ---- Clock ticker for SLA countdowns (30s, same pattern as InboxPage) ----
  const [clock, setClock] = useState(dayjs);
  useEffect(() => { const timer = setInterval(() => setClock(dayjs()), 30000); return () => clearInterval(timer); }, []);

  // ---- SLA map ------------------------------------------------------------
  const slaByOrderId = useMemo(() => {
    const map = new Map<AllMallId, SlaInfo>();
    for (const order of orders) map.set(order.id, getSlaForOrder(order, clock, t));
    return map;
  }, [orders, clock, t]);
  const slaOf = (order: Order): SlaInfo => slaByOrderId.get(order.id) ?? { remainingMs: Number.MAX_SAFE_INTEGER, tone: 'none', label: '' };

  // ---- Automatically sorted + filtered base set ----------------------------
  const baseFiltered = useMemo(() => {
    let items = orders;
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      items = items.filter((o) =>
        o.orderNo.toLowerCase().includes(kw) || o.buyerName.toLowerCase().includes(kw) ||
        o.items.toLowerCase().includes(kw) || (o.trackingNo && o.trackingNo.toLowerCase().includes(kw)));
    }
    if (storeFilter != null) items = items.filter((o) => o.storeId === storeFilter);
    if (dateRange) {
      items = items.filter((o) => {
        const day = dayjs(o.createdAt).format('YYYY-MM-DD');
        return day >= dateRange[0] && day <= dateRange[1];
      });
    }
    if (exceptionTypeFilter) items = items.filter((o) => o.exceptionType === exceptionTypeFilter);
    if (slaFilter) {
      items = items.filter((o) => {
        const tone = slaByOrderId.get(o.id)?.tone;
        return slaFilter === 'breached' ? tone === 'breached' : tone === 'breached' || tone === 'critical' || tone === 'warning';
      });
    }
    // Needs-me first, then time pressure, then newest. Sorting purely by remaining time
    // (as an earlier pass did) buries exceptions below finished orders.
    return [...items].sort((a, b) => {
      const sa = slaOf(a); const sb = slaOf(b);
      const ra = priorityRank(a, sa); const rb = priorityRank(b, sb);
      if (ra !== rb) return ra - rb;
      if (sa.remainingMs !== sb.remainingMs) return sa.remainingMs - sb.remainingMs;
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });
  }, [orders, searchKw, storeFilter, dateRange, exceptionTypeFilter, slaFilter, slaByOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoCountBase = baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length;
  const exceptionCountBase = baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length;
  const atRiskCount = baseFiltered.filter((o) => { const tone = slaOf(o).tone; return tone === 'breached' || tone === 'critical'; }).length;
  // Only exceptions that are *also* time-critical — the card's helper sits under the
  // exception count, so counting every urgent order there would contradict the number.
  const exceptionAtRiskCount = baseFiltered.filter((o) => {
    const tone = slaOf(o).tone;
    return EXCEPTION_ORDER_STATUSES.includes(o.status) && (tone === 'breached' || tone === 'critical');
  }).length;
  // An exception that is also SLA-critical must not be counted twice.
  const needsMeCount = baseFiltered.filter((o) => {
    const tone = slaOf(o).tone;
    return EXCEPTION_ORDER_STATUSES.includes(o.status) || tone === 'breached' || tone === 'critical';
  }).length;
  const filtersActive = !!(searchKw || storeFilter != null || dateRange || exceptionTypeFilter || slaFilter);
  const clearFilters = () => { setSearchKw(''); setStoreFilter(undefined); setDateRange(null); setExceptionTypeFilter(undefined); setSlaFilter(undefined); };

  const filtered = useMemo(() => {
    if (tabFilter === 'auto') return baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status));
    if (tabFilter === 'exception') return baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status));
    return baseFiltered;
  }, [baseFiltered, tabFilter]);

  // Results first: land on the exception tab when there is something to decide. Runs once
  // *after* orders arrive — checking on mount (as an earlier pass did) always saw an
  // empty list, so the default never actually switched.
  const defaultTabApplied = useRef(false);
  useEffect(() => {
    if (defaultTabApplied.current || orders.length === 0) return;
    defaultTabApplied.current = true;
    if (orders.some((o) => EXCEPTION_ORDER_STATUSES.includes(o.status))) setTabFilter('exception');
  }, [orders]);

  // Deep-link: /orders?order=<id> opens that order's detail modal once data arrives.
  useEffect(() => {
    if (orderFromUrl == null) return;
    const target = orders.find((o) => o.id === orderFromUrl);
    if (target) setDetailOrder(target);
  }, [orders, orderFromUrl]);

  const totalCount = orders.length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const autoHandled = orders.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length;
  const exceptionCount = orders.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length;
  const rateDenominator = totalCount - cancelledCount;
  const autoRate = rateDenominator > 0 ? Math.round((autoHandled / rateDenominator) * 100) : 0;

  /**
   * Transparency log (O1): the steps automation took, newest first. Built from timeline
   * entries already flagged `automated` — no second source of truth to drift.
   */
  const autoLogEntries = useMemo(() => {
    const entries: { key: string; text: string; at: string }[] = [];
    for (const order of orders) {
      order.timeline.forEach((step, index) => {
        if (step.automated) entries.push({ key: `${order.id}-${index}`, text: `${step.title} · ${order.orderNo}`, at: step.at });
      });
    }
    return entries.sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf()).slice(0, 20);
  }, [orders]);

  // ---- Mutations -----------------------------------------------------------
  const cancelMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) => ordersApi.cancelAndRefund(params.orderId, params.reason),
    onSuccess: () => { message.success(t('order.cancelledAndRefunded')); queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['orderSync'] }); setDetailOrder(null); setPendingAction(null); setActionReason(''); },
  });
  const releaseMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) => ordersApi.releaseFraud(params.orderId, params.reason),
    onSuccess: () => { message.success(t('ordersv2.releasedFeedback')); queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['orderSync'] }); setDetailOrder(null); setPendingAction(null); setActionReason(''); },
  });
  const applyRecMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.applyRecommendation(orderId),
    // Conclusion-style feedback, matching product sync and store renewal: say what will
    // happen next, not just "success".
    onSuccess: (order) => {
      message.success(order ? t('ordersv2.recommendationApplied', { order: order.orderNo }) : t('common.operationSuccess'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSync'] });
    },
  });

  const openRiskyAction = (type: RiskyActionType, order: Order) => { setActionReason(''); setPendingAction({ type, order }); };
  const confirmRiskyAction = () => {
    if (!pendingAction || !actionReason.trim()) return;
    if (pendingAction.type === 'cancel_refund') cancelMutation.mutate({ orderId: pendingAction.order.id, reason: actionReason.trim() });
    else releaseMutation.mutate({ orderId: pendingAction.order.id, reason: actionReason.trim() });
  };
  const handleContactBuyer = (order: Order) => message.info(`${t('order.contactBuyerMsg')}: ${order.buyerName} (${order.orderNo})`);

  const statusColors: Record<OrderStatus, string> = {
    auto_processing: 'blue', awaiting_shipment: 'geekblue', auto_shipped: 'cyan',
    auto_completed: 'green', exception: 'orange', fraud_blocked: 'red', cancelled: 'default',
  };

  // ---- Table columns -------------------------------------------------------
  const columns: ColumnsType<Order> = [
    { title: t('order.orderNo'), dataIndex: 'orderNo', width: 140, render: (no: string) => <Typography.Text code>{no}</Typography.Text> },
    { title: t('order.store'), dataIndex: 'storeId', width: 110, ellipsis: true, render: (id: number) => storeNamesById.get(id) ?? '-' },
    { title: t('order.buyer'), dataIndex: 'buyerName', width: 90, ellipsis: true },
    { title: t('order.items'), dataIndex: 'items', ellipsis: true, width: 140 },
    {
      title: t('order.amount'), dataIndex: 'amount', width: 78, align: 'right', sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => <Typography.Text strong>¥{v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('ordersv2.slaColumn'), key: 'sla', width: 105,
      sorter: (a, b) => slaOf(a).remainingMs - slaOf(b).remainingMs,
      render: (_: unknown, record: Order) => {
        const sla = slaOf(record);
        if (sla.tone === 'none') return <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>;
        const urgent = sla.tone === 'breached' || sla.tone === 'critical';
        return (
          <Typography.Text strong={urgent} style={{ color: SLA_TONE_COLOR[sla.tone], fontSize: 12, whiteSpace: 'nowrap' }}>
            {urgent && <ClockCircleOutlined style={{ marginRight: 4 }} />}{sla.label}
          </Typography.Text>
        );
      },
    },
    { title: t('order.status'), dataIndex: 'status', width: 88, render: (s: OrderStatus) => <Tag color={statusColors[s]}>{t(`order.status_${s}`)}</Tag> },
    {
      // Pinned: with the SLA column added, an unpinned action column lands past the
      // viewport at 1280px and the recommended action becomes unreachable.
      title: t('common.actions'), width: 185, fixed: 'right',
      render: (_: unknown, record: Order) => {
        const isException = EXCEPTION_ORDER_STATUSES.includes(record.status);
        const rec = record.recommendation;
        const tier2 = rec && rec.action !== 'release' && rec.action !== 'cancel_refund' ? rec : undefined;
        // Stop row-click (which opens the detail) from firing behind the buttons.
        return (
          <div onClick={(event) => event.stopPropagation()}>
            <TableActionGroup>
              {isException && tier2 && (
                <Popconfirm
                  title={t('ordersv2.applyRecommendationTitle')}
                  description={<Typography.Text style={{ fontSize: 12 }}>{tier2.rationale}</Typography.Text>}
                  onConfirm={() => applyRecMutation.mutate(record.id)}
                  okText={t('ordersv2.applyRecommendationOk')}
                  cancelText={t('common.cancel')}
                >
                  <Button size="small" type="primary" icon={<ThunderboltOutlined />} loading={applyRecMutation.isPending}>
                    {t('ordersv2.applyRecommendation')}
                  </Button>
                </Popconfirm>
              )}
              {isException && record.status === 'fraud_blocked' && (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openRiskyAction('fraud_release', record)}>{t('order.approve')}</Button>
              )}
              {/* Contact-buyer and cancel/refund stay in the detail modal: four buttons do
                  not fit a pinned column, and both need the evidence next to them. */}
              <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailOrder(record)}>{t('common.view')}</Button>
            </TableActionGroup>
          </div>
        );
      },
    },
  ];

  const timelineIcons: Record<string, React.ReactNode> = {
    check: <CheckCircleOutlined style={{ color: 'var(--ark-green)' }} />,
    shield: <SecurityScanOutlined style={{ color: 'var(--ark-blue)' }} />,
    truck: <TruckOutlined style={{ color: 'var(--ark-purple)' }} />,
    sync: <SyncOutlined style={{ color: 'var(--ark-blue)' }} />,
    warning: <ExclamationCircleOutlined style={{ color: 'var(--ark-orange)' }} />,
    stop: <StopOutlined style={{ color: 'var(--ark-red)' }} />,
    close: <ExclamationCircleOutlined style={{ color: 'var(--ark-muted)' }} />,
  };

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('order.title')} description={t('order.description')} />
        <StoreConnectionEmptyState description={t('ordersv2.onboardingEmpty')} />
      </div>
    );
  }

  const renderOrdersTable = (description?: string) => (
    <DataTableCard<Order>
      rowKey="id"
      columns={columns}
      dataSource={filtered}
      description={description}
      pagination={{ pageSize: 15, size: 'small', showTotal: (total: number) => t('ordersv2.paginationTotal', { total }) }}
      scroll={{ x: 930 }}
      onRow={(record) => ({ onClick: () => setDetailOrder(record), style: { cursor: 'pointer' } })}
      locale={{
        emptyText: (
          <EmptyState
            description={filtersActive ? t('ordersv2.emptyFiltered') : t('ordersv2.emptyNoOrders')}
            actionText={filtersActive ? t('ordersv2.clearFilters') : undefined}
            onAction={filtersActive ? clearFilters : undefined}
          />
        ),
      }}
    />
  );

  const orderFilters = (
    <PageFilterBar>
      <Input prefix={<SearchOutlined />} placeholder={t('order.searchPlaceholder')} allowClear value={searchKw} onChange={(e) => setSearchKw(e.target.value)} />
      <Select allowClear placeholder={t('order.filterStore')} value={storeFilter} onChange={setStoreFilter} options={stores.map((store) => ({ value: store.id, label: store.name }))} />
      <Select
        allowClear
        placeholder={t('ordersv2.filterSla')}
        value={slaFilter}
        onChange={setSlaFilter}
        options={[
          { value: 'at_risk', label: t('ordersv2.filterSlaAtRisk') },
          { value: 'breached', label: t('ordersv2.filterSlaBreached') },
        ]}
      />
      <Select
        allowClear
        placeholder={t('ordersv2.filterExceptionType')}
        value={exceptionTypeFilter}
        onChange={setExceptionTypeFilter}
        options={EXCEPTION_TYPE_OPTIONS.map((value) => ({ value, label: t(`ordersv2.exceptionType_${value}`) }))}
      />
      <DatePicker.RangePicker
        size="middle"
        placeholder={[t('order.startDate'), t('order.endDate')]}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
          else setDateRange(null);
        }}
      />
    </PageFilterBar>
  );

  const troubledStores = (syncResult?.perStore ?? []).filter((entry) => entry.needsRelogin);

  return (
    <div className="page-stack">
      <PageHeader title={t('order.title')} description={t('order.description')} />

      {/* O1: order sync digest — same shape as the products page's SyncDigestCard, since
          orders arrive through the same store sync and raise the same question. */}
      <Card size="small">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space size={8}>
            <ThunderboltOutlined style={{ color: 'var(--ark-purple)' }} />
            <Typography.Text strong>{t('ordersv2.syncDigestTitle')}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {syncResult?.lastSyncedAt
                ? t('ordersv2.lastSynced', { time: dayjs(syncResult.lastSyncedAt).format('YYYY-MM-DD HH:mm') })
                : t('ordersv2.neverSynced')}
              {' · '}{t('ordersv2.syncCadence')}
            </Typography.Text>
          </Space>
          <Button size="small" icon={<SyncOutlined spin={resyncMutation.isPending} />} loading={resyncMutation.isPending} onClick={() => resyncMutation.mutate()}>
            {syncResult?.status === 'failed' ? t('ordersv2.retryNow') : t('ordersv2.syncNow')}
          </Button>
        </div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space size={6} wrap>
            {needsMeCount === 0 && <CheckCircleOutlined style={{ color: 'var(--ark-green)' }} />}
            <Typography.Text style={{ fontSize: 13 }}>
              {needsMeCount > 0
                ? t('ordersv2.syncSummaryPending', { total: totalCount, auto: autoHandled })
                : t('ordersv2.syncSummaryClean', { total: totalCount, auto: autoHandled })}
            </Typography.Text>
            {needsMeCount > 0 && (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setTabFilter('exception')}>
                {t('ordersv2.needsYouAction', { count: needsMeCount })}
              </Button>
            )}
          </Space>
          {autoLogEntries.length > 0 && (
            <Button type="link" size="small" style={{ padding: 0 }} icon={digestExpanded ? <DownOutlined /> : <RightOutlined />} onClick={() => setDigestExpanded(!digestExpanded)}>
              {t('ordersv2.autoHandledLog', { count: autoLogEntries.length })}
            </Button>
          )}
        </div>

        {troubledStores.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 8, padding: '4px 10px' }}
            message={
              <Typography.Text style={{ fontSize: 12 }}>
                {t('ordersv2.staleStoresWarning', { stores: troubledStores.map((entry) => storeNamesById.get(entry.storeId) ?? '').filter(Boolean).join('、') })}
              </Typography.Text>
            }
          />
        )}

        {digestExpanded && (
          <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid var(--ark-border-soft)', maxHeight: 220, overflowY: 'auto' }}>
            {autoLogEntries.map((entry) => (
              <div key={entry.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <CheckCircleOutlined style={{ color: 'var(--ark-green)', flexShrink: 0 }} />
                <Typography.Text style={{ fontSize: 12, flex: 1 }}>{entry.text}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>{dayjs(entry.at).format('MM-DD HH:mm')}</Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* O2: the one thing with a platform penalty attached gets its own line. */}
      {atRiskCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          message={t('ordersv2.slaAlert', { count: atRiskCount })}
          action={<Button size="small" onClick={() => { setSlaFilter('at_risk'); setTabFilter('all'); }}>{t('ordersv2.slaAlertAction')}</Button>}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <MetricCard className="stat-card stat-card-primary" title={t('order.totalToday')} value={totalCount} overlayIcon={<ShoppingCartOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            className="stat-card stat-card-success"
            title={t('order.autoProcessed')}
            value={autoHandled}
            valueStyle={{ color: 'var(--ark-green)' }}
            overlayIcon={<ThunderboltOutlined />}
            helper={t('ordersv2.autoRateNote', { rate: autoRate })}
          />
        </Col>
        <Col xs={12} sm={6}>
          <div onClick={() => setTabFilter(tabFilter === 'exception' ? 'all' : 'exception')} style={{ cursor: 'pointer' }}>
            <MetricCard
              className="stat-card stat-card-warning"
              title={t('order.exceptionCount')}
              value={exceptionCount}
              valueStyle={{ color: exceptionCount > 0 ? 'var(--ark-orange)' : 'var(--ark-green)' }}
              overlayIcon={<ExclamationCircleOutlined />}
              helper={exceptionAtRiskCount > 0 ? t('ordersv2.exceptionCardHelper', { count: exceptionAtRiskCount }) : t('ordersv2.exceptionCardHelperNone')}
            />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard className="stat-card stat-card-purple" title={t('ordersv2.cardCancelled')} value={cancelledCount} overlayIcon={<CloseOutlined />} />
        </Col>
      </Row>

      <Tabs
        activeKey={tabFilter}
        onChange={(key) => setTabFilter(key as TabFilter)}
        items={[
          {
            key: 'all',
            label: <span><ShoppingCartOutlined /> {t('order.allOrders')} ({baseFiltered.length})</span>,
            children: <>{orderFilters}{renderOrdersTable()}</>,
          },
          {
            key: 'auto',
            label: (
              <span>
                <ThunderboltOutlined /> {t('order.autoProcessedTab')}
                {autoCountBase > 0 && <Badge count={autoCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6, background: 'var(--ark-green)' }} />}
              </span>
            ),
            children: <>{orderFilters}{renderOrdersTable(t('order.autoProcessedDesc'))}</>,
          },
          {
            key: 'exception',
            label: (
              <span>
                <ExclamationCircleOutlined style={{ color: exceptionCountBase > 0 ? 'var(--ark-red)' : undefined }} /> {t('order.exceptionOrders')}
                {exceptionCountBase > 0 && <Badge count={exceptionCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: <>{orderFilters}{renderOrdersTable(t('order.exceptionOrderDesc'))}</>,
          },
        ]}
      />

      {/* Risky action modal */}
      <Modal
        title={pendingAction?.type === 'cancel_refund' ? t('ordersv2.cancelRefundTitle') : t('ordersv2.releaseTitle')}
        open={!!pendingAction}
        onCancel={() => { setPendingAction(null); setActionReason(''); }}
        okText={pendingAction?.type === 'cancel_refund' ? t('order.cancelRefund') : t('order.approveRelease')}
        okButtonProps={{ danger: pendingAction?.type === 'cancel_refund', disabled: !actionReason.trim(), loading: cancelMutation.isPending || releaseMutation.isPending }}
        onOk={confirmRiskyAction} width={520}>
        {pendingAction && (
          <>
            <Alert type={pendingAction.type === 'cancel_refund' ? 'warning' : 'info'} showIcon style={{ marginBottom: 12 }} message={pendingAction.type === 'cancel_refund' ? t('ordersv2.cancelRefundWarning') : t('ordersv2.releaseWarning')} />
            <Descriptions column={2} size="small" style={{ marginBottom: 12 }} title={t('ordersv2.confirmEvidence')}>
              <Descriptions.Item label={t('order.orderNo')}>{pendingAction.order.orderNo}</Descriptions.Item>
              <Descriptions.Item label={t('order.store')}>{storeNameOf(pendingAction.order)}</Descriptions.Item>
              <Descriptions.Item label={t('order.buyer')}>{pendingAction.order.buyerName}</Descriptions.Item>
              <Descriptions.Item label={t('order.amount')}><Typography.Text strong>¥{pendingAction.order.amount.toFixed(2)}</Typography.Text></Descriptions.Item>
              <Descriptions.Item label={t('order.items')} span={2}>{pendingAction.order.items}</Descriptions.Item>
            </Descriptions>
            {pendingAction.order.exceptionReason && (
              <Card size="small" title={pendingAction.type === 'fraud_release' ? t('ordersv2.riskEvidence') : t('order.exceptionReason')} style={{ marginBottom: 12 }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{pendingAction.order.exceptionReason}</pre>
              </Card>
            )}
            <Typography.Text strong style={{ fontSize: 13 }}>{t('ordersv2.reasonLabel')}</Typography.Text>
            <Input.TextArea rows={3} style={{ marginTop: 8 }} value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder={t('ordersv2.reasonPlaceholder')} maxLength={200} showCount />
          </>
        )}
      </Modal>

      {/* Order detail modal */}
      <Modal
        title={detailOrder ? `${t('order.orderDetail')}: ${detailOrder.orderNo}` : ''}
        open={!!detailOrder}
        onCancel={() => setDetailOrder(null)}
        width={560}
        footer={
          <Space>
            {detailOrder && EXCEPTION_ORDER_STATUSES.includes(detailOrder.status) && (
              <>
                {detailOrder.status === 'exception' && (
                  <>
                    <Button icon={<MailOutlined />} onClick={() => { handleContactBuyer(detailOrder); setDetailOrder(null); }}>{t('order.contactBuyer')}</Button>
                    <Button danger icon={<CloseOutlined />} type="primary" onClick={() => openRiskyAction('cancel_refund', detailOrder)}>{t('order.cancelRefund')}</Button>
                  </>
                )}
                {detailOrder.status === 'fraud_blocked' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => openRiskyAction('fraud_release', detailOrder)}>{t('order.approveRelease')}</Button>
                )}
              </>
            )}
            <Button onClick={() => setDetailOrder(null)}>{t('common.close')}</Button>
          </Space>
        }>
        {detailOrder && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('order.store')}>{storeNameOf(detailOrder)}</Descriptions.Item>
              <Descriptions.Item label={t('order.status')}><Tag color={statusColors[detailOrder.status]}>{t(`order.status_${detailOrder.status}`)}</Tag></Descriptions.Item>
              <Descriptions.Item label={t('order.buyer')}>{detailOrder.buyerName}</Descriptions.Item>
              <Descriptions.Item label={t('order.amount')}><Typography.Text strong>¥{detailOrder.amount.toFixed(2)}</Typography.Text></Descriptions.Item>
              <Descriptions.Item label={t('order.createdAt')}>{dayjs(detailOrder.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              {slaOf(detailOrder).tone !== 'none' && (
                <Descriptions.Item label={t('ordersv2.slaColumn')}>
                  <Typography.Text strong style={{ color: SLA_TONE_COLOR[slaOf(detailOrder).tone] }}>{slaOf(detailOrder).label}</Typography.Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('order.logistics')}>
                {detailOrder.logisticsStatus ?? '—'}
                {detailOrder.trackingNo && <Typography.Text code style={{ marginLeft: 6, fontSize: 12 }}>{detailOrder.trackingNo}</Typography.Text>}
              </Descriptions.Item>
              <Descriptions.Item label={t('order.items')} span={2}>{detailOrder.items}</Descriptions.Item>
            </Descriptions>
            {detailOrder.recommendation && (
              <>
                <Divider />
                <Typography.Title level={5}><ThunderboltOutlined style={{ color: 'var(--ark-purple)', marginRight: 6 }} />{t('ordersv2.recommendationTitle')}</Typography.Title>
                <Card size="small" style={{ background: 'color-mix(in srgb, var(--ark-purple) 6%, var(--ark-panel))', border: '1px solid color-mix(in srgb, var(--ark-purple) 25%, var(--ark-panel))' }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space size={8} wrap>
                      <Typography.Text strong style={{ fontSize: 13 }}>{detailOrder.recommendation.label}</Typography.Text>
                      <Tag color="purple" style={{ margin: 0 }}>{t('ordersv2.recommendationConfidence', { value: Math.round(detailOrder.recommendation.confidence * 100) })}</Tag>
                    </Space>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{detailOrder.recommendation.rationale}</Typography.Text>
                  </Space>
                </Card>
              </>
            )}
            {detailOrder.exceptionReason && (
              <>
                <Divider />
                <Typography.Title level={5} style={{ color: 'var(--ark-red)' }}><ExclamationCircleOutlined /> {t('order.exceptionReason')}</Typography.Title>
                <Card size="small" style={{ background: 'color-mix(in srgb, var(--ark-red) 8%, var(--ark-panel))', border: '1px solid color-mix(in srgb, var(--ark-red) 35%, var(--ark-panel))' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{detailOrder.exceptionReason}</pre>
                </Card>
              </>
            )}
            <Divider />
            <Typography.Title level={5}>{t('order.timeline')}</Typography.Title>
            <Timeline items={detailOrder.timeline.map((e) => ({
              dot: timelineIcons[e.icon],
              color: e.icon === 'stop' ? 'red' : e.icon === 'warning' ? 'orange' : undefined,
              children: (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong style={{ fontSize: 13 }}>{e.title}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayjs(e.at).isValid() ? dayjs(e.at).format('MM-DD HH:mm') : e.at}</Typography.Text>
                  {e.note && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('ordersv2.reasonPrefix')}: {e.note}</Typography.Text>}
                  {e.estimated && <Typography.Text type="secondary" style={{ fontSize: 12 }}><TruckOutlined style={{ marginRight: 4 }} />{t('order.estimated')}: {e.estimated}</Typography.Text>}
                </Space>
              ),
            }))} />
            <Divider />
            <Typography.Title level={5}>{t('order.agentAction')}</Typography.Title>
            <Typography.Text style={{ fontSize: 13 }}>{detailOrder.agentAction}</Typography.Text>
          </>
        )}
      </Modal>
    </div>
  );
}