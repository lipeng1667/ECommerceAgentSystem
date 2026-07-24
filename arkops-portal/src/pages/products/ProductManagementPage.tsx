import { DownOutlined, EditOutlined, PlusOutlined, RobotOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Dropdown, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mergeSuggestionsApi, productListingsApi, productsApi } from '../../api/products';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { ListingDistribution } from '../../components/products/ListingDistribution';
import { ListingMatrix } from '../../components/products/ListingMatrix';
import { ProductThumb } from '../../components/products/ProductThumb';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import { CreateProductModal } from './CreateProductModal';
import { ListToStoreModal } from './ListToStoreModal';
import type { AllMallId, AttributeProvenance, ListingStatus, Product, ProductListing, ProductMergeSuggestion, Store } from '../../types/domain';

type TranslateFn = ReturnType<typeof useI18n>['t'];

/** Stock level below which a product's shared pool counts as low. */
const LOW_STOCK_THRESHOLD = 50;

type StockFilter = 'all' | 'healthy' | 'low' | 'out';
/** "Listed on / not listed on [store]" — the gap-finder toggle (§3.14.2). Only active with a specific storeFilter. */
type ListedToggle = 'any' | 'listed' | 'not_listed';

export function productStockLevel(product: Product): 'healthy' | 'low' | 'out' {
  if (product.totalStock <= 0) return 'out';
  if (product.totalStock < LOW_STOCK_THRESHOLD) return 'low';
  return 'healthy';
}

