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
  ExclamationCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  MailOutlined,
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
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { AllMallId, Order, OrderStatus, OrderTimelineStep } from '../../types/domain';
import { AUTO_FLOW_ORDER_STATUSES, EXCEPTION_ORDER_STATUSES } from '../../types/domain';
import { parseAllMallId } from '../../utils/id';

type TabFilter = 'all' | 'exception' | 'auto';
type RiskyActionType = 'cancel_refund' | 'fraud_release';

/** A1 assumption: platform SLA in hours. */
const PLATFORM_SLA_HOURS: Record<string, number> = { pinduoduo: 48, taobao: 48, jd: 24 };

interface SlaInfo { remainingMs: number; tone: 'ok' | 'warning' | 'critical' | 'breached'; label: string; sortScore: number }

function getSlaForOrder(order: Order, now: dayjs.Dayjs): SlaInfo {
  // SLA only applies to orders in the pre-shipment flow
  if (!order.shipDeadlineAt) return { remainingMs: 0, tone: 'ok', label: '', sortScore: Number.MAX_SAFE_INTEGER };
  const deadline = dayjs(order.shipDeadlineAt);
  const remainingMs = deadline.diff(now);
  const sortScore = remainingMs; // lower = more urgent, breached = negative → sorts first
  if (remainingMs <= 0) return { remainingMs, tone: 'breached', label: '已超时', sortScore };
  if (remainingMs <= 2 * 3600000) return { remainingMs, tone: 'critical', label: `距超时 ${Math.ceil(remainingMs / 60000)} 分钟`, sortScore };
  if (remainingMs <= 6 * 3600000) return { remainingMs, tone: 'warning', label: `距超时 ${Math.ceil(remainingMs / 3600000)} 小时 ${Math.ceil((remainingMs % 3600000) / 60000)} 分`, sortScore };
  return { remainingMs, tone: 'ok', label: `${Math.ceil(remainingMs / 3600000)} 小时后`, sortScore };
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
  // Deep-link: /orders?order=<id> opens that order's detail modal on mount.
  const orderFromUrl = parseAllMallId(searchParams.get('order') ?? undefined);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: RiskyActionType; order: Order } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [digestExpanded, setDigestExpanded] = useState(false);

  // ---- Data layer ----------------------------------------------------------
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const storeNamesById = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);
  const storeNameOf = (order: Order) => storeNamesById.get(order.storeId) ?? '-';

  // ---- Clock ticker for SLA countdowns (30s, same pattern as InboxPage) ----
  const [clock, setClock] = useState(dayjs);
  useEffect(() => { const timer = setInterval(() => setClock(dayjs()), 30000); return () => clearInterval(timer); }, []);

  // ---- SLA map ------------------------------------------------------------
  const slaByOrderId = useMemo(() => {
    const map = new Map<AllMallId, SlaInfo>();
    for (const order of orders) {
      const sla = getSlaForOrder(order, clock);
      map.set(order.id, sla);
    }
    return map;
  }, [orders, clock]);

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
    // Sort: breached → critical → warning → ok → others, then newest first
    return [...items].sort((a, b) => {
      const sa = slaByOrderId.get(a.id)?.sortScore ?? Number.MAX_SAFE_INTEGER;
      const sb = slaByOrderId.get(b.id)?.sortScore ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });
  }, [orders, searchKw, storeFilter, dateRange, slaByOrderId]);

  const autoCountBase = baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length;
  const exceptionCountBase = baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length;
  const needsMeCount = exceptionCountBase + baseFiltered.filter((o) => {
    const sla = slaByOrderId.get(o.id);
    return sla?.tone === 'breached' || sla?.tone === 'critical';
  }).length;

  const filtered = useMemo(() => {
    if (tabFilter === 'auto') return baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status));
    if (tabFilter === 'exception') return baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status));
    return baseFiltered;
  }, [baseFiltered, tabFilter]);

  // Smart default: when there are exceptions/urgent items, land on "needs me" tab
  useEffect(() => {
    if (exceptionCountBase > 0) setTabFilter('exception');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auto-handled log: steps marked `automated`, most recent first
  const autoLogEntries = useMemo(() => {
    const entries: { text: string; at: string }[] = [];
    for (const order of orders) {
      for (const step of order.timeline) {
        if (step.automated) entries.push({ text: `${step.title} · ${order.orderNo}`, at: step.at });
      }
    }
    return entries.sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf()).slice(0, 20);
  }, [orders]);

  // ---- Mutations -----------------------------------------------------------
  const cancelMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) => ordersApi.cancelAndRefund(params.orderId, params.reason),
    onSuccess: () => { message.success(t('order.cancelledAndRefunded')); queryClient.invalidateQueries({ queryKey: ['orders'] }); setDetailOrder(null); setPendingAction(null); setActionReason(''); },
  });
  const releaseMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) => ordersApi.releaseFraud(params.orderId, params.reason),
    onSuccess: () => { message.success(t('order.fraudApproved')); queryClient.invalidateQueries({ queryKey: ['orders'] }); setDetailOrder(null); setPendingAction(null); setActionReason(''); },
  });
  const applyRecMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.applyRecommendation(orderId),
    onSuccess: () => { message.success(t('common.operationSuccess')); queryClient.invalidateQueries({ queryKey: ['orders'] }); },
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

  // ---- SLA color helpers ---------------------------------------------------
  const slaColor = (tone: SlaInfo['tone']) => tone === 'breached' ? 'var(--ark-red)' : tone === 'critical' ? 'var(--ark-orange)' : tone === 'warning' ? 'var(--ark-yellow, #d97706)' : 'var(--ark-muted)';

  // ---- Table columns -------------------------------------------------------
  const columns: ColumnsType<Order> = [
    { title: t('order.orderNo'), dataIndex: 'orderNo', width: 160, render: (no: string) => <Typography.Text code>{no}</Typography.Text> },
    { title: t('order.store'), dataIndex: 'storeId', width: 130, ellipsis: true, render: (id: number) => storeNamesById.get(id) ?? '-' },
    { title: t('order.buyer'), dataIndex: 'buyerName', width: 100, ellipsis: true },
    { title: t('order.items'), dataIndex: 'items', ellipsis: true, width: 170 },
    {
      title: t('order.amount'), dataIndex: 'amount', width: 80, align: 'right', sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => <Typography.Text strong>¥{v.toFixed(2)}</Typography.Text>,
    },
    {
      title: 'SLA', key: 'sla', width: 115,
      render: (_: unknown, record: Order) => {
        const sla = slaByOrderId.get(record.id);
        if (!sla || sla.tone === 'ok') return <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>;
        return <Typography.Text strong style={{ color: slaColor(sla.tone), fontSize: 12, whiteSpace: 'nowrap' }} title={sla.label}>{sla.label}</Typography.Text>;
      },
    },
    { title: t('order.status'), dataIndex: 'status', width: 100, render: (s: OrderStatus) => <Tag color={statusColors[s]}>{t(`order.status_${s}`)}</Tag> },
    {
      title: t('order.logistics'), dataIndex: 'logisticsStatus', width: 130, ellipsis: true,
      render: (status: string, record: Order) => (
        <Space direction="vertical" size={0}>
          {record.trackingNo ? <Typography.Text code style={{ fontSize: 11 }}>{record.trackingNo}</Typography.Text> : <Typography.Text type="secondary" style={{ fontSize: 11 }}>—</Typography.Text>}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{status}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('common.actions'), width: 200,
      render: (_: unknown, record: Order) => {
        const isException = EXCEPTION_ORDER_STATUSES.includes(record.status);
        const rec = record.recommendation;
        return (
          <TableActionGroup>
            {isException && rec && rec.action !== 'release' && rec.action !== 'cancel_refund' && (
              <Popconfirm title={rec.rationale} onConfirm={() => applyRecMutation.mutate(record.id)} okText={rec.label} cancelText={t('common.cancel')}>
                <Button size="small" type="primary" icon={<ThunderboltOutlined />} loading={applyRecMutation.isPending}>{rec.label}</Button>
              </Popconfirm>
            )}
            {isException && record.status === 'exception' && record.exceptionType !== 'fraud_suspected' && (
              <Button size="small" icon={<MailOutlined />} onClick={() => handleContactBuyer(record)}>{t('order.contactBuyer')}</Button>
            )}
            {isException && record.status === 'fraud_blocked' && (
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openRiskyAction('fraud_release', record)}>{t('order.approve')}</Button>
            )}
            {isException && record.status === 'exception' && (
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => openRiskyAction('cancel_refund', record)}>{t('order.cancelRefund')}</Button>
            )}
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailOrder(record)}>{t('common.view')}</Button>
          </TableActionGroup>
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
        <StoreConnectionEmptyState description="尚未同步订单。连接店铺后，历史订单和后续新增订单会汇总到这里。" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('order.title')}
        description={t('order.description')}
        actions={<Button icon={<SyncOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}>立即同步订单</Button>}
      />

      {/* O1: Fulfillment digest card */}
      <Card size="small" style={{ marginBottom: 16 }}
        styles={{ body: { padding: '8px 16px' } }}>
        <Space size={4} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size={4} wrap>
            <ThunderboltOutlined style={{ color: 'var(--ark-green)' }} />
            <Typography.Text>{totalCount} 单中 <Typography.Text strong style={{ color: 'var(--ark-green)' }}>AI 已自动履约 {autoHandled} 单</Typography.Text></Typography.Text>
            {needsMeCount > 0 ? (
              <Button type="link" size="small" onClick={() => setTabFilter('exception')} style={{ color: 'var(--ark-red)', padding: 0 }}>
                {needsMeCount} 单需要你决定 → 去处理
              </Button>
            ) : (
              <Typography.Text type="secondary">{cancelledCount} 单买家取消</Typography.Text>
            )}
          </Space>
          <Space size={4}>
            <HistoryOutlined style={{ color: 'var(--ark-muted)' }} />
            <Button type="link" size="small" onClick={() => setDigestExpanded(!digestExpanded)} style={{ padding: 0, fontSize: 11 }}>
              {t('products.autoHandledLog', { count: autoLogEntries.length })}
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>· 每 15 分钟自动检查</Typography.Text>
          </Space>
        </Space>
        {digestExpanded && autoLogEntries.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--ark-border-soft)', maxHeight: 200, overflowY: 'auto' }}>
            {autoLogEntries.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ark-muted)', padding: '2px 0' }}>
                <span><CheckCircleOutlined style={{ color: 'var(--ark-green)', marginRight: 4 }} />{e.text}</span>
                <span>{dayjs(e.at).isValid() ? dayjs(e.at).format('MM-DD HH:mm') : e.at}</span>
              </div>
            ))}
          </div>
        )}
        {autoLogEntries.length === 0 && (
          <Card size="small" style={{ marginTop: 16, textAlign: 'center' }}>
            <CheckCircleOutlined style={{ color: 'var(--ark-green)', fontSize: 32, marginBottom: 8, display: 'block' }} />
            <Typography.Title level={5} style={{ margin: 0 }}>今日订单全部自动履约完成</Typography.Title>
            <Typography.Text type="secondary">无需人工处理，系统已自动完成所有订单。</Typography.Text>
          </Card>
        )}
      </Card>

      {/* O2 SLA urgency line when something is at risk */}
      {baseFiltered.some((o) => { const s = slaByOrderId.get(o.id); return s?.tone === 'critical' || s?.tone === 'breached'; }) && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          message={`⏰ ${baseFiltered.filter((o) => { const s = slaByOrderId.get(o.id); return s?.tone === 'critical' || s?.tone === 'breached'; }).length} 单即将触达或已超时平台红线`}
          action={<Button size="small" onClick={() => setTabFilter('exception')}>立即处理</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Filter bar */}
      <PageFilterBar>
        <Input prefix={<SearchOutlined />} placeholder={t('order.searchPlaceholder')} allowClear value={searchKw} onChange={(e) => setSearchKw(e.target.value)} />
        <Select allowClear placeholder={t('order.filterStore')} value={storeFilter} onChange={setStoreFilter} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        <DatePicker.RangePicker size="middle" placeholder={[t('order.startDate'), t('order.endDate')]} onChange={(dates) => { if (dates && dates[0] && dates[1]) { setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]); } else { setDateRange(null); } }} />
      </PageFilterBar>

      <Tabs activeKey={tabFilter} onChange={(key) => setTabFilter(key as TabFilter)} items={[
        { key: 'all', label: <span><ShoppingCartOutlined /> {t('order.allOrders')} ({baseFiltered.length})</span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small', showTotal: (tCount: number) => `共 ${tCount} 条` }} scroll={{ x: 1200 }} /> },
        { key: 'auto', label: <span><ThunderboltOutlined /> {t('order.autoProcessedTab')}{autoCountBase > 0 && <Badge count={autoCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6, background: 'var(--ark-green)' }} />}</span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small', showTotal: (tCount: number) => `共 ${tCount} 条` }} scroll={{ x: 1200 }} description={t('order.autoProcessedDesc')} /> },
        { key: 'exception', label: <span><ExclamationCircleOutlined style={{ color: exceptionCountBase > 0 ? 'var(--ark-red)' : undefined }} /> {t('order.exceptionOrders')}{exceptionCountBase > 0 && <Badge count={exceptionCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}</span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small', showTotal: (tCount: number) => `共 ${tCount} 条` }} scroll={{ x: 1200 }} description={t('order.exceptionOrderDesc')} /> },
      ]} />

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
              <Descriptions.Item label={t('order.createdAt')}>{dayjs(detailOrder.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
              {detailOrder.trackingNo && <Descriptions.Item label={t('order.trackingNo')}><Typography.Text code>{detailOrder.trackingNo}</Typography.Text></Descriptions.Item>}
              <Descriptions.Item label={t('order.items')} span={2}>{detailOrder.items}</Descriptions.Item>
            </Descriptions>
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