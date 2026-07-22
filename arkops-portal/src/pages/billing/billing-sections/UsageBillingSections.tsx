import {
  CrownOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LineChartOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { financeApi } from '../../../api/finance';
import { useI18n } from '../../../app/i18n';
import { TrendBarChart } from '../../../components/charts/TrendBarChart';
import { MetricCard } from '../../../components/metrics/MetricCard';
import type { BillingRecord } from '../../../types/domain';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 }).format(value);
}

/** WS-F F3: next bill date is always computed — first day of the next cycle. */
export function computeNextBillDate(pendingDueDate?: string) {
  const now = dayjs();
  if (pendingDueDate && dayjs(pendingDueDate).isAfter(now, 'day')) return pendingDueDate;
  return now.add(1, 'month').startOf('month').format('YYYY-MM-DD');
}

// ===== 顶部概览卡片 =====

export function FinanceSummary({ onSwitchToSubscription }: { onSwitchToSubscription: () => void }) {
  const { t } = useI18n();
  const { data: usage } = useQuery({ queryKey: ['usageOverview'], queryFn: financeApi.getUsageOverview });
  const { data: analysis } = useQuery({ queryKey: ['costAnalysis'], queryFn: financeApi.getCostAnalysis });
  const { data: currentBill } = useQuery({ queryKey: ['currentBill'], queryFn: financeApi.getCurrentBillDetail });
  const { data: currentPlan } = useQuery({ queryKey: ['currentPlan'], queryFn: financeApi.getCurrentPlan });
  const { data: records } = useQuery({ queryKey: ['billingRecords'], queryFn: financeApi.getBillingRecords });
  const pendingRecord = records?.find((r) => r.status === 'pending');

  // WS-F F3: linear projection of the month-end total from month-to-date overage.
  const now = dayjs();
  const overageToDate = currentBill ? currentBill.total - currentBill.baseSubscription - currentBill.discount : 0;
  const projectedTotal = currentBill
    ? currentBill.baseSubscription + overageToDate * (now.daysInMonth() / Math.max(now.date(), 1))
    : 0;
  const nextBillDate = computeNextBillDate(pendingRecord?.dueDate);

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} lg={4}>
        <Card style={{ height: '100%', borderTop: '3px solid #2563eb' }} bodyStyle={{ padding: '16px 20px' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('finance.currentPlanLabel')}</Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <CrownOutlined style={{ color: '#2563eb' }} />
            <Typography.Text strong style={{ fontSize: 18, color: '#2563eb' }}>{currentPlan?.tier ?? '-'}</Typography.Text>
          </div>
          <Typography.Link onClick={onSwitchToSubscription} style={{ fontSize: 11, marginTop: 4, display: 'inline-block' }}>
            {t('finance.manageSubscription')} →
          </Typography.Link>
        </Card>
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('finance.monthlyFee')}
          value={currentBill?.total ?? 0}
          prefix="¥"
          precision={2}
          valueStyle={{ color: '#2563eb', fontWeight: 'bold', fontSize: 20 }}
          helper={`${t('finance.baseFee')} ¥${currentBill?.baseSubscription ?? 0}`}
        />
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('billingv2.projectedTotal')}
          value={projectedTotal}
          prefix="¥"
          precision={2}
          valueStyle={{ color: '#7c3aed', fontWeight: 'bold', fontSize: 20 }}
          helper={t('billingv2.projectedHelper')}
        />
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('finance.usagePercent')}
          value={usage ? Math.round((usage.agentCalls.used / usage.agentCalls.limit) * 100) : 0}
          suffix="%"
          valueStyle={{ color: usage && usage.agentCalls.used > usage.agentCalls.limit ? '#dc2626' : '#16a34a', fontWeight: 'bold', fontSize: 20 }}
        >
          <Progress
            percent={usage ? Math.min(Math.round((usage.agentCalls.used / usage.agentCalls.limit) * 100), 100) : 0}
            size="small"
            strokeColor={usage && usage.agentCalls.used > usage.agentCalls.limit ? '#dc2626' : '#2563eb'}
          />
        </MetricCard>
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('finance.savedAmount')}
          value={analysis?.estimatedSaving.savedAmount ?? 0}
          prefix="¥"
          valueStyle={{ color: '#16a34a', fontWeight: 'bold', fontSize: 20 }}
          helper={t('finance.savedShort')}
        />
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('subscription.nextBillDate')}
          value={nextBillDate}
          valueStyle={{ color: '#ea580c', fontWeight: 'bold', fontSize: 18 }}
          helper={t('billingv2.nextBillHelper')}
        >
          <Tag color={pendingRecord ? 'orange' : 'default'} style={{ marginTop: 4 }}>{pendingRecord ? t('finance.status_pending') : t('finance.noPending')}</Tag>
        </MetricCard>
      </Col>
    </Row>
  );
}

