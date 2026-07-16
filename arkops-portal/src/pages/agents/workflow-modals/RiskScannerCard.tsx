import { FileSearchOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockBreakerLogs, mockRiskScans } from '../agentConfigMockData';

export function RiskScannerCard() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastScan, setLastScan] = useState('2h ago');
  const [riskScans, setRiskScans] = useState(
    mockRiskScans.map(r => ({ ...r, status: r.status as 'pending' | 'fixed' })),
  );

  const handleFix = (id: number) => {
    setRiskScans(prev => prev.map(r => (r.id === id ? { ...r, status: 'fixed' as const } : r)));
    message.success(t('risk.fixed'));
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan('just now');
      message.success(t('risk.scanDone'));
    }, 2000);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      message.success(t('risk.exportDone'));
    }, 1500);
  };

  const severityConfig: Record<string, { color: string; label: string }> = {
    high: { color: 'red', label: t('risk.severityHigh') },
    medium: { color: 'orange', label: t('risk.severityMedium') },
    low: { color: 'gold', label: t('risk.severityLow') },
  };

  const riskColumns = [
    {
      title: t('risk.product'),
      dataIndex: 'product',
      width: 140,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.issue'),
      dataIndex: 'issue',
      ellipsis: true,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.severity'),
      dataIndex: 'severity',
      width: 80,
      render: (v: string) => {
        const cfg = severityConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('risk.rule'),
      dataIndex: 'rule',
      width: 120,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.suggestion'),
      dataIndex: 'suggestion',
      ellipsis: true,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.statusCol'),
      dataIndex: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'pending' ? 'orange' : 'green'} style={{ fontSize: 11 }}>
          {v === 'pending' ? t('risk.statusPending') : t('risk.statusFixed')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      width: 80,
      render: (_: unknown, r: typeof riskScans[0]) =>
        r.status === 'fixed' ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('risk.fixed')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleFix(r.id)}>
            {t('risk.fix')}
          </Button>
        ),
    },
  ];

  const breakerColumns = [
    {
      title: t('risk.time'),
      dataIndex: 'time',
      width: 150,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.agent'),
      dataIndex: 'agent',
      width: 140,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.reason'),
      dataIndex: 'reason',
      ellipsis: true,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.action'),
      dataIndex: 'action',
      ellipsis: true,
      render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('risk.recoverStatus'),
      width: 140,
      render: (_: unknown, r: typeof mockBreakerLogs[0]) => (
        r.recovered ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('risk.recovered')} {r.recoveredAt}</Tag>
        ) : (
          <Tag color="red" style={{ fontSize: 11 }}>{t('risk.notRecovered')}</Tag>
        )
      ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #dc2626' }}
      title={
        <Space>
          <SafetyOutlined style={{ color: '#dc2626' }} />
          {t('risk.scannerTitle')}
          <Badge status="processing" />
          <Tag color="red" style={{ fontSize: 11 }}>{t('risk.lastScan')}: {lastScan}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan}>
            {t('risk.scanNow')}
          </Button>
          <Button size="small" type="primary" icon={<FileSearchOutlined />} loading={exporting} onClick={handleExport}>
            {t('risk.exportReport')}
          </Button>
        </Space>
      }
    >
      <Tabs
        size="small"
        defaultActiveKey="compliance"
        items={[
          {
            key: 'compliance',
            label: t('risk.complianceTab'),
            children: <Table dataSource={riskScans} columns={riskColumns} rowKey="id" pagination={false} size="small" />,
          },
          {
            key: 'breaker',
            label: t('risk.breakerTab'),
            children: <Table dataSource={mockBreakerLogs} columns={breakerColumns} rowKey="id" pagination={false} size="small" />,
          },
        ]}
      />
    </Card>
  );
}
