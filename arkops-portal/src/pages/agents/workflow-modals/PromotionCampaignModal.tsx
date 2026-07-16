import { FireOutlined, GiftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Col, Form, InputNumber, Row, Select, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface PromotionCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

const mockActive = [
  { id: 1, name: 'Summer Flash Sale', type: 'flash_sale', discount: '30% OFF', budget: 5000, spent: 2340, sales: 8900, roi: 3.8, period: 'Jul 1 - Jul 15', status: 'running' },
  { id: 2, name: 'Bundle: Earbuds + Case', type: 'bundle', discount: 'Save $8', budget: 2000, spent: 580, sales: 2100, roi: 3.6, period: 'Jul 5 - Jul 20', status: 'running' },
  { id: 3, name: 'New Customer Coupon', type: 'coupon', discount: '$5 off', budget: 3000, spent: 890, sales: 3200, roi: 3.6, period: 'Jul 1 - Jul 31', status: 'running' },
];

const mockHistory = [
  { id: 4, name: 'Spring Mega Sale', type: 'flash_sale', discount: '25% OFF', budget: 8000, spent: 7900, sales: 22000, roi: 2.8, period: 'Mar 15 - Mar 30', status: 'ended' },
  { id: 5, name: 'Easter Bundle', type: 'bundle', discount: 'Save $5', budget: 1500, spent: 1200, sales: 3800, roi: 3.2, period: 'Mar 25 - Apr 5', status: 'ended' },
];

const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  flash_sale: { color: 'red', icon: <ThunderboltOutlined />, label: '' },
  coupon: { color: 'blue', icon: <GiftOutlined />, label: '' },
  bundle: { color: 'purple', icon: <FireOutlined />, label: '' },
};

export function PromotionCampaignModal({ open, onClose }: PromotionCampaignModalProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(mockActive);

  typeConfig.flash_sale.label = t('promo.flashSale');
  typeConfig.coupon.label = t('promo.coupon');
  typeConfig.bundle.label = t('promo.bundle');

  const handleEnd = (id: number) => {
    setActive(prev => prev.map(c => c.id === id ? { ...c, status: 'ended' } : c));
    message.success(t('promo.endSuccess'));
  };

  const handleCreate = () => {
    message.success(t('promo.createSuccess'));
  };

  const columns = [
    { title: t('promo.campaignName'), dataIndex: 'name', render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    {
      title: t('promo.type'), dataIndex: 'type', width: 100,
      render: (v: string) => { const c = typeConfig[v]; return <Tag color={c.color} icon={c.icon} style={{ fontSize: 11 }}>{c.label}</Tag>; },
    },
    { title: t('promo.discount'), dataIndex: 'discount', width: 90 },
    {
      title: t('promo.spent') + '/' + t('promo.budget'), width: 110,
      render: (_: unknown, r: typeof mockActive[0]) => <Typography.Text style={{ fontSize: 12 }}>${r.spent} / ${r.budget}</Typography.Text>,
    },
    { title: t('promo.sales'), dataIndex: 'sales', width: 80, render: (v: number) => <Typography.Text style={{ color: '#16a34a', fontSize: 12 }}>${v.toLocaleString()}</Typography.Text> },
    { title: t('promo.roi'), dataIndex: 'roi', width: 60, render: (v: number) => <Tag color={v >= 3 ? 'green' : 'orange'} style={{ fontSize: 11 }}>{v.toFixed(1)}x</Tag> },
    { title: t('promo.period'), dataIndex: 'period', width: 130, render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text> },
    {
      title: '', width: 80,
      render: (_: unknown, r: typeof mockActive[0]) => r.status === 'running' ? <Button size="small" danger onClick={() => handleEnd(r.id)}>{t('promo.endNow')}</Button> : <Tag>{t('promo.ended')}</Tag>,
    },
  ];

  return (
    <BaseWorkflowModal
      open={open}
      onClose={onClose}
      title={t('promo.title')}
      icon={<FireOutlined />}
      iconColor="#ea580c"
      width={900}
      tabs={[
        {
          key: 'active', label: t('promo.activeTab', { count: active.filter(c => c.status === 'running').length }),
          children: <Table dataSource={active.filter(c => c.status === 'running')} columns={columns} rowKey="id" pagination={false} size="small" />,
        },
        {
          key: 'history', label: t('promo.historyTab', { count: mockHistory.length }),
          children: <Table dataSource={mockHistory} columns={columns} rowKey="id" pagination={false} size="small" />,
        },
        {
          key: 'create', label: t('promo.createTab'),
          children: (
            <Form layout="vertical" style={{ maxWidth: 500, margin: '0 auto', paddingTop: 16 }}>
              <Form.Item label={t('promo.campaignName')} name="name" rules={[{ required: true }]}>
                <Select style={{ width: '100%' }} options={[
                  { value: 'flash_sale', label: t('promo.createFlashSale') },
                  { value: 'coupon', label: t('promo.createCoupon') },
                  { value: 'bundle', label: t('promo.createBundle') },
                ]} />
              </Form.Item>
              <Form.Item label={t('promo.productSelect')} name="product" rules={[{ required: true }]}>
                <Select placeholder={t('promo.productSelect')} options={[
                  { value: 'earbuds', label: 'Wireless Earbuds Pro 2' },
                  { value: 'charger', label: 'USB-C Fast Charger 65W' },
                  { value: 'watch', label: 'Smart Watch Lite' },
                ]} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={t('promo.discountValue')} name="discount" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={90} suffix="%" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t('promo.duration')} name="duration" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={30} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" block onClick={handleCreate}>{t('promo.createFlashSale')}</Button>
            </Form>
          ),
        },
      ]}
    />
  );
}
