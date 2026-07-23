import {
  ArrowUpOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tabs,
  Typography,
  Upload,
  Popconfirm,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productDraftsApi, productsApi } from '../../api/products';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { AllMallId, Product, ProductDisplayStatus, ProductDraft } from '../../types/domain';

/** Stock level below which a product counts as low stock. */
const LOW_STOCK_THRESHOLD = 50;

/** Display status: an active product with zero stock is shown as out_of_stock (C7). */
function displayStatus(product: Product): ProductDisplayStatus {
  if (product.status === 'active' && product.stock <= 0) return 'out_of_stock';
  return product.status;
}

type StockFilter = 'all' | 'healthy' | 'low' | 'out';

/** In-progress recognition/manual draft, before it has an id or a saved status. */
type DraftInProgress = Omit<ProductDraft, 'id' | 'createdAt' | 'status'>;

export function ProductManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  // Item 3 (D3): store scope comes from the shell-level persistent filter, same as
  // the dashboard — the page no longer maintains its own competing store Select.
  const { scope: storeScope, activeStore, isAllStores } = useStoreScope();

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });
  const { data: drafts = [] } = useQuery({ queryKey: ['productDrafts'], queryFn: productDraftsApi.list });
  const { data: storesData = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const storeNameById = useMemo(() => new Map(storesData.map((s) => [s.id, s.name])), [storesData]);
  const resolveStoreName = (storeId: AllMallId) => storeNameById.get(storeId) ?? t('products.unknownStore');

  const [keyword, setKeyword] = useState('');
  // 库存筛选：支持从仪表盘 /products?stock=low 深链进入（C2/C7）
  const [stockFilter, setStockFilter] = useState<StockFilter>(() => {
    const fromParam = searchParams.get('stock');
    return fromParam === 'low' || fromParam === 'out' || fromParam === 'healthy' ? fromParam : 'all';
  });
  // 草稿上架确认：通过前必须确认售价与初始库存（C7）
  const [approvingDraft, setApprovingDraft] = useState<ProductDraft | null>(null);
  const [approveForm] = Form.useForm();
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productEditForm] = Form.useForm();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<DraftInProgress | null>(null);
  const [previewDraft, setPreviewDraft] = useState<ProductDraft | null>(null);

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['products'] });
  const invalidateDrafts = () => queryClient.invalidateQueries({ queryKey: ['productDrafts'] });

  const updateProductMutation = useMutation({
    mutationFn: (input: { id: AllMallId; patch: Partial<Pick<Product, 'name' | 'cost' | 'sellingPrice' | 'stock'>> }) =>
      productsApi.update(input.id, input.patch),
    onSuccess: () => {
      invalidateProducts();
      message.success(t('products.productUpdated'));
      setProductEditModalOpen(false);
      productEditForm.resetFields();
    }
  });
  const deleteProductMutation = useMutation({
    mutationFn: (id: AllMallId) => productsApi.remove(id),
    onSuccess: () => {
      invalidateProducts();
      message.success(t('products.productDeleted'));
    }
  });
  const submitDraftForReviewMutation = useMutation({
    mutationFn: (id: AllMallId) => productDraftsApi.submitForReview(id),
    onSuccess: () => {
      invalidateDrafts();
      message.success(t('products.submittedForReview'));
    }
  });
  const approveDraftMutation = useMutation({
    mutationFn: (input: { id: AllMallId; sellingPrice: number; stock: number }) =>
      productDraftsApi.approve(input.id, { sellingPrice: input.sellingPrice, stock: input.stock }),
    onSuccess: () => {
      invalidateProducts();
      invalidateDrafts();
      setApprovingDraft(null);
      approveForm.resetFields();
      message.success(t('products.draftApproved'));
    }
  });
  const rejectDraftMutation = useMutation({
    mutationFn: (id: AllMallId) => productDraftsApi.reject(id),
    onSuccess: () => {
      invalidateDrafts();
      message.success(t('products.draftRejected'));
    }
  });
  const saveDraftMutation = useMutation({
    mutationFn: (input: DraftInProgress & { status: ProductDraft['status'] }) => productDraftsApi.save(input),
    onSuccess: (_, variables) => {
      invalidateDrafts();
      message.success(variables.status === 'pending_review' ? t('products.submittedForReview') : t('products.draftSaved'));
      setUploadModalOpen(false);
      setFileList([]);
      setRecognitionResult(null);
      uploadForm.resetFields();
    }
  });

  const matchesStock = (p: Product) => {
    if (stockFilter === 'low') return p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD;
    if (stockFilter === 'out') return p.stock <= 0;
    if (stockFilter === 'healthy') return p.stock >= LOW_STOCK_THRESHOLD;
    return true;
  };
  const matchesKeyword = (name: string, sku: string) => {
    if (!keyword) return true;
    const q = keyword.toLowerCase();
    return name.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
  };
  const matchesScope = (storeId: AllMallId) => isAllStores || storeId === storeScope;

  const filteredProducts = products
    .filter((p) => matchesScope(p.storeId))
    .filter(matchesStock)
    .filter((p) => matchesKeyword(p.name, p.sku));
  const filteredDrafts = drafts
    .filter((d) => matchesScope(d.storeId))
    .filter((d) => matchesKeyword(d.name, d.sku));

  // 库存预警汇总（C7/4.7）
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const hasStockAlerts = lowStockCount + outOfStockCount > 0;

  const openApproveDraft = (draft: ProductDraft) => {
    setApprovingDraft(draft);
    approveForm.setFieldsValue({ sellingPrice: draft.sellingPrice, stock: 100 });
  };

  const handleApproveDraft = () => {
    approveForm.validateFields().then((values: { sellingPrice: number; stock: number }) => {
      if (!approvingDraft) return;
      approveDraftMutation.mutate({ id: approvingDraft.id, sellingPrice: values.sellingPrice, stock: values.stock });
    });
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    productEditForm.setFieldsValue({ name: product.name, cost: product.cost, sellingPrice: product.sellingPrice, stock: product.stock });
    setProductEditModalOpen(true);
  };

  const handleProductEditSubmit = () => {
    productEditForm.validateFields().then((values) => {
      if (editingProduct) {
        updateProductMutation.mutate({ id: editingProduct.id, patch: values });
      }
    });
  };

  /** Item 11: soft warning (not a hard block) when selling price is below cost. */
  const priceBelowCostRule = (getCost: () => number | undefined) => ({
    warningOnly: true,
    validator: (_: unknown, value: number) => {
      const cost = getCost();
      if (value != null && cost != null && value < cost) {
        return Promise.reject(new Error(t('products.priceBelowCostWarning')));
      }
      return Promise.resolve();
    },
  });

  const handleStartRecognize = async () => {
    setRecognizing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const storeId: AllMallId = uploadForm.getFieldValue('storeId') ?? activeStore?.id ?? storesData[0]?.id;
    setRecognitionResult({
      storeId,
      sku: `SKU-${Date.now()}`,
      name: '智能识别商品名称',
      cost: 15.8,
      sellingPrice: 35.99,
      description: '基于AI图像识别生成的商品描述。该商品具有高品质材料，适合多种使用场景。支持快速发货和售后服务保障。',
      images: fileList.map((f) => f.url || ''),
    });
    setRecognizing(false);
  };

  const saveDraft = () => {
    if (recognitionResult) saveDraftMutation.mutate({ ...recognitionResult, status: 'draft' });
  };

  const submitForReview = () => {
    if (recognitionResult) saveDraftMutation.mutate({ ...recognitionResult, status: 'pending_review' });
  };

  const productColumns: ColumnsType<Product> = [
    { title: t('products.store'), key: 'store', width: 180, render: (_: unknown, r: Product) => resolveStoreName(r.storeId) },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: t('products.name'), dataIndex: 'name', ellipsis: true },
    { title: t('products.cost'), dataIndex: 'cost', width: 100, align: 'right', sorter: (a, b) => a.cost - b.cost, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: t('products.price'), dataIndex: 'sellingPrice', width: 100, align: 'right', sorter: (a, b) => a.sellingPrice - b.sellingPrice, render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: t('products.margin'), width: 90, align: 'right',
      sorter: (a, b) => {
        const marginOf = (r: Product) => (r.sellingPrice > 0 ? (r.sellingPrice - r.cost) / r.sellingPrice : 0);
        return marginOf(a) - marginOf(b);
      },
      render: (_: unknown, r: Product) => {
        const m = r.sellingPrice > 0 ? Math.round(((r.sellingPrice - r.cost) / r.sellingPrice) * 100) : 0;
        return <Typography.Text style={{ color: m > 30 ? 'var(--ark-green)' : m > 10 ? 'var(--ark-orange)' : 'var(--ark-red)' }}>{m}%</Typography.Text>;
      },
    },
    { title: t('products.stock'), dataIndex: 'stock', width: 80, align: 'right', sorter: (a, b) => a.stock - b.stock, render: (v: number) => <Tag color={v <= 0 ? 'red' : v < 50 ? 'orange' : 'green'}>{v}</Tag> },
    {
      title: t('products.status'), width: 120,
      // 状态由库存派生：有货在售 = active，售罄 = out_of_stock（C7）
      render: (_: unknown, r: Product) => {
        const s = displayStatus(r);
        const colors: Record<string, string> = { active: 'green', inactive: 'default', out_of_stock: 'red', draft: 'blue', pending_review: 'orange' };
        return <Tag color={colors[s]}>{t(`products.${s}`)}</Tag>;
      },
    },
    {
      title: t('common.actions'), width: 160,
      render: (_: unknown, record: Product) => (
        <TableActionGroup>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditProduct(record)}>{t('common.edit')}</Button>
          <Popconfirm title={t('common.confirmDelete')} onConfirm={() => deleteProductMutation.mutate(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />}>{t('common.delete')}</Button>
          </Popconfirm>
        </TableActionGroup>
      ),
    },
  ];

  const draftColumns: ColumnsType<ProductDraft> = [
    { title: t('products.store'), key: 'store', width: 180, render: (_: unknown, r: ProductDraft) => resolveStoreName(r.storeId) },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: t('products.name'), dataIndex: 'name', ellipsis: true },
    { title: t('products.price'), dataIndex: 'sellingPrice', width: 100, align: 'right', sorter: (a, b) => a.sellingPrice - b.sellingPrice, render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: t('products.status'), dataIndex: 'status', width: 120,
      render: (s: string) => {
        const colors: Record<string, string> = { draft: 'blue', pending_review: 'orange' };
        return <Tag color={colors[s]}>{t(`products.${s}`)}</Tag>;
      },
    },
    { title: t('products.createdAt'), dataIndex: 'createdAt', width: 140 },
    {
      title: t('common.actions'), width: 230,
      // 统一草稿生命周期：草稿先提交审核，审核通过时确认售价/库存后上架（C7）
      render: (_: unknown, record: ProductDraft) => (
        <TableActionGroup>
          <Button size="small" icon={<ArrowUpOutlined />} onClick={() => setPreviewDraft(record)}>{t('draft.preview')}</Button>
          {record.status === 'draft' && (
            <Button size="small" type="primary" onClick={() => submitDraftForReviewMutation.mutate(record.id)}>{t('products.submitForReview')}</Button>
          )}
          {record.status === 'pending_review' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openApproveDraft(record)}>{t('products.approve')}</Button>
              <Popconfirm title={t('products.rejectConfirm')} onConfirm={() => rejectDraftMutation.mutate(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<CloseCircleOutlined />}>{t('products.reject')}</Button>
              </Popconfirm>
            </>
          )}
        </TableActionGroup>
      ),
    },
  ];

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
      />

      {/* Agent 联动提示 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', marginBottom: 16,
        background: 'color-mix(in srgb, var(--ark-purple) 6%, var(--ark-panel))',
        borderRadius: 8, border: '1px solid color-mix(in srgb, var(--ark-purple) 24%, var(--ark-border))',
      }}>
        <Space>
          <RobotOutlined style={{ color: 'var(--ark-purple)' }} />
          <Typography.Text style={{ fontSize: 13 }}>
            {t('products.agentNote')}
          </Typography.Text>
        </Space>
        <Link to="/agents/product_launch">
          <Button size="small" icon={<RobotOutlined />}>Agent 详情 →</Button>
        </Link>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <MetricCard className="stat-card stat-card-primary" title={t('products.totalProducts')} value={products.length} />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            className="stat-card stat-card-success"
            title={t('products.activeProducts')}
            value={products.filter((p) => displayStatus(p) === 'active').length}
          />
        </Col>
        <Col xs={12} sm={6}>
          {/* 库存预警汇总卡：点击即筛选，与库存下拉共享同一状态，二者不会不同步（item 8） */}
          <div
            onClick={() => setStockFilter((prev) => (prev === 'low' || prev === 'out' ? 'all' : 'low'))}
            style={{ cursor: 'pointer' }}
          >
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
          <MetricCard className="stat-card stat-card-purple" title={t('products.draftCount')} value={drafts.length} />
        </Col>
      </Row>

      <PageFilterBar>
        <Input.Search
          placeholder={t('products.searchPlaceholder')}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <Select
          style={{ width: 160 }}
          value={stockFilter}
          onChange={(v) => setStockFilter(v)}
          options={[
            { value: 'all', label: t('products.stockAll') },
            { value: 'healthy', label: t('products.stockHealthy') },
            { value: 'low', label: t('products.stockLow') },
            { value: 'out', label: t('products.stockOut') },
          ]}
        />
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)} style={{ marginLeft: 'auto' }}>
          {t('products.uploadProduct')}
        </Button>
      </PageFilterBar>

      <Tabs defaultActiveKey="products"
        items={[
          {
            key: 'products',
            label: <><ShoppingCartOutlined /> {t('products.productList')}</>,
            children: (
              <DataTableCard<Product>
                rowKey="id"
                columns={productColumns}
                dataSource={filteredProducts}
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
              />
            ),
          },
          {
            key: 'drafts',
            label: <><EditOutlined /> {t('products.draftBox')}</>,
            children: (
              <DataTableCard<ProductDraft>
                rowKey="id"
                columns={draftColumns}
                dataSource={filteredDrafts}
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
              />
            ),
          },
        ]}
      />

      {/* 草稿上架确认：通过前确认售价与初始库存（C7） */}
      <Modal
        title={t('products.approveModalTitle')}
        open={!!approvingDraft}
        onOk={handleApproveDraft}
        okText={t('products.approve')}
        confirmLoading={approveDraftMutation.isPending}
        onCancel={() => { setApprovingDraft(null); approveForm.resetFields(); }}
        width={440}
      >
        {approvingDraft && (
          <>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
              {t('products.approveModalDesc')}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ fontSize: 13, marginBottom: 12 }}>
              <Typography.Text strong>{approvingDraft.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>SKU: {approvingDraft.sku} · {resolveStoreName(approvingDraft.storeId)}</Typography.Text>
            </Typography.Paragraph>
            <Form form={approveForm} layout="vertical">
              <Form.Item
                label={t('products.price')}
                name="sellingPrice"
                rules={[{ required: true }, priceBelowCostRule(() => approvingDraft.cost)]}
              >
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
              <Form.Item label={t('products.initialStock')} name="stock" rules={[{ required: true }]}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal title={t('products.editProduct')} open={productEditModalOpen} onOk={handleProductEditSubmit}
        confirmLoading={updateProductMutation.isPending}
        onCancel={() => { setProductEditModalOpen(false); productEditForm.resetFields(); }} width={480}>
        <Form form={productEditForm} layout="vertical">
          <Form.Item label={t('products.name')} name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label={t('products.cost')} name="cost" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" /></Form.Item>
          <Form.Item
            label={t('products.price')}
            name="sellingPrice"
            rules={[{ required: true }, priceBelowCostRule(() => productEditForm.getFieldValue('cost'))]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item label={t('products.stock')} name="stock" rules={[{ required: true }]}><InputNumber min={0} step={1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('products.uploadProduct')}
        open={uploadModalOpen}
        onCancel={() => { setUploadModalOpen(false); setFileList([]); setRecognitionResult(null); uploadForm.resetFields(); }}
        width={760}
        footer={null}
      >
        {!recognitionResult ? (
          <div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              {t('products.uploadDesc')}
            </Typography.Paragraph>
            <Form form={uploadForm} layout="vertical">
              <Form.Item label={t('entity.storeName')} name="storeId">
                <Select
                  style={{ width: '100%' }}
                  defaultValue={activeStore?.id ?? storesData[0]?.id}
                  options={storesData.map((s) => ({ value: s.id, label: s.name }))}
                />
              </Form.Item>
              <Form.Item label={t('products.uploadImages')}>
                <Upload
                  multiple
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  beforeUpload={() => false}
                  maxCount={10}
                >
                  {fileList.length < 10 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>{t('common.upload')}</div></div>}
                </Upload>
                <Typography.Text type="secondary">{t('products.uploadHint')}</Typography.Text>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={() => { setUploadModalOpen(false); setFileList([]); }}>
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                icon={<CameraOutlined />}
                loading={recognizing}
                onClick={handleStartRecognize}
                style={{ marginLeft: 8 }}
                disabled={fileList.length === 0}
              >
                {recognizing ? t('products.recognizing') : t('products.startRecognize')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              {t('products.previewDesc')}
            </Typography.Paragraph>
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <Card size="small" title={t('products.images')}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {recognitionResult.images.map((img, idx) => (
                      <img key={idx} src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={14}>
                <Card size="small">
                  <Form layout="vertical">
                    <Form.Item label={t('products.name')}>
                      <Input defaultValue={recognitionResult.name} onChange={(e) => setRecognitionResult((prev) => prev ? { ...prev, name: e.target.value } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.price')}>
                      <InputNumber defaultValue={recognitionResult.sellingPrice} style={{ width: '100%' }} prefix="¥" onChange={(v) => setRecognitionResult((prev) => prev ? { ...prev, sellingPrice: v ?? 0 } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.cost')}>
                      <InputNumber defaultValue={recognitionResult.cost} style={{ width: '100%' }} prefix="¥" onChange={(v) => setRecognitionResult((prev) => prev ? { ...prev, cost: v ?? 0 } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.description')}>
                      <Input.TextArea defaultValue={recognitionResult.description} rows={3} onChange={(e) => setRecognitionResult((prev) => prev ? { ...prev, description: e.target.value } : null)} />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={() => { setRecognitionResult(null); setFileList([]); }}>{t('common.reupload')}</Button>
              <Button onClick={saveDraft} loading={saveDraftMutation.isPending} style={{ marginLeft: 8 }}>{t('products.saveDraft')}</Button>
              <Button type="primary" onClick={submitForReview} loading={saveDraftMutation.isPending} style={{ marginLeft: 8 }}>{t('products.submitForReview')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal title={t('draft.preview')} open={!!previewDraft} onCancel={() => setPreviewDraft(null)} width={640} footer={null}>
        {previewDraft && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {previewDraft.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 4 }} />
                  ))}
                </div>
              </Col>
              <Col span={14}>
                <Typography.Title level={4}>{previewDraft.name}</Typography.Title>
                <Typography.Text type="secondary">SKU: {previewDraft.sku}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>{resolveStoreName(previewDraft.storeId)}</Typography.Text>
                <Typography.Title level={3} style={{ marginTop: 12, color: 'var(--ark-red)' }}>¥{previewDraft.sellingPrice.toFixed(2)}</Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>{previewDraft.description}</Typography.Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