// ===== 超额费率卡 =====

export function OverageRateSection() {
  const { t } = useI18n();
  const { data: rates = [] } = useQuery({ queryKey: ['overageRates'], queryFn: financeApi.getOverageRates });

  const columns: ColumnsType<{ key: string; label: string; included: string; rate: string }> = [
    { title: t('billingv2.rateItem'), dataIndex: 'label' },
    { title: t('billingv2.includedInPlan'), dataIndex: 'included' },
    { title: t('billingv2.overageRate'), dataIndex: 'rate', render: (v: string) => <Typography.Text strong style={{ color: '#ea580c' }}>{v}</Typography.Text> }
  ];

  return (
    <Card title={<><TagsOutlined /> {t('billingv2.rateCard')}</>} style={{ marginBottom: 24 }}>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
        {t('billingv2.rateCardDesc')}
      </Typography.Paragraph>
      <Table rowKey="key" columns={columns} dataSource={rates} pagination={false} size="small" />
    </Card>
  );
}

// ===== 用量 =====

/** Distance in px from the chart container bottom to the bars' baseline (label + gap). */
const CHART_BASELINE_OFFSET = 32;
const MAX_BAR_HEIGHT = 90;

export function UsageSection() {
  const { t } = useI18n();
  const { data: trend = [] } = useQuery({ queryKey: ['usageTrend'], queryFn: financeApi.getUsageTrend });
  const { data: usage } = useQuery({ queryKey: ['usageOverview'], queryFn: financeApi.getUsageOverview });
  if (trend.length === 0) return null;

  // WS-F F3: plan limits drawn on every metered trend (token limit converted to K).
  const metrics = [
    { key: 'agentCalls' as const, label: t('finance.agentCalls'), color: '#2563eb', limit: usage?.agentCalls.limit, limitText: usage ? `${usage.agentCalls.limit} 次` : undefined },
    { key: 'tokenUsage' as const, label: t('finance.tokenUsage'), color: '#7c3aed', limit: usage ? usage.tokenUsage.limit / 1000 : undefined, limitText: usage ? `${usage.tokenUsage.limit / 1000}K` : undefined },
    { key: 'browserSessions' as const, label: t('finance.browserSessions'), color: '#0f766e', limit: usage?.browserSessions.limit, limitText: usage ? `${usage.browserSessions.limit} 个` : undefined },
    { key: 'stores' as const, label: t('subscription.stores'), color: '#ea580c', limit: usage?.stores.limit, limitText: usage ? `${usage.stores.limit} 个` : undefined }
  ];

  return (
    <Card
      title={<><LineChartOutlined /> {t('finance.usageTrend')}</>}
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[16, 16]}>
        {metrics.map((m) => {
          const dataMax = Math.max(...trend.map((d) => d[m.key] ?? 0), 1);
          const scaleMax = Math.max(dataMax, m.limit ?? 0);
          return (
            <Col xs={24} lg={12} key={m.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <Typography.Text strong>{m.label}</Typography.Text>
                {m.limitText && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-block', width: 18, borderTop: '2px dashed var(--ark-orange)', verticalAlign: 'middle', marginRight: 4 }} />
                    {t('billingv2.planLimit')} {m.limitText}
                  </Typography.Text>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <TrendBarChart
                  className="usage-chart"
                  barAreaHeight={100}
                  maxBarHeight={MAX_BAR_HEIGHT}
                  points={trend.map((item) => {
                    const value = item[m.key] ?? 0;
                    const overLimit = m.limit != null && value > m.limit;
                    return {
                      key: `${m.key}-${item.month}`,
                      label: item.month,
                      bars: [
                        {
                          value,
                          max: scaleMax,
                          title: `${m.label}: ${value}${m.key === 'tokenUsage' ? 'K' : ''}${overLimit ? ` · ${t('billingv2.overLimit')}` : ''}`,
                          color: overLimit ? '#dc2626' : m.color,
                          minHeight: 10,
                          width: 18
                        }
                      ]
                    };
                  })}
                />
                {m.limit != null && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      bottom: CHART_BASELINE_OFFSET + Math.min(m.limit / scaleMax, 1) * MAX_BAR_HEIGHT,
                      borderTop: '2px dashed var(--ark-orange)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('finance.monthAvg')}: {Math.round(trend.reduce((sum, d) => sum + (d[m.key] ?? 0), 0) / trend.length).toLocaleString()}{m.key === 'tokenUsage' ? 'K' : ' 次'}
                </Typography.Text>
              </div>
            </Col>
          );
        })}
      </Row>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
        {t('billingv2.overLimitNote')}
      </Typography.Paragraph>
    </Card>
  );
}

// ===== 账单 =====

export function BillingSection() {
  const { t } = useI18n();
  const { data: records } = useQuery({ queryKey: ['billingRecords'], queryFn: financeApi.getBillingRecords });
  const { data: currentBill } = useQuery({ queryKey: ['currentBill'], queryFn: financeApi.getCurrentBillDetail });
  const statusColors: Record<BillingRecord['status'], string> = { pending: 'orange', paid: 'green', overdue: 'red' };
  const columns: ColumnsType<BillingRecord> = [
    { title: t('finance.period'), dataIndex: 'period' },
    { title: t('finance.amount'), dataIndex: 'amount', render: (v: number) => formatCurrency(v), align: 'right' },
    { title: t('finance.status'), dataIndex: 'status', render: (s: BillingRecord['status']) => <Tag color={statusColors[s]}>{t(`finance.status_${s}`)}</Tag>, width: 100 },
    { title: t('finance.dueDate'), dataIndex: 'dueDate', width: 110 },
    { title: t('finance.invoice'), dataIndex: 'invoiceUrl', render: (url: string | undefined) => url ? <Button size="small" icon={<DownloadOutlined />}>{t('finance.download')}</Button> : '-', width: 100 }
  ];

  return (
    <Card
      title={<><FileTextOutlined /> {t('finance.billing')}</>}
      style={{ marginBottom: 24 }}
    >
      {currentBill && (
        <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}><Statistic title={t('finance.baseFee')} value={currentBill.baseSubscription} prefix="¥" valueStyle={{ fontSize: 16 }} /></Col>
          {currentBill.overageItems.map((item, idx) => (
            <Col xs={12} sm={6} key={idx}>
              <Statistic title={item.description} value={item.amount} prefix="¥" precision={2} valueStyle={{ fontSize: 16, color: '#ea580c' }} />
            </Col>
          ))}
          <Col xs={12} sm={6}><Statistic title={t('finance.total')} value={currentBill.total} prefix="¥" valueStyle={{ fontSize: 20, color: '#2563eb', fontWeight: 'bold' }} /></Col>
        </Row>
      )}
      <Table rowKey="id" columns={columns} dataSource={records} pagination={false} size="small" />
    </Card>
  );
}
