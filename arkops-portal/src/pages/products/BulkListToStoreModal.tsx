/**
 * File: BulkListToStoreModal.tsx
 * Purpose: T-PROD-002 — batch-list multiple products to a single store at once.
 * Reuses the individual createListing flow but applies it to N products in one
 * confirmation step, so a merchant can stock a new store in a single action
 * rather than repeating the single-product modal 30+ times.
 *
 * Author: AI Agent
 * Created: 2026-08-10
 *
 * Main exports:
 * - BulkListToStoreModal: modal for batch listing products to a store.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Progress, Radio, Select, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { productListingsApi } from '../../api/products';
import { useI18n } from '../../app/i18n';
import type { AllMallId, InventoryMode, Product, ProductListing, Store } from '../../types/domain';

interface BulkItem {
  product: Product;
  checked: boolean;
}

interface BulkListToStoreModalProps {
  open: boolean;
  products: Product[];
  /** Existing listings for context (price suggestions). */
  allListings: ProductListing[];
  /** Available target stores: stores where at least one selected product isn't already listed. */
  availableStores: Store[];
  onClose: () => void;
}

export function BulkListToStoreModal({ open, products, allListings, availableStores, onClose }: BulkListToStoreModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const inventoryMode: InventoryMode = Form.useWatch('inventoryMode', form) ?? 'shared';

  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const createBatchMutation = useMutation({
    mutationFn: async (input: {
      items: { productId: AllMallId; storeId: AllMallId; platformSkuRef: string; sellingPrice: number; inventoryMode: InventoryMode; allocation?: number; safetyStock?: number }[];
    }) => {
      setProgress({ current: 0, total: input.items.length });
      const outcomes = await Promise.allSettled(
        input.items.map((item, idx) =>
          productListingsApi.create(item).then((result) => {
            setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
            return { idx, result };
          })
        )
      );
      const succeeded = outcomes.filter((o) => o.status === 'fulfilled').length;
      const failed = outcomes.length - succeeded;
      return { succeeded, failed, total: input.items.length };
    },
    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: ['productListings'] });
      setProgress({ current: 0, total: 0 });
      if (failed === 0) {
        message.success(t('products.bulkListCreated', { count: succeeded }));
      } else if (succeeded === 0) {
        message.error(t('products.bulkAllFailed'));
      } else {
        message.warning(t('products.bulkPartialSuccess', { succeeded, failed }));
      }
      form.resetFields();
      onClose();
    },
    onError: (error: Error) => {
      setProgress({ current: 0, total: 0 });
      message.error(error.message);
    },
  });

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (open && products.length > 0) {
      const initial: Record<string, boolean> = {};
      products.forEach((p) => { initial[p.id] = true; });
      setCheckedMap(initial);
      form.setFieldsValue({
        storeId: availableStores[0]?.id,
        targetCategory: products[0]?.category ?? '',
        inventoryMode: 'shared',
        allocation: 0,
        contentAdapted: true,
      });
    }
  }, [open, products, availableStores, form]);

  if (!open || products.length === 0) return null;

  const checkedProducts = products.filter((p) => checkedMap[p.id]);
  const allChecked = checkedProducts.length === products.length;

  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    products.forEach((p) => { next[p.id] = !allChecked; });
    setCheckedMap(next);
  };

  const getPriceForProduct = (product: Product): number => {
    const listings = allListings.filter((l) => l.productId === product.id);
    if (listings.length > 0) {
      return Math.round((listings.reduce((sum, l) => sum + l.sellingPrice, 0) / listings.length) * 100) / 100;
    }
    return Math.round(product.cost * 1.8 * 100) / 100;
  };

  const columns: ColumnsType<BulkItem> = [
    {
      width: 40,
      render: (_: unknown, record: BulkItem) => (
        <Checkbox checked={checkedMap[record.product.id] ?? false} onChange={(e) => setCheckedMap((prev) => ({ ...prev, [record.product.id]: e.target.checked }))} />
      ),
    },
    { title: t('products.name'), dataIndex: ['product', 'name'], ellipsis: true },
    { title: t('products.spuCode'), dataIndex: ['product', 'spuCode'], width: 100 },
    {
      title: t('products.price'), width: 90, align: 'right',
      render: (_: unknown, record: BulkItem) => `¥${getPriceForProduct(record.product).toFixed(2)}`,
    },
    {
      title: t('products.store'), width: 100,
      render: (_: unknown, record: BulkItem) => {
        const count = allListings.filter((l) => l.productId === record.product.id).length;
        return <Typography.Text type="secondary">{t('products.listedOnNStores', { count })}</Typography.Text>;
      },
    },
  ];

  const dataSource: BulkItem[] = products.map((product) => ({ product, checked: checkedMap[product.id] ?? false }));

  const handleSubmit = () => {
    if (checkedProducts.length === 0) {
      message.warning(t('products.bulkSelectAtLeastOne'));
      return;
    }
    form.validateFields().then((values) => {
      createBatchMutation.mutate({
        items: checkedProducts.map((p) => ({
          productId: p.id,
          storeId: values.storeId,
          platformSkuRef: `${values.storeId}-${p.spuCode}`,
          sellingPrice: getPriceForProduct(p),
          inventoryMode: values.inventoryMode,
          allocation: values.inventoryMode === 'independent' ? Math.round(values.allocation ?? 0) : undefined,
          safetyStock: values.inventoryMode === 'shared' ? 0 : undefined,
        })),
      });
    });
  };

  const isRunning = createBatchMutation.isPending;

  return (
    <Modal
      title={t('products.bulkListToStore')}
      open={open}
      onOk={handleSubmit}
      okText={isRunning ? t('products.bulkProgress', { current: progress.current, total: progress.total }) : t('products.bulkListConfirm', { count: checkedProducts.length })}
      confirmLoading={isRunning}
      okButtonProps={{ disabled: checkedProducts.length === 0 }}
      cancelText={t('common.cancel')}
      cancelButtonProps={{ disabled: isRunning }}
      onCancel={onClose}
      maskClosable={!isRunning}
      width={640}
    >
      {availableStores.length === 0 ? (
        <Alert type="info" showIcon message={t('products.bulkNoAvailableStores')} />
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            message={t('products.bulkListHint', { count: products.length })}
            style={{ marginBottom: 12 }}
          />
          {isRunning && progress.total > 0 && (
            <Progress percent={Math.round((progress.current / progress.total) * 100)} status="active" style={{ marginBottom: 12 }} />
          )}
          <div style={{ marginBottom: 8 }}>
            <Checkbox checked={allChecked} onChange={toggleAll} disabled={isRunning}>
              {allChecked ? t('common.deselectAll') : t('common.selectAll')}
            </Checkbox>
            <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              {t('products.bulkSelected', { count: checkedProducts.length })}
            </Typography.Text>
          </div>
          <Table
            rowKey={(r: BulkItem) => r.product.id}
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            scroll={{ y: 240 }}
            showHeader={false}
          />
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} disabled={isRunning}>
            <Form.Item label={t('products.targetStore')} name="storeId" rules={[{ required: true }]}>
              <Select options={availableStores.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
            <Form.Item
              label={<span>{t('listing.targetCategory')} <Tag color="blue" style={{ fontSize: 11 }}>{t('products.bulkCategoryAutoMap')}</Tag></span>}
              name="targetCategory"
              rules={[{ required: true }]}
            >
              <Input placeholder={t('products.bulkCategoryPlaceholder')} />
            </Form.Item>
            <Form.Item name="contentAdapted" valuePropName="checked">
              <Checkbox>{t('listing.contentAdapted')}</Checkbox>
            </Form.Item>
            <Form.Item label={t('listing.inventoryModeLabel')} name="inventoryMode" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="shared">{t('listing.mode_shared')} — {t('listing.modeSharedHint')}</Radio>
                <Radio value="independent">{t('listing.mode_independent')} — {t('listing.modeIndependentHint')}</Radio>
              </Radio.Group>
            </Form.Item>
            {inventoryMode === 'independent' && (
              <Form.Item label={t('listing.allocation')} name="allocation" rules={[{ required: true }]}>
                <InputNumber min={1} step={1} style={{ width: '100%' }} placeholder={t('listing.allocationPlaceholder')} />
              </Form.Item>
            )}
          </Form>
        </>
      )}
    </Modal>
  );
}
