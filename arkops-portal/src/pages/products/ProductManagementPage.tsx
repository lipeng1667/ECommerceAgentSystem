import { EditOutlined, RobotOutlined, WarningOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mergeSuggestionsApi, productListingsApi, productsApi } from '../../api/products';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { ListingDistribution } from '../../components/products/ListingDistribution';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { AllMallId, AttributeProvenance, ListingStatus, Product, ProductListing, Store } from '../../types/domain';
import { listingAvailableStock } from '../../types/domain';

type TranslateFn = ReturnType<typeof useI18n>['t'];

/** Stock level below which a product's shared pool counts as low. */
const LOW_STOCK_THRESHOLD = 50;

type StockFilter = 'all' | 'healthy' | 'low' | 'out';
/** "Listed on / not listed on [store]" — the gap-finder toggle (§3.14.2). Only active with a specific storeFilter. */
type ListedToggle = 'any' | 'listed' | 'not_listed';

const LISTING_STATUS_COLOR: Record<ListingStatus, string> = { listed: 'green', draft: 'gold', pending_review: 'gold', delisted: 'red' };

function productStockLevel(product: Product): 'healthy' | 'low' | 'out' {
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
function ProvenanceTag({ provenance, stores, t }: { provenance: AttributeProvenance; stores: Store[]; t: TranslateFn }) {
  if (provenance.source === 'manual') {
    return <Tag style={{ fontSize: 11 }}>{t('products.provenanceManual')}</Tag>;
  }
  const storeName = stores.find((s) => s.id === provenance.storeId)?.name ?? '';
  return <Tag color="purple" style={{ fontSize: 11 }}>{t('products.provenanceAi', { store: storeName })}</Tag>;
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

  // P1 will replace this with the full "list to store" wizard (reusing the migration
  // flow's step pattern: category mapping + suggested price + inventory mode + content
  // adaptation). P0 only ships the read model (table, chips, matrix), so this is a stub.
  const handleListToStore = () => message.info(t('products.listToStoreComingSoon'));

  const columns: ColumnsType<Product> = [
    {
      title: t('products.product'), key: 'product', width: 260,
      render: (_: unknown, record: Product) => (
        <Space align="start">
          <img src={record.images[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong ellipsis>{record.name}</Typography.Text>
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
          <Button size="small" onClick={handleListToStore}>{t('products.listToStore')}</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditProduct(record)}>{t('common.edit')}</Button>
        </TableActionGroup>
      )
    },
  ];

  const expandedRowRender = (record: Product) => {
    const productListings = listingsByProduct.get(record.id) ?? [];
    const rows = stores.map((store) => ({ store, listing: productListings.find((l) => l.storeId === store.id) }));
    const matrixColumns: ColumnsType<{ store: Store; listing?: ProductListing }> = [
      { title: t('products.store'), key: 'store', render: (_: unknown, row) => row.store.name },
      {
        title: t('products.status'), key: 'status',
        render: (_: unknown, row) => row.listing
          ? <Tag color={LISTING_STATUS_COLOR[row.listing.status]}>{t(`listing.${row.listing.status}`)}</Tag>
          : <Tag>{t('listing.notListed')}</Tag>
      },
      { title: t('products.price'), key: 'price', align: 'right', render: (_: unknown, row) => row.listing ? `¥${row.listing.sellingPrice.toFixed(2)}` : '-' },
      {
        title: t('products.stock'), key: 'stock', align: 'right',
        render: (_: unknown, row) => row.listing ? `${listingAvailableStock(record, row.listing)} (${t(`listing.mode_${row.listing.inventoryMode}`)})` : '-'
      },
      { title: t('listing.platformSku'), key: 'sku', render: (_: unknown, row) => row.listing?.platformSkuRef ?? '-' },
      { title: t('listing.lastSynced'), key: 'sync', render: (_: unknown, row) => row.listing?.lastSyncedAt ?? '-' },
      {
        title: t('common.actions'), key: 'actions',
        render: (_: unknown, row) => row.listing ? null : <Button size="small" type="link" onClick={handleListToStore}>{t('listing.listToThisStore')}</Button>
      },
    ];
    return <Table<{ store: Store; listing?: ProductListing }> rowKey={(row) => row.store.id} size="small" pagination={false} columns={matrixColumns} dataSource={rows} />;
  };

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
      <PageHeader title={t('products.title')} description={t('products.description')} />

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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
          <MetricCard
            className="stat-card stat-card-purple"
            title={t('products.toHandle')}
            value={mergeCount + draftListingsCount}
            helper={t('products.toHandleMeta', { merge: mergeCount, drafts: draftListingsCount })}
          />
        </Col>
      </Row>

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
    </div>
  );
}