function priceRangeText(listings: ProductListing[]): string {
  if (listings.length === 0) return '-';
  const prices = listings.map((l) => l.sellingPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `¥${min.toFixed(2)}` : `¥${min.toFixed(2)} – ¥${max.toFixed(2)}`;
}

/** D6 sub-decision 2: shows where a master attribute's value came from, and whether it's locked from sync. */
export function ProvenanceTag({ provenance, stores, t }: { provenance: AttributeProvenance; stores: Store[]; t: TranslateFn }) {
  if (provenance.source === 'manual') {
    return <Tag style={{ fontSize: 11 }}>{t('products.provenanceManual')}</Tag>;
  }
  const storeName = stores.find((s) => s.id === provenance.storeId)?.name ?? '';
  return <Tag color="purple" style={{ fontSize: 11 }}>{t('products.provenanceAi', { store: storeName })}</Tag>;
}

/** One side of a merge-suggestion comparison card (§3.14.8). */
function MergeCandidate({ product, listings, stores }: { product: Product; listings: ProductListing[]; stores: Store[] }) {
  const storeNames = listings.map((l) => stores.find((s) => s.id === l.storeId)?.name).filter(Boolean).join('、');
  return (
    <Space align="start">
      <ProductThumb src={product.images[0]} size={48} />
      <div>
        <Typography.Text strong>{product.name}</Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{product.spuCode} · {priceRangeText(listings)}</Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{storeNames}</Typography.Text>
      </div>
    </Space>
  );
}

/** "待归并" tab (§3.14.8): side-by-side candidate comparison for the 60–95% confidence band. */
function MergeQueueTab({
  suggestions, products, listingsByProduct, stores, onMerge, onDismiss, merging, dismissing, t,
}: {
  suggestions: ProductMergeSuggestion[];
  products: Product[];
  listingsByProduct: Map<AllMallId, ProductListing[]>;
  stores: Store[];
  onMerge: (id: AllMallId) => void;
  onDismiss: (id: AllMallId) => void;
  merging: boolean;
  dismissing: boolean;
  t: TranslateFn;
}) {
  const productById = new Map(products.map((p) => [p.id, p]));

  if (suggestions.length === 0) {
    return <Typography.Paragraph type="secondary" style={{ padding: 24, textAlign: 'center' }}>{t('products.noMergeSuggestions')}</Typography.Paragraph>;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {suggestions.map((suggestion) => {
        const productA = productById.get(suggestion.productAId);
        const productB = productById.get(suggestion.productBId);
        if (!productA || !productB) return null;
        return (
          <Card key={suggestion.id} size="small">
            <Row gutter={16} align="middle">
              <Col flex="1 1 260px"><MergeCandidate product={productA} listings={listingsByProduct.get(productA.id) ?? []} stores={stores} /></Col>
              <Col flex="0 0 100px" style={{ textAlign: 'center' }}>
                <Tag color={suggestion.confidence >= 80 ? 'orange' : 'gold'}>{t('listing.categoryMatchConfidence', { value: suggestion.confidence })}</Tag>
              </Col>
              <Col flex="1 1 260px"><MergeCandidate product={productB} listings={listingsByProduct.get(productB.id) ?? []} stores={stores} /></Col>
              <Col flex="0 0 auto">
                <Space>
                  <Popconfirm title={t('products.mergeConfirm')} onConfirm={() => onMerge(suggestion.id)} okText={t('common.confirm')} cancelText={t('common.cancel')}>
                    <Button type="primary" loading={merging}>{t('products.merge')}</Button>
                  </Popconfirm>
                  <Button onClick={() => onDismiss(suggestion.id)} loading={dismissing}>{t('products.dismiss')}</Button>
                </Space>
              </Col>
            </Row>
            <Space size={4} wrap style={{ marginTop: 12 }}>
              {suggestion.matchFactors.map((factor) => <Tag key={factor} style={{ fontSize: 11 }}>{factor}</Tag>)}
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}

/** "草稿" tab (§3.14.9): read-only — action happens in the unified Action Inbox or the listing matrix. */
function DraftsTab({ listings, products, stores, t }: { listings: ProductListing[]; products: Product[]; stores: Store[]; t: TranslateFn }) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const columns: ColumnsType<ProductListing> = [
    { title: t('products.product'), key: 'product', render: (_: unknown, l: ProductListing) => {
      const product = productById.get(l.productId);
      return product ? <Link to={`/products/${product.id}`}>{product.name}</Link> : '-';
    } },
    { title: t('products.store'), key: 'store', render: (_: unknown, l: ProductListing) => storeById.get(l.storeId)?.name ?? '-' },
    { title: t('products.status'), key: 'status', render: (_: unknown, l: ProductListing) => <Tag color="gold">{t(`listing.${l.status}`)}</Tag> },
    { title: t('products.price'), key: 'price', align: 'right', render: (_: unknown, l: ProductListing) => `¥${l.sellingPrice.toFixed(2)}` },
    { title: t('listing.lastSynced'), key: 'sync', render: (_: unknown, l: ProductListing) => dayjs(l.lastSyncedAt).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        {t('products.draftsReadOnlyNote')} <Link to="/inbox">{t('products.goToInbox')}</Link>
      </Typography.Paragraph>
      <DataTableCard<ProductListing> rowKey="id" columns={columns} dataSource={listings} pagination={false} />
    </>
  );
}

export function ProductManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { scope: shellScope, isAllStores } = useStoreScope();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });
  const { data: listings = [] } = useQuery({ queryKey: ['productListings'], queryFn: productListingsApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: mergeSuggestions = [] } = useQuery({ queryKey: ['productMergeSuggestions'], queryFn: mergeSuggestionsApi.list });

  const listingsByProduct = useMemo(() => {
    const map = new Map<AllMallId, ProductListing[]>();
    listings.forEach((l) => {
      const arr = map.get(l.productId) ?? [];
      arr.push(l);
      map.set(l.productId, arr);
    });
    return map;
  }, [listings]);

  const [keyword, setKeyword] = useState('');
  // Page-local store + listed/not-listed filter (gap-finder). Defaults from the shell
  // store scope (D3) but is independent of it: the shell scope narrows "what's mine",
  // this toggle asks "does the shell-scoped store have this product or not" — a hard
  // AND with the shell scope would make "not listed here" results impossible to see.
  const [storeFilter, setStoreFilter] = useState<AllMallId | 'all'>(() => (isAllStores ? 'all' : shellScope));
  const [listedToggle, setListedToggle] = useState<ListedToggle>('any');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm] = Form.useForm();
  const [listToStoreTarget, setListToStoreTarget] = useState<{ product: Product; storeId?: AllMallId } | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [createModalMode, setCreateModalMode] = useState<'manual' | 'recognize' | null>(null);
  const navigate = useNavigate();

  const invalidateListings = () => queryClient.invalidateQueries({ queryKey: ['productListings'] });

  const updateProductMutation = useMutation({
    mutationFn: (input: { id: AllMallId; patch: Partial<Pick<Product, 'name' | 'category' | 'cost' | 'description' | 'totalStock'>> }) =>
      productsApi.update(input.id, input.patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success(t('products.productUpdated'));
      setEditingProduct(null);
      editForm.resetFields();
    }
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
  const syncMutation = useMutation({
    mutationFn: () => productListingsApi.syncAll(),
    onSuccess: () => { invalidateListings(); message.success(t('products.syncDone')); }
  });
  const mergeMutation = useMutation({
    mutationFn: (id: AllMallId) => mergeSuggestionsApi.merge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      invalidateListings();
      queryClient.invalidateQueries({ queryKey: ['productMergeSuggestions'] });
      message.success(t('products.merged'));
    }
  });
  const dismissMutation = useMutation({
    mutationFn: (id: AllMallId) => mergeSuggestionsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productMergeSuggestions'] });
      message.success(t('products.dismissed'));
    }
  });

  const matchesKeyword = (product: Product, productListings: ProductListing[]) => {
    if (!keyword) return true;
    const q = keyword.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.spuCode.toLowerCase().includes(q) ||
      productListings.some((l) => l.platformSkuRef.toLowerCase().includes(q))
    );
  };
  const matchesStoreListed = (productListings: ProductListing[]) => {
    if (storeFilter === 'all' || listedToggle === 'any') return true;
    const hasListing = productListings.some((l) => l.storeId === storeFilter);
    return listedToggle === 'listed' ? hasListing : !hasListing;
  };
  const matchesStatus = (productListings: ProductListing[]) => {
    if (statusFilter === 'all') return true;
    return productListings.some((l) => l.status === statusFilter);
  };
  const matchesStock = (product: Product) => stockFilter === 'all' || productStockLevel(product) === stockFilter;

  const filteredProducts = products.filter((p) => {
    const productListings = listingsByProduct.get(p.id) ?? [];
    return matchesKeyword(p, productListings) && matchesStoreListed(productListings) && matchesStatus(productListings) && matchesStock(p);
  });

  // KPIs reflect the whole merchant catalog, not the table's local filters (matches
  // the Store list convention: filters narrow the table, KPIs stay stable landmarks).
  const totalProducts = products.length;
  const coveredCount = products.filter((p) => (listingsByProduct.get(p.id) ?? []).some((l) => l.status === 'listed')).length;
  const avgStores = totalProducts > 0
    ? products.reduce((sum, p) => sum + (listingsByProduct.get(p.id) ?? []).filter((l) => l.status === 'listed').length, 0) / totalProducts
    : 0;
  const lowStockCount = products.filter((p) => productStockLevel(p) === 'low').length;
  const outOfStockCount = products.filter((p) => productStockLevel(p) === 'out').length;
  const hasStockAlerts = lowStockCount + outOfStockCount > 0;
  const draftListingsCount = listings.filter((l) => l.status === 'draft' || l.status === 'pending_review').length;
  const mergeCount = mergeSuggestions.length;

  // Sync strip (§3.14.5): last-synced = most recent listing sync; pending = draft/pending_review listings.
  const lastSyncedAt = listings.reduce<string | null>((latest, l) => (!latest || l.lastSyncedAt > latest ? l.lastSyncedAt : latest), null);

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    editForm.setFieldsValue({
      name: product.name,
      category: product.category,
      cost: product.cost,
      description: product.description,
      totalStock: product.totalStock,
    });
  };
  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      if (editingProduct) updateProductMutation.mutate({ id: editingProduct.id, patch: values });
    });
  };

  const availableStoresFor = (product: Product): Store[] => {
    const listedStoreIds = new Set((listingsByProduct.get(product.id) ?? []).map((l) => l.storeId));
    return stores.filter((s) => !listedStoreIds.has(s.id));
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products.product'), key: 'product', width: 260,
      render: (_: unknown, record: Product) => (
        <Space align="start">
          <ProductThumb src={record.images[0]} size={40} />
          <div style={{ minWidth: 0 }}>
            <Link to={`/products/${record.id}`}><Typography.Text strong ellipsis>{record.name}</Typography.Text></Link>
            <br />
            <Space size={4}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.spuCode}</Typography.Text>
              <Tag style={{ fontSize: 11 }} color={record.createdBy === 'ai' ? 'purple' : 'default'}>
                {record.createdBy === 'ai' ? t('products.aiTag') : t('products.manualTag')}
              </Tag>
            </Space>
          </div>
        </Space>
      )
    },
    { title: t('products.category'), dataIndex: 'category', width: 100 },
    { title: t('products.cost'), dataIndex: 'cost', width: 90, align: 'right', sorter: (a, b) => a.cost - b.cost, render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: t('products.priceRange'), key: 'priceRange', width: 150,
      render: (_: unknown, r: Product) => priceRangeText(listingsByProduct.get(r.id) ?? [])
    },
    {
      title: t('products.distribution'), key: 'distribution', width: 220,
      render: (_: unknown, r: Product) => <ListingDistribution stores={stores} listings={listingsByProduct.get(r.id) ?? []} compact />
    },
    {
      title: t('products.stock'), dataIndex: 'totalStock', width: 100, align: 'right', sorter: (a, b) => a.totalStock - b.totalStock,
      render: (v: number, r: Product) => {
        const level = productStockLevel(r);
        return <Tag color={level === 'out' ? 'red' : level === 'low' ? 'orange' : 'green'}>{v}</Tag>;
      }
    },
    {
      title: t('common.actions'), key: 'actions', width: 190,
      render: (_: unknown, record: Product) => (
        <TableActionGroup>
          <Button size="small" disabled={availableStoresFor(record).length === 0} onClick={() => setListToStoreTarget({ product: record })}>
            {t('products.listToStore')}
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditProduct(record)}>{t('common.edit')}</Button>
        </TableActionGroup>
      )
    },
  ];

  const expandedRowRender = (record: Product) => (
    <ListingMatrix
      product={record}
      stores={stores}
      listings={listingsByProduct.get(record.id) ?? []}
      onListToStore={(storeId) => setListToStoreTarget({ product: record, storeId })}
      onSubmitForReview={(id) => submitForReviewMutation.mutate(id)}
      onPublish={(id) => publishMutation.mutate(id)}
      onDelist={(id) => delistMutation.mutate(id)}
    />
  );

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('products.title')} description={t('products.description')} />
        <StoreConnectionEmptyState description="尚未同步商品。连接已有店铺后，在售商品、SKU、价格和库存会自动出现在这里。" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={t('products.title')}
        description={t('products.description')}
        actions={
          <Dropdown
            menu={{
              items: [
                { key: 'manual', label: t('products.createManual') },
                { key: 'recognize', label: t('products.createRecognize') },
              ],
              onClick: ({ key }) => setCreateModalMode(key as 'manual' | 'recognize'),
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>{t('products.newProduct')} <DownOutlined /></Button>
          </Dropdown>
        }
      />

      {/* 同步条（§3.14.5，对标店铺连接同步） */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', marginBottom: 12,
        background: 'var(--ark-panel-soft)', borderRadius: 8, border: '1px solid var(--ark-border-soft)',
      }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {lastSyncedAt ? t('products.lastSynced', { time: dayjs(lastSyncedAt).format('YYYY-MM-DD HH:mm') }) : t('products.neverSynced')}
          {' · '}
          {t('products.pendingChanges', { count: draftListingsCount })}
        </Typography.Text>
        <Space>
          <Button size="small" icon={<SyncOutlined spin={syncMutation.isPending} />} loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
            {t('products.syncNow')}
          </Button>
          <Link to="/stores/onboarding?journey=import">
            <Button size="small" type="link">{t('products.manageStoreSync')}</Button>
          </Link>
        </Space>
      </div>

      {/* Agent 联动提示 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', marginBottom: 16,
        background: 'color-mix(in srgb, var(--ark-purple) 6%, var(--ark-panel))',
        borderRadius: 8, border: '1px solid color-mix(in srgb, var(--ark-purple) 24%, var(--ark-border))',
      }}>
        <Space>
          <RobotOutlined style={{ color: 'var(--ark-purple)' }} />
          <Typography.Text style={{ fontSize: 13 }}>{t('products.agentNote')}</Typography.Text>
        </Space>
        <Link to="/agents/product_launch">
          <Button size="small" icon={<RobotOutlined />}>Agent 详情 →</Button>
        </Link>
      </div>

      <Row gutter={[16, 16]} className="store-kpi-row" style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <MetricCard className="stat-card stat-card-primary" title={t('products.totalProducts')} value={totalProducts} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            className="stat-card stat-card-success"
            title={t('products.coverage')}
            value={`${coveredCount}/${totalProducts}`}
            helper={t('products.coverageHelper', { avg: avgStores.toFixed(1), total: stores.length })}
          />
        </Col>
        <Col xs={12} sm={6}>
          <div onClick={() => setStockFilter((prev) => (prev === 'low' || prev === 'out' ? 'all' : 'low'))} style={{ cursor: 'pointer' }}>
            <MetricCard
              className="stat-card stat-card-warning"
              title={t('products.inventoryAlert')}
              value={lowStockCount + outOfStockCount}
              overlayIcon={<WarningOutlined />}
              valueStyle={hasStockAlerts ? { color: 'var(--ark-orange)' } : undefined}
              helper={t('products.inventoryAlertMeta', { low: lowStockCount, out: outOfStockCount })}
            />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div onClick={() => setActiveTab(mergeCount > 0 ? 'merge' : 'drafts')} style={{ cursor: 'pointer' }}>
            <MetricCard
              className="stat-card stat-card-purple"
              title={t('products.toHandle')}
              value={mergeCount + draftListingsCount}
              helper={t('products.toHandleMeta', { merge: mergeCount, drafts: draftListingsCount })}
            />
          </div>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'products',
            label: t('products.tabAll'),
            children: (
              <>
                <PageFilterBar>
                  <Input.Search placeholder={t('products.searchPlaceholder')} onChange={(e) => setKeyword(e.target.value)} allowClear />
                  <Select
                    value={storeFilter}
                    onChange={(v) => { setStoreFilter(v); if (v === 'all') setListedToggle('any'); }}
                    options={[{ value: 'all', label: t('products.allStores') }, ...stores.map((s) => ({ value: s.id, label: s.name }))]}
                  />
                  <Select
                    value={listedToggle}
                    onChange={setListedToggle}
                    disabled={storeFilter === 'all'}
                    options={[
                      { value: 'any', label: t('products.listedToggleAny') },
                      { value: 'listed', label: t('products.listedToggleListed') },
                      { value: 'not_listed', label: t('products.listedToggleNotListed') },
                    ]}
                  />
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'all', label: t('products.statusFilterAll') },
                      { value: 'listed', label: t('listing.listed') },
                      { value: 'draft', label: t('listing.draft') },
                      { value: 'pending_review', label: t('listing.pending_review') },
                      { value: 'delisted', label: t('listing.delisted') },
                    ]}
                  />
                  <Select
                    value={stockFilter}
                    onChange={setStockFilter}
                    options={[
                      { value: 'all', label: t('products.stockAll') },
                      { value: 'healthy', label: t('products.stockHealthy') },
                      { value: 'low', label: t('products.stockLow') },
                      { value: 'out', label: t('products.stockOut') },
                    ]}
                  />
                </PageFilterBar>

                <DataTableCard<Product>
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredProducts}
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
                  expandable={{ expandedRowRender, rowExpandable: () => true }}
                  scroll={{ x: 1200 }}
                />
              </>
            ),
          },
          {
            key: 'merge',
            label: `${t('products.tabMerge')} (${mergeCount})`,
            children: (
              <MergeQueueTab
                suggestions={mergeSuggestions}
                products={products}
                listingsByProduct={listingsByProduct}
                stores={stores}
                onMerge={(id) => mergeMutation.mutate(id)}
                onDismiss={(id) => dismissMutation.mutate(id)}
                merging={mergeMutation.isPending}
                dismissing={dismissMutation.isPending}
                t={t}
              />
            ),
          },
          {
            key: 'drafts',
            label: `${t('products.tabDrafts')} (${draftListingsCount})`,
            children: (
              <DraftsTab
                listings={listings.filter((l) => l.status === 'draft' || l.status === 'pending_review')}
                products={products}
                stores={stores}
                t={t}
              />
            ),
          },
        ]}
      />

      <Modal
        title={t('products.editProduct')}
        open={!!editingProduct}
        onOk={handleEditSubmit}
        confirmLoading={updateProductMutation.isPending}
        onCancel={() => { setEditingProduct(null); editForm.resetFields(); }}
        width={520}
      >
        {editingProduct && (
          <Form form={editForm} layout="vertical">
            <Form.Item
              label={<Space size={6}>{t('products.name')}<ProvenanceTag provenance={editingProduct.provenance.name} stores={stores} t={t} /></Space>}
              name="name" rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={<Space size={6}>{t('products.category')}<ProvenanceTag provenance={editingProduct.provenance.category} stores={stores} t={t} /></Space>}
              name="category" rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={<Space size={6}>{t('products.cost')}<ProvenanceTag provenance={editingProduct.provenance.cost} stores={stores} t={t} /></Space>}
              name="cost" rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
            <Form.Item
              label={<Space size={6}>{t('products.descriptionLabel')}<ProvenanceTag provenance={editingProduct.provenance.description} stores={stores} t={t} /></Space>}
              name="description"
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label={t('products.totalStock')} name="totalStock" rules={[{ required: true }]}>
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <ListToStoreModal
        open={!!listToStoreTarget}
        product={listToStoreTarget?.product ?? null}
        listings={listToStoreTarget ? (listingsByProduct.get(listToStoreTarget.product.id) ?? []) : []}
        availableStores={listToStoreTarget ? availableStoresFor(listToStoreTarget.product) : []}
        initialStoreId={listToStoreTarget?.storeId}
        onClose={() => setListToStoreTarget(null)}
      />

      {createModalMode && (
        <CreateProductModal
          open={!!createModalMode}
          mode={createModalMode}
          stores={stores}
          onClose={() => setCreateModalMode(null)}
          onCreated={(product) => navigate(`/products/${product.id}`)}
        />
      )}
    </div>
  );
}
