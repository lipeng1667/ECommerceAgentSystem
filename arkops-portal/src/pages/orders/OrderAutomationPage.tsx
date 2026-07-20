import {
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  LineChartOutlined,
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
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';

type OrderStatus = 'auto_processing' | 'awaiting_shipment' | 'auto_shipped' | 'auto_completed' | 'exception' | 'fraud_blocked' | 'cancelled';

interface TimelineStep {
  title: string;
  at: string;
  icon: string;
  estimated?: string;
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

const storeNames = ['TikTok Shop 美国旗舰店', 'Amazon 户外用品店', 'Shopify 独立站'];

const orders: OrderItem[] = [
  {
    id: 'ord_001', orderNo: '#ORD-2406-0820',
    storeName: 'TikTok Shop 美国旗舰店', buyerName: 'Jessica Lee',
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
    storeName: 'Amazon 户外用品店', buyerName: 'Mark Thompson',
    items: '折叠露营椅 ×2, LED 露营灯 ×1', amount: 115.97,
    status: 'auto_shipped', trackingNo: '1Z999AA0987654321',
    logisticsStatus: '运输中 · 预计 6 月 24 日送达',
    agentAction: '智能分仓 → US-East 仓发货 → 已创建运单',
    createdAt: '2026-06-21',
    timeline: [
      { title: '付款确认', at: '06-21 08:15', icon: 'check' },
      { title: '风控通过', at: '06-21 08:15', icon: 'shield' },
      { title: '智能分仓 US-East', at: '06-21 08:16', icon: 'sync' },
      { title: '创建运单', at: '06-21 08:30', icon: 'truck' },
      { title: '预计送达', at: '06-24', icon: 'truck', estimated: '06-24 18:00' },
    ],
  },
  {
    id: 'ord_003', orderNo: '#ORD-2406-0822',
    storeName: 'Shopify 独立站', buyerName: 'Sophie Chen',
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
    storeName: 'TikTok Shop 美国旗舰店', buyerName: 'PO Box 8842',
    items: '65W GaN 充电器 ×2', amount: 39.98,
    status: 'exception', exceptionType: 'address_invalid', trackingNo: undefined,
    logisticsStatus: '—',
    exceptionReason: '收货地址含 PO Box，USPS/FedEx 均不支持配送。\n建议联系买家获取街道地址或取消退款。',
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
    storeName: 'Amazon 户外用品店', buyerName: 'Anonymous Buyer',
    items: '户外登山包 40L ×3', amount: 137.97,
    status: 'fraud_blocked', exceptionType: 'fraud_suspected', trackingNo: undefined,
    logisticsStatus: '—',
    exceptionReason: '高风险标记（3/5 规则命中）:\n• 新注册账号（注册不足 7 天）\n• 发卡行位于菲律宾，收货地为美国\n• 单笔购买 3 件高单价商品',
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
    storeName: 'TikTok Shop 美国旗舰店', buyerName: 'David Kim',
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
];

export function OrderAutomationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [tabFilter, setTabFilter] = useState<'all' | 'exception' | 'auto'>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() =>
    orders.map((order) => ({ ...order, timeline: [...order.timeline] }))
  );
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);
  const [searchKw, setSearchKw] = useState('');
  const [storeFilter, setStoreFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 处理异常订单操作
  const handleCancelAndRefund = (order: OrderItem) => {
    const actionAt = new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setOrderItems((items) =>
      items.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: 'cancelled',
              agentAction: `运营取消并退款 — ${actionAt}`,
              timeline: [
                ...item.timeline,
                { title: '运营取消并退款', at: actionAt, icon: 'close' },
                { title: '退款已发起', at: actionAt, icon: 'check' }
              ]
            }
          : item
      )
    );
    message.success(`${t('order.cancelledAndRefunded')}: ${order.orderNo}`);
    setDetailOrder(null);
  };

  const handleContactBuyer = (order: OrderItem) => {
    message.info(`${t('order.contactBuyerMsg')}: ${order.buyerName} (${order.orderNo})`);
  };

  const handleApproveFraud = (order: OrderItem) => {
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
                { title: '人工审核通过', at: actionAt, icon: 'check' },
                { title: '进入发货流程', at: '预计 2 小时内', icon: 'sync', estimated: estimatedAt }
              ]
            }
          : item
      )
    );
    message.success(`${t('order.fraudApproved')}: ${order.orderNo}`);
    setDetailOrder(null);
  };

  const autoCount = orderItems.filter((o) => ['auto_completed', 'auto_shipped', 'awaiting_shipment', 'cancelled'].includes(o.status)).length;
  const exceptionCount = orderItems.filter((o) => o.status === 'exception' || o.status === 'fraud_blocked').length;
  const autoRate = orderItems.length > 0 ? Math.round((autoCount / orderItems.length) * 100) : 0;

  const filtered = useMemo(() => {
    let items = orderItems;

    // Tab 筛选
    if (tabFilter === 'auto') {
      items = items.filter((o) => ['auto_completed', 'auto_shipped', 'awaiting_shipment', 'cancelled'].includes(o.status));
    } else if (tabFilter === 'exception') {
      items = items.filter((o) => o.status === 'exception' || o.status === 'fraud_blocked');
    }

    // 关键词搜索
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      items = items.filter((o) =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.buyerName.toLowerCase().includes(kw) ||
        o.items.toLowerCase().includes(kw) ||
        (o.trackingNo && o.trackingNo.toLowerCase().includes(kw))
      );
    }

    // 店铺筛选
    if (storeFilter) items = items.filter((o) => o.storeName === storeFilter);

    // 状态筛选
    if (statusFilter) items = items.filter((o) => o.status === statusFilter);

    // 日期筛选
    if (dateRange) {
      items = items.filter((o) => {
        const d = o.createdAt;
        return d >= dateRange[0] && d <= dateRange[1];
      });
    }

    return items;
  }, [orderItems, tabFilter, searchKw, storeFilter, statusFilter, dateRange]);

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
      render: (v: number) => <Typography.Text strong>${v.toFixed(2)}</Typography.Text>,
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
            <Typography.Text code style={{ fontSize: 11 }}>{record.trackingNo}</Typography.Text>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>—</Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{status}</Typography.Text>
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
          {(record.status === 'exception' || record.status === 'fraud_blocked') && (
            <>
              {record.exceptionType === 'fraud_suspected' ? (
                <Button
                  size="small" type="primary" icon={<CheckCircleOutlined />}
                  onClick={() => handleApproveFraud(record)}
                >
                  {t('order.approve')}
                </Button>
              ) : (
                <Button
                  size="small" danger icon={<CloseOutlined />}
                  onClick={() => handleCancelAndRefund(record)}
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

      {/* 自动化统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <MetricCard title={t('order.totalToday')} value={orderItems.length} prefix={<ShoppingCartOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title={t('order.autoProcessed')}
            value={autoCount}
            valueStyle={{ color: '#16a34a' }}
            prefix={<ThunderboltOutlined />}
            suffix={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{autoRate}%</Typography.Text>}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title={t('order.autoRate')}
            value={autoRate}
            suffix="%"
            valueStyle={{ color: autoRate >= 80 ? '#16a34a' : '#ea580c' }}
            prefix={<LineChartOutlined />}
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
      </Row>

      {/* 搜索与筛选栏 */}
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
            <Select
              allowClear
              placeholder={t('order.status')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'awaiting_shipment', label: t('order.status_awaiting_shipment') },
                { value: 'auto_shipped', label: t('order.status_auto_shipped') },
                { value: 'auto_completed', label: t('order.status_auto_completed') },
                { value: 'exception', label: t('order.status_exception') },
                { value: 'fraud_blocked', label: t('order.status_fraud_blocked') },
                { value: 'cancelled', label: t('order.status_cancelled') },
              ]}
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
        defaultActiveKey="all"
        onChange={(key) => setTabFilter(key as 'all' | 'exception' | 'auto')}
        items={[
          {
            key: 'all',
            label: <span><ShoppingCartOutlined /> {t('order.allOrders')} ({filtered.length})</span>,
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
                <Badge count={autoCount} size="small" offset={[6, -4]} style={{ marginLeft: 6, background: '#16a34a' }} />
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
                <ExclamationCircleOutlined style={{ color: exceptionCount > 0 ? '#dc2626' : undefined }} /> {t('order.exceptionOrders')}
                {exceptionCount > 0 && <Badge count={exceptionCount} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}
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

      {/* 订单详情弹窗 */}
      <Modal
        title={detailOrder ? `${t('order.orderDetail')}: ${detailOrder.orderNo}` : ''}
        open={!!detailOrder}
        onCancel={() => setDetailOrder(null)}
        width={560}
        footer={
          <Space>
            {detailOrder && (detailOrder.status === 'exception' || detailOrder.status === 'fraud_blocked') && (
              <>
                {detailOrder.status === 'exception' && (
                  <>
                    <Button icon={<MailOutlined />} onClick={() => { handleContactBuyer(detailOrder); setDetailOrder(null); }}>
                      {t('order.contactBuyer')}
                    </Button>
                    <Button danger icon={<CloseOutlined />} type="primary" onClick={() => handleCancelAndRefund(detailOrder)}>
                      {t('order.cancelRefund')}
                    </Button>
                  </>
                )}
                {detailOrder.status === 'fraud_blocked' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApproveFraud(detailOrder)}>
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
                <Typography.Text strong>${detailOrder.amount.toFixed(2)}</Typography.Text>
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
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {e.at}
                    </Typography.Text>
                    {e.estimated && (
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>
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
