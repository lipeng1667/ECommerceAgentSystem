import { BankOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';

const mockReconciliation = [
  { id: 1, platform: 'TikTok Shop', month: '2024-06', platformBill: 48230, bankReceived: 47890, diff: 340, status: 'matched', diffReason: '汇率波动' },
  { id: 2, platform: 'Amazon', month: '2024-05', platformBill: 32100, bankReceived: 31200, diff: 900, status: 'investigating', diffReason: '' },
  { id: 3, platform: 'TikTok Shop', month: '2024-05', platformBill: 38500, bankReceived: 38500, diff: 0, status: 'matched', diffReason: '' },
  { id: 4, platform: 'Amazon', month: '2024-04', platformBill: 28900, bankReceived: 28200, diff: 700, status: 'resolved', diffReason: '平台手续费调整' },
];

export function FinanceReconcileCard() {
  const { t } = useI18n();
  const [reconciling, setReconciling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastReconcile, setLastReconcile] = useState('2h ago');
  const [reconciliation] = useState(mockReconciliation.map(r => ({ ...r })));

  const handleReconcile = () => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      setLastReconcile('just now');
      message.success(t('finance.reconcileDone'));
    }, 2000);
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      message.success(t('finance.reportDone'));
    }, 1500);
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    matched: { color: 'green', label: t('finance.statusMatched') },
    investigating: { color: 'gold', label: t('finance.statusInvestigating') },
    resolved: { color: 'blue', label: t('finance.statusResolved') },
  };

  const columns = [
    {
      title: t('finance.platform'),
      dataIndex: 'platform',
      width: 130,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('finance.month'),
      dataIndex: 'month',
      width: 100,
      render: (v: string) => <Typography.Text style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('finance.platformBill'),
      dataIndex: 'platformBill',
      width: 120,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toLocaleString()}</Typography.Text>,
    },
    {
      title: t('finance.bankReceived'),
      dataIndex: 'bankReceived',
      width: 120,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toLocaleString()}</Typography.Text>,
    },
    {
      title: t('finance.diff'),
      dataIndex: 'diff',
      width: 100,
      render: (v: number) => {
        const color = v === 0 ? '#16a34a' : '#dc2626';
        return <Typography.Text style={{ fontSize: 13, color, fontWeight: 600 }}>${v.toFixed(2)}</Typography.Text>;
      },
    },
    {
      title: t('finance.statusCol'),
      dataIndex: 'status',
      width: 110,
      render: (v: string) => {
        const cfg = statusConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 90,
      render: () => (
        <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => message.success(t('finance.viewed'))}>
          {t('finance.view')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #64748b' }}
      title={
        <Space>
          <BankOutlined style={{ color: '#64748b' }} />
          {t('finance.reconcileTitle')}
          <Badge status="processing" />
          <Tag color="default" style={{ fontSize: 11 }}>{t('finance.lastReconcile')}: {lastReconcile}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={reconciling} onClick={handleReconcile}>
            {t('finance.reconcileNow')}
          </Button>
          <Button size="small" type="primary" icon={<EditOutlined />} loading={generating} onClick={handleGenerateReport}>
            {t('finance.generateReport')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={reconciliation} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
