import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Form, Input, InputNumber, Modal, Progress, Radio, Row, Select, Space, Statistic, Tabs, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { mergeSuggestionsApi, productListingsApi, productsApi } from '../../api/products';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { DetailSection } from '../../components/detail/DetailSection';
import { PageHeader } from '../../components/PageHeader';
import { ListingMatrix } from '../../components/products/ListingMatrix';
import { parseAllMallId } from '../../utils/id';
import type { AllMallId, InventoryMode, ProductListing } from '../../types/domain';
import { listingAvailableStock } from '../../types/domain';
import { ListToStoreModal } from './ListToStoreModal';
import { ProvenanceTag } from './ProductManagementPage';

export function ProductDetailPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { productId } = useParams();
  const parsedId = parseAllMallId(productId);
  const queryClient = useQueryClient();

  const { data: product } = useQuery({ queryKey: ['product', parsedId], queryFn: () => productsApi.get(parsedId!), enabled: parsedId !== undefined });
  const { data: allListings = [] } = useQuery({ queryKey: ['productListings'], queryFn: productListingsApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: mergeSuggestions = [] } = useQuery({ queryKey: ['productMergeSuggestions'], queryFn: mergeSuggestionsApi.list });

  const listings = allListings.filter((l) => l.productId === parsedId);
  const listedStoreIds = new Set(listings.map((l) => l.storeId));
  const availableStores = stores.filter((s) => !listedStoreIds.has(s.id));
  const hasSuggestion = mergeSuggestions.some((s) => s.productAId === parsedId || s.productBId === parsedId);

  const [infoForm] = Form.useForm();
  const [listToStoreTarget, setListToStoreTarget] = useState<{ storeId?: AllMallId } | null>(null);
  const [editingListing, setEditingListing] = useState<ProductListing | null>(null);
  const [listingForm] = Form.useForm();

  const invalidateListings = () => queryClient.invalidateQueries({ queryKey: ['productListings'] });
  const invalidateProduct = () => queryClient.invalidateQueries({ queryKey: ['product', parsedId] });

  const updateProductMutation = useMutation({
    mutationFn: (patch: Parameters<typeof productsApi.update>[1]) => productsApi.update(parsedId!, patch),
    onSuccess: () => { invalidateProduct(); message.success(t('products.productUpdated')); }
  });
  const setPrimaryStoreMutation = useMutation({
    mutationFn: (storeId: AllMallId) => productsApi.setPrimaryStore(parsedId!, storeId),
    onSuccess: () => { invalidateProduct(); message.success(t('products.primaryStoreUpdated')); }
  });
  const submitForReviewMutation = useMutation({
    mutationFn: (id: AllMallId) => productListingsApi.updateStatus(id, 'pending_review'),
    onSuccess: () => { invalidateListings(); message.success(t('listing.submittedForReview')); }
  });
  const publishMutation = useMutation({
    mutationFn: (id: AllMallId) => productListingsApi.updateStatus(id, 'listed'),
    onSuccess: () => { invalidateListings(); message.success(t('listing.published')); }
  });
  const delistMutation = useMutation({
    mutationFn: (id: AllMallId) => productListingsApi.updateStatus(id, 'delisted'),
    onSuccess: () => { invalidateListings(); message.success(t('listing.delisted')); }
  });
  const updateListingMutation = useMutation({
    mutationFn: (input: { id: AllMallId; patch: Parameters<typeof productListingsApi.update>[1] }) => productListingsApi.update(input.id, input.patch),
    onSuccess: () => { invalidateListings(); message.success(t('listing.updated')); setEditingListing(null); listingForm.resetFields(); }
  });

  if (!product) {
    return (
      <div className="page-stack">
        <PageHeader title={t('products.detailTitle')} breadcrumb={[{ title: t('products.title'), href: '/products' }]} onBack={() => navigate('/products')} />
      </div>
    );
  }

  const handleInfoSave = () => {
    infoForm.validateFields().then((values) => updateProductMutation.mutate(values));
  };

  const openEditListing = (listing: ProductListing) => {
    setEditingListing(listing);
    listingForm.setFieldsValue({
      sellingPrice: listing.sellingPrice,
      inventoryMode: listing.inventoryMode,
      allocation: listing.allocation ?? 0,
      safetyStock: listing.safetyStock ?? 0,
    });
  };
  const handleListingSave = () => {
    listingForm.validateFields().then((values) => {
      if (!editingListing) return;
      updateListingMutation.mutate({
        id: editingListing.id,
        patch: {
          sellingPrice: values.sellingPrice,
          inventoryMode: values.inventoryMode,
          allocation: values.inventoryMode === 'independent' ? values.allocation : undefined,
          safetyStock: values.inventoryMode === 'shared' ? values.safetyStock : undefined,
        },
      });
    });
  };

  const allocatedTotal = listings.filter((l) => l.inventoryMode === 'independent').reduce((sum, l) => sum + (l.allocation ?? 0), 0);
  const safetyTotal = listings.filter((l) => l.inventoryMode === 'shared').reduce((sum, l) => sum + (l.safetyStock ?? 0), 0);
  const reservedPct = product.totalStock > 0 ? Math.min(100, Math.round(((allocatedTotal + safetyTotal) / product.totalStock) * 100)) : 0;

  const distributionTab = (
    <>
      {hasSuggestion && (
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          {t('products.hasSuggestionHint')}
        </Typography.Paragraph>
      )}
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button size="small" type="primary" icon={<PlusOutlined />} disabled={availableStores.length === 0} onClick={() => setListToStoreTarget({})}>
          {t('products.listToStore')}
        </Button>
      </div>
      <ListingMatrix
        product={product}
        stores={stores}
        listings={listings}
        size="middle"
        onListToStore={(storeId) => setListToStoreTarget({ storeId })}
        onSubmitForReview={(id) => submitForReviewMutation.mutate(id)}
        onPublish={(id) => publishMutation.mutate(id)}
        onDelist={(id) => delistMutation.mutate(id)}
      />
    </>
  );

  const infoTab = (
    <DetailSection>
      <Form
        form={infoForm}
        layout="vertical"
        initialValues={{ name: product.name, category: product.category, cost: product.cost, description: product.description, totalStock: product.totalStock }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label={<Space size={6}>{t('products.name')}<ProvenanceTag provenance={product.provenance.name} stores={stores} t={t} /></Space>} name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={<Space size={6}>{t('products.category')}<ProvenanceTag provenance={product.provenance.category} stores={stores} t={t} /></Space>} name="category" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={<Space size={6}>{t('products.cost')}<ProvenanceTag provenance={product.provenance.cost} stores={stores} t={t} /></Space>} name="cost" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('products.spuCode')}>
              <Input value={product.spuCode} disabled />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={<Space size={6}>{t('products.descriptionLabel')}<ProvenanceTag provenance={product.provenance.description} stores={stores} t={t} /></Space>} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" loading={updateProductMutation.isPending} onClick={handleInfoSave}>{t('common.save')}</Button>
        </Space>
      </Form>
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--ark-border-soft)' }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>{t('products.primaryStore')}</Typography.Text>
        <Select
          style={{ width: 240 }}
          value={product.primaryStoreId}
          loading={setPrimaryStoreMutation.isPending}
          onChange={(v) => setPrimaryStoreMutation.mutate(v)}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>{t('products.primaryStoreHint')}</Typography.Paragraph>
      </div>
    </DetailSection>
  );

  const inventoryTab = (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Statistic title={t('products.totalStock')} value={product.totalStock} /></Col>
        <Col xs={24} sm={8}><Statistic title={t('listing.allocation')} value={allocatedTotal} /></Col>
        <Col xs={24} sm={8}><Statistic title={t('products.safetyStockTotal')} value={safetyTotal} /></Col>
      </Row>
      <Progress percent={reservedPct} size="small" format={(p) => `${p}% ${t('products.poolReserved')}`} style={{ marginBottom: 16 }} />
      <DescriptionPanel
        title={t('products.perStoreAllocation')}
        column={1}
        items={listings.map((listing) => ({
          label: stores.find((s) => s.id === listing.storeId)?.name ?? '',
          value: (
            <Space>
              <Tag color={listing.inventoryMode === 'shared' ? 'blue' : 'purple'}>{t(`listing.mode_${listing.inventoryMode}`)}</Tag>
              <Typography.Text>{t('listing.available')}: {listingAvailableStock(product, listing)}</Typography.Text>
              {listing.inventoryMode === 'independent' && <Typography.Text type="secondary">({t('listing.allocation')} {listing.allocation})</Typography.Text>}
              {listing.inventoryMode === 'shared' && <Typography.Text type="secondary">({t('products.safetyStockLabel')} {listing.safetyStock})</Typography.Text>}
              <Button size="small" type="link" onClick={() => openEditListing(listing)} style={{ padding: 0 }}>{t('common.edit')}</Button>
            </Space>
          ),
        }))}
      />
    </>
  );

  return (
    <div className="page-stack">
      <PageHeader
        title={product.name}
        description={t('products.detailDescription')}
        breadcrumb={[{ title: t('products.title'), href: '/products' }, { title: product.name }]}
        onBack={() => navigate('/products')}
      />
      <Tabs
        defaultActiveKey="distribution"
        items={[
          { key: 'distribution', label: t('products.distribution'), children: distributionTab },
          { key: 'info', label: t('products.productInfo'), children: infoTab },
          { key: 'inventory', label: t('products.stock'), children: inventoryTab },
        ]}
      />

      <ListToStoreModal
        open={!!listToStoreTarget}
        product={product}
        listings={listings}
        availableStores={availableStores}
        initialStoreId={listToStoreTarget?.storeId}
        onClose={() => setListToStoreTarget(null)}
      />

      <Modal
        title={t('listing.editListing')}
        open={!!editingListing}
        onOk={handleListingSave}
        confirmLoading={updateListingMutation.isPending}
        onCancel={() => { setEditingListing(null); listingForm.resetFields(); }}
        width={440}
      >
        {editingListing && (
          <Form form={listingForm} layout="vertical">
            <Form.Item label={t('products.price')} name="sellingPrice" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
            <Form.Item label={t('listing.inventoryModeLabel')} name="inventoryMode" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="shared">{t('listing.mode_shared')}</Radio>
                <Radio value="independent">{t('listing.mode_independent')}</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.inventoryMode !== cur.inventoryMode}>
              {({ getFieldValue }) => {
                const mode: InventoryMode = getFieldValue('inventoryMode');
                return mode === 'independent' ? (
                  <Form.Item label={t('listing.allocation')} name="allocation" rules={[{ required: true }]}>
                    <InputNumber min={0} max={product.totalStock} step={1} style={{ width: '100%' }} />
                  </Form.Item>
                ) : (
                  <Form.Item label={t('products.safetyStockLabel')} name="safetyStock" rules={[{ required: true }]}>
                    <InputNumber min={0} max={product.totalStock} step={1} style={{ width: '100%' }} />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
