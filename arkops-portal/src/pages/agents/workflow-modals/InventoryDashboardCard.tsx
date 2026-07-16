import { ReloadOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';

const mockInventory = [
  { id: 1, sku: 'GN65-BK-001', product: '65W GaN 充电器', stock: 520, threshold: 50, status: 'healthy', lastUpdated: '2h ago' },
  { id: 2, sku: 'EB-PRO-2', product: '蓝牙耳机 Pro', stock: 32, threshold: 50, status: 'low', lastUpdated: '1h ago' },
  { id: 3, sku: 'TS-SUM-01', product: '夏季运动T恤', stock: 180, threshold: 50, status: 'healthy', lastUpdated: '3h ago' },
  { id: 4, sku: 'LED-RGB-5M', product: 'LED 灯带 RGB', stock: 8, threshold: 20, status: 'critical', lastUpdated: '30min ago' },
  { id: 5, sku: 'CAMP-CHAIR', product: '可折叠露营椅', stock: 0, threshold: 30, status: 'dead', lastUpdated: '5h ago' },
];

export function InventoryDashboardCard() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [replenishing, setReplenishing] = useState(false);
  const [lastScan, setLastScan] = useState('1h ago');
  const [inventory, setInventory] = useState(mockInventory.map(i => ({ ...i })));

  const handleReplenish = (id: number) => {
    setInventory(prev =>
      prev.map(i => (i.id === id ? { ...i, stock: i.threshold * 3, status: 'healthy' } : i)),
    );
    message.success(t('inventory.replenished'));
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan('just now');
      message.success(t('inventory.scanDone'));
    }, 2000);
  };

  const handleBatchReplenish = () => {
    setReplenishing(true);
    setTimeout(() => {
      setReplenishing(false);
      message.success(t('inventory.replenishDone'));
    }, 1500);
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    healthy: { color: 'green', label: t('inventory.statusHealthy') },
    low: { color: 'orange', label: t('inventory.statusLow') },
    critical: { color: 'red', label: t('inventory.statusCritical') },
    dead: { color: 'default', label: t('inventory.statusDead') },
  };

  const columns = [
    {
      title: t('inventory.sku'),
      dataIndex: 'sku',
      width: 130,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('inventory.productName'),
      dataIndex: 'product',
      render: (v: string) => <Typography.Text style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('inventory.stock'),
      dataIndex: 'stock',
      width: 100,
      render: (v: number) => {
        const color = v === 0 ? '#dc2626' : v < 20 ? '#ea580c' : '#16a34a';
        return <Typography.Text style={{ fontSize: 13, color, fontWeight: 600 }}>{v}</Typography.Text>;
      },
    },
    {
      title: t('inventory.threshold'),
      dataIndex: 'threshold',
      width: 100,
      render: (v: number) => <Typography.Text type="secondary" style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('inventory.statusCol'),
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof inventory[0]) => (
        <Button
          size="small"
          type="link"
          disabled={r.status === 'healthy'}
          style={{ fontSize: 12, padding: 0 }}
          onClick={() => handleReplenish(r.id)}
        >
          {t('inventory.replenish')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #dc2626' }}
      title={
        <Space>
          <ShoppingCartOutlined style={{ color: '#dc2626' }} />
          {t('inventory.dashboardTitle')}
          <Badge status="processing" />
          <Tag color="red" style={{ fontSize: 11 }}>{t('inventory.lastScan')}: {lastScan}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan}>
            {t('inventory.scanNow')}
          </Button>
          <Button size="small" type="primary" icon={<ShoppingCartOutlined />} loading={replenishing} onClick={handleBatchReplenish}>
            {t('inventory.batchReplenish')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={inventory} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
