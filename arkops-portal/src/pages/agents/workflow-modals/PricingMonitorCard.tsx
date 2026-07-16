import { DollarOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockCompetitorPrices } from '../agentConfigMockData';

export function PricingMonitorCard() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [lastScan, setLastScan] = useState('2h ago');
  const [prices, setPrices] = useState(
    mockCompetitorPrices.map(p => ({ ...p, adjusted: false })),
  );

  const handleAdjustPrice = (id: number) => {
    setPrices(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ourPrice: Number((p.theirPrice + 0.5).toFixed(2)), adjusted: true }
          : p,
      ),
    );
    message.success(t('pricing.adjusted'));
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan('just now');
      message.success(t('pricing.scanDone'));
    }, 2000);
  };

  const handleBatchAdjust = () => {
    setAdjusting(true);
    setTimeout(() => {
      setAdjusting(false);
      message.success(t('pricing.adjustDone'));
    }, 1500);
  };

  const columns = [
    {
      title: t('pricing.product'),
      dataIndex: 'product',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('pricing.competitorPrice'),
      dataIndex: 'theirPrice',
      width: 120,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('pricing.ourPrice'),
      dataIndex: 'ourPrice',
      width: 120,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('pricing.priceDiff'),
      width: 120,
      render: (_: unknown, r: typeof prices[0]) => {
        const diff = r.ourPrice - r.theirPrice;
        if (Math.abs(diff) < 0.01) return <Tag style={{ fontSize: 11 }}>{t('pricing.priceParity')}</Tag>;
        if (diff > 0) return <Tag color="red" style={{ fontSize: 11 }}>+${diff.toFixed(2)}</Tag>;
        return <Tag color="green" style={{ fontSize: 11 }}>-${Math.abs(diff).toFixed(2)}</Tag>;
      },
    },
    {
      title: t('pricing.grossMargin'),
      width: 100,
      render: (_: unknown, r: typeof prices[0]) => {
        const cost = r.theirPrice * 0.7;
        const margin = ((r.ourPrice - cost) / r.ourPrice * 100).toFixed(0);
        return <Typography.Text style={{ fontSize: 13 }}>{margin}%</Typography.Text>;
      },
    },
    {
      title: t('common.actions'),
      width: 100,
      render: (_: unknown, r: typeof prices[0]) =>
        r.adjusted ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('pricing.adjusted')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleAdjustPrice(r.id)}>
            {t('pricing.adjustPrice')}
          </Button>
        ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #16a34a' }}
      title={
        <Space>
          <DollarOutlined style={{ color: '#16a34a' }} />
          {t('pricing.monitorTitle')}
          <Badge status="processing" />
          <Tag color="green" style={{ fontSize: 11 }}>{t('pricing.lastScan')}: {lastScan}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan}>
            {t('pricing.scanNow')}
          </Button>
          <Button size="small" type="primary" icon={<ToolOutlined />} loading={adjusting} onClick={handleBatchAdjust}>
            {t('pricing.batchAdjust')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={prices} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
