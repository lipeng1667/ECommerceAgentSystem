import { CheckCircleOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Progress, Row, Statistic, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface FinanceAuditModalProps {
  open: boolean;
  onClose: () => void;
}

const mockSummary = [
  { id: 1, month: '2026-07', orders: 1245, platformRevenue: 48200, bankReceived: 47950, discrepancy: 250, status: 'investigating' },
  { id: 2, month: '2026-06', orders: 1180, platformRevenue: 45600, bankReceived: 45600, discrepancy: 0, status: 'matched' },
  { id: 3, month: '2026-05', orders: 1098, platformRevenue: 42100, bankReceived: 41850, discrepancy: 250, status: 'matched' },
];

const mockDiscrepancies = [
  { id: 1, month: '2026-07', platform: 'Amazon', orders: 820, platformRevenue: 32100, bankReceived: 31900, discrepancy: 200, status: 'investigating' },
  { id: 2, month: '2026-07', platform: 'TikTok Shop', orders: 425, platformRevenue: 16100, bankReceived: 16050, discrepancy: 50, status: 'unmatched' },
];

export function FinanceAuditModal({ open, onClose }: FinanceAuditModalProps) {
  const { t } = useI18n();
  const [discrepancies, setDiscrepancies] = useState(mockDiscrepancies);

  const handleMarkMatched = (id: number) => {
    setDiscrepancies(prev => prev.map(d => d.id === id ? { ...d, status: 'matched' } : d));
    message.success(t('finAudit.markMatchedSuccess'));
  };

  const totalRevenue = mockSummary.reduce((s, r) => s + r.platformRevenue, 0);
  const totalDiscrepancy = mockSummary.reduce((s, r) => s + r.discrepancy, 0);
  const matchRate = Math.round((1 - totalDiscrepancy / totalRevenue) * 1000) / 10;
  const discrepancyCount = discrepancies.filter(d => d.status !== 'matched').length;

  const statusConfig: Record<string, { color: string; tag: string }> = {
    matched: { color: 'green', tag: t('finAudit.matched') },
    unmatched: { color: 'red', tag: t('finAudit.unmatched') },
    investigating: { color: 'orange', tag: t('finAudit.investigating') },
  };

  const summaryColumns = [
    { title: t('finAudit.month'), dataIndex: 'month', width: 100, render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    { title: t('finAudit.orders'), dataIndex: 'orders', width: 80, render: (v: number) => v.toLocaleString() },
    { title: t('finAudit.platformRevenue'), dataIndex: 'platformRevenue', width: 120, render: (v: number) => `$${v.toLocaleString()}` },
    { title: t('finAudit.bankReceived'), dataIndex: 'bankReceived', width: 120, render: (v: number) => `$${v.toLocaleString()}` },
    {
      title: t('finAudit.discrepancy'), dataIndex: 'discrepancy', width: 90,
      render: (v: number) => v === 0 ? <Tag color="green" style={{ fontSize: 11 }}>$0</Tag> : <Tag color="red" style={{ fontSize: 11 }}>-${v}</Tag>,
    },
    {
      title: t('finAudit.statusCol'), dataIndex: 'status', width: 100,
      render: (v: string) => { const c = statusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
  ];

  const discrepancyColumns = [
    { title: t('finAudit.month'), dataIndex: 'month', width: 100, render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    { title: t('finAudit.platform'), dataIndex: 'platform', width: 110, render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag> },
    { title: t('finAudit.orders'), dataIndex: 'orders', width: 70 },
    { title: t('finAudit.platformRevenue'), dataIndex: 'platformRevenue', width: 120, render: (v: number) => `$${v.toLocaleString()}` },
    { title: t('finAudit.bankReceived'), dataIndex: 'bankReceived', width: 120, render: (v: number) => `$${v.toLocaleString()}` },
    {
      title: t('finAudit.discrepancy'), dataIndex: 'discrepancy', width: 90,
      render: (v: number) => <Tag color="red" style={{ fontSize: 11 }}>-${v}</Tag>,
    },
    {
      title: t('finAudit.statusCol'), dataIndex: 'status', width: 100,
      render: (v: string) => { const c = statusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
    {
      title: '', width: 110,
      render: (_: unknown, r: typeof mockDiscrepancies[0]) => r.status !== 'matched' ? <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkMatched(r.id)}>{t('finAudit.markMatched')}</Button> : null,
    },
  ];

  return (
    <BaseWorkflowModal
      open={open}
      onClose={onClose}
      title={t('finAudit.title')}
      icon={<SearchOutlined />}
      iconColor="#2563eb"
      width={900}
      preContent={
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}><Card size="small"><Statistic title={t('finAudit.totalRevenue')} value={totalRevenue} prefix="$" /></Card></Col>
          <Col span={8}><Card size="small"><Statistic title={t('finAudit.totalDiscrepancy')} value={totalDiscrepancy} prefix="$" valueStyle={{ color: '#dc2626' }} /></Card></Col>
          <Col span={8}><Card size="small"><div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{t('finAudit.matchRate')}</div><Progress percent={matchRate} size="small" strokeColor="#16a34a" format={(p) => <span style={{ fontSize: 12 }}>{p}%</span>} /></Card></Col>
        </Row>
      }
      tabs={[
        { key: 'summary', label: t('finAudit.summaryTab'), children: <Table dataSource={mockSummary} columns={summaryColumns} rowKey="id" pagination={false} size="small" /> },
        {
          key: 'discrepancy',
          label: t('finAudit.discrepancyTab', { count: discrepancyCount }),
          children: discrepancyCount > 0 ? <Table dataSource={discrepancies} columns={discrepancyColumns} rowKey="id" pagination={false} size="small" /> : <Empty description={t('finAudit.noDiscrepancies')} />,
        },
        {
          key: 'report', label: t('finAudit.reportTab'),
          children: <Card><Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success(t('finAudit.reportGenerated'))}>{t('finAudit.downloadReport')}</Button></Card>,
        },
      ]}
    />
  );
}
