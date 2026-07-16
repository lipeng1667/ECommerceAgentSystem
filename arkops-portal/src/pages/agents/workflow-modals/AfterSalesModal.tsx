import { CheckOutlined, CloseOutlined, TruckOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface AfterSalesModalProps {
  open: boolean;
  onClose: () => void;
}

const mockReturns = [
  { id: 1, orderId: 'AMZ-10245', buyer: 'user_29481', product: 'Wireless Earbuds Pro 2', reason: 'Defective', amount: 32.99, status: 'pending', requestedAt: '2h ago' },
  { id: 2, orderId: 'AMZ-10238', buyer: 'shopper_1023', product: 'USB-C Charger 65W', reason: 'Wrong item', amount: 24.99, status: 'pending', requestedAt: '5h ago' },
  { id: 3, orderId: 'TIK-5567', buyer: 'buyer_8821', product: 'Smart Watch Lite', reason: 'Not as described', amount: 39.99, status: 'auto_approved', requestedAt: '1d ago' },
];

const mockRefunds = [
  { id: 1, orderId: 'AMZ-10201', buyer: 'user_5520', product: 'Bluetooth Speaker Mini', reason: 'Late delivery', amount: 18.99, status: 'refunded', requestedAt: '3d ago' },
  { id: 2, orderId: 'TIK-5501', buyer: 'shopper_3399', product: 'Wireless Earbuds Pro 2', reason: 'Customer changed mind', amount: 32.99, status: 'refunded', requestedAt: '5d ago' },
];

const mockLogistics = [
  { id: 1, orderId: 'AMZ-10245', carrier: 'UPS', trackingNo: '1Z999AA10123456784', status: 'in_transit' },
  { id: 2, orderId: 'AMZ-10238', carrier: 'FedEx', trackingNo: '771182438921', status: 'exception' },
  { id: 3, orderId: 'TIK-5567', carrier: 'USPS', trackingNo: '9400111899223197543210', status: 'delivered' },
];

export function AfterSalesModal({ open, onClose }: AfterSalesModalProps) {
  const { t } = useI18n();
  const [returns, setReturns] = useState(mockReturns);

  const handleApprove = (id: number) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    message.success(t('aftersales.approveSuccess'));
  };
  const handleReject = (id: number) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    message.success(t('aftersales.rejectSuccess'));
  };

  const statusConfig: Record<string, { color: string; tag: string }> = {
    pending: { color: 'orange', tag: t('aftersales.pendingReview') },
    auto_approved: { color: 'blue', tag: t('aftersales.autoApproved') },
    approved: { color: 'green', tag: t('aftersales.approved') },
    rejected: { color: 'red', tag: t('aftersales.rejected') },
    refunded: { color: 'purple', tag: t('aftersales.refunded') },
  };

  const returnColumns = [
    { title: t('aftersales.orderId'), dataIndex: 'orderId', width: 110, render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text> },
    { title: t('aftersales.buyer'), dataIndex: 'buyer', width: 110 },
    { title: t('aftersales.product'), dataIndex: 'product', ellipsis: true },
    { title: t('aftersales.reason'), dataIndex: 'reason', width: 100 },
    { title: t('aftersales.amount'), dataIndex: 'amount', width: 70, render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: t('aftersales.status'), dataIndex: 'status', width: 100,
      render: (v: string) => { const c = statusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
    { title: t('aftersales.requestedAt'), dataIndex: 'requestedAt', width: 80, render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text> },
    {
      title: '', width: 120,
      render: (_: unknown, r: typeof mockReturns[0]) => r.status === 'pending' ? (
        <Space size="small">
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)}>{t('aftersales.approve')}</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(r.id)}>{t('aftersales.reject')}</Button>
        </Space>
      ) : null,
    },
  ];

  const refundColumns = [
    { title: t('aftersales.orderId'), dataIndex: 'orderId', width: 110, render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text> },
    { title: t('aftersales.buyer'), dataIndex: 'buyer', width: 110 },
    { title: t('aftersales.product'), dataIndex: 'product', ellipsis: true },
    { title: t('aftersales.reason'), dataIndex: 'reason', width: 120 },
    { title: t('aftersales.amount'), dataIndex: 'amount', width: 70, render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: t('aftersales.status'), dataIndex: 'status', width: 100,
      render: (v: string) => { const c = statusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
  ];

  const logisticsStatusConfig: Record<string, { color: string; tag: string }> = {
    in_transit: { color: 'blue', tag: t('aftersales.inTransit') },
    delivered: { color: 'green', tag: t('aftersales.delivered') },
    exception: { color: 'red', tag: t('aftersales.exception') },
  };

  const logisticsColumns = [
    { title: t('aftersales.orderId'), dataIndex: 'orderId', width: 110, render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text> },
    { title: t('aftersales.carrier'), dataIndex: 'carrier', width: 80, render: (v: string) => <Tag icon={<TruckOutlined />} style={{ fontSize: 11 }}>{v}</Tag> },
    { title: t('aftersales.trackingNo'), dataIndex: 'trackingNo', render: (v: string) => <Typography.Text copyable style={{ fontSize: 12 }}>{v}</Typography.Text> },
    {
      title: t('aftersales.status'), dataIndex: 'status', width: 100,
      render: (v: string) => { const c = logisticsStatusConfig[v]; return <Tag color={c.color} style={{ fontSize: 11 }}>{c.tag}</Tag>; },
    },
  ];

  return (
    <BaseWorkflowModal
      open={open}
      onClose={onClose}
      title={t('aftersales.title')}
      icon={<TruckOutlined />}
      iconColor="#ea580c"
      width={850}
      tabs={[
        { key: 'returns', label: t('aftersales.returnTab', { count: returns.filter(r => r.status === 'pending').length }), children: <Table dataSource={returns} columns={returnColumns} rowKey="id" pagination={false} size="small" /> },
        { key: 'refunds', label: t('aftersales.refundTab', { count: mockRefunds.length }), children: <Table dataSource={mockRefunds} columns={refundColumns} rowKey="id" pagination={false} size="small" /> },
        { key: 'logistics', label: t('aftersales.logisticsTab', { count: mockLogistics.length }), children: <Table dataSource={mockLogistics} columns={logisticsColumns} rowKey="id" pagination={false} size="small" /> },
      ]}
    />
  );
}
