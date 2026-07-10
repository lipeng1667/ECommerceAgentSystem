import {
  ApiOutlined,
  ArrowLeftOutlined,
  CustomerServiceOutlined,
  LinkOutlined,
  PlusOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  StopOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb, Button, Card, Checkbox, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Store, StoreConnection, StoreServiceType } from '../../types/domain';
import { parseAllMallId } from '../../utils/id';

export function StoreDetailPage({ mode }: { mode?: 'new' }) {
  const { t } = useI18n();
  const { storeId } = useParams();
  const parsedStoreId = parseAllMallId(storeId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: store } = useQuery({
    queryKey: ['store', parsedStoreId],
    queryFn: () => storesApi.get(parsedStoreId!),
    enabled: parsedStoreId !== undefined && mode !== 'new'
  });
  const createStore = useMutation({
    mutationFn: storesApi.create,
    onSuccess: (created) => navigate(`/stores/${created.id}`)
  });
  const revokeMutation = useMutation({
    mutationFn: () => storesApi.updateStatus(parsedStoreId!, 'revoked'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', parsedStoreId] })
  });
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionForm] = Form.useForm();
  const addConnectionMutation = useMutation({
    mutationFn: (values: { serviceName: string; serviceType: StoreServiceType; authMethod: Store['authMethod']; apiKey?: string; account?: string }) =>
      storesApi.addConnection(parsedStoreId!, values),
    onSuccess: () => {
      message.success(t('stores.connectionAdded'));
      queryClient.invalidateQueries({ queryKey: ['store', parsedStoreId] });
      setConnectionModalOpen(false);
      connectionForm.resetFields();
    }
  });

  const [authMethod, setAuthMethod] = useState<Store['authMethod'] | undefined>();
  const [platform, setPlatform] = useState<string>('tiktok_shop');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // 各平台授权服务名称映射（运营后台 / 投流 / 客服 / 物流 / 财务）
  const platformServiceNames: Record<string, Record<string, { title: string; desc: string }>> = {
    tiktok_shop: {
      advertising: { title: 'TikTok Ads', desc: 'TikTok 广告投放平台' },
      customer_service: { title: 'TikTok Shop Chat', desc: 'TikTok Shop 买家消息' },
      logistics: { title: 'TikTok Shop Logistics', desc: 'TikTok Shop 物流发货' },
      finance: { title: 'TikTok Shop Finance', desc: 'TikTok Shop 财务结算' },
    },
    amazon: {
      advertising: { title: 'Amazon Ads', desc: 'Amazon 广告活动管理' },
      customer_service: { title: 'Buyer-Seller Messaging', desc: 'Amazon 买家消息' },
      logistics: { title: 'Amazon FBA / Logistics', desc: 'FBA 仓储与物流配送' },
      finance: { title: 'Amazon Payments', desc: 'Amazon 收款与结算' },
    },
    shopify: {
      advertising: { title: 'Shopify Audiences', desc: 'Shopify 广告受众与投放' },
      customer_service: { title: 'Shopify Inbox', desc: 'Shopify 买家消息' },
      logistics: { title: 'Shopify Shipping', desc: 'Shopify 物流发货' },
      finance: { title: 'Shopify Payments', desc: 'Shopify 收款与结算' },
    },
    shopee: {
      advertising: { title: 'Shopee Ads', desc: '虾皮广告投放平台' },
      customer_service: { title: '聊聊 (Shopee Chat)', desc: 'Shopee 买家消息' },
      logistics: { title: 'SLS 物流', desc: 'Shopee 自建物流' },
      finance: { title: 'Shopee Finance', desc: 'Shopee 财务结算' },
    },
    lazada: {
      advertising: { title: 'Sponsored Solutions', desc: 'Lazada 广告推广' },
      customer_service: { title: 'Lazada Chat', desc: 'Lazada 买家消息' },
      logistics: { title: 'LGS 物流', desc: 'Lazada 自建物流' },
      finance: { title: 'Lazada Finance', desc: 'Lazada 财务结算' },
    },
    temu: {
      advertising: { title: 'Temu Ads', desc: 'Temu 广告投放' },
      customer_service: { title: 'Temu Chat', desc: 'Temu 买家消息' },
      logistics: { title: 'Temu Logistics', desc: 'Temu JIT/VMI 物流' },
      finance: { title: 'Temu Finance', desc: 'Temu 财务结算' },
    },
    ebay: {
      advertising: { title: 'Promoted Listings', desc: 'eBay 广告推广' },
      customer_service: { title: 'eBay Messages', desc: 'eBay 买家消息' },
      logistics: { title: 'eBay Shipping', desc: 'eBay 物流发货' },
      finance: { title: 'eBay Payments', desc: 'eBay 收款与结算' },
    },
    douyin: {
      advertising: { title: '千川', desc: '巨量千川广告投放平台' },
      customer_service: { title: '飞鸽', desc: '飞鸽客服系统' },
      logistics: { title: '抖店物流', desc: '抖店物流发货' },
      finance: { title: '抖店结算', desc: '抖店财务结算中心' },
    },
    pinduoduo: {
      advertising: { title: '多多搜索 / 全站推广', desc: '拼多多广告投放平台' },
      customer_service: { title: '多多客服', desc: '拼多多买家消息' },
      logistics: { title: '拼多多物流', desc: '拼多多物流发货' },
      finance: { title: '对账中心', desc: '商家后台对账结算' },
    },
    jd: {
      advertising: { title: '京准通', desc: '京东广告投放平台' },
      customer_service: { title: '咚咚', desc: '咚咚客服系统' },
      logistics: { title: '京东物流', desc: '京东物流配送' },
      finance: { title: '京麦财务', desc: '京东商家财务结算' },
    },
    taobao: {
      advertising: { title: '直通车 / 万相台', desc: '淘宝广告投放平台' },
      customer_service: { title: '千牛客服', desc: '千牛客服接待' },
      logistics: { title: '菜鸟物流', desc: '菜鸟物流发货' },
      finance: { title: '支付宝商家中心', desc: '支付宝收款与结算' },
    },
    kuaishou: {
      advertising: { title: '磁力金牛', desc: '快手电商广告投放平台' },
      customer_service: { title: '快手客服', desc: '快手买家消息' },
      logistics: { title: '快手物流', desc: '快手物流发货' },
      finance: { title: '快手财务', desc: '快手财务结算' },
    },
  };

  const serviceOptions = [
    { key: 'advertising', icon: <ThunderboltOutlined />, color: '#2563eb' },
    { key: 'customer_service', icon: <CustomerServiceOutlined />, color: '#16a34a' },
    { key: 'logistics', icon: <ShoppingCartOutlined />, color: '#ea580c' },
    { key: 'finance', icon: <WalletOutlined />, color: '#7c3aed' },
  ];

  // 平台 → 地区和币种映射
  const platformDefaults: Record<string, { region: string; currency: string }> = {
    tiktok_shop: { region: 'US', currency: 'USD' },
    amazon: { region: 'US', currency: 'USD' },
    shopify: { region: 'US', currency: 'USD' },
    shopee: { region: 'SG', currency: 'SGD' },
    lazada: { region: 'SG', currency: 'SGD' },
    temu: { region: 'US', currency: 'USD' },
    ebay: { region: 'US', currency: 'USD' },
    pinduoduo: { region: 'CN', currency: 'CNY' },
    douyin: { region: 'CN', currency: 'CNY' },
    jd: { region: 'CN', currency: 'CNY' },
    taobao: { region: 'CN', currency: 'CNY' },
    kuaishou: { region: 'CN', currency: 'CNY' },
  };

  if (mode === 'new') {
    const authMethods: { value: Store['authMethod']; label: string; desc: string; platforms: string[] }[] = [
      { value: 'credentials', label: t('stores.authCredentials'), desc: t('stores.authCredentialsDesc'), platforms: ['tiktok_shop', 'amazon', 'shopee', 'lazada', 'temu', 'ebay', 'pinduoduo', 'douyin', 'jd', 'taobao', 'kuaishou'] },
      { value: 'api_key', label: t('stores.authApiKey'), desc: t('stores.authApiKeyDesc'), platforms: ['shopify', 'amazon', 'ebay'] },
      { value: 'oauth', label: t('stores.authOauth'), desc: t('stores.authOauthDesc'), platforms: ['shopify', 'amazon'] }
    ];

    return (
      <div className="page-stack">
        <Breadcrumb
          items={[
            { title: <Link to="/setup">{t('nav.stores')}</Link> },
            { title: t('stores.addTitle') }
          ]}
        />
        <PageHeader
          title={t('stores.addTitle')}
          description={t('stores.addDescription')}
          actions={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/setup')}>
              {t('stores.backToList')}
            </Button>
          }
        />
        {/* 步骤1：店铺信息 */}
        <Card title={t('stores.stepPlatform')} style={{ marginBottom: 16 }}>
          <Form.Item label={t('stores.name')} name="storeName" rules={[{ required: true }]}>
            <Input placeholder={t('stores.namePlaceholder')} onChange={(e) => form.setFieldsValue({ name: e.target.value })} />
          </Form.Item>
          <Form.Item label={t('stores.platform')}>
            <Select
              value={platform}
              onChange={(v) => {
                setPlatform(v);
                setAuthMethod(undefined);
                const def = platformDefaults[v];
                if (def) form.setFieldsValue({ region: def.region, currency: def.currency });
              }}
              options={[
                { value: 'tiktok_shop', label: 'TikTok Shop' }, { value: 'amazon', label: 'Amazon' },
                { value: 'shopify', label: 'Shopify' }, { value: 'shopee', label: 'Shopee' },
                { value: 'lazada', label: 'Lazada' }, { value: 'temu', label: 'Temu' }, { value: 'ebay', label: 'eBay' },
                { value: 'pinduoduo', label: '拼多多' }, { value: 'douyin', label: '抖音' },
                { value: 'jd', label: '京东' }, { value: 'taobao', label: '淘宝' },
                { value: 'kuaishou', label: '快手' }
              ]}
            />
          </Form.Item>
        </Card>

        {/* 步骤2：授权方式 */}
        <Card title={t('stores.stepAuth')} style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary">{t('stores.chooseAuth')}</Typography.Paragraph>
          <Row gutter={[12, 12]}>
            {authMethods.filter((m) => m.platforms.includes(platform)).map((m) => (
              <Col xs={24} sm={12} key={m.value}>
                <Card hoverable size="small"
                  style={{ border: authMethod === m.value ? '2px solid #2563eb' : '1px solid #e8e8e8', cursor: 'pointer' }}
                  onClick={() => setAuthMethod(m.value)}>
                  <Typography.Text strong>{m.label}</Typography.Text><br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{m.desc}</Typography.Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 步骤3+4：授权配置 + 开通服务（Form 包裹） */}
        {authMethod && (
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createStore.mutate({
              name: values.name, platform, authMethod,
              apiKey: values.apiKey, apiSecret: values.apiSecret, account: values.account,
              region: values.region, currency: values.currency,
              services: selectedServices,
            })}
          >
            <Form.Item name="name" hidden><Input /></Form.Item>

            {/* 步骤3：授权配置 */}
            <Card title={<><SettingOutlined /> {t('stores.stepConfig')}</>} style={{ marginBottom: 16 }}>
              <Typography.Title level={5} style={{ marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                <LinkOutlined style={{ marginRight: 8 }} />{t('stores.primaryAuth')}
              </Typography.Title>

              {authMethod === 'credentials' && (
                <>
                  <div style={{ padding: 16, background: '#f0f5ff', borderRadius: 8, marginBottom: 16 }}>
                    <Typography.Text>{t('stores.credentialsNote')}</Typography.Text>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}><Form.Item label={t('stores.account')} name="account" rules={[{ required: true }]}><Input placeholder="seller@example.com" /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item label={t('stores.password')} name="password"><Input.Password placeholder={t('stores.passwordPlaceholder')} /></Form.Item></Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t('stores.region')} name="region" initialValue={platformDefaults[platform]?.region}>
                        <Input disabled />
                      </Form.Item>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('stores.regionAutoHint')}</Typography.Text>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label={t('stores.currency')} name="currency" initialValue={platformDefaults[platform]?.currency}>
                        <Input disabled />
                      </Form.Item>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('stores.currencyAutoHint')}</Typography.Text>
                    </Col>
                  </Row>
                </>
              )}

              {authMethod === 'api_key' && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}><Form.Item label={t('stores.apiKeyLabel')} name="apiKey" rules={[{ required: true }]}><Input placeholder="shpat_xxxxxxxxxxxx" /></Form.Item></Col>
                  <Col xs={24} sm={12}><Form.Item label={t('stores.apiSecretLabel')} name="apiSecret" rules={[{ required: true }]}><Input.Password placeholder={t('stores.apiSecretPlaceholder')} /></Form.Item></Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label={t('stores.region')} name="region" initialValue={platformDefaults[platform]?.region}>
                      <Input disabled />
                    </Form.Item>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('stores.regionAutoHint')}</Typography.Text>
                  </Col>
                </Row>
              )}

              {authMethod === 'oauth' && (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Typography.Title level={5}>{t('stores.oauthTitle')}</Typography.Title>
                  <Typography.Paragraph type="secondary">{t('stores.oauthDesc')}</Typography.Paragraph>
                  <Button type="primary" size="large" icon={<LinkOutlined />} onClick={() => message.info(t('stores.oauthMock'))}>
                    {t('stores.oauthConnect', { platform: platform === 'shopify' ? 'Shopify' : 'Amazon' })}
                  </Button>
                  <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>{t('stores.oauthMockNote')}</Typography.Paragraph>
                </div>
              )}
            </Card>

            {/* 步骤4：授权服务 */}
            <Card title={<><ApiOutlined style={{ marginRight: 8 }} />授权服务</>} style={{ marginBottom: 16 }}>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                选择需要为「{form.getFieldValue('name') || '新店铺'}」授权的平台服务，后续可在店铺设置中随时调整。
              </Typography.Paragraph>
              <Checkbox.Group
                style={{ width: '100%' }}
                value={selectedServices}
                onChange={v => setSelectedServices(v as string[])}
              >
                <Row gutter={[16, 16]}>
                  {serviceOptions.map(svc => {
                    const names = platformServiceNames[platform]?.[svc.key];
                    return (
                      <Col xs={24} sm={12} key={svc.key}>
                        <Card
                          size="small"
                          hoverable
                          style={{
                            borderLeft: `4px solid ${svc.color}`,
                            background: selectedServices.includes(svc.key) ? `${svc.color}08` : '#fff',
                          }}
                        >
                          <Checkbox value={svc.key}>
                            <div>
                              <Space>
                                <span style={{ color: svc.color, fontSize: 16 }}>{svc.icon}</span>
                                <Typography.Text strong style={{ fontSize: 13 }}>{names?.title ?? svc.key}</Typography.Text>
                              </Space>
                              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2, marginLeft: 24 }}>
                                {names?.desc ?? ''}
                              </Typography.Text>
                            </div>
                          </Checkbox>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Checkbox.Group>
            </Card>

            {/* 提交按钮 */}
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/setup')}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={createStore.isPending} size="large">
                {t('stores.create')}
              </Button>
            </Space>
          </Form>
        )}
      </div>
    );
  }

  const serviceTypeIcons: Record<string, JSX.Element> = {
    store_backend: <ShopOutlined />,
    advertising: <ThunderboltOutlined />,
    customer_service: <CustomerServiceOutlined />,
    logistics: <ShoppingCartOutlined />,
    finance: <WalletOutlined />,
    other: <ApiOutlined />
  };

  const connectionColumns: ColumnsType<StoreConnection> = [
    {
      title: t('stores.serviceName'),
      dataIndex: 'serviceName',
      render: (name: string, record) => (
        <Space>
          {serviceTypeIcons[record.serviceType] ?? <ApiOutlined />}
          <Typography.Text>{name}</Typography.Text>
        </Space>
      )
    },
    {
      title: t('stores.serviceType'),
      dataIndex: 'serviceType',
      render: (type: StoreServiceType) => (
        <Tag>{t(`stores.service_${type}`)}</Tag>
      )
    },
    {
      title: t('stores.authMethod'),
      dataIndex: 'authMethod',
      render: (method: Store['authMethod']) => {
        const labels: Record<string, string> = { credentials: t('stores.authCredentials'), api_key: t('stores.authApiKey'), oauth: t('stores.authOauth') };
        return <Tag>{labels[method] ?? method}</Tag>;
      }
    },
    {
      title: t('stores.status'),
      dataIndex: 'status',
      render: (status: string) => <StatusBadge value={status as Store['status']} />
    },
    {
      title: t('stores.lastVerified'),
      dataIndex: 'lastVerifiedAt',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  const settingsTab = (
    <>
      {/* 店铺主体授权 */}
      <DescriptionPanel
        title={<><LinkOutlined /> {t('stores.primaryAuth')}</>}
        spacing="bottom"
        items={[
          { label: t('stores.platform'), value: store?.platform },
          {
            label: t('stores.authMethod'),
            value: (
              <Tag color={store?.authMethod === 'credentials' ? 'orange' : store?.authMethod === 'api_key' ? 'green' : 'purple'}>
                {store?.authMethod === 'credentials' ? t('stores.authCredentials') : store?.authMethod === 'api_key' ? t('stores.authApiKey') : t('stores.authOauth')}
              </Tag>
            ),
          },
          { label: t('stores.status'), value: store ? <StatusBadge value={store.status} /> : null },
          ...(store?.apiKey ? [{ label: 'API Key', value: <Typography.Text code>{store.apiKey}</Typography.Text> }] : []),
          ...(store?.account ? [{ label: t('stores.account'), value: store.account }] : []),
          ...(store?.region ? [{ label: t('stores.region'), value: store.region }] : []),
          ...(store?.currency ? [{ label: t('stores.currency'), value: store.currency }] : []),
        ]}
      />

      {/* 服务授权 */}
      <Card
        title={<><ApiOutlined /> {t('stores.serviceAuth')} ({store?.connections?.length ?? 0})</>}
        extra={<Button icon={<PlusOutlined />} onClick={() => setConnectionModalOpen(true)}>{t('stores.addService')}</Button>}
        style={{ marginBottom: 16 }}
      >
        {(!store?.connections || store.connections.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
            <Typography.Paragraph type="secondary">{t('stores.noConnections')}</Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>{t('stores.noConnectionsHint')}</Typography.Paragraph>
          </div>
        ) : (
          <Table rowKey="id" columns={connectionColumns} dataSource={store.connections} pagination={false} size="small" />
        )}
      </Card>

      {/* 添加服务弹窗 */}
      <Modal
        title={t('stores.addService')}
        open={connectionModalOpen}
        onOk={() => connectionForm.submit()}
        onCancel={() => { setConnectionModalOpen(false); connectionForm.resetFields(); }}
        confirmLoading={addConnectionMutation.isPending}
      >
        <Form form={connectionForm} layout="vertical" onFinish={(values) => addConnectionMutation.mutate(values)} initialValues={{ serviceType: 'advertising', authMethod: 'credentials' }}>
          <Form.Item label={t('stores.serviceName')} name="serviceName" rules={[{ required: true }]}><Input placeholder={t('stores.serviceNamePlaceholder')} /></Form.Item>
          <Form.Item label={t('stores.serviceType')} name="serviceType" rules={[{ required: true }]}>
            <Select options={[
              { value: 'advertising', label: <><ThunderboltOutlined /> {t('stores.service_advertising')}</> },
              { value: 'customer_service', label: <><CustomerServiceOutlined /> {t('stores.service_customer_service')}</> },
              { value: 'logistics', label: <><ShoppingCartOutlined /> {t('stores.service_logistics')}</> },
              { value: 'finance', label: <><WalletOutlined /> {t('stores.service_finance')}</> },
              { value: 'other', label: <><ApiOutlined /> {t('stores.service_other')}</> }
            ]} />
          </Form.Item>
          <Form.Item label={t('stores.authMethod')} name="authMethod" rules={[{ required: true }]}>
            <Select options={[
              { value: 'credentials', label: t('stores.authCredentials') },
              { value: 'api_key', label: t('stores.authApiKey') }
            ]} />
          </Form.Item>
          <Form.Item label={t('stores.account')} name="account"><Input placeholder="seller@example.com" /></Form.Item>
          <Form.Item label="API Key" name="apiKey"><Input placeholder="shpat_xxxxxxxxxxxx" /></Form.Item>
        </Form>
      </Modal>
    </>
  );

  return (
    <div className="page-stack">
      <PageHeader
        title={store?.name ?? t('stores.detailTitle')}
        description={t('stores.detailDescription')}
        actions={
          <Button danger icon={<StopOutlined />} onClick={() => revokeMutation.mutate()} disabled={store?.status === 'revoked'}>
            {t('stores.revoke')}
          </Button>
        }
      />
      {settingsTab}
    </div>
  );
}
