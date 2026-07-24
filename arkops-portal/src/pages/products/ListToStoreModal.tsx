/**
 * File: ListToStoreModal.tsx
 * Purpose: "List to store" flow (product-design.md §3.14.7) — lands a master product on
 * a store it isn't listed on yet. Reuses the onboarding migration flow's step content
 * (category mapping, suggested price, inventory-mode choice, content adaptation) as a
 * single-form modal rather than importing StoreOnboardingPage's wizard machinery, which
 * is built around creating a new store via cross-platform migration, not listing an
 * existing product to an already-connected store — a different operation with the same
 * visual grammar. Always lands as a draft listing (review/publish happens afterward).
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 *
 * Main exports:
 * - ListToStoreModal: modal form that creates a draft ProductListing.
 */
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Radio, Select, Tag, Typography, message } from 'antd';
import { productListingsApi } from '../../api/products';
import { useI18n } from '../../app/i18n';
import type { AllMallId, InventoryMode, Product, ProductListing, Store } from '../../types/domain';

interface ListToStoreModalProps {
  open: boolean;
  product: Product | null;
  /** This product's existing listings, used to derive the suggested price. */
  listings: ProductListing[];
  /** Stores this product has no listing on yet — the only valid targets. */
  availableStores: Store[];
  /** Preselected target store, e.g. from a matrix row's "list to this store" CTA. */
  initialStoreId?: AllMallId;
  onClose: () => void;
}

/** Suggested price: average of the product's existing listing prices, or a cost-based fallback. */
function suggestPrice(product: Product, existingPrices: number[]): number {
  if (existingPrices.length > 0) {
    return Math.round((existingPrices.reduce((sum, p) => sum + p, 0) / existingPrices.length) * 100) / 100;
  }
  return Math.round(product.cost * 1.8 * 100) / 100;
}

export function ListToStoreModal({ open, product, listings, availableStores, initialStoreId, onClose }: ListToStoreModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const inventoryMode: InventoryMode = Form.useWatch('inventoryMode', form) ?? 'shared';

  const createListingMutation = useMutation({
    mutationFn: (input: { productId: AllMallId; storeId: AllMallId; platformSkuRef: string; sellingPrice: number; inventoryMode: InventoryMode; allocation?: number; safetyStock?: number }) =>
      productListingsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productListings'] });
      message.success(t('listing.createdDraft'));
      form.resetFields();
      onClose();
    }
  });

  useEffect(() => {
    if (open && product) {
      form.setFieldsValue({
        storeId: initialStoreId ?? availableStores[0]?.id,
        targetCategory: product.category,
        sellingPrice: suggestPrice(product, listings.map((l) => l.sellingPrice)),
        inventoryMode: 'shared',
        allocation: Math.round(product.totalStock * 0.2),
        contentAdapted: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, listings, initialStoreId]);

  if (!product) return null;

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      createListingMutation.mutate({
        productId: product.id,
        storeId: values.storeId,
        platformSkuRef: `${values.storeId}-${product.spuCode}`,
        sellingPrice: values.sellingPrice,
        inventoryMode: values.inventoryMode,
        allocation: values.inventoryMode === 'independent' ? values.allocation : undefined,
        safetyStock: values.inventoryMode === 'shared' ? 0 : undefined,
      });
    });
  };

  return (
    <Modal
      title={t('listing.listToStoreTitle', { name: product.name })}
      open={open}
      onOk={handleSubmit}
      okText={t('listing.createDraft')}
      confirmLoading={createListingMutation.isPending}
      onCancel={() => { form.resetFields(); onClose(); }}
      width={520}
    >
      {availableStores.length === 0 ? (
        <Alert type="info" showIcon message={t('listing.allStoresListed')} />
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item label={t('products.store')} name="storeId" rules={[{ required: true }]}>
            <Select options={availableStores.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item
            label={<span>{t('listing.targetCategory')} <Tag color="blue" style={{ fontSize: 11 }}>{t('listing.categoryMatchConfidence', { value: 92 })}</Tag></span>}
            name="targetCategory" rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('listing.suggestedPrice')} name="sellingPrice" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item label={t('listing.inventoryModeLabel')} name="inventoryMode" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="shared">{t('listing.mode_shared')} — {t('listing.modeSharedHint')}</Radio>
              <Radio value="independent">{t('listing.mode_independent')} — {t('listing.modeIndependentHint')}</Radio>
            </Radio.Group>
          </Form.Item>
          {inventoryMode === 'independent' && (
            <Form.Item label={t('listing.allocation')} name="allocation" rules={[{ required: true }]}>
              <InputNumber min={0} max={product.totalStock} step={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item name="contentAdapted" valuePropName="checked">
            <Checkbox>{t('listing.contentAdapted')}</Checkbox>
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: -8 }}>
            {t('listing.listToStoreNote')}
          </Typography.Paragraph>
        </Form>
      )}
    </Modal>
  );
}
