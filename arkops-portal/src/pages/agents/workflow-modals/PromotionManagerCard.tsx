import { GiftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, Card, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useI18n } from '../../../app/i18n';

const mockPromotions = [
  { id: 1, name: 'LED灯带清仓闪购', type: 'flash_sale', discount: '35% OFF', originalPrice: 12.49, promoPrice: 8.12, budget: 200, spent: 45, status: 'active', startDate: '2024-06-18', endDate: '2024-06-25' },
  { id: 2, name: '618满减券', type: 'coupon', discount: '满$50减$8', originalPrice: 0, promoPrice: 0, budget: 2000, spent: 0, status: 'pending', startDate: '2024-06-18', endDate: '2024-06-20' },
  { id: 3, name: '充电器+耳机套餐', type: 'bundle', discount: '套装9折', originalPrice: 72.98, promoPrice: 65.68, budget: 500, spent: 120, status: 'active', startDate: '2024-06-15', endDate: '2024-06-30' },
  { id: 4, name: '运动T恤买二送一', type: 'bundle', discount: '买2送1', originalPrice: 25.98, promoPrice: 17.32, budget: 300, spent: 280, status: 'ended', startDate: '2024-06-01', endDate: '2024-06-14' },
];

export function PromotionManagerCard() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState('2h ago');
  const [promotions, setPromotions] = useState(mockPromotions.map(p => ({ ...p })));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [promoForm] = Form.useForm();

  const handleStop = (id: number) => {
    setPromotions(prev => prev.map(p => (p.id === id ? { ...p, status: 'ended' } : p)));
    message.success(t('promo.stopped'));
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan('just now');
      message.success(t('promo.scanDone'));
    }, 2000);
  };

  const handleNewPromo = () => {
    setDrawerOpen(true);
  };

  const handleCreatePromo = () => {
    promoForm.validateFields().then(values => {
      const newPromo = {
        id: promotions.length + 1,
        name: values.name,
        type: values.type,
        discount: values.discount,
        originalPrice: 0,
        promoPrice: 0,
        budget: values.budget,
        spent: 0,
        status: 'pending',
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      };
      setPromotions(prev => [...prev, newPromo]);
      setDrawerOpen(false);
      promoForm.resetFields();
      message.success(t('promo.createSuccess'));
    });
  };

  const typeConfig: Record<string, { color: string; label: string }> = {
    flash_sale: { color: 'red', label: t('promo.typeFlashSale') },
    coupon: { color: 'blue', label: t('promo.typeCoupon') },
    bundle: { color: 'purple', label: t('promo.typeBundle') },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'green', label: t('promo.statusActive') },
    pending: { color: 'gold', label: t('promo.statusPending') },
    ended: { color: 'default', label: t('promo.statusEnded') },
  };

  const columns = [
    {
      title: t('promo.promoName'),
      dataIndex: 'name',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('promo.type'),
      dataIndex: 'type',
      width: 100,
      render: (v: string) => {
        const cfg = typeConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('promo.discountStrength'),
      dataIndex: 'discount',
      width: 120,
      render: (v: string) => <Typography.Text style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('promo.budgetSpent'),
      width: 130,
      render: (_: unknown, r: typeof promotions[0]) => (
        <Space direction="vertical" size={0}>
          <Typography.Text style={{ fontSize: 13 }}>${r.spent} / ${r.budget}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {((r.spent / r.budget) * 100).toFixed(0)}%
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('promo.statusCol'),
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const cfg = statusConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 120,
      render: (_: unknown, r: typeof promotions[0]) => (
        <Space size="small">
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => message.info(t('promo.viewed'))}>
            {t('promo.view')}
          </Button>
          {r.status === 'active' && (
            <Button size="small" type="link" danger style={{ fontSize: 12, padding: 0 }} onClick={() => handleStop(r.id)}>
              {t('promo.stop')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        style={{ marginBottom: 16, borderTop: '3px solid #dc2626' }}
        title={
          <Space>
            <GiftOutlined style={{ color: '#dc2626' }} />
            {t('promo.managerTitle')}
            <Badge status="processing" />
            <Tag color="red" style={{ fontSize: 11 }}>{t('promo.lastScan')}: {lastScan}</Tag>
          </Space>
        }
        extra={
          <Space size="small">
            <Button size="small" icon={<PlusOutlined />} onClick={handleNewPromo}>
              {t('promo.newPromo')}
            </Button>
            <Button size="small" type="primary" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan}>
              {t('promo.scanNow')}
            </Button>
          </Space>
        }
      >
        <Table dataSource={promotions} columns={columns} rowKey="id" pagination={false} size="small" />
      </Card>
      <Drawer
        title={t('promo.newPromo')}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); promoForm.resetFields(); }}
        width={400}
        extra={
          <Space>
            <Button onClick={() => { setDrawerOpen(false); promoForm.resetFields(); }}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleCreatePromo}>{t('common.confirm')}</Button>
          </Space>
        }
      >
        <Form form={promoForm} layout="vertical">
          <Form.Item label={t('promo.campaignName')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('promo.type')} name="type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'flash_sale', label: t('promo.typeFlashSale') },
              { value: 'coupon', label: t('promo.typeCoupon') },
              { value: 'bundle', label: t('promo.typeBundle') },
            ]} />
          </Form.Item>
          <Form.Item label={t('promo.discountValue')} name="discount" rules={[{ required: true }]}>
            <Input placeholder="35% OFF / 满$50减$8" />
          </Form.Item>
          <Form.Item label={t('promo.budget')} name="budget" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="$" />
          </Form.Item>
          <Form.Item label={t('promo.startDate')} name="startDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('promo.endDate')} name="endDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
