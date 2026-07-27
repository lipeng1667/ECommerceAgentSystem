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
 * - 2026-07-27: D8/O0 — switched from inline mock data to ordersApi + TanStack Query,
 *   numeric AllMallIds, ISO timestamps.
 */
import {
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
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
import { useMemo, useState } from 'react';
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
import type { AllMallId, Order, OrderStatus } from '../../types/domain';
import { AUTO_FLOW_ORDER_STATUSES, EXCEPTION_ORDER_STATUSES } from '../../types/domain';
import { parseAllMallId } from '../../utils/id';

type TabFilter = 'all' | 'exception' | 'auto';
type RiskyActionType = 'cancel_refund' | 'fraud_release';

export function OrderAutomationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [searchKw, setSearchKw] = useState('');
  // parseAllMallId (not Number) so a non-numeric ?store= yields undefined instead of
  // NaN, which would match no order and silently empty the table.
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>(
    () => parseAllMallId(searchParams.get('store') ?? undefined)
  );
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: RiskyActionType; order: Order } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // ---- Data layer ----------------------------------------------------------
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });

  // Single source for store display names: the store list. `Order` carries only
  // storeId, so the page can never drift from what /stores shows.
  const storeNamesById = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);
  const storeNameOf = (order: Order) => storeNamesById.get(order.storeId) ?? '-';

  // ---- Mutations -----------------------------------------------------------
  const cancelMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) =>
      ordersApi.cancelAndRefund(params.orderId, params.reason),
    onSuccess: () => {
      message.success(t('order.cancelledAndRefunded'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDetailOrder(null); setPendingAction(null); setActionReason('');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (params: { orderId: number; reason: string }) =>
      ordersApi.releaseFraud(params.orderId, params.reason),
    onSuccess: () => {
      message.success(t('order.fraudApproved'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDetailOrder(null); setPendingAction(null); setActionReason('');
    },
  });

  const openRiskyAction = (type: RiskyActionType, order: Order) => {
    setActionReason('');
    setPendingAction({ type, order });
  };

  const confirmRiskyAction = () => {
    if (!pendingAction || !actionReason.trim()) return;
    if (pendingAction.type === 'cancel_refund') {
      cancelMutation.mutate({ orderId: pendingAction.order.id, reason: actionReason.trim() });
    } else {
      releaseMutation.mutate({ orderId: pendingAction.order.id, reason: actionReason.trim() });
    }
  };

  const handleContactBuyer = (order: Order) => {
    message.info(`${t('order.contactBuyerMsg')}: ${order.buyerName} (${order.orderNo})`);
  };

  // ---- Filtering -----------------------------------------------------------
  const baseFiltered = useMemo(() => {
    let items = orders;
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      items = items.filter((o) => o.orderNo.toLowerCase().includes(kw) || o.buyerName.toLowerCase().includes(kw) || o.items.toLowerCase().includes(kw) || (o.trackingNo && o.trackingNo.toLowerCase().includes(kw)));
    }
    if (storeFilter != null) items = items.filter((o) => o.storeId === storeFilter);
    if (dateRange) {
      // createdAt is an ISO instant; compare on the local calendar day the picker
      // works in. A raw string compare would drop same-day orders (ISO carries a
      // time component) and could shift the day for early-morning local orders.
      items = items.filter((o) => {
        const day = dayjs(o.createdAt).format('YYYY-MM-DD');
        return day >= dateRange[0] && day <= dateRange[1];
      });
    }
    return items;
  }, [orders, searchKw, storeFilter, dateRange]);

  const autoCountBase = baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length;
  const exceptionCountBase = baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length;

  const filtered = useMemo(() => {
    if (tabFilter === 'auto') return baseFiltered.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status));
    if (tabFilter === 'exception') return baseFiltered.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status));
    return baseFiltered;
  }, [baseFiltered, tabFilter]);

  const totalCount = orders.length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const autoHandled = orders.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length;
  const exceptionCount = orders.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length;
  const rateDenominator = totalCount - cancelledCount;
  const autoRate = rateDenominator > 0 ? Math.round((autoHandled / rateDenominator) * 100) : 0;

  const statusColors: Record<OrderStatus, string> = {
    auto_processing: 'blue', awaiting_shipment: 'geekblue', auto_shipped: 'cyan',
    auto_completed: 'green', exception: 'orange', fraud_blocked: 'red', cancelled: 'default',
  };

  // ---- Table columns -------------------------------------------------------
  const columns: ColumnsType<Order> = [
    { title: t('order.orderNo'), dataIndex: 'orderNo', width: 160, render: (no: string) => <Typography.Text code>{no}</Typography.Text> },
    { title: t('order.store'), dataIndex: 'storeId', width: 150, ellipsis: true, render: (id: number) => storeNamesById.get(id) ?? '-' },
    { title: t('order.buyer'), dataIndex: 'buyerName', width: 120, ellipsis: true },
    { title: t('order.items'), dataIndex: 'items', ellipsis: true, width: 180 },
    { title: t('order.amount'), dataIndex: 'amount', width: 80, align: 'right', render: (v: number) => <Typography.Text strong>¥{v.toFixed(2)}</Typography.Text> },
    { title: t('order.status'), dataIndex: 'status', width: 110, render: (s: OrderStatus) => <Tag color={statusColors[s]}>{t(`order.status_${s}`)}</Tag> },
    {
      title: t('order.logistics'), dataIndex: 'logisticsStatus', width: 140, ellipsis: true,
      render: (status: string, record: Order) => (
        <Space direction="vertical" size={0}>
          {record.trackingNo ? <Typography.Text code style={{ fontSize: 12 }}>{record.trackingNo}</Typography.Text> : <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{status}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('common.actions'), width: 160,
      render: (_: unknown, record: Order) => (
        <TableActionGroup>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailOrder(record)}>{t('common.view')}</Button>
          {EXCEPTION_ORDER_STATUSES.includes(record.status) && (
            <>
              {record.exceptionType === 'fraud_suspected' ? (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openRiskyAction('fraud_release', record)}>{t('order.approve')}</Button>
              ) : (
                <Button size="small" danger icon={<CloseOutlined />} onClick={() => openRiskyAction('cancel_refund', record)}>{t('order.cancelRefund')}</Button>
              )}
            </>
          )}
        </TableActionGroup>
      ),
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
      <PageHeader title={t('order.title')} description={t('order.description')} />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><MetricCard title={t('order.totalToday')} value={totalCount} prefix={<ShoppingCartOutlined />} /></Col>
        <Col xs={12} sm={6}>
          <MetricCard title={t('order.autoProcessed')} value={autoHandled} valueStyle={{ color: 'var(--ark-green)' }} prefix={<ThunderboltOutlined />}
            suffix={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('ordersv2.autoRateNote', { rate: autoRate })}</Typography.Text>} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard title={t('order.exceptionCount')} value={exceptionCount} valueStyle={{ color: exceptionCount > 0 ? 'var(--ark-orange)' : 'var(--ark-green)' }} prefix={<ExclamationCircleOutlined />} />
        </Col>
        <Col xs={12} sm={6}><MetricCard title={t('ordersv2.cardCancelled')} value={cancelledCount} valueStyle={{ color: 'var(--ark-muted)' }} prefix={<CloseOutlined />} /></Col>
      </Row>

      <PageFilterBar variant="card">
        <Input prefix={<SearchOutlined />} placeholder={t('order.searchPlaceholder')} allowClear value={searchKw} onChange={(e) => setSearchKw(e.target.value)} />
        <Select allowClear placeholder={t('order.filterStore')} value={storeFilter} onChange={setStoreFilter} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        <DatePicker.RangePicker size="middle" placeholder={[t('order.startDate'), t('order.endDate')]} onChange={(dates) => { if (dates && dates[0] && dates[1]) { setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]); } else { setDateRange(null); } }} />
      </PageFilterBar>

      <Tabs activeKey={tabFilter} onChange={(key) => setTabFilter(key as TabFilter)} items={[
        { key: 'all', label: <span><ShoppingCartOutlined /> {t('order.allOrders')} ({baseFiltered.length})</span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small' }} scroll={{ x: 1120 }} /> },
        { key: 'auto', label: <span><ThunderboltOutlined /> {t('order.autoProcessedTab')}<Badge count={autoCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6, background: 'var(--ark-green)' }} /></span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small' }} scroll={{ x: 1120 }} description={t('order.autoProcessedDesc')} /> },
        { key: 'exception', label: <span><ExclamationCircleOutlined style={{ color: exceptionCountBase > 0 ? 'var(--ark-red)' : undefined }} /> {t('order.exceptionOrders')}{exceptionCountBase > 0 && <Badge count={exceptionCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}</span>, children: <DataTableCard<Order> rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 15, size: 'small' }} scroll={{ x: 1120 }} description={t('order.exceptionOrderDesc')} /> },
      ]} />

      {/* Risky action modal */}
      <Modal
        title={pendingAction?.type === 'cancel_refund' ? t('ordersv2.cancelRefundTitle') : t('ordersv2.releaseTitle')}
        open={!!pendingAction}
        onCancel={() => { setPendingAction(null); setActionReason(''); }}
        okText={pendingAction?.type === 'cancel_refund' ? t('order.cancelRefund') : t('order.approveRelease')}
        okButtonProps={{ danger: pendingAction?.type === 'cancel_refund', disabled: !actionReason.trim(), loading: cancelMutation.isPending || releaseMutation.isPending }}
        onOk={confirmRiskyAction}
        width={520}
      >
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
        }
      >
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
                {/* color-mix over the red token — the repo has no --ark-red-soft/-light
                    tokens, and referencing missing vars silently drops the tint. */}
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