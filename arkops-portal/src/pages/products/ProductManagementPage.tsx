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
  UploadOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
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
  Table,
  Tag,
  Tabs,
  Typography,
  Upload,
  Popconfirm,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import type { AllMallId } from '../../types/domain';

interface ProductSimple {
  id: string;
  storeName: string;
  sku: string;
  name: string;
  cost: number;
  sellingPrice: number;
  stock: number;
  /** Stored lifecycle status; `out_of_stock` is DERIVED from stock, never stored (C7). */
  status: 'active' | 'inactive' | 'draft' | 'pending_review';
  draftBy?: string;
  draftAt?: string;
  images?: string[];
}

/** Stock level below which a product counts as low stock. */
const LOW_STOCK_THRESHOLD = 50;

/** Display status: an active product with zero stock is shown as out_of_stock (C7). */
function displayStatus(product: ProductSimple): 'active' | 'inactive' | 'draft' | 'pending_review' | 'out_of_stock' {
  if (product.status === 'active' && product.stock <= 0) return 'out_of_stock';
  return product.status;
}

type StockFilter = 'all' | 'healthy' | 'low' | 'out';

interface ProductDraft {
  id: string;
  storeName: string;
  sku: string;
  name: string;
  cost: number;
  sellingPrice: number;
  description: string;
  images: string[];
  status: 'draft' | 'pending_review';
  createdAt: string;
}

const initialProducts: ProductSimple[] = [
  { id: 'prod_001', storeName: '拼多多旗舰店', sku: 'BT-E01', name: '蓝牙耳机 Pro', cost: 18.5, sellingPrice: 39.99, stock: 420, status: 'active' },
  { id: 'prod_002', storeName: '拼多多旗舰店', sku: 'BT-E02', name: '运动挂脖耳机', cost: 12.0, sellingPrice: 24.99, stock: 180, status: 'active' },
  { id: 'prod_003', storeName: '拼多多旗舰店', sku: 'CK-C01', name: '65W GaN 充电器', cost: 8.2, sellingPrice: 19.99, stock: 35, status: 'active' },
  { id: 'prod_004', storeName: '淘宝户外用品店', sku: 'OG-T01', name: '折叠露营椅', cost: 22.0, sellingPrice: 49.99, stock: 210, status: 'active' },
  { id: 'prod_005', storeName: '淘宝户外用品店', sku: 'OG-L01', name: 'LED 露营灯', cost: 6.5, sellingPrice: 15.99, stock: 95, status: 'active' },
  { id: 'prod_006', storeName: '淘宝户外用品店', sku: 'OG-B01', name: '户外登山包 40L', cost: 18.0, sellingPrice: 45.99, stock: 0, status: 'active' },
  { id: 'prod_007', storeName: '京东自营店', sku: 'SF-C01', name: '定制手机壳', cost: 3.5, sellingPrice: 12.99, stock: 520, status: 'active' },
];

const initialDrafts: ProductDraft[] = [
  {
    id: 'draft_001',
    storeName: '拼多多旗舰店',
    sku: 'BT-N01',
    name: '便携式野营炉',
    cost: 14.2,
    sellingPrice: 35.99,
    description: '高品质便携式野营炉，采用不锈钢材质，折叠设计方便携带。适用于户外露营、野餐等场景，支持多种燃料类型。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20camping%20stove%20outdoor%20cooking%20equipment&image_size=square'],
    status: 'draft',
    createdAt: '2026-06-21 07:45'
  },
  {
    id: 'draft_002',
    storeName: '淘宝户外用品店',
    sku: 'OG-N01',
    name: '超轻登山杖一对',
    cost: 8.5,
    sellingPrice: 29.99,
    description: '碳纤维材质超轻登山杖，仅重180g，可伸缩调节长度，适合徒步旅行和登山运动。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=carbon%20fiber%20hiking%20trekking%20poles%20outdoor&image_size=square'],
    status: 'draft',
    createdAt: '2026-06-21 06:30'
  },
  {
    id: 'draft_003',
    storeName: '拼多多旗舰店',
    sku: 'BT-N02',
    name: '骨传导运动耳机',
    cost: 22.0,
    sellingPrice: 49.99,
    description: '骨传导技术，无需入耳，安全舒适。IPX6防水等级，适合跑步、骑行等运动场景。蓝牙5.3，续航8小时。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bone%20conduction%20sports%20headphones%20wireless&image_size=square'],
    status: 'pending_review',
    createdAt: '2026-06-20 15:00'
  },
];

export function ProductManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductSimple[]>(initialProducts);
  const [drafts, setDrafts] = useState<ProductDraft[]>(initialDrafts);
  const [selectedStoreId, setSelectedStoreId] = useState<AllMallId | null>(null);
  // 库存筛选：支持从仪表盘 /products?stock=low 深链进入（C2/C7）
  const [stockFilter, setStockFilter] = useState<StockFilter>(() => {
    const fromParam = searchParams.get('stock');
    return fromParam === 'low' || fromParam === 'out' || fromParam === 'healthy' ? fromParam : 'all';
  });
  // 草稿上架确认：通过前必须确认售价与初始库存（C7）
  const [approvingDraft, setApprovingDraft] = useState<ProductDraft | null>(null);
  const [approveForm] = Form.useForm();
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSimple | null>(null);
  const [productEditForm] = Form.useForm();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<ProductDraft | null>(null);
  const [previewDraft, setPreviewDraft] = useState<ProductDraft | null>(null);

  const { data: storesData = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(),
  });

  const selectedStoreName = storesData.find(s => s.id === selectedStoreId)?.name ?? '';
  const matchesStock = (p: ProductSimple) => {
    if (stockFilter === 'low') return p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD;
    if (stockFilter === 'out') return p.stock <= 0;
    if (stockFilter === 'healthy') return p.stock >= LOW_STOCK_THRESHOLD;
    return true;
  };
  const filteredProducts = products
    .filter((p) => (selectedStoreName ? p.storeName === selectedStoreName : true))
    .filter(matchesStock);
  const filteredDrafts = selectedStoreName ? drafts.filter((d) => d.storeName === selectedStoreName) : drafts;

  // 库存预警汇总（C7/4.7）
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // 草稿统一生命周期：草稿 → 提交审核 → 通过后上架（C7/6.8）
  const submitDraftForReview = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'pending_review' as const } : d)));
    message.success(t('products.submittedForReview'));
  };

  const openApproveDraft = (draft: ProductDraft) => {
    setApprovingDraft(draft);
    approveForm.setFieldsValue({ sellingPrice: draft.sellingPrice, stock: 100 });
  };

  const handleApproveDraft = () => {
    approveForm.validateFields().then((values: { sellingPrice: number; stock: number }) => {
      if (!approvingDraft) return;
      const newProduct: ProductSimple = {
        id: `prod_${Date.now()}`,
        storeName: approvingDraft.storeName,
        sku: approvingDraft.sku,
        name: approvingDraft.name,
        cost: approvingDraft.cost,
        sellingPrice: values.sellingPrice,
        stock: values.stock,
        status: 'active',
        images: approvingDraft.images,
      };
      setProducts((prev) => [newProduct, ...prev]);
      setDrafts((prev) => prev.filter((d) => d.id !== approvingDraft.id));
      setApprovingDraft(null);
      approveForm.resetFields();
      message.success(t('products.draftApproved'));
    });
  };

  const rejectDraft = (id: string) => {
    setDrafts((prev) => prev.filter(d => d.id !== id));
    message.success(t('products.draftRejected'));
  };

  const openEditProduct = (product: ProductSimple) => {
    setEditingProduct(product);
    productEditForm.setFieldsValue({ name: product.name, cost: product.cost, sellingPrice: product.sellingPrice, stock: product.stock });
    setProductEditModalOpen(true);
  };

  const handleProductEditSubmit = () => {
    productEditForm.validateFields().then((values) => {
      if (editingProduct) {
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, ...values } : p));
        message.success(t('products.productUpdated'));
      }
      setProductEditModalOpen(false);
      productEditForm.resetFields();
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    message.success(t('products.productDeleted'));
  };

  const handleStartRecognize = async () => {
    setRecognizing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const storeName = storesData.find(s => s.id === uploadForm.getFieldValue('storeId'))?.name ?? 'Unknown Store';
    setRecognitionResult({
      id: `draft_${Date.now()}`,
      storeName,
      sku: `SKU-${Date.now()}`,
      name: '智能识别商品名称',
      cost: 15.8,
      sellingPrice: 35.99,
      description: '基于AI图像识别生成的商品描述。该商品具有高品质材料，适合多种使用场景。支持快速发货和售后服务保障。',
      images: fileList.map(f => f.url || ''),
      status: 'draft',
      createdAt: new Date().toLocaleString()
    });
    setRecognizing(false);
  };

  const saveDraft = () => {
    if (recognitionResult) {
      setDrafts((prev) => [recognitionResult, ...prev]);
      message.success(t('products.draftSaved'));
      setUploadModalOpen(false);
      setFileList([]);
      setRecognitionResult(null);
      uploadForm.resetFields();
    }
  };

  const submitForReview = () => {
    if (recognitionResult) {
      const updatedDraft = { ...recognitionResult, status: 'pending_review' as const };
      setDrafts((prev) => [updatedDraft, ...prev]);
      message.success(t('products.submittedForReview'));
      setUploadModalOpen(false);
      setFileList([]);
      setRecognitionResult(null);
      uploadForm.resetFields();
    }
  };

  const productColumns: ColumnsType<ProductSimple> = [
    { title: t('products.store'), dataIndex: 'storeName', width: 180 },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: t('products.name'), dataIndex: 'name', ellipsis: true },
    { title: t('products.cost'), dataIndex: 'cost', width: 100, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: t('products.price'), dataIndex: 'sellingPrice', width: 100, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: t('products.margin'), width: 90, align: 'right',
      render: (_: unknown, r: ProductSimple) => {
        const m = r.sellingPrice > 0 ? Math.round(((r.sellingPrice - r.cost) / r.sellingPrice) * 100) : 0;
        return <Typography.Text style={{ color: m > 30 ? '#16a34a' : m > 10 ? '#ea580c' : '#dc2626' }}>{m}%</Typography.Text>;
      },
    },
    { title: t('products.stock'), dataIndex: 'stock', width: 80, align: 'right', render: (v: number) => <Tag color={v <= 0 ? 'red' : v < 50 ? 'orange' : 'green'}>{v}</Tag> },
    {
      title: t('products.status'), width: 120,
      // 状态由库存派生：有货在售 = active，售罄 = out_of_stock（C7）
      render: (_: unknown, r: ProductSimple) => {
        const s = displayStatus(r);
        const colors: Record<string, string> = { active: 'green', inactive: 'default', out_of_stock: 'red', draft: 'blue', pending_review: 'orange' };
        return <Tag color={colors[s]}>{t(`products.${s}`)}</Tag>;
      },
    },
    {
      title: t('common.actions'), width: 140,
      render: (_: unknown, record: ProductSimple) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditProduct(record)}>{t('common.edit')}</Button>
          <Popconfirm title={t('common.confirmDelete')} onConfirm={() => deleteProduct(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />}>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const draftColumns: ColumnsType<ProductDraft> = [
    { title: t('products.store'), dataIndex: 'storeName', width: 180 },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: t('products.name'), dataIndex: 'name', ellipsis: true },
    { title: t('products.price'), dataIndex: 'sellingPrice', width: 100, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
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
        <Space>
          <Button size="small" icon={<ArrowUpOutlined />} onClick={() => setPreviewDraft(record)}>{t('common.preview')}</Button>
          {record.status === 'draft' && (
            <Button size="small" type="primary" onClick={() => submitDraftForReview(record.id)}>{t('productsv2.submitReview')}</Button>
          )}
          {record.status === 'pending_review' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openApproveDraft(record)}>{t('products.approve')}</Button>
              <Popconfirm title={t('productsv2.rejectConfirm')} onConfirm={() => rejectDraft(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<CloseCircleOutlined />}>{t('products.reject')}</Button>
              </Popconfirm>
            </>
          )}
        </Space>
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
        background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe',
      }}>
        <Space>
          <RobotOutlined style={{ color: '#7c3aed' }} />
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
          <Card>
            <Typography.Text type="secondary">{t('products.totalProducts')}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '8px 0', color: '#2563eb' }}>{products.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Typography.Text type="secondary">{t('products.activeProducts')}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '8px 0', color: '#16a34a' }}>{products.filter(p => displayStatus(p) === 'active').length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          {/* 库存预警汇总卡：点击即筛选（C7/4.7） */}
          <Card
            hoverable
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            style={stockFilter === 'low' || stockFilter === 'out' ? { borderColor: '#ea580c' } : undefined}
          >
            <Typography.Text type="secondary">{t('productsv2.inventoryAlert')}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '8px 0', color: lowStockCount + outOfStockCount > 0 ? '#ea580c' : '#16a34a' }}>
              {lowStockCount + outOfStockCount}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('productsv2.inventoryAlertMeta', { low: lowStockCount, out: outOfStockCount })}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Typography.Text type="secondary">{t('products.draftCount')}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '8px 0', color: '#ea580c' }}>{drafts.length}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder={t('products.filterStore')}
            style={{ width: 220 }}
            value={selectedStoreId}
            onChange={(v) => setSelectedStoreId(v ?? null)}
            options={storesData.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            style={{ width: 160 }}
            value={stockFilter}
            onChange={(v) => setStockFilter(v)}
            options={[
              { value: 'all', label: t('productsv2.stockAll') },
              { value: 'healthy', label: t('productsv2.stockHealthy') },
              { value: 'low', label: t('productsv2.stockLow') },
              { value: 'out', label: t('productsv2.stockOut') },
            ]}
          />
        </Space>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>
          {t('products.uploadProduct')}
        </Button>
      </div>

      <Tabs defaultActiveKey="products"
        items={[
          {
            key: 'products',
            label: <><ShoppingCartOutlined /> {t('products.productList')}</>,
            children: (
              <Card>
                <Table rowKey="id" columns={productColumns} dataSource={filteredProducts} pagination={{ pageSize: 10 }} size="small" />
              </Card>
            ),
          },
          {
            key: 'drafts',
            label: <><EditOutlined /> {t('products.draftBox')}</>,
            children: (
              <Card>
                <Table rowKey="id" columns={draftColumns} dataSource={filteredDrafts} pagination={{ pageSize: 10 }} size="small" />
              </Card>
            ),
          },
        ]}
      />

      {/* 草稿上架确认：通过前确认售价与初始库存（C7） */}
      <Modal
        title={t('productsv2.approveModalTitle')}
        open={!!approvingDraft}
        onOk={handleApproveDraft}
        okText={t('products.approve')}
        onCancel={() => { setApprovingDraft(null); approveForm.resetFields(); }}
        width={440}
      >
        {approvingDraft && (
          <>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
              {t('productsv2.approveModalDesc')}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ fontSize: 13, marginBottom: 12 }}>
              <Typography.Text strong>{approvingDraft.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>SKU: {approvingDraft.sku} · {approvingDraft.storeName}</Typography.Text>
            </Typography.Paragraph>
            <Form form={approveForm} layout="vertical">
              <Form.Item label={t('products.price')} name="sellingPrice" rules={[{ required: true }]}>
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
              <Form.Item label={t('productsv2.initialStock')} name="stock" rules={[{ required: true }]}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal title={t('products.editProduct')} open={productEditModalOpen} onOk={handleProductEditSubmit}
        onCancel={() => { setProductEditModalOpen(false); productEditForm.resetFields(); }} width={480}>
        <Form form={productEditForm} layout="vertical">
          <Form.Item label={t('products.name')} name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label={t('products.cost')} name="cost" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" /></Form.Item>
          <Form.Item label={t('products.price')} name="sellingPrice" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" /></Form.Item>
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
              <Form.Item label={t('entity.storeName')}>
                <Select
                  style={{ width: '100%' }}
                  defaultValue={storesData[0]?.id}
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
                      <Input defaultValue={recognitionResult.name} onChange={(e) => setRecognitionResult(prev => prev ? { ...prev, name: e.target.value } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.price')}>
                      <InputNumber defaultValue={recognitionResult.sellingPrice} style={{ width: '100%' }} prefix="¥" onChange={(v) => setRecognitionResult(prev => prev ? { ...prev, sellingPrice: v ?? 0 } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.cost')}>
                      <InputNumber defaultValue={recognitionResult.cost} style={{ width: '100%' }} prefix="¥" onChange={(v) => setRecognitionResult(prev => prev ? { ...prev, cost: v ?? 0 } : null)} />
                    </Form.Item>
                    <Form.Item label={t('products.description')}>
                      <Input.TextArea defaultValue={recognitionResult.description} rows={3} onChange={(e) => setRecognitionResult(prev => prev ? { ...prev, description: e.target.value } : null)} />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={() => { setRecognitionResult(null); setFileList([]); }}>{t('common.reupload')}</Button>
              <Button onClick={saveDraft} style={{ marginLeft: 8 }}>{t('products.saveDraft')}</Button>
              <Button type="primary" onClick={submitForReview} style={{ marginLeft: 8 }}>{t('products.submitForReview')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal title={t('common.preview')} open={!!previewDraft} onCancel={() => setPreviewDraft(null)} width={640} footer={null}>
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
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>{previewDraft.storeName}</Typography.Text>
                <Typography.Title level={3} style={{ marginTop: 12, color: '#dc2626' }}>¥{previewDraft.sellingPrice.toFixed(2)}</Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>{previewDraft.description}</Typography.Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
