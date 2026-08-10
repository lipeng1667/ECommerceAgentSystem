/**
 * Create Promotion Drawer — V1.1
 * Form to create a new promotion campaign (flash_sale, seckill, coupon, bundle, full_reduction).
 */
import { useState } from 'react';
import { useI18n } from '../../app/i18n';
import {
  Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { AllMallId, PromotionCampaign, PromotionType, Store, Product } from '../../types/domain';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Omit<PromotionCampaign, 'id' | 'spent' | 'revenue' | 'roi' | 'createdAt'>) => void;
  loading: boolean;
  stores: Store[];
  products: Product[];
}

const TYPE_OPTIONS: { value: PromotionType; labelKey: string }[] = [
  { value: 'flash_sale', labelKey: 'promotions.flashSale' },
  { value: 'seckill', labelKey: 'promotions.seckill' },
  { value: 'coupon', labelKey: 'promotions.coupon' },
  { value: 'bundle', labelKey: 'promotions.bundle' },
  { value: 'full_reduction', labelKey: 'promotions.fullReduction' },
];

export function CreatePromotionDrawer({ open, onClose, onCreate, loading, stores, products }: Props) {
  const { t } = useI18n();
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onCreate({
        name: values.name,
        type: values.type,
        storeId: values.storeId,
        productIds: values.productIds,
        discount: values.discount,
        budget: values.budget,
        status: values.startDate && dayjs(values.startDate).isAfter(dayjs()) ? 'scheduled' : 'active',
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        autoCreated: false,
      });
      form.resetFields();
    });
  };

  // Filter products by selected store
  const [selectedStore, setSelectedStore] = useState<AllMallId | undefined>();

  return (
    <Drawer
      title={t('promotions.create')}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>{t('promotions.create')}</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ discount: 20, budget: 1000 }}>
        <Form.Item name="name" label={t('promotions.name')} rules={[{ required: true, message: t('promotions.nameRequired') }]}>
          <Input placeholder={t('promotions.namePlaceholder')} />
        </Form.Item>

        <Form.Item name="type" label={t('promotions.type')} rules={[{ required: true }]}>
          <Select
            options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            placeholder={t('promotions.selectType')}
          />
        </Form.Item>

        <Form.Item name="storeId" label={t('promotions.store')} rules={[{ required: true }]}>
          <Select
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
            placeholder={t('promotions.selectStore')}
            onChange={(val) => setSelectedStore(val)}
          />
        </Form.Item>

        <Form.Item name="productIds" label={t('promotions.products')} rules={[{ required: true, message: t('promotions.productsRequired') }]}>
          <Select
            mode="multiple"
            placeholder={t('promotions.selectProducts')}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.spuCode})` }))}
            maxTagCount={3}
          />
        </Form.Item>

        <Form.Item name="discount" label={t('promotions.discount')} rules={[{ required: true }]}>
          <InputNumber min={1} max={90} addonAfter="%" placeholder="20" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="budget" label={t('promotions.budget')} rules={[{ required: true }]}>
          <InputNumber min={100} step={100} addonBefore="¥" placeholder="1000" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="dateRange" label={t('promotions.period')} rules={[{ required: true, message: t('promotions.periodRequired') }]}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs().subtract(1, 'day'), 'day')}
            placeholder={[t('promotions.startDate'), t('promotions.endDate')]}
          />
        </Form.Item>

        <div style={{ padding: '8px 12px', background: 'var(--ark-bg-sink)', borderRadius: 6, marginTop: -8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('promotions.createHint')}
          </Typography.Text>
        </div>
      </Form>
    </Drawer>
  );
}
