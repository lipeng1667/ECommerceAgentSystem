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
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Col, Progress, Row, Segmented, Space, Statistic, Table, Tag, Typography } from 'antd';
import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { businessDashboardApi } from '../../api/businessDashboard';
import { dashboardApi } from '../../api/dashboard';
import { financeApi } from '../../api/finance';
import { storesApi } from '../../api/stores';
import { useDemoMode } from '../../app/demoMode';
import { useI18n } from '../../app/i18n';
import { TrendBarChart } from '../../components/charts/TrendBarChart';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
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

const OperationsOverview = memo(function OperationsOverview({ storesData }: { storesData: Store[] }) {
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');

  const { data: biz } = useQuery({
    queryKey: ['businessDashboard', timeRange],
    queryFn: () => businessDashboardApi.getMetrics(timeRange)
  });

  const { data: ops } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getSummary });

  // 店铺名称 → Store 映射，用于获取真实店铺状态
  const storeByName = new Map(storesData.map(s => [s.name, s]));

  // Agent 实时动态 mock 数据
  const agentFeed = useMemo(() => [
    { time: '10:32', agent: 'pricing_strategy', action: '将充电器价格从 $42.00 调整为 $39.99', store: 'TikTok Shop 美国旗舰店', color: '#7c3aed' },
    { time: '10:28', agent: 'review_manager', action: '回复了 John D. 的 1 星差评', store: 'Amazon 户外用品店', color: '#16a34a' },
    { time: '10:15', agent: 'ads_optimizer', action: '将 CA-002 预算从 $300 削减至 $150，ROI 偏低 0.8×', store: 'TikTok Shop 美国旗舰店', color: '#2563eb' },
    { time: '10:02', agent: 'inventory_alert', action: '充电器库存降至 45 件，低于阈值 50', store: 'Shopify 独立站', color: '#ea580c' },
    { time: '09:48', agent: 'competitor_intel', action: '监测到竞品降价 8%，建议调整运动T恤定价', store: 'Amazon 户外用品店', color: '#6366f1' },
    { time: '09:30', agent: 'crm_retention', action: '向 320 名沉睡客户发放 $5 唤醒优惠券', store: 'TikTok Shop 美国旗舰店', color: '#0f766e' },
    { time: '09:15', agent: 'customer_service', action: 'AI 自动回复 3 条买家咨询，0 条转人工', store: 'Shopify 独立站', color: '#0891b2' },
  ], []);

  return (
    <>
      {/* ===== 1. Agent 实时动态流 ===== */}
      <Card
        title={<><RobotOutlined style={{ color: '#2563eb' }} /> {t('dashboard.agentFeed')}</>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {agentFeed.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 4px',
                borderBottom: i < agentFeed.length - 1 ? '1px solid var(--ark-border-soft)' : 'none',
                opacity: 1 - i * 0.08
              }}
            >
              <Typography.Text style={{ fontSize: 11, color: '#94a3b8', minWidth: 40, fontFamily: 'monospace' }}>
                {item.time}
              </Typography.Text>
              <Tag color={item.color} style={{ fontSize: 10, margin: 0, minWidth: 60, textAlign: 'center' }}>
                {t(`agent.${item.agent}`).length > 6 ? t(`agent.${item.agent}`).slice(0, 6) + '..' : t(`agent.${item.agent}`)}
              </Tag>
              <Typography.Text style={{ fontSize: 12, flex: 1, minWidth: 0 }} ellipsis>
                {item.action}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 10, minWidth: 60, textAlign: 'right' }}>
                {item.store}
              </Typography.Text>
            </div>
          ))}
        </div>
      </Card>

      {/* ===== 2. 核心指标（按店铺统计） ===== */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><DollarOutlined style={{ marginRight: 8 }} />{t('dashboard.coreMetrics')}</span>
            <Segmented size="small" value={timeRange} onChange={v => setTimeRange(v as 'today' | '7d' | '30d')}
              options={[
                { label: t('time.today'), value: 'today' },
                { label: t('time.7d'), value: '7d' },
                { label: t('time.30d'), value: '30d' },
              ]}
            />
          </div>
        }
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
            ]}
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
                  { title: t('dashboard.colCreatedAt'), dataIndex: 'createdAt', width: 130, render: (v: string) => <Typography.Text style={{ fontSize: 11 }} type="secondary">{v}</Typography.Text> },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ===== 4. 需要关注 ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title={<><AlertOutlined /> {t('dashboard.attention')}</>} size="small">
            {biz && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {biz.afterSales.negativeReviews - biz.afterSales.respondedReviews > 0 && (
                  <Link to="/agents/review_manager" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                    <Space>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠</span>
                      <Typography.Text style={{ fontSize: 12 }}>{t('dashboard.negativeReviewPending')}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('dashboard.viewTask')}</Typography.Text>
                    </Space>
                    <Badge count={biz.afterSales.negativeReviews - biz.afterSales.respondedReviews} size="small" />
                  </Link>
                )}
                {biz.inventory.lowStockCount > 0 && (
                  <Link to="/products" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff7ed', borderRadius: 8 }}>
                    <Space>
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>⚠</span>
                      <Typography.Text style={{ fontSize: 12 }}>{t('dashboard.inventoryAlert')}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('dashboard.toProducts')}</Typography.Text>
                    </Space>
                    <Badge count={biz.inventory.lowStockCount} size="small" />
                  </Link>
                )}
                {biz.adMetrics.roas < 1.5 && (
                  <Link to="/agents/ads_optimizer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff7ed', borderRadius: 8 }}>
                    <Space>
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>⚠</span>
                      <Typography.Text style={{ fontSize: 12 }}>{t('dashboard.lowAdROI', { roi: biz.adMetrics.roas })}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('dashboard.viewTask')}</Typography.Text>
                    </Space>
                    <Tag color="orange" style={{ fontSize: 9 }}>{t('dashboard.watch')}</Tag>
                  </Link>
                )}
                {biz.inventory.outOfStockCount > 0 && (
                  <Link to="/products" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                    <Space>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠</span>
                      <Typography.Text style={{ fontSize: 12 }}>{t('dashboard.outOfStock')}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('dashboard.toProductManagement')}</Typography.Text>
                    </Space>
                    <Badge count={biz.inventory.outOfStockCount} size="small" />
                  </Link>
                )}
                {(!biz || (biz.afterSales.negativeReviews - biz.afterSales.respondedReviews === 0 && biz.inventory.lowStockCount === 0 && biz.adMetrics.roas >= 1.5 && biz.inventory.outOfStockCount === 0)) && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#16a34a' }}>
                    <CheckCircleOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                    <Typography.Text style={{ fontSize: 13 }}>{t('dashboard.allGood')}</Typography.Text>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ===== 5. 额度 + 健康信号（精简到底部）===== */}
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
  const { isDemo, enterDemo } = useDemoMode();

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

  // 自适应状态条
  const setupIncomplete = storeCount === 0 || enabledAgentCount === 0;
  const statusBarStyle = storeCount === 0
    ? { background: '#fff7ed', border: '1px solid #fed7aa' }
    : enabledAgentCount === 0
      ? { background: '#eff6ff', border: '1px solid #bfdbfe' }
      : { background: '#f0fdf4', border: '1px solid #bbf7d0' };

  return (
    <div className="page-stack">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      <AutomationOverview />
      <ApprovalQueue />

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

      {/* 试用横幅 — 非付费套餐显示 */}
      {trialStatus && trialStatus.planTier !== 'Enterprise' && storeCount > 0 && (
        <Card size="small" style={{ marginBottom: 16, background: 'linear-gradient(90deg, #fefce8 0%, #fef9c3 100%)', border: '1px solid #facc15' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space size={12}>
                <Typography.Text strong style={{ fontSize: 13, color: '#854d0e' }}>
                  {t('dashboard.trialDaysLeft', { days: trialStatus.trialDaysLeft })}
                </Typography.Text>
                <Tag color="orange" style={{ fontSize: 10 }}>
                  {t('dashboard.trialUsedStores', { used: trialStatus.usedStores, limit: trialStatus.trialStoreLimit })}
                </Tag>
                <Tag color={trialStatus.usedAgentCalls > trialStatus.agentCallLimit * 0.8 ? 'red' : 'orange'} style={{ fontSize: 10 }}>
                  {t('dashboard.trialAgentCalls', { used: trialStatus.usedAgentCalls, limit: trialStatus.agentCallLimit })}
                </Tag>
                <Typography.Text style={{ fontSize: 11, color: '#a16207' }}>
                  {t('dashboard.premiumAgentsLocked', { count: trialStatus.premiumAgents.length })}
                </Typography.Text>
              </Space>
            </Col>
            <Col>
              <Link to="/settings/billing">
                <Button type="primary" size="small" style={{ background: '#ca8a04', borderColor: '#ca8a04' }}>
                  {t('dashboard.upgradePlan')}
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>
      )}

      {/* 自适应状态条 */}
      <Card size="small" style={{ ...statusBarStyle, marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Badge status={storeCount === 0 ? 'warning' : enabledAgentCount === 0 ? 'processing' : 'success'} />
              {storeCount === 0 ? (
                <Typography.Text strong style={{ fontSize: 13, color: '#c2410c' }}>
                  {t('dashboard.connectStoreHint')}
                </Typography.Text>
              ) : enabledAgentCount === 0 ? (
                <Typography.Text strong style={{ fontSize: 13, color: '#1d4ed8' }}>
                  {t('dashboard.storeConnectedNoAgent')}
                </Typography.Text>
              ) : (
                <>
                  <Typography.Text strong style={{ fontSize: 13 }}>{t('setup.runningStatus')}</Typography.Text>
                  <Tag color="green" style={{ fontSize: 10 }}>{storeCount} {t('setup.storesOnline')}</Tag>
                  <Tag color="blue" style={{ fontSize: 10 }}>{enabledAgentCount} Agents {t('setup.agentsRunning')}</Tag>
                </>
              )}
            </Space>
          </Col>
          <Col>
            <Link to="/setup">
              <Button type={setupIncomplete ? 'primary' : 'default'} size="small" icon={<SettingOutlined />}>
                {setupIncomplete ? t('dashboard.quickSetup') : t('setup.manageConfig')}
              </Button>
            </Link>
          </Col>
        </Row>
      </Card>

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

      <OperationsOverview storesData={storesData ?? []} />
    </div>
  );
}
