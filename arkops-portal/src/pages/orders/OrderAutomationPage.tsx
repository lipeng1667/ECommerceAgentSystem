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
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';

type OrderStatus = 'auto_processing' | 'awaiting_shipment' | 'auto_shipped' | 'auto_completed' | 'exception' | 'fraud_blocked' | 'cancelled';

/** Statuses handled end-to-end by automation (cancellations are deliberately excluded, C6). */
const AUTO_FLOW_STATUSES: OrderStatus[] = ['auto_processing', 'awaiting_shipment', 'auto_shipped', 'auto_completed'];
const EXCEPTION_STATUSES: OrderStatus[] = ['exception', 'fraud_blocked'];

interface TimelineStep {
  title: string;
  at: string;
  icon: string;
  estimated?: string;
  /** Operator-entered reason recorded with manual interventions (C6). */
  note?: string;
}

interface OrderItem {
  id: string;
  orderNo: string;
  storeName: string;
  buyerName: string;
  items: string;
  amount: number;
  status: OrderStatus;
  trackingNo?: string;
  logisticsStatus?: string;
  exceptionReason?: string;
  exceptionType?: 'address_invalid' | 'fraud_suspected' | 'out_of_stock' | 'payment_failed' | 'buyer_dispute';
  agentAction: string;
  createdAt: string;
  timeline: TimelineStep[];
}

const storeNames = ['拼多多旗舰店', '淘宝户外用品店', '京东自营店'];

const orders: OrderItem[] = [
  {
    id: 'ord_001', orderNo: '#ORD-2406-0820',
    storeName: '拼多多旗舰店', buyerName: '李女士',
    items: '蓝牙耳机 Pro ×1', amount: 39.99,
    status: 'auto_completed', trackingNo: '1Z999AA1234567890',
    logisticsStatus: '已签收',
    agentAction: '签收确认 → 自动完结 → 触发好评邀请',
    createdAt: '2026-06-20',
    timeline: [
      { title: '付款确认', at: '06-20 10:30', icon: 'check' },
      { title: '风控通过', at: '06-20 10:30', icon: 'shield' },
      { title: '自动发货', at: '06-20 11:00', icon: 'truck' },
      { title: '物流签收', at: '06-21 09:00', icon: 'check' },
      { title: '自动完结', at: '06-21 09:05', icon: 'check' },
    ],
  },
  {
    id: 'ord_002', orderNo: '#ORD-2406-0821',
    storeName: '淘宝户外用品店', buyerName: '张先生',
    items: '折叠露营椅 ×2, LED 露营灯 ×1', amount: 115.97,
    status: 'auto_shipped', trackingNo: '1Z999AA0987654321',
    logisticsStatus: '运输中 · 预计 6 月 24 日送达',
    agentAction: '智能分仓 → 华东仓发货 → 已创建运单',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 08:15', icon: 'check' },
      { title: '风控通过', at: '06-21 08:15', icon: 'shield' },
      { title: '智能分仓 华东仓', at: '06-21 08:16', icon: 'sync' },
      { title: '创建运单', at: '06-21 08:30', icon: 'truck' },
      { title: '预计送达', at: '06-24', icon: 'truck', estimated: '06-24 18:00' },
    ],
  },
  {
    id: 'ord_003', orderNo: '#ORD-2406-0822',
    storeName: '京东自营店', buyerName: '陈女士',
    items: '定制手机壳 ×3', amount: 38.97,
    status: 'awaiting_shipment', trackingNo: undefined,
    logisticsStatus: '待发货',
    agentAction: '付款确认，库存分配完成，等待创建运单发货',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 14:00', icon: 'check' },
      { title: '风控通过', at: '06-21 14:00', icon: 'shield' },
      { title: '库存分配完成', at: '06-21 14:01', icon: 'sync' },
      { title: '待发货', at: '预计 06-21 18:00 前', icon: 'truck', estimated: '06-21 18:00' },
    ],
  },
  {
    id: 'ord_004', orderNo: '#ORD-2406-0823',
    storeName: '拼多多旗舰店', buyerName: '王先生',
    items: '65W GaN 充电器 ×2', amount: 39.98,
    status: 'exception', exceptionType: 'address_invalid', trackingNo: undefined,
    logisticsStatus: '—',
    exceptionReason: '收货地址缺少门牌号，物流商暂无法配送。\n建议联系买家补充完整地址或取消订单。',
    agentAction: '自动拦截 → 推送到异常列表待运营处理',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 14:30', icon: 'check' },
      { title: '地址校验失败', at: '06-21 14:30', icon: 'warning' },
      { title: '自动拦截', at: '06-21 14:31', icon: 'stop' },
    ],
  },
  {
    id: 'ord_005', orderNo: '#ORD-2406-0824',
    storeName: '淘宝户外用品店', buyerName: '匿名买家',
    items: '户外登山包 40L ×3', amount: 137.97,
    status: 'fraud_blocked', exceptionType: 'fraud_suspected', trackingNo: undefined,
    logisticsStatus: '—',
    exceptionReason: '高风险标记（3/5 规则命中）:\n• 新注册账号（注册不足 7 天）\n• 支付账号实名信息与收货人不一致\n• 单笔购买 3 件高单价商品',
    agentAction: '风控命中多项规则 → 自动阻断 → 等待人工审核',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 02:15', icon: 'check' },
      { title: '风控命中 3/5 规则', at: '06-21 02:15', icon: 'warning' },
      { title: '自动阻断', at: '06-21 02:16', icon: 'stop' },
    ],
  },
  {
    id: 'ord_006', orderNo: '#ORD-2406-0825',
    storeName: '拼多多旗舰店', buyerName: '刘先生',
    items: '运动挂脖耳机 ×1', amount: 24.99,
    status: 'cancelled', trackingNo: undefined,
    logisticsStatus: '—',
    agentAction: '买家主动取消（付款后 5 分钟内）→ 自动退款已发起',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 16:00', icon: 'check' },
      { title: '买家取消订单', at: '06-21 16:03', icon: 'close' },
      { title: '自动退款', at: '06-21 16:04', icon: 'check' },
    ],
  },
  {
    id: 'ord_007', orderNo: '#ORD-2406-0826',
    storeName: '京东自营店', buyerName: '赵女士',
    items: 'LED 露营灯 ×2', amount: 31.98,
    status: 'auto_processing', trackingNo: undefined,
    logisticsStatus: '处理中',
    agentAction: '付款确认 → 风控校验中 → 智能分仓计算中',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 17:20', icon: 'check' },
      { title: '风控校验中', at: '06-21 17:20', icon: 'sync' },
    ],
  },
];

