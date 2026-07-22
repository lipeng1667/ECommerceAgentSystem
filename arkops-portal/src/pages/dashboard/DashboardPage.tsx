import {
  AlertOutlined,
  DashboardOutlined,
  LineChartOutlined,
  PayCircleOutlined,
  PlayCircleOutlined,
  RightOutlined,
  RiseOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Progress, Row, Segmented, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessDashboardApi, type DashboardTimeRange } from '../../api/businessDashboard';
import { dashboardApi } from '../../api/dashboard';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useDemoMode } from '../../app/demoMode';
import { useI18n } from '../../app/i18n';
import { TrendBarChart } from '../../components/charts/TrendBarChart';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { AutomationOverview } from '../../components/AutomationOverview';

const statusColors: Record<string, string> = {
  succeeded: '#16a34a',
  waiting_approval: '#ea580c',
  running: '#2563eb',
  queued: '#94a3b8',
  failed: '#dc2626',
  cancelled: '#64748b'
};

/** Assumed net margin used only for the profit *estimate* KPI; surfaced in the UI (C4). */
const ESTIMATED_NET_MARGIN = 0.21;

function formatCurrency(value: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

/** Compact CJK-friendly value label for chart columns, e.g. 28640 → "2.9万". */
function formatCompact(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return formatNumber(Math.round(value));
}

function changePercent(current: number, previous: number) {
  if (previous === 0) return { value: 0, up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: pct, up: pct >= 0 };
}

// ===== 任务状态环形图（可点击 + 可访问，C5）=====

function TaskStatusDonut({
  breakdown,
}: {
  breakdown: { status: string; count: number }[];
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const total = breakdown.reduce((s, i) => s + i.count, 0);
  const size = 158;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segmentTarget = (status: string) =>
    status === 'waiting_approval' ? '/agents/approvals' : '/agents';

  let offsetFraction = 0;
  const segments = breakdown.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const segment = { ...item, fraction, startFraction: offsetFraction };
    offsetFraction += fraction;
    return segment;
  });

  const ariaSummary = breakdown
    .map((item) => `${t(`status.${item.status}`)} ${item.count}`)
    .join('，');

  return (
    <div className="status-visual">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={t('dashboardv2.donutAria', { detail: ariaSummary })}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ark-border-soft, #e2e8f0)" strokeWidth={strokeWidth} />
        {segments.map((seg) => (
          <circle
            key={seg.status}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={statusColors[seg.status] ?? '#94a3b8'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.fraction * circumference} ${circumference}`}
            strokeDashoffset={-seg.startFraction * circumference}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={t('dashboardv2.donutSegmentAria', { status: t(`status.${seg.status}`), count: seg.count })}
            onClick={() => navigate(segmentTarget(seg.status))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') navigate(segmentTarget(seg.status));
            }}
          >
            <title>{`${t(`status.${seg.status}`)}: ${seg.count}`}</title>
          </circle>
        ))}
        <text x="50%" y="47%" textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: 'var(--ark-ink, #172033)' }}>
          {total}
        </text>
        <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--ark-muted, #64748b)' }}>
          {t('dashboard.taskUnit')}
        </text>
      </svg>
      <div className="status-list">
        {breakdown.map((item) => (
          <Link to={segmentTarget(item.status)} key={item.status} style={{ color: 'inherit' }}>
            <div className="status-row">
              <span className="status-label"><i style={{ background: statusColors[item.status] ?? '#94a3b8' }} />{t(`status.${item.status}`)}</span>
              <span>{item.count} <RightOutlined style={{ fontSize: 10, color: 'var(--ark-muted, #64748b)' }} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ===== 主页面 =====

export function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isDemo, enterDemo } = useDemoMode();
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('today');
  // TODO(integration): consume shell StoreScope context (D3) — replace this local state with the
  // shell-level persistent store filter once WS-E lands it. Everything below reads only from
  // `storeScope`, so the swap is a one-line change here.
  const [storeScope, setStoreScope] = useState<string>('all');
  const scopedStoreName = storeScope === 'all' ? undefined : storeScope;

  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(),
  });
  const storeCount = storesData?.length ?? 0;
  const storeIdByName = new Map((storesData ?? []).map((s) => [s.name, s.id]));

  const { data: businessMetrics } = useQuery({
    queryKey: ['businessDashboard', timeRange, storeScope],
    queryFn: () => businessDashboardApi.getMetrics(timeRange, scopedStoreName),
    enabled: storeCount > 0,
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
    enabled: storeCount > 0,
  });

  const { data: achievements } = useQuery({
    queryKey: ['agentAchievements'],
    queryFn: dashboardApi.getAgentAchievements,
    enabled: storeCount > 0,
    refetchInterval: 60_000,
  });

  const pendingReviews = businessMetrics
    ? businessMetrics.afterSales.negativeReviews - businessMetrics.afterSales.respondedReviews
    : 0;
  const gmvChange = businessMetrics ? changePercent(businessMetrics.periodGmv.current, businessMetrics.periodGmv.previous) : { value: 0, up: true };
  const orderChange = businessMetrics ? changePercent(businessMetrics.periodOrders.current, businessMetrics.periodOrders.previous) : { value: 0, up: true };
  const comparisonLabel = businessMetrics ? t(businessMetrics.comparisonLabelKey) : '';

  // ===== 顶部关注条数据（C1/C2）=====
  const attentionItems = [
    dashboardSummary && dashboardSummary.loginRequiredStores > 0
      ? { key: 'login', to: '/stores', tag: t('dashboardv2.tagUrgent'), tagColor: 'red', label: t('dashboardv2.itemLoginRequired'), count: t('dashboardv2.countStores', { count: dashboardSummary.loginRequiredStores }) }
      : null,
    dashboardSummary && dashboardSummary.pendingApprovals > 0
      ? { key: 'approvals', to: '/agents/approvals', tag: t('dashboardv2.tagApproval'), tagColor: 'orange', label: t('dashboardv2.itemPendingApprovals'), count: t('dashboardv2.countItems', { count: dashboardSummary.pendingApprovals }) }
      : null,
    dashboardSummary && dashboardSummary.exceptionCenterPending > 0
      ? { key: 'exceptions', to: '/agents/exceptions', tag: t('dashboardv2.tagException'), tagColor: 'volcano', label: t('dashboardv2.itemExceptions'), count: t('dashboardv2.countItems', { count: dashboardSummary.exceptionCenterPending }) }
      : null,
    pendingReviews > 0
      ? { key: 'reviews', to: '/agents/review_manager', tag: t('dashboardv2.tagReview'), tagColor: 'gold', label: t('dashboardv2.itemNegativeReviews'), count: t('dashboardv2.countReviews', { count: pendingReviews }) }
      : null,
    businessMetrics && businessMetrics.inventory.lowStockCount > 0
      ? { key: 'stock', to: '/products?stock=low', tag: t('dashboardv2.tagStock'), tagColor: 'blue', label: t('dashboardv2.itemLowStock'), count: t('dashboardv2.countSkus', { count: businessMetrics.inventory.lowStockCount }) }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  // 全账号范围提示：这些卡片不受店铺筛选影响（C3 诚实标注）
  const accountScopeTag = scopedStoreName ? (
    <Tag style={{ fontSize: 12 }} color="default">{t('dashboardv2.scopeAllStores')}</Tag>
  ) : null;

  // 店铺经营对比行：全店时附带汇总行
  const storeRows = businessMetrics
    ? [
        ...(scopedStoreName
          ? []
          : [{
              storeName: t('biz.allStores'),
              platform: '',
              gmv: businessMetrics.periodGmv.current,
              orders: businessMetrics.periodOrders.current,
              roas: businessMetrics.adMetrics.roas,
              pendingNegativeReviews: pendingReviews,
              summary: true,
            }]),
        ...businessMetrics.storeMetrics.map((s) => ({ ...s, summary: false })),
      ]
    : [];

  const scopedTasks = (dashboardSummary?.recentTasks ?? []).filter((task) => {
    if (!scopedStoreName) return true;
    return task.storeId === storeIdByName.get(scopedStoreName);
  });

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
        <StoreConnectionEmptyState description="连接第一家店铺后，这里会显示 GMV、订单、库存、评价和 Agent 运营结果。当前账号尚未产生经营数据。" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <Space size={8} wrap>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <SyncOutlined /> {t('dashboardv2.updatedAt', { time: dayjs().format('HH:mm') })}
            </Typography.Text>
            <Select
              value={storeScope}
              onChange={setStoreScope}
              style={{ width: 190 }}
              options={[
                { label: t('dashboardv2.filterAllStores'), value: 'all' },
                ...(storesData ?? []).map((store) => ({ label: store.name, value: store.name })),
              ]}
            />
            <Segmented
              value={timeRange}
              onChange={(value) => setTimeRange(value as DashboardTimeRange)}
              options={[
                { label: t('dashboardv2.rangeToday'), value: 'today' },
                { label: t('dashboardv2.range7d'), value: '7d' },
                { label: t('dashboardv2.range30d'), value: '30d' },
              ]}
            />
          </Space>
        }
      />

      {/* 演示模式入口 — 无店铺时显示 */}
      {!isDemo && storeCount === 0 && (
        <Card size="small" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <PlayCircleOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                <div>
                  <Typography.Text strong style={{ fontSize: 13 }}>{t('dashboard.demoBanner')}</Typography.Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => enterDemo()}>
                {t('dashboard.tryDemo')}
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* ===== 顶部关注条：唯一的待办入口（C1）===== */}
      {storeCount > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <AlertOutlined style={{ color: attentionItems.length > 0 ? '#ea580c' : '#16a34a' }} />
              <Typography.Text strong>{t('dashboardv2.attentionTitle')}</Typography.Text>
              {accountScopeTag}
            </Space>
          }
          extra={
            <Link to="/inbox">
              <Button type="primary" size="small">{t('dashboardv2.attentionInboxCta')} <RightOutlined /></Button>
            </Link>
          }
        >
          {attentionItems.length > 0 ? (
            <div className="dashboard-priority-list">
              {attentionItems.map((item) => (
                <Link to={item.to} key={item.key}>
                  <span><Tag color={item.tagColor}>{item.tag}</Tag>{item.label}</span>
                  <strong>{item.count} →</strong>
                </Link>
              ))}
            </div>
          ) : (
            <Typography.Text type="success" style={{ fontSize: 13 }}>{t('dashboardv2.attentionAllClear')}</Typography.Text>
          )}
        </Card>
      )}

      {/* ===== 核心 KPI（≤4 个，C4）===== */}
      {businessMetrics && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            {
              title: t('dashboardv2.kpiGmv'),
              value: formatCurrency(businessMetrics.periodGmv.current),
              meta: `${gmvChange.up ? '↑' : '↓'} ${Math.abs(gmvChange.value)}% ${comparisonLabel}`,
              color: '#2563eb',
              icon: <PayCircleOutlined />,
              estimate: false,
            },
            {
              title: t('dashboardv2.kpiOrders'),
              value: formatNumber(businessMetrics.periodOrders.current),
              meta: `${orderChange.up ? '↑' : '↓'} ${Math.abs(orderChange.value)}% ${comparisonLabel}`,
              color: '#0f766e',
              icon: <ShoppingCartOutlined />,
              estimate: false,
            },
            {
              title: t('dashboardv2.kpiAdRoi'),
              value: `${businessMetrics.adMetrics.roas.toFixed(1)}×`,
              meta: t('dashboardv2.adRoiTarget', { target: businessMetrics.adMetrics.targetRoas.toFixed(1) }),
              color: '#7c3aed',
              icon: <DashboardOutlined />,
              estimate: false,
            },
            {
              title: t('dashboardv2.kpiEstProfit'),
              value: formatCurrency(Math.round(businessMetrics.periodGmv.current * ESTIMATED_NET_MARGIN)),
              meta: t('dashboardv2.estProfitAssumption'),
              color: '#16a34a',
              icon: <RiseOutlined />,
              estimate: true,
            },
          ].map((metric) => (
            <Col key={metric.title} xs={12} xl={6}>
              <Card size="small" className="business-kpi-card">
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Space size={4}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{metric.title}</Typography.Text>
                      {metric.estimate && <Tag color="default" style={{ fontSize: 12, lineHeight: '16px', margin: 0 }}>{t('dashboardv2.estimateTag')}</Tag>}
                    </Space>
                    <Typography.Title level={3} style={{ margin: '6px 0 2px', color: metric.color }}>{metric.value}</Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{metric.meta}</Typography.Text>
                  </div>
                  <span className="business-kpi-icon" style={{ color: metric.color }}>{metric.icon}</span>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ===== 趋势 + 任务状态（C5）===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          {businessMetrics && (
            <Card
              title={<><LineChartOutlined /> {t('dashboardv2.trendTitle')}</>}
              size="small"
              extra={timeRange === '30d' ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('dashboardv2.trendBucketNote')}</Typography.Text> : null}
            >
              <TrendBarChart
                ariaLabel={t('dashboardv2.trendTitle')}
                points={businessMetrics.gmvTrend.map((point) => ({
                  key: point.date,
                  label: point.date,
                  valueLabel: `¥${formatCompact(point.gmv)}`,
                  bars: [
                    { value: point.gmv, title: `GMV: ¥${formatNumber(point.gmv)}`, className: 'trend-bar-gmv', minHeight: 10 },
                    { value: point.orders, title: t('dashboard.ordersColon', { count: point.orders }), className: 'trend-bar-orders', minHeight: 6 }
                  ]
                }))}
              />
              <div className="chart-legend">
                <span><i className="legend-dot legend-gmv" />{t('dashboardv2.legendGmv')}</span>
                <span><i className="legend-dot legend-orders" />{t('dashboardv2.legendOrders')}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('dashboardv2.trendScaleNote')}</Typography.Text>
              </div>
            </Card>
          )}
        </Col>
        <Col xs={24} lg={10}>
          {dashboardSummary && (
            <Card
              title={<><DashboardOutlined /> {t('dashboard.taskOverview')}</>}
              size="small"
              extra={accountScopeTag}
            >
              <TaskStatusDonut breakdown={dashboardSummary.taskStatusBreakdown} />
            </Card>
          )}
        </Col>
      </Row>

      {/* ===== 店铺经营对比（C2 可点击、C9 可滚动 + 12px）===== */}
      <Card
        title={<span><PayCircleOutlined style={{ marginRight: 8 }} />{t('dashboardv2.storeCompare')}</span>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        {businessMetrics ? (
          <Table
            rowKey="storeName"
            dataSource={storeRows}
            pagination={false}
            size="small"
            scroll={{ x: 760 }}
            columns={[
              {
                title: t('dashboard.colStore'), dataIndex: 'storeName', width: 200,
                render: (name: string, record) => {
                  if (record.summary) {
                    return <Typography.Text strong style={{ fontSize: 13, color: '#2563eb' }}>{name}</Typography.Text>;
                  }
                  const storeId = storeIdByName.get(name);
                  const label = (
                    <>
                      <Typography.Text strong style={{ fontSize: 13, color: storeId ? '#2563eb' : undefined }}>{name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{record.platform}</Typography.Text>
                    </>
                  );
                  return storeId ? <Link to={`/stores/${storeId}`}>{label}</Link> : <div>{label}</div>;
                }
              },
              {
                title: t('dashboard.colStatus'), width: 90,
                render: (_: unknown, record) => {
                  if (record.summary) return <Tag color="blue" style={{ fontSize: 12 }}>{t('dashboard.summary')}</Tag>;
                  const store = (storesData ?? []).find((s) => s.name === record.storeName);
                  return store ? <StatusBadge value={store.status} /> : <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>;
                }
              },
              {
                title: 'GMV', dataIndex: 'gmv', width: 140, align: 'right' as const,
                render: (v: number, record) => (
                  <span style={{ fontWeight: record.summary ? 700 : 400, color: record.summary ? '#2563eb' : 'inherit', fontSize: 13 }}>
                    ¥{formatNumber(v)}
                    {record.summary && (
                      <span style={{ fontSize: 12, marginLeft: 4, color: gmvChange.up ? '#16a34a' : '#dc2626' }}>
                        {gmvChange.up ? '▲' : '▼'}{Math.abs(gmvChange.value)}%
                      </span>
                    )}
                  </span>
                )
              },
              {
                title: t('dashboard.colOrders'), dataIndex: 'orders', width: 120, align: 'right' as const,
                render: (v: number, record) => {
                  const content = (
                    <span style={{ fontWeight: record.summary ? 700 : 400, fontSize: 13 }}>
                      {formatNumber(v)}
                      {record.summary && (
                        <span style={{ fontSize: 12, marginLeft: 4, color: orderChange.up ? '#16a34a' : '#dc2626' }}>
                          {orderChange.up ? '▲' : '▼'}{Math.abs(orderChange.value)}%
                        </span>
                      )}
                    </span>
                  );
                  if (record.summary) return content;
                  return <Link to={`/orders?store=${encodeURIComponent(record.storeName)}`} style={{ color: 'inherit' }}>{content} <RightOutlined style={{ fontSize: 10, color: 'var(--ark-muted, #64748b)' }} /></Link>;
                }
              },
              {
                title: t('dashboard.colAdROI'), dataIndex: 'roas', width: 100, align: 'right' as const,
                render: (v: number, record) => {
                  const text = (
                    <Typography.Text strong style={{ color: v >= 5 ? '#16a34a' : v >= 2 ? '#ea580c' : '#dc2626', fontSize: 13 }}>
                      {v.toFixed(1)}×
                    </Typography.Text>
                  );
                  if (record.summary) return text;
                  return <Link to="/agents/ads_optimizer">{text} <RightOutlined style={{ fontSize: 10, color: 'var(--ark-muted, #64748b)' }} /></Link>;
                }
              },
              {
                title: t('dashboard.colNegativeReview'), dataIndex: 'pendingNegativeReviews', width: 90, align: 'right' as const,
                render: (v: number) => v > 0
                  ? <Link to="/agents/review_manager"><Tag color="red" style={{ fontSize: 12 }}>{v}{t('dashboard.pendingReply')} →</Tag></Link>
                  : <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>
              },
            ]}
          />
        ) : (
          <EmptyState description={t('common.empty')} />
        )}
      </Card>

      {/* ===== Agent 今日成果 — 单行摘要（C4）===== */}
      {achievements && storeCount > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row align="middle" justify="space-between" gutter={[12, 12]}>
            <Col flex="auto">
              <Space size={6} wrap>
                <RobotOutlined style={{ color: '#16a34a' }} />
                <Typography.Text style={{ fontSize: 13 }}>
                  {t('dashboardv2.achievementLine', {
                    hours: achievements.hoursSaved,
                    revenue: formatNumber(achievements.revenueUplift),
                    tasks: achievements.tasksProcessed,
                    rate: achievements.tasksSuccessRate,
                  })}
                </Typography.Text>
              </Space>
            </Col>
            <Col>
              <Link to="/agents" style={{ fontSize: 12 }}>{t('dashboardv2.viewAgents')} <RightOutlined style={{ fontSize: 10 }} /></Link>
            </Col>
          </Row>
        </Card>
      )}

      {/* ===== 近期任务（跟随店铺筛选）===== */}
      {scopedTasks.length > 0 && (
        <Card
          title={<><UnorderedListOutlined /> {t('dashboard.recentTasksTitle')}</>}
          size="small"
          style={{ marginBottom: 16 }}
          extra={<Link to="/agents" style={{ fontSize: 12 }}>{t('dashboard.agentCenterLink')}</Link>}
        >
          <Table
            rowKey="id"
            dataSource={scopedTasks}
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
            columns={[
              { title: t('dashboard.taskName'), dataIndex: 'title', render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
              { title: t('dashboard.colStore'), dataIndex: 'storeId', width: 120, render: (storeId: unknown) => {
                const store = (storesData ?? []).find((s) => s.id === storeId);
                return <Typography.Text style={{ fontSize: 12 }} type="secondary">{store?.name ?? '-'}</Typography.Text>;
              }},
              { title: 'Agent', dataIndex: 'agentType', width: 120, render: (v: string) => <Tag style={{ fontSize: 12 }}>{t(`agent.${v}`)}</Tag> },
              { title: t('dashboard.colStatus'), dataIndex: 'status', width: 100, render: (v: string) => {
                const colorMap: Record<string, string> = { running: 'blue', succeeded: 'green', failed: 'red', waiting_approval: 'orange', queued: 'default' };
                return <Tag color={colorMap[v]} style={{ fontSize: 12 }}>{t(`status.${v}`)}</Tag>;
              }},
              { title: t('dashboard.colCreatedAt'), dataIndex: 'createdAt', width: 130, render: (v: string) => <Typography.Text style={{ fontSize: 12 }} type="secondary">{dayjs(v).format('MM-DD HH:mm')}</Typography.Text> },
            ]}
          />
        </Card>
      )}

      <AutomationOverview />

      {/* ===== 系统额度与健康信号（账号级）===== */}
      {dashboardSummary && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.quotaUsageShort')} size="small" extra={accountScopeTag}>
              {dashboardSummary.quotaUsage.map((item) => {
                const pct = Math.round((item.used / item.limit) * 100);
                return (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Typography.Text style={{ fontSize: 12 }}>{t(item.key)}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{formatNumber(item.used)}/{formatNumber(item.limit)}</Typography.Text>
                    </div>
                    <Progress percent={pct} strokeColor={item.color} size="small" />
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.systemHealth')} size="small" extra={accountScopeTag}>
              {dashboardSummary.healthSignals?.slice(0, 4).map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--ark-border-soft)' }}>
                  <Typography.Text style={{ fontSize: 12 }}>{t(item.key)}</Typography.Text>
                  <Tag color={item.status === 'healthy' ? 'green' : item.status === 'warning' ? 'orange' : 'red'} style={{ fontSize: 12 }}>
                    {t(`dashboard.${item.status}`)}
                  </Tag>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
