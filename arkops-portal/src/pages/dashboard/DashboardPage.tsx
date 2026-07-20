import {
  AlertOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  RiseOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Col, Progress, Row, Segmented, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { businessDashboardApi } from '../../api/businessDashboard';
import { dashboardApi } from '../../api/dashboard';
import { financeApi } from '../../api/finance';
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
import { ApprovalQueue } from '../../components/ApprovalQueue';
import type { Store } from '../../types/domain';

const statusColors: Record<string, string> = {
  succeeded: '#16a34a',
  waiting_approval: '#ea580c',
  running: '#2563eb',
  failed: '#dc2626'
};

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function changePercent(current: number, previous: number) {
  if (previous === 0) return { value: 0, up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: pct, up: pct >= 0 };
}

// ===== 统一运营总览 =====

const OperationsOverview = memo(function OperationsOverview({
  storesData,
  timeRange,
  selectedStoreName,
}: {
  storesData: Store[];
  timeRange: 'today' | '7d' | '30d';
  selectedStoreName: string;
}) {
  const { t } = useI18n();

  const { data: biz } = useQuery({
    queryKey: ['businessDashboard', timeRange],
    queryFn: () => businessDashboardApi.getMetrics(timeRange)
  });

  const { data: ops } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getSummary });

  // 店铺名称 → Store 映射，用于获取真实店铺状态
  const storeByName = new Map(storesData.map(s => [s.name, s]));

  return (
    <>
      {/* ===== 店铺经营对比 ===== */}
      <Card
        title={<span><DollarOutlined style={{ marginRight: 8 }} />店铺经营对比</span>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        {biz ? (
          <Table
            rowKey="storeName"
            dataSource={[
              // 汇总行
              { storeName: t('biz.allStores'), platform: '', gmv: biz.gmv.today, orders: biz.orders.today, roas: biz.adMetrics.roas, negativeReviews: biz.afterSales.negativeReviews - biz.afterSales.respondedReviews, status: 'summary' as const },
              // 店铺行（GMV 来自 biz 数据，状态来自真实店铺数据）
              { storeName: biz.storeGmvRank[0]?.storeName ?? 'Store A', platform: biz.storeGmvRank[0]?.platform ?? '', gmv: biz.storeGmvRank[0]?.gmv ?? 0, orders: 236, roas: 8.2, negativeReviews: 1, status: storeByName.get(biz.storeGmvRank[0]?.storeName ?? '')?.status ?? 'connected' },
              { storeName: biz.storeGmvRank[1]?.storeName ?? 'Store B', platform: biz.storeGmvRank[1]?.platform ?? '', gmv: biz.storeGmvRank[1]?.gmv ?? 0, orders: 128, roas: 5.8, negativeReviews: 1, status: storeByName.get(biz.storeGmvRank[1]?.storeName ?? '')?.status ?? 'connected' },
              { storeName: biz.storeGmvRank[2]?.storeName ?? 'Store C', platform: biz.storeGmvRank[2]?.platform ?? '', gmv: biz.storeGmvRank[2]?.gmv ?? 0, orders: 48, roas: 6.3, negativeReviews: 0, status: storeByName.get(biz.storeGmvRank[2]?.storeName ?? '')?.status ?? 'connected' },
            ].filter(row => selectedStoreName === 'all' || (row.status !== 'summary' && row.storeName === selectedStoreName))}
            pagination={false}
            size="small"
            columns={[
              {
                title: t('dashboard.colStore'), dataIndex: 'storeName', width: 200,
                render: (name: string, record: any) => (
                  <div>
                    {record.status === 'summary' ? (
                      <Typography.Text strong style={{ fontSize: 13, color: '#2563eb' }}>{name}</Typography.Text>
                    ) : (
                      <>
                        <Typography.Text strong style={{ fontSize: 13 }}>{name}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{record.platform as string}</Typography.Text>
                      </>
                    )}
                  </div>
                )
              },
              {
                title: t('dashboard.colStatus'), dataIndex: 'status', width: 90,
                render: (status: string) => {
                  if (status === 'summary') return <Tag color="blue" style={{ fontSize: 10 }}>{t('dashboard.summary')}</Tag>;
                  return <StatusBadge value={status as any} />;
                }
              },
              {
                title: 'GMV', dataIndex: 'gmv', width: 120, align: 'right' as const,
                render: (v: number, _record: any, idx: number) => {
                  const pct = idx === 0 ? changePercent(biz.gmv.today, biz.gmv.yesterday) : null;
                  return (
                    <span style={{ fontWeight: idx === 0 ? 700 : 400, color: idx === 0 ? '#2563eb' : 'inherit' }}>
                      ${formatNumber(v)}
                      {pct && (
                        <span style={{ fontSize: 10, marginLeft: 4, color: pct.up ? '#16a34a' : '#dc2626' }}>
                          {pct.up ? '▲' : '▼'}{Math.abs(pct.value)}%
                        </span>
                      )}
                    </span>
                  );
                }
              },
              {
                title: t('dashboard.colOrders'), dataIndex: 'orders', width: 100, align: 'right' as const,
                render: (v: number, _record: any, idx: number) => {
                  const pct = idx === 0 ? changePercent(biz.orders.today, biz.orders.yesterday) : null;
                  return (
                    <span style={{ fontWeight: idx === 0 ? 700 : 400 }}>
                      {formatNumber(v)}
                      {pct && (
                        <span style={{ fontSize: 10, marginLeft: 4, color: pct.up ? '#16a34a' : '#dc2626' }}>
                          {pct.up ? '▲' : '▼'}{Math.abs(pct.value)}%
                        </span>
                      )}
                    </span>
                  );
                }
              },
              {
                title: t('dashboard.colAdROI'), dataIndex: 'roas', width: 90, align: 'right' as const,
                render: (v: number) => (
                  <Typography.Text strong style={{ color: v >= 5 ? '#16a34a' : v >= 2 ? '#ea580c' : '#dc2626', fontSize: 13 }}>
                    {v.toFixed(1)}×
                  </Typography.Text>
                )
              },
              {
                title: t('dashboard.colNegativeReview'), dataIndex: 'negativeReviews', width: 70, align: 'right' as const,
                render: (v: number) => v > 0
                  ? <Tag color="red" style={{ fontSize: 10 }}>{v}{t('dashboard.pendingReply')}</Tag>
                  : <Typography.Text type="secondary" style={{ fontSize: 11 }}>-</Typography.Text>
              },
            ]}
          />
        ) : (
          <EmptyState description={t('common.empty')} />
        )}
      </Card>

      {/* ===== 3. GMV 趋势 + 任务状态 ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={biz ? 14 : 24}>
          {biz && (
            <Card title={<><LineChartOutlined /> {t('dashboard.gmvOrderTrend')}</>} size="small">
              <TrendBarChart
                ariaLabel="GMV Trend"
                points={biz.gmvTrend.map(point => ({
                  key: point.date,
                  label: point.date,
                  bars: [
                    { value: point.gmv, max: 35000, title: `GMV: $${formatNumber(point.gmv)}`, className: 'trend-bar-runs', minHeight: 10 },
                    { value: point.orders, max: 500, title: t('dashboard.ordersColon', { count: point.orders }), className: 'trend-bar-approvals', minHeight: 6 }
                  ]
                }))}
              />
              <div className="chart-legend">
                <span><i className="legend-dot legend-runs" />{t('dashboard.gmvTrend')}</span>
                <span><i className="legend-dot legend-approvals" />{t('dashboard.ordersTrend')}</span>
              </div>
            </Card>
          )}
        </Col>
        <Col xs={24} lg={biz ? 10 : 24}>
          {ops && (
            <Card title={<><DashboardOutlined /> {t('dashboard.taskOverview')}</>} size="small">
              <div className="status-visual">
                <div className="donut-chart" style={{
                  background: `conic-gradient(${ops.taskStatusBreakdown.length
                    ? ops.taskStatusBreakdown.map(item => {
                        const total = ops.taskStatusBreakdown.reduce((s, i) => s + i.count, 0);
                        return `${statusColors[item.status] ?? '#94a3b8'} ${ops.taskStatusBreakdown.slice(0, ops.taskStatusBreakdown.indexOf(item)).reduce((s, i) => s + (i.count / total * 100), 0)}% ${ops.taskStatusBreakdown.slice(0, ops.taskStatusBreakdown.indexOf(item) + 1).reduce((s, i) => s + (i.count / total * 100), 0)}%`;
                      }).join(', ')
                    : '#e2e8f0 0% 100%'})`
                }}>
                  <div><strong>{ops.taskStatusBreakdown.reduce((s, i) => s + i.count, 0)}</strong><span>{t('dashboard.taskUnit')}</span></div>
                </div>
                <div className="status-list">
                  {ops.taskStatusBreakdown.map(item => (
                    <div className="status-row" key={item.status}>
                      <span className="status-label"><i style={{ background: statusColors[item.status] }} />{t(`status.${item.status}`)}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* ===== 3.5. 近期任务 ===== */}
      {ops && ops.recentTasks && ops.recentTasks.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card
              title={<><UnorderedListOutlined /> {t('dashboard.recentTasksTitle')}</>}
              size="small"
              extra={<Link to="/agents" style={{ fontSize: 12 }}>{t('dashboard.agentCenterLink')}</Link>}
            >
              <Table
                rowKey="id"
                dataSource={ops.recentTasks}
                pagination={false}
                size="small"
                columns={[
                  { title: t('dashboard.taskName'), dataIndex: 'title', render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
                  { title: t('dashboard.colStore'), dataIndex: 'storeId', width: 100, render: (_v: any, record: any) => {
                    const store = storesData.find((s: any) => s.id === record.storeId);
                    return <Typography.Text style={{ fontSize: 11 }} type="secondary">{store?.name ?? '-'}</Typography.Text>;
                  }},
                  { title: 'Agent', dataIndex: 'agentType', width: 110, render: (v: string) => <Tag style={{ fontSize: 10 }}>{t(`agent.${v}`)}</Tag> },
                  { title: t('dashboard.colStatus'), dataIndex: 'status', width: 90, render: (v: string) => {
                    const colorMap: Record<string, string> = { running: 'blue', succeeded: 'green', failed: 'red', waiting_approval: 'orange', queued: 'default' };
                    return <Tag color={colorMap[v]} style={{ fontSize: 10 }}>{t(`status.${v}`)}</Tag>;
                  }},
                  { title: t('dashboard.colCreatedAt'), dataIndex: 'createdAt', width: 130, render: (v: string) => <Typography.Text style={{ fontSize: 11 }} type="secondary">{dayjs(v).format('MM-DD HH:mm')}</Typography.Text> },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ===== 系统额度与健康信号（页面底部）===== */}
      {ops && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.quotaUsageShort')} size="small">
              {ops.quotaUsage.map(item => {
                const pct = Math.round((item.used / item.limit) * 100);
                return (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Typography.Text style={{ fontSize: 12 }}>{t(item.key)}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{formatNumber(item.used)}/{formatNumber(item.limit)}</Typography.Text>
                    </div>
                    <Progress percent={pct} strokeColor={item.color} size="small" />
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.systemHealth')} size="small">
              {ops.healthSignals?.slice(0, 4).map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--ark-border-soft)' }}>
                  <Typography.Text style={{ fontSize: 12 }}>{t(item.key)}</Typography.Text>
                  <Tag color={item.status === 'healthy' ? 'green' : item.status === 'warning' ? 'orange' : 'red'} style={{ fontSize: 10 }}>
                    {t(`dashboard.${item.status}`)}
                  </Tag>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
});

// ===== 主页面 =====

export function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isDemo, enterDemo } = useDemoMode();
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');
  const [selectedStoreName, setSelectedStoreName] = useState('all');

  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(),
  });
  const storeCount = storesData?.length ?? 0;

  const { data: allAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  });
  const enabledAgentCount = allAgents.filter(a => a.enabled && a.agentType !== 'login_bootstrap').length;

  const { data: achievements } = useQuery({
    queryKey: ['agentAchievements'],
    queryFn: dashboardApi.getAgentAchievements,
    enabled: storeCount > 0,
    refetchInterval: 60_000,
  });

  const { data: trialStatus } = useQuery({
    queryKey: ['trialStatus'],
    queryFn: financeApi.getTrialStatus,
    enabled: storeCount > 0,
  });

  const { data: businessMetrics } = useQuery({
    queryKey: ['businessDashboard', timeRange],
    queryFn: () => businessDashboardApi.getMetrics(timeRange),
    enabled: storeCount > 0,
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
    enabled: storeCount > 0,
  });

  const selectedStoreMetric = businessMetrics?.storeGmvRank.find(item => item.storeName === selectedStoreName);
  const storeOrders: Record<string, number> = {
    'TikTok Shop 美国旗舰店': 236,
    'Amazon 户外用品店': 128,
    'Shopify 独立站': 48,
  };
  const currentGmv = selectedStoreMetric?.gmv ?? businessMetrics?.gmv.today ?? 0;
  const currentOrders = selectedStoreMetric ? storeOrders[selectedStoreMetric.storeName] ?? 0 : businessMetrics?.orders.today ?? 0;
  const pendingReviews = businessMetrics ? businessMetrics.afterSales.negativeReviews - businessMetrics.afterSales.respondedReviews : 0;
  const gmvChange = businessMetrics ? changePercent(businessMetrics.gmv.today, businessMetrics.gmv.yesterday) : { value: 0, up: true };
  const orderChange = businessMetrics ? changePercent(businessMetrics.orders.today, businessMetrics.orders.yesterday) : { value: 0, up: true };

  // 自适应状态条
  const setupIncomplete = storeCount === 0 || enabledAgentCount === 0;
  const statusBarStyle = storeCount === 0
    ? { background: '#fff7ed', border: '1px solid #fed7aa' }
    : enabledAgentCount === 0
      ? { background: '#eff6ff', border: '1px solid #bfdbfe' }
      : { background: '#f0fdf4', border: '1px solid #bbf7d0' };

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
            <Typography.Text type="secondary" style={{ fontSize: 11 }}><SyncOutlined /> 数据更新于 {dayjs().format('HH:mm')}</Typography.Text>
            <Select
              value={selectedStoreName}
              onChange={setSelectedStoreName}
              style={{ width: 190 }}
              options={[
                { label: '全部店铺', value: 'all' },
                ...(storesData ?? []).map(store => ({ label: store.name, value: store.name })),
              ]}
            />
            <Segmented
              value={timeRange}
              onChange={value => setTimeRange(value as 'today' | '7d' | '30d')}
              options={[
                { label: '当日', value: 'today' },
                { label: '7 日', value: '7d' },
                { label: '30 天', value: '30d' },
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

      {businessMetrics && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            { title: 'GMV', value: formatCurrency(currentGmv), meta: `${gmvChange.up ? '↑' : '↓'} ${Math.abs(gmvChange.value)}% 较昨日`, color: '#2563eb', icon: <DollarOutlined /> },
            { title: '订单', value: formatNumber(currentOrders), meta: `${orderChange.up ? '↑' : '↓'} ${Math.abs(orderChange.value)}% 较昨日`, color: '#0f766e', icon: <ShoppingCartOutlined /> },
            { title: '预计利润', value: formatCurrency(Math.round(currentGmv * 0.21)), meta: '按 21% 预计净利率', color: '#16a34a', icon: <RiseOutlined /> },
            { title: '广告 ROI', value: `${businessMetrics.adMetrics.roas.toFixed(1)}×`, meta: `目标 ${businessMetrics.adMetrics.targetRoas.toFixed(1)}×`, color: '#7c3aed', icon: <DashboardOutlined /> },
            { title: '差评待回复', value: String(pendingReviews), meta: `回复率 ${businessMetrics.afterSales.reviewResponseRate}%`, color: pendingReviews > 0 ? '#dc2626' : '#16a34a', icon: <WarningOutlined /> },
            { title: '低库存 SKU', value: String(businessMetrics.inventory.lowStockCount), meta: `${businessMetrics.inventory.outOfStockCount} 个已断货`, color: '#ea580c', icon: <AlertOutlined /> },
          ].map(metric => (
            <Col key={metric.title} xs={12} md={8} xl={4}>
              <Card size="small" className="business-kpi-card">
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{metric.title}</Typography.Text>
                    <Typography.Title level={3} style={{ margin: '6px 0 2px', color: metric.color }}>{metric.value}</Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{metric.meta}</Typography.Text>
                  </div>
                  <span className="business-kpi-icon" style={{ color: metric.color }}>{metric.icon}</span>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {businessMetrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="stretch">
          <Col xs={24} lg={10}>
            <Card className="ai-business-brief" title={<Space><RobotOutlined />AI 经营简报</Space>}>
              <Typography.Paragraph strong style={{ fontSize: 15, marginBottom: 12 }}>
                今日 GMV 较昨日增长 {Math.abs(gmvChange.value)}%，整体经营稳定，但库存和店铺授权需要优先处理。
              </Typography.Paragraph>
              <Space direction="vertical" size={8}>
                <Typography.Text>• TikTok Shop 贡献当前最高 GMV，广告 ROI 高于目标。</Typography.Text>
                <Typography.Text>• Amazon 店铺需要重新登录，否则后续数据可能停止更新。</Typography.Text>
                <Typography.Text>• {businessMetrics.inventory.lowStockCount} 个 SKU 库存偏低，建议今天确认补货计划。</Typography.Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title={<Space><AlertOutlined style={{ color: '#ea580c' }} />今日待办</Space>} extra={<Typography.Text type="secondary">按紧急程度排序</Typography.Text>} style={{ height: '100%' }}>
              <div className="dashboard-priority-list">
                {dashboardSummary && dashboardSummary.loginRequiredStores > 0 && <Link to="/stores"><span><Tag color="red">紧急</Tag>Amazon 店铺需要重新登录</span><strong>{dashboardSummary.loginRequiredStores} 家 →</strong></Link>}
                {dashboardSummary && dashboardSummary.pendingApprovals > 0 && <Link to="/agents/approvals"><span><Tag color="orange">审批</Tag>Agent 操作等待人工确认</span><strong>{dashboardSummary.pendingApprovals} 项 →</strong></Link>}
                {pendingReviews > 0 && <Link to="/agents/review_manager"><span><Tag color="gold">评价</Tag>差评等待回复</span><strong>{pendingReviews} 条 →</strong></Link>}
                {businessMetrics.inventory.lowStockCount > 0 && <Link to="/products"><span><Tag color="blue">库存</Tag>SKU 库存不足</span><strong>{businessMetrics.inventory.lowStockCount} 个 →</strong></Link>}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <ApprovalQueue />

      {/* Agent 今日成果卡片 */}
      {achievements && storeCount > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac' }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space size={4}>
                <RobotOutlined style={{ color: '#16a34a', fontSize: 14 }} />
                <Typography.Text strong style={{ fontSize: 13, color: '#166534' }}>{t('dashboard.achievementTitle')}</Typography.Text>
              </Space>
            </Col>
            <Col>
              <Row gutter={[32, 16]}>
                <Col>
                  <Statistic
                    title={<Space size={2}><ClockCircleOutlined style={{ fontSize: 10 }} /><span style={{ fontSize: 10 }}>{t('dashboard.achievementHours')}</span></Space>}
                    value={achievements.hoursSaved}
                    suffix={
                      <span style={{ fontSize: 12, color: achievements.hoursSavedTrend > 0 ? '#16a34a' : '#dc2626' }}>
                        <ArrowUpOutlined style={{ fontSize: 10 }} /> {achievements.hoursSavedTrend}%
                      </span>
                    }
                    valueStyle={{ fontSize: 20, color: '#166534', fontWeight: 700 }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={<Space size={2}><DollarOutlined style={{ fontSize: 10 }} /><span style={{ fontSize: 10 }}>{t('dashboard.achievementRevenue')}</span></Space>}
                    value={achievements.revenueUplift}
                    prefix="$"
                    suffix={
                      <span style={{ fontSize: 12, color: achievements.revenueUpliftTrend > 0 ? '#16a34a' : '#dc2626' }}>
                        <ArrowUpOutlined style={{ fontSize: 10 }} /> {achievements.revenueUpliftTrend}%
                      </span>
                    }
                    valueStyle={{ fontSize: 20, color: '#166534', fontWeight: 700 }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={<Space size={2}><CheckCircleOutlined style={{ fontSize: 10 }} /><span style={{ fontSize: 10 }}>{t('dashboard.achievementTasks')}</span></Space>}
                    value={achievements.tasksProcessed}
                    suffix={
                      <span style={{ fontSize: 12, color: '#16a34a' }}>
                        {achievements.tasksSuccessRate}%
                      </span>
                    }
                    valueStyle={{ fontSize: 20, color: '#166534', fontWeight: 700 }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
          {achievements.topContributor && (
            <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(22,163,74,0.06)', borderRadius: 6, fontSize: 12, color: '#166534' }}>
              <Space size={4}>
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{t(`agent.${achievements.topContributor.agentType}`)}</Tag>
                <span>{t(achievements.topContributor.insight)}</span>
              </Space>
            </div>
          )}
        </Card>
      )}

      <OperationsOverview storesData={storesData ?? []} timeRange={timeRange} selectedStoreName={selectedStoreName} />

      <AutomationOverview />

      <Card size="small" style={{ ...statusBarStyle, marginBottom: 16 }}>
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col>
            <Space size="middle" wrap>
              <Badge status={enabledAgentCount === 0 ? 'processing' : 'success'} />
              <Typography.Text strong style={{ fontSize: 13 }}>
                {enabledAgentCount === 0 ? '店铺已连接，配置 Agent 后可开始智能运营' : '自动化方案运行正常'}
              </Typography.Text>
              <Tag color="green">{storeCount} 家店铺在线</Tag>
              {trialStatus && trialStatus.planTier !== 'Enterprise' && (
                <Tag color={trialStatus.usedAgentCalls > trialStatus.agentCallLimit * 0.8 ? 'red' : 'orange'}>
                  试用剩余 {trialStatus.trialDaysLeft} 天 · 调用 {trialStatus.usedAgentCalls}/{trialStatus.agentCallLimit}
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {trialStatus && trialStatus.planTier !== 'Enterprise' && <Link to="/settings/billing"><Button size="small">查看套餐</Button></Link>}
              <Link to="/setup"><Button type={setupIncomplete ? 'primary' : 'default'} size="small" icon={<SettingOutlined />}>配置自动化方案</Button></Link>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