type RiskyActionType = 'cancel_refund' | 'fraud_release';

export function OrderAutomationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tabFilter, setTabFilter] = useState<'all' | 'exception' | 'auto'>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() =>
    orders.map((order) => ({ ...order, timeline: [...order.timeline] }))
  );
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);
  const [searchKw, setSearchKw] = useState('');
  const [storeFilter, setStoreFilter] = useState<string | undefined>(() => {
    const fromParam = searchParams.get('store');
    return fromParam && storeNames.includes(fromParam) ? fromParam : undefined;
  });
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 高风险操作确认（C6/1.2）：取消退款 & 风控放行都必须带原因确认
  const [pendingAction, setPendingAction] = useState<{ type: RiskyActionType; order: OrderItem } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const openRiskyAction = (type: RiskyActionType, order: OrderItem) => {
    setActionReason('');
    setPendingAction({ type, order });
  };

  const executeCancelAndRefund = (order: OrderItem, reason: string) => {
    const actionAt = new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setOrderItems((items) =>
      items.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: 'cancelled',
              agentAction: `${t('ordersv2.timelineCancelled')} — ${actionAt}`,
              timeline: [
                ...item.timeline,
                { title: t('ordersv2.timelineCancelled'), at: actionAt, icon: 'close', note: reason },
                { title: t('ordersv2.timelineRefundStarted'), at: actionAt, icon: 'check' }
              ]
            }
          : item
      )
    );
    message.success(`${t('order.cancelledAndRefunded')}: ${order.orderNo}`);
    setDetailOrder(null);
  };

  const executeFraudRelease = (order: OrderItem, reason: string) => {
    const actionAt = new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const estimatedAt = new Date(Date.now() + 2 * 3600000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setOrderItems((items) =>
      items.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: 'awaiting_shipment',
              agentAction: '运营人工审核通过 → 订单放行，进入正常发货流程',
              exceptionReason: undefined,
              exceptionType: undefined,
              timeline: [
                ...item.timeline,
                { title: t('ordersv2.timelineReleased'), at: actionAt, icon: 'check', note: reason },
                { title: t('ordersv2.timelineToShipping'), at: '预计 2 小时内', icon: 'sync', estimated: estimatedAt }
              ]
            }
          : item
      )
    );
    message.success(`${t('order.fraudApproved')}: ${order.orderNo}`);
    setDetailOrder(null);
  };

  const confirmRiskyAction = () => {
    if (!pendingAction || !actionReason.trim()) return;
    if (pendingAction.type === 'cancel_refund') {
      executeCancelAndRefund(pendingAction.order, actionReason.trim());
    } else {
      executeFraudRelease(pendingAction.order, actionReason.trim());
    }
    setPendingAction(null);
    setActionReason('');
  };

  const handleContactBuyer = (order: OrderItem) => {
    message.info(`${t('order.contactBuyerMsg')}: ${order.buyerName} (${order.orderNo})`);
  };

  // 单一状态轴：搜索/店铺/日期先收敛出基础集合，Tab 计数与表格都基于它（C6/4.8）
  const baseFiltered = useMemo(() => {
    let items = orderItems;
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      items = items.filter((o) =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.buyerName.toLowerCase().includes(kw) ||
        o.items.toLowerCase().includes(kw) ||
        (o.trackingNo && o.trackingNo.toLowerCase().includes(kw))
      );
    }
    if (storeFilter) items = items.filter((o) => o.storeName === storeFilter);
    if (dateRange) {
      items = items.filter((o) => o.createdAt >= dateRange[0] && o.createdAt <= dateRange[1]);
    }
    return items;
  }, [orderItems, searchKw, storeFilter, dateRange]);

  const autoCountBase = baseFiltered.filter((o) => AUTO_FLOW_STATUSES.includes(o.status)).length;
  const exceptionCountBase = baseFiltered.filter((o) => EXCEPTION_STATUSES.includes(o.status)).length;

  const filtered = useMemo(() => {
    if (tabFilter === 'auto') return baseFiltered.filter((o) => AUTO_FLOW_STATUSES.includes(o.status));
    if (tabFilter === 'exception') return baseFiltered.filter((o) => EXCEPTION_STATUSES.includes(o.status));
    return baseFiltered;
  }, [baseFiltered, tabFilter]);

  // 顶部统计：始终基于全量订单；自动化率剔除取消单（C6）
  const totalCount = orderItems.length;
  const cancelledCount = orderItems.filter((o) => o.status === 'cancelled').length;
  const autoHandled = orderItems.filter((o) => AUTO_FLOW_STATUSES.includes(o.status)).length;
  const exceptionCount = orderItems.filter((o) => EXCEPTION_STATUSES.includes(o.status)).length;
  const rateDenominator = totalCount - cancelledCount;
  const autoRate = rateDenominator > 0 ? Math.round((autoHandled / rateDenominator) * 100) : 0;

  const statusColors: Record<string, string> = {
    auto_processing: 'blue',
    awaiting_shipment: 'geekblue',
    auto_shipped: 'cyan',
    auto_completed: 'green',
    exception: 'orange',
    fraud_blocked: 'red',
    cancelled: 'default',
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: t('order.orderNo'),
      dataIndex: 'orderNo',
      width: 160,
      render: (no: string) => <Typography.Text code>{no}</Typography.Text>,
    },
    {
      title: t('order.store'),
      dataIndex: 'storeName',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('order.buyer'),
      dataIndex: 'buyerName',
      width: 120,
      ellipsis: true,
      render: (name: string) => <Typography.Text>{name}</Typography.Text>,
    },
    {
      title: t('order.items'),
      dataIndex: 'items',
      ellipsis: true,
      width: 180,
    },
    {
      title: t('order.amount'),
      dataIndex: 'amount',
      width: 80,
      align: 'right',
      render: (v: number) => <Typography.Text strong>¥{v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('order.status'),
      dataIndex: 'status',
      width: 110,
      render: (s: string) => <Tag color={statusColors[s]}>{t(`order.status_${s}`)}</Tag>,
    },
    {
      title: t('order.logistics'),
      dataIndex: 'logisticsStatus',
      width: 140,
      ellipsis: true,
      render: (status: string, record: OrderItem) => (
        <Space direction="vertical" size={0}>
          {record.trackingNo ? (
            <Typography.Text code style={{ fontSize: 12 }}>{record.trackingNo}</Typography.Text>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{status}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      width: 160,
      render: (_: unknown, record: OrderItem) => (
        <TableActionGroup>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailOrder(record)}>
            {t('common.view')}
          </Button>
          {EXCEPTION_STATUSES.includes(record.status) && (
            <>
              {record.exceptionType === 'fraud_suspected' ? (
                <Button
                  size="small" type="primary" icon={<CheckCircleOutlined />}
                  onClick={() => openRiskyAction('fraud_release', record)}
                >
                  {t('order.approve')}
                </Button>
              ) : (
                <Button
                  size="small" danger icon={<CloseOutlined />}
                  onClick={() => openRiskyAction('cancel_refund', record)}
                >
                  {t('order.cancelRefund')}
                </Button>
              )}
            </>
          )}
        </TableActionGroup>
      ),
    },
  ];

  const timelineIcons: Record<string, JSX.Element> = {
    check: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
    shield: <SecurityScanOutlined style={{ color: '#2563eb' }} />,
    truck: <TruckOutlined style={{ color: '#7c3aed' }} />,
    sync: <SyncOutlined style={{ color: '#2563eb' }} />,
    warning: <ExclamationCircleOutlined style={{ color: '#ea580c' }} />,
    stop: <StopOutlined style={{ color: '#dc2626' }} />,
    close: <ExclamationCircleOutlined style={{ color: '#64748b' }} />,
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
      />

      {/* 自动化统计（自动数量与自动化率合并为一张卡，取消单不计入比率，C6） */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <MetricCard title={t('order.totalToday')} value={totalCount} prefix={<ShoppingCartOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title={t('order.autoProcessed')}
            value={autoHandled}
            valueStyle={{ color: '#16a34a' }}
            prefix={<ThunderboltOutlined />}
            suffix={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('ordersv2.autoRateNote', { rate: autoRate })}</Typography.Text>}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title={t('order.exceptionCount')}
            value={exceptionCount}
            valueStyle={{ color: exceptionCount > 0 ? '#ea580c' : '#16a34a' }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title={t('ordersv2.cardCancelled')}
            value={cancelledCount}
            valueStyle={{ color: '#64748b' }}
            prefix={<CloseOutlined />}
          />
        </Col>
      </Row>

      {/* 搜索与筛选栏（状态筛选统一收敛到下方 Tab 单轴，C6） */}
      <PageFilterBar variant="card">
            <Input
              prefix={<SearchOutlined />}
              placeholder={t('order.searchPlaceholder')}
              allowClear
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
            />
            <Select
              allowClear
              placeholder={t('order.filterStore')}
              value={storeFilter}
              onChange={setStoreFilter}
              options={storeNames.map((s) => ({ value: s, label: s }))}
            />
            <DatePicker.RangePicker
              size="middle"
              placeholder={[t('order.startDate'), t('order.endDate')]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                } else {
                  setDateRange(null);
                }
              }}
            />
      </PageFilterBar>

      <Tabs
        activeKey={tabFilter}
        onChange={(key) => setTabFilter(key as 'all' | 'exception' | 'auto')}
        items={[
          {
            key: 'all',
            label: <span><ShoppingCartOutlined /> {t('order.allOrders')} ({baseFiltered.length})</span>,
            children: (
              <DataTableCard<OrderItem>
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 15, size: 'small' }}
                scroll={{ x: 1120 }}
              />
            ),
          },
          {
            key: 'auto',
            label: (
              <span>
                <ThunderboltOutlined /> {t('order.autoProcessedTab')}
                <Badge count={autoCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6, background: '#16a34a' }} />
              </span>
            ),
            children: (
              <DataTableCard<OrderItem>
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 15, size: 'small' }}
                scroll={{ x: 1120 }}
                description={t('order.autoProcessedDesc')}
              />
            ),
          },
          {
            key: 'exception',
            label: (
              <span>
                <ExclamationCircleOutlined style={{ color: exceptionCountBase > 0 ? '#dc2626' : undefined }} /> {t('order.exceptionOrders')}
                {exceptionCountBase > 0 && <Badge count={exceptionCountBase} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: (
              <DataTableCard<OrderItem>
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 15, size: 'small' }}
                scroll={{ x: 1120 }}
                description={t('order.exceptionOrderDesc')}
              />
            ),
          },
        ]}
      />

      {/* 高风险操作确认弹窗：证据 + 必填原因，写入订单时间线（C6/1.2） */}
      <Modal
        title={pendingAction?.type === 'cancel_refund' ? t('ordersv2.cancelRefundTitle') : t('ordersv2.releaseTitle')}
        open={!!pendingAction}
        onCancel={() => { setPendingAction(null); setActionReason(''); }}
        okText={pendingAction?.type === 'cancel_refund' ? t('order.cancelRefund') : t('order.approveRelease')}
        okButtonProps={{ danger: pendingAction?.type === 'cancel_refund', disabled: !actionReason.trim() }}
        onOk={confirmRiskyAction}
        width={520}
      >
        {pendingAction && (
          <>
            <Alert
              type={pendingAction.type === 'cancel_refund' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 12 }}
              message={pendingAction.type === 'cancel_refund' ? t('ordersv2.cancelRefundWarning') : t('ordersv2.releaseWarning')}
            />
            <Descriptions column={2} size="small" style={{ marginBottom: 12 }} title={t('ordersv2.confirmEvidence')}>
              <Descriptions.Item label={t('order.orderNo')}>{pendingAction.order.orderNo}</Descriptions.Item>
              <Descriptions.Item label={t('order.store')}>{pendingAction.order.storeName}</Descriptions.Item>
              <Descriptions.Item label={t('order.buyer')}>{pendingAction.order.buyerName}</Descriptions.Item>
              <Descriptions.Item label={t('order.amount')}>
                <Typography.Text strong>¥{pendingAction.order.amount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('order.items')} span={2}>{pendingAction.order.items}</Descriptions.Item>
            </Descriptions>
            {pendingAction.order.exceptionReason && (
              <Card
                size="small"
                title={pendingAction.type === 'fraud_release' ? t('ordersv2.riskEvidence') : t('order.exceptionReason')}
                style={{ marginBottom: 12 }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{pendingAction.order.exceptionReason}</pre>
              </Card>
            )}
            <Typography.Text strong style={{ fontSize: 13 }}>{t('ordersv2.reasonLabel')}</Typography.Text>
            <Input.TextArea
              rows={3}
              style={{ marginTop: 8 }}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={t('ordersv2.reasonPlaceholder')}
              maxLength={200}
              showCount
            />
          </>
        )}
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title={detailOrder ? `${t('order.orderDetail')}: ${detailOrder.orderNo}` : ''}
        open={!!detailOrder}
        onCancel={() => setDetailOrder(null)}
        width={560}
        footer={
          <Space>
            {detailOrder && EXCEPTION_STATUSES.includes(detailOrder.status) && (
              <>
                {detailOrder.status === 'exception' && (
                  <>
                    <Button icon={<MailOutlined />} onClick={() => { handleContactBuyer(detailOrder); setDetailOrder(null); }}>
                      {t('order.contactBuyer')}
                    </Button>
                    <Button danger icon={<CloseOutlined />} type="primary" onClick={() => openRiskyAction('cancel_refund', detailOrder)}>
                      {t('order.cancelRefund')}
                    </Button>
                  </>
                )}
                {detailOrder.status === 'fraud_blocked' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => openRiskyAction('fraud_release', detailOrder)}>
                    {t('order.approveRelease')}
                  </Button>
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
              <Descriptions.Item label={t('order.store')}>{detailOrder.storeName}</Descriptions.Item>
              <Descriptions.Item label={t('order.status')}>
                <Tag color={statusColors[detailOrder.status]}>{t(`order.status_${detailOrder.status}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('order.buyer')}>{detailOrder.buyerName}</Descriptions.Item>
              <Descriptions.Item label={t('order.amount')}>
                <Typography.Text strong>¥{detailOrder.amount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('order.createdAt')}>{detailOrder.createdAt}</Descriptions.Item>
              {detailOrder.trackingNo && (
                <Descriptions.Item label={t('order.trackingNo')}>
                  <Typography.Text code>{detailOrder.trackingNo}</Typography.Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('order.items')} span={2}>{detailOrder.items}</Descriptions.Item>
            </Descriptions>

            {detailOrder.exceptionReason && (
              <>
                <Divider />
                <Typography.Title level={5} style={{ color: '#dc2626' }}>
                  <ExclamationCircleOutlined /> {t('order.exceptionReason')}
                </Typography.Title>
                <Card size="small" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{detailOrder.exceptionReason}</pre>
                </Card>
              </>
            )}

            <Divider />
            <Typography.Title level={5}>{t('order.timeline')}</Typography.Title>
            <Timeline
              items={detailOrder.timeline.map((e) => ({
                dot: timelineIcons[e.icon],
                color: e.icon === 'stop' ? 'red' : e.icon === 'warning' ? 'orange' : undefined,
                children: (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong style={{ fontSize: 13 }}>{e.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {e.at}
                    </Typography.Text>
                    {e.note && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {t('ordersv2.reasonPrefix')}: {e.note}
                      </Typography.Text>
                    )}
                    {e.estimated && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <TruckOutlined style={{ marginRight: 4 }} />{t('order.estimated')}: {e.estimated}
                      </Typography.Text>
                    )}
                  </Space>
                ),
              }))}
            />

            <Divider />
            <Typography.Title level={5}>{t('order.agentAction')}</Typography.Title>
            <Typography.Text style={{ fontSize: 13 }}>{detailOrder.agentAction}</Typography.Text>
          </>
        )}
      </Modal>
    </div>
  );
}
