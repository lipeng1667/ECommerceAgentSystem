import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface InventoryAlertModalProps {
  open: boolean;
  onClose: () => void;
}

const mockLowStock = [
  { id: 1, sku: 'EAR-PRO2-BLK', product: 'Wireless Earbuds Pro 2', currentStock: 8, threshold: 20, daysOfSupply: 3, status: 'critical' },
  { id: 2, sku: 'CHG-65W-WHT', product: 'USB-C Fast Charger 65W', currentStock: 15, threshold: 30, daysOfSupply: 7, status: 'warning' },
  { id: 3, sku: 'WCH-LITE-BLK', product: 'Smart Watch Lite', currentStock: 3, threshold: 15, daysOfSupply: 1, status: 'critical' },
  { id: 4, sku: 'SPK-MIN-BLU', product: 'Bluetooth Speaker Mini', currentStock: 22, threshold: 25, daysOfSupply: 10, status: 'warning' },
];

const mockDeadStock = [
  { id: 1, sku: 'CSE-LTH-BRN', product: 'Leather Phone Case', currentStock: 120, deadStockDays: 89, lastSold: '3 months ago' },
  { id: 2, sku: 'CBL-USB-1M', product: 'USB-A Cable 1m', currentStock: 85, deadStockDays: 67, lastSold: '2 months ago' },
  { id: 3, sku: 'HLD-CAR-BLK', product: 'Car Phone Holder', currentStock: 50, deadStockDays: 45, lastSold: '6 weeks ago' },
];

const mockReplenish = [
  { id: 1, sku: 'EAR-PRO2-BLK', product: 'Wireless Earbuds Pro 2', suggestedQty: 200, leadTime: 7 },
  { id: 2, sku: 'WCH-LITE-BLK', product: 'Smart Watch Lite', suggestedQty: 150, leadTime: 10 },
];

export function InventoryAlertModal({ open, onClose }: InventoryAlertModalProps) {
  const { t } = useI18n();
  const [replenished, setReplenished] = useState<number[]>([]);

  const handleReplenish = (id: number, sku: string) => {
    setReplenished(prev => [...prev, id]);
    message.success(t('inventory.replenishSuccess', { sku }));
  };

  const statusConfig: Record<string, { color: string; tag: string }> = {
    critical: { color: 'red', tag: t('inventory.critical') },
    warning: { color: 'orange', tag: t('inventory.warning') },
    healthy: { color: 'green', tag: t('inventory.healthy') },
    out: { color: 'red', tag: t('inventory.outOfStock') },
  };

  const lowStockColumns = [
    { title: t('inventory.sku'), dataIndex: 'sku', width: 130, render: (v: string) => <Typography.Text code style={{ fontSize: 11 }}>{v}</Typography.Text> },
    { title: t('inventory.product'), dataIndex: 'product', ellipsis: true },
    {
      title: t('inventory.currentStock'), dataIndex: 'currentStock', width: 90,
      render: (v: number, r: typeof mockLowStock[0]) => <Space><Typography.Text strong style={{ color: r.status === 'critical' ? '#dc2626' : '#f59e0b', fontSize: 13 }}>{v}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 11 }}>/ {r.threshold}</Typography.Text></Space>,
    },
    {
      title: t('inventory.daysOfSupply'), dataIndex: 'daysOfSupply', width: 90,
      render: (v: number) => <Tag color={v <= 3 ? 'red' : v <= 7 ? 'orange' : 'green'} style={{ fontSize: 11 }}>{v}d</Tag>,
    },
    {
      title: t('inventory.status'), dataIndex: 'status', width: 80,
      render: (v: string) => { const c = statusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
  ];

  const deadStockColumns = [
    { title: t('inventory.sku'), dataIndex: 'sku', width: 130, render: (v: string) => <Typography.Text code style={{ fontSize: 11 }}>{v}</Typography.Text> },
    { title: t('inventory.product'), dataIndex: 'product', ellipsis: true },
    { title: t('inventory.currentStock'), dataIndex: 'currentStock', width: 90, render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>{v}</Typography.Text> },
    {
      title: t('inventory.deadStockDays'), dataIndex: 'deadStockDays', width: 90,
      render: (v: number) => <Tag color={v >= 60 ? 'red' : 'orange'} style={{ fontSize: 11 }}>{v}d</Tag>,
    },
    { title: t('inventory.lastSold'), dataIndex: 'lastSold', width: 110, render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text> },
  ];

  const replenishColumns = [
    { title: t('inventory.sku'), dataIndex: 'sku', width: 130, render: (v: string) => <Typography.Text code style={{ fontSize: 11 }}>{v}</Typography.Text> },
    { title: t('inventory.product'), dataIndex: 'product', ellipsis: true },
    { title: t('inventory.suggestedQty'), dataIndex: 'suggestedQty', width: 100, render: (v: number) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    { title: t('inventory.leadTime'), dataIndex: 'leadTime', width: 90, render: (v: number) => <Tag style={{ fontSize: 11 }}>{v}d</Tag> },
    {
      title: '', width: 100,
      render: (_: unknown, r: typeof mockReplenish[0]) => replenished.includes(r.id) ? <Tag color="green" style={{ fontSize: 11 }}>OK</Tag> : <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => handleReplenish(r.id, r.sku)}>{t('inventory.replenish')}</Button>,
    },
  ];

  return (
    <BaseWorkflowModal
      open={open}
      onClose={onClose}
      title={t('inventory.title')}
      icon={<ExclamationCircleOutlined />}
      iconColor="#dc2626"
      width={800}
      tabs={[
        { key: 'low', label: t('inventory.lowStockTab', { count: mockLowStock.length }), children: <Table dataSource={mockLowStock} columns={lowStockColumns} rowKey="id" pagination={false} size="small" /> },
        { key: 'dead', label: t('inventory.deadStockTab', { count: mockDeadStock.length }), children: <Table dataSource={mockDeadStock} columns={deadStockColumns} rowKey="id" pagination={false} size="small" /> },
        { key: 'replenish', label: t('inventory.replenishTab', { count: mockReplenish.length }), children: <Table dataSource={mockReplenish} columns={replenishColumns} rowKey="id" pagination={false} size="small" /> },
      ]}
    />
  );
}
