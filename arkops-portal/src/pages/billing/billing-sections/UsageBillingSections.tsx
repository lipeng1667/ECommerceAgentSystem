import {
  BankOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  CrownOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MailOutlined,
  PhoneOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  SwapOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Descriptions, Form, Input, message, Progress, Row, Statistic, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { financeApi } from '../../../api/finance';
import { useI18n } from '../../../app/i18n';
import { TrendBarChart } from '../../../components/charts/TrendBarChart';
import { MetricCard } from '../../../components/metrics/MetricCard';
import type { BillingRecord, SubscriptionPlan } from '../../../types/domain';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
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

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} lg={5}>
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
      <Col xs={12} sm={6} lg={5}>
        <MetricCard
          title={t('finance.monthlyFee')}
          value={currentBill?.total ?? 0}
          prefix="$"
          precision={2}
          valueStyle={{ color: '#2563eb', fontWeight: 'bold', fontSize: 20 }}
          helper={`${t('finance.baseFee')} $${currentBill?.baseSubscription ?? 0}`}
        />
      </Col>
      <Col xs={12} sm={6} lg={5}>
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
      <Col xs={12} sm={6} lg={5}>
        <MetricCard
          title={t('finance.savedAmount')}
          value={analysis?.estimatedSaving.savedAmount ?? 0}
          prefix="$"
          valueStyle={{ color: '#16a34a', fontWeight: 'bold', fontSize: 20 }}
          helper={t('finance.savedShort')}
        />
      </Col>
      <Col xs={12} sm={6} lg={4}>
        <MetricCard
          title={t('finance.nextDueDate')}
          value={pendingRecord?.dueDate ?? '-'}
          valueStyle={{ color: '#ea580c', fontWeight: 'bold', fontSize: 18 }}
        >
          <Tag color={pendingRecord ? 'orange' : 'default'} style={{ marginTop: 4 }}>{pendingRecord ? t('finance.status_pending') : t('finance.noPending')}</Tag>
        </MetricCard>
      </Col>
    </Row>
  );
}

// ===== 用量 =====

export function UsageSection() {
  const { t } = useI18n();
  const { data: trend = [] } = useQuery({ queryKey: ['usageTrend'], queryFn: financeApi.getUsageTrend });
  if (trend.length === 0) return null;

  const metrics = [
    { key: 'agentCalls' as const, label: t('finance.agentCalls'), color: '#2563eb' },
    { key: 'tokenUsage' as const, label: t('finance.tokenUsage'), color: '#7c3aed' },
    { key: 'browserSessions' as const, label: t('finance.browserSessions'), color: '#0f766e' },
    { key: 'stores' as const, label: t('subscription.stores'), color: '#ea580c' }
  ];

  const maxValues: Record<string, number> = {};
  for (const m of metrics) {
    maxValues[m.key] = Math.max(...trend.map((d) => d[m.key] ?? 0), 1);
  }

  return (
    <Card
      title={<><LineChartOutlined /> {t('finance.usageTrend')}</>}
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[16, 16]}>
        {metrics.map((m) => (
          <Col xs={24} lg={12} key={m.key}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>{m.label}</Typography.Text>
            <TrendBarChart
              className="usage-chart"
              barAreaHeight={100}
              maxBarHeight={90}
              points={trend.map((item) => ({
                key: `${m.key}-${item.month}`,
                label: item.month,
                bars: [
                  {
                    value: item[m.key] ?? 0,
                    max: maxValues[m.key],
                    title: `${m.label}: ${item[m.key]}${m.key === 'tokenUsage' ? 'K' : ''}`,
                    color: m.color,
                    minHeight: 10,
                    width: 18
                  }
                ]
              }))}
            />
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('finance.monthAvg')}: {Math.round(trend.reduce((sum, d) => sum + (d[m.key] ?? 0), 0) / trend.length).toLocaleString()}{m.key === 'tokenUsage' ? 'K' : ' 次'}
              </Typography.Text>
            </div>
          </Col>
        ))}
      </Row>
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
          <Col xs={12} sm={6}><Statistic title={t('finance.baseFee')} value={currentBill.baseSubscription} prefix="$" valueStyle={{ fontSize: 16 }} /></Col>
          {currentBill.overageItems.map((item, idx) => (
            <Col xs={12} sm={6} key={idx}>
              <Statistic title={item.description} value={item.amount} prefix="$" precision={2} valueStyle={{ fontSize: 16, color: '#ea580c' }} />
            </Col>
          ))}
          <Col xs={12} sm={6}><Statistic title={t('finance.total')} value={currentBill.total} prefix="$" valueStyle={{ fontSize: 20, color: '#2563eb', fontWeight: 'bold' }} /></Col>
        </Row>
      )}
      <Table rowKey="id" columns={columns} dataSource={records} pagination={false} size="small" />
    </Card>
  );
}
