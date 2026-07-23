import {
  ApiOutlined,
  CustomerServiceOutlined,
  LineChartOutlined,
  LinkOutlined,
  PayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  StopOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Checkbox, Col, Form, Input, Modal, Progress, Row, Select, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storeBusinessApi } from '../../api/storeBusiness';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { TrendBarChart } from '../../components/charts/TrendBarChart';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { DetailSection } from '../../components/detail/DetailSection';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { AllMallId, Store, StoreConnection, StoreServiceType } from '../../types/domain';
import { parseAllMallId } from '../../utils/id';
import { getPlatformName } from '../../utils/storeDisplay';

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
    onSuccess: (created) => {
      message.success(t('common.operationSuccess'));
      navigate(`/stores/${created.id}`);
    }
  });
  const revokeMutation = useMutation({
    mutationFn: () => storesApi.updateStatus(parsedStoreId!, 'revoked'),
    onSuccess: () => {
      message.success(t('common.operationSuccess'));
      queryClient.invalidateQueries({ queryKey: ['store', parsedStoreId] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    }
  });
  // A8: re-authorize path out of the revoked state.
  const reauthorizeMutation = useMutation({
    mutationFn: () => storesApi.updateStatus(parsedStoreId!, 'connected'),
    onSuccess: () => {
      message.success(t('storewizard.reauthorized'));
      queryClient.invalidateQueries({ queryKey: ['store', parsedStoreId] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    }
  });
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
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
  const [platform, setPlatform] = useState<string>('pinduoduo');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // 各平台授权服务名称映射（运营后台 / 投流 / 客服 / 物流 / 财务）
  const platformServiceNames: Record<string, Record<string, { title: string; desc: string }>> = {
    pinduoduo: {
      advertising: { title: '多多搜索 / 全站推广', desc: '拼多多广告投放平台' },
      customer_service: { title: '多多客服', desc: '拼多多买家消息' },
      logistics: { title: '拼多多物流', desc: '拼多多物流发货' },
      finance: { title: '对账中心', desc: '拼多多商家后台对账结算' },
    },
    taobao: {
      advertising: { title: '直通车 / 万相台', desc: '淘宝广告投放平台' },
      customer_service: { title: '千牛客服', desc: '千牛客服接待' },
      logistics: { title: '菜鸟物流', desc: '菜鸟物流发货' },
      finance: { title: '支付宝商家中心', desc: '支付宝收款与结算' },
    },
    jd: {
      advertising: { title: '京准通', desc: '京东广告投放平台' },
      customer_service: { title: '咚咚', desc: '咚咚客服系统' },
      logistics: { title: '京东物流', desc: '京东物流配送' },
      finance: { title: '京麦财务', desc: '京东商家财务结算' },
    },
  };

  const serviceOptions = [
    { key: 'advertising', icon: <ThunderboltOutlined />, color: 'var(--ark-blue)' },
    { key: 'customer_service', icon: <CustomerServiceOutlined />, color: 'var(--ark-green)' },
    { key: 'logistics', icon: <ShoppingCartOutlined />, color: 'var(--ark-orange)' },
    { key: 'finance', icon: <WalletOutlined />, color: 'var(--ark-purple)' },
  ];

  // 平台 → 地区和币种映射
  const platformDefaults: Record<string, { region: string; currency: string }> = {
    pinduoduo: { region: 'CN', currency: 'CNY' },
    jd: { region: 'CN', currency: 'CNY' },
    taobao: { region: 'CN', currency: 'CNY' },
  };

  if (mode === 'new') {
    const authMethods: { value: Store['authMethod']; label: string; desc: string; platforms: string[] }[] = [
      { value: 'credentials', label: t('stores.authCredentials'), desc: t('stores.authCredentialsDesc'), platforms: ['pinduoduo', 'taobao', 'jd'] },
      { value: 'api_key', label: t('stores.authApiKey'), desc: t('stores.authApiKeyDesc'), platforms: ['jd', 'taobao'] },
      { value: 'oauth', label: t('stores.authOauth'), desc: t('stores.authOauthDesc'), platforms: ['jd', 'taobao'] }
    ];

    return (
      <div className="page-stack">
        {/* A2: breadcrumb/back both lead to /stores (was /setup); A3: this legacy
            form is now the "advanced" branch behind the guided wizard. */}
        <PageHeader
          title={t('storewizard.advancedTitle')}
          description={t('storewizard.advancedDescription')}
          breadcrumb={[
            { title: t('stores.title'), href: '/stores' },
            { title: t('storewizard.advancedTitle') }
          ]}
          onBack={() => navigate('/stores')}
        />
        <Alert
          type="info"
          showIcon
          message={t('storewizard.advancedBanner')}
          action={
            <Button size="small" type="primary" onClick={() => navigate('/stores/onboarding?journey=import')}>
              {t('storewizard.backToWizard')}
            </Button>
          }
          style={{ marginBottom: 16 }}
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
                { value: 'pinduoduo', label: '拼多多' }, { value: 'taobao', label: '淘宝' },
                { value: 'jd', label: '京东' }
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
                  style={{ border: authMethod === m.value ? '2px solid var(--ark-blue)' : '1px solid var(--ark-border)', cursor: 'pointer' }}
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
              <Typography.Title level={5} style={{ marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--ark-border-soft)' }}>
                <LinkOutlined style={{ marginRight: 8 }} />{t('stores.primaryAuth')}
              </Typography.Title>

              {authMethod === 'credentials' && (
                <>
                  {/* A3: no raw password collection — login is authorized via the
                      platform's official QR flow after the record is created. */}
                  <div style={{ padding: 16, background: 'color-mix(in srgb, var(--ark-blue) 6%, var(--ark-panel))', borderRadius: 8, marginBottom: 16 }}>
                    <Typography.Text>{t('storewizard.credentialsSafeNote')}</Typography.Text>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}><Form.Item label={t('stores.account')} name="account" rules={[{ required: true }]}><Input placeholder="seller@example.com" /></Form.Item></Col>
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
                  <Col xs={24} sm={12}><Form.Item label={t('stores.apiKeyLabel')} name="apiKey" rules={[{ required: true }]}><Input placeholder={t('storewizard.apiKeyPlaceholder')} /></Form.Item></Col>
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
                    {t('stores.oauthConnect', { platform: platform === 'jd' ? '京东' : '淘宝' })}
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
                            background: selectedServices.includes(svc.key)
                              ? `color-mix(in srgb, ${svc.color} 6%, var(--ark-panel))`
                              : 'var(--ark-panel)',
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
              <Button onClick={() => navigate('/stores')}>
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
          { label: t('stores.platform'), value: store ? getPlatformName(store.platform) : undefined },
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
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--ark-muted)' }}>
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
          <Form.Item label="API Key" name="apiKey"><Input placeholder={t('storewizard.apiKeyPlaceholder')} /></Form.Item>
        </Form>
      </Modal>
    </>
  );

  return (
    <div className="page-stack">
      <PageHeader
        title={store?.name ?? t('stores.detailTitle')}
        description={t('stores.detailDescription')}
        breadcrumb={[
          { title: t('stores.title'), href: '/stores' },
          { title: store?.name ?? t('stores.detailTitle') }
        ]}
        onBack={() => navigate('/stores')}
        actions={
          <Button danger icon={<StopOutlined />} disabled={store?.status === 'revoked'} onClick={() => setRevokeModalOpen(true)}>
            {t('stores.revoke')}
          </Button>
        }
      />
      {/* A8: dedicated revoke confirmation spelling out the consequences (2.12). */}
      <Modal
        title={t('storewizard.revokeTitle')}
        open={revokeModalOpen}
        okText={t('storewizard.revokeConfirm')}
        okButtonProps={{ danger: true, loading: revokeMutation.isPending }}
        cancelText={t('common.cancel')}
        onOk={() => {
          revokeMutation.mutate(undefined, { onSuccess: () => setRevokeModalOpen(false) });
        }}
        onCancel={() => setRevokeModalOpen(false)}
      >
        <Typography.Paragraph>{t('storewizard.revokeIntro')}</Typography.Paragraph>
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
          <li><Typography.Text>{t('storewizard.revokeItem1')}</Typography.Text></li>
          <li><Typography.Text>{t('storewizard.revokeItem2')}</Typography.Text></li>
          <li><Typography.Text>{t('storewizard.revokeItem3')}</Typography.Text></li>
        </ul>
      </Modal>
      {/* A8: revoked state offers an explicit way back (re-authorize CTA). */}
      {store?.status === 'revoked' && (
        <Alert
          type="warning"
          showIcon
          message={t('storewizard.revokedAlertTitle')}
          description={t('storewizard.revokedAlertDesc')}
          action={
            <Button type="primary" loading={reauthorizeMutation.isPending} onClick={() => reauthorizeMutation.mutate()}>
              {t('storewizard.reauthorize')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      {/* Item 4: login_required/expired previously had no recovery action on this
          page at all (only revoked did) — a dead end for the most common operational
          issue. Reuses the same reauthorizeMutation with relogin-specific copy. */}
      {(store?.status === 'login_required' || store?.status === 'expired') && (
        <Alert
          type="warning"
          showIcon
          message={t('storewizard.reloginAlertTitle')}
          description={t('storewizard.reloginAlertDesc')}
          action={
            <Button type="primary" loading={reauthorizeMutation.isPending} onClick={() => reauthorizeMutation.mutate()}>
              {t('stores.reloginNow')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <Tabs
        defaultActiveKey="overview"
        items={[
          { key: 'overview', label: t('storedetail.overviewTab'), children: <StoreBusinessOverview storeId={parsedStoreId} /> },
          { key: 'settings', label: t('stores.settings'), children: settingsTab },
        ]}
      />
    </div>
  );
}

/**
 * Item 1: store detail "Business Overview" tab, built entirely from the existing
 * `storeBusinessApi` mock data (GMV/orders trend, ad metrics, after-sales, inventory,
 * top products) that was fully modeled but unused until now.
 */
function StoreBusinessOverview({ storeId }: { storeId: AllMallId | undefined }) {
  const { t } = useI18n();
  const { data: detail, isLoading } = useQuery({
    queryKey: ['storeBusiness', storeId],
    queryFn: () => storeBusinessApi.getDetail(storeId!),
    enabled: storeId !== undefined,
  });

  if (isLoading || !detail) {
    return <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>;
  }

  const gmvChange = detail.gmv.yesterday > 0 ? ((detail.gmv.today - detail.gmv.yesterday) / detail.gmv.yesterday) * 100 : 0;
  const ordersChange = detail.orders.yesterday > 0 ? ((detail.orders.today - detail.orders.yesterday) / detail.orders.yesterday) * 100 : 0;
  const rankColors = ['gold', 'default', 'orange'];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <MetricCard
            className="stat-card stat-card-primary"
            title={t('stores.todayGmv')}
            value={detail.gmv.today}
            prefix="¥"
            overlayIcon={<PayCircleOutlined />}
            helper={
              <Typography.Text type={gmvChange >= 0 ? 'success' : 'danger'}>
                {gmvChange >= 0 ? '↑' : '↓'} {t('storedetail.vsYesterday', { value: Math.abs(gmvChange).toFixed(1) })}
              </Typography.Text>
            }
          />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard
            className="stat-card stat-card-success"
            title={t('stores.todayOrders')}
            value={detail.orders.today}
            overlayIcon={<ShoppingCartOutlined />}
            helper={
              <Typography.Text type={ordersChange >= 0 ? 'success' : 'danger'}>
                {ordersChange >= 0 ? '↑' : '↓'} {t('storedetail.vsYesterday', { value: Math.abs(ordersChange).toFixed(1) })}
              </Typography.Text>
            }
          />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard
            className="stat-card stat-card-purple"
            title={t('storedetail.aov')}
            value={detail.aov}
            prefix="¥"
            precision={1}
            overlayIcon={<WalletOutlined />}
          />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard
            className="stat-card stat-card-warning"
            title={t('storedetail.storeRating')}
            value={detail.afterSales.storeRating}
            precision={1}
            suffix="/5"
            overlayIcon={<StarOutlined />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <DetailSection title={<><LineChartOutlined /> {t('storedetail.trendTitle')}</>}>
            <TrendBarChart
              ariaLabel={t('storedetail.trendTitle')}
              points={detail.gmv.trend.map((point, i) => ({
                key: point.date,
                label: point.date,
                valueLabel: `¥${point.value.toLocaleString()}`,
                bars: [
                  { value: point.value, title: `GMV: ¥${point.value.toLocaleString()}`, className: 'trend-bar-gmv', minHeight: 10 },
                  {
                    value: detail.orders.trend[i]?.value ?? 0,
                    title: `${t('stores.todayOrders')}: ${detail.orders.trend[i]?.value ?? 0}`,
                    className: 'trend-bar-orders',
                    minHeight: 6,
                  },
                ],
              }))}
            />
            <div className="chart-legend">
              <span><i className="legend-dot legend-gmv" />GMV</span>
              <span><i className="legend-dot legend-orders" />{t('stores.todayOrders')}</span>
            </div>
          </DetailSection>
        </Col>
        <Col xs={24} lg={10}>
          <DetailSection title={<><ThunderboltOutlined /> {t('storedetail.adPanel')}</>}>
            <Row gutter={12} style={{ marginBottom: 12 }}>
              <Col span={12}><Statistic title={t('storedetail.adSpendToday')} value={detail.adMetrics.todaySpend} prefix="¥" /></Col>
              <Col span={12}><Statistic title={t('storedetail.adRoas')} value={detail.adMetrics.roas} precision={2} suffix="×" /></Col>
              <Col span={12}><Statistic title={t('storedetail.adCpc')} value={detail.adMetrics.cpc} prefix="¥" precision={2} /></Col>
              <Col span={12}><Statistic title={t('storedetail.adCtr')} value={detail.adMetrics.ctr} suffix="%" precision={1} /></Col>
            </Row>
            <Progress
              percent={Math.min(100, Math.round((detail.adMetrics.todaySpend / detail.adMetrics.budgetLimit) * 100))}
              size="small"
              format={(p) => `${p}% ${t('storedetail.adBudgetUsage')}`}
            />
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 4 }}>
              {t('storedetail.campaigns')}
            </Typography.Paragraph>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {detail.adMetrics.campaigns.map((c) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <Typography.Text ellipsis style={{ maxWidth: 150 }}>{c.name}</Typography.Text>
                  <Space size={8}>
                    <Typography.Text type="secondary">¥{c.spend}</Typography.Text>
                    <Tag color={c.status === 'active' ? 'green' : c.status === 'warning' ? 'orange' : 'default'}>{c.roi.toFixed(1)}×</Tag>
                  </Space>
                </div>
              ))}
            </Space>
          </DetailSection>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <DescriptionPanel
            title={<><CustomerServiceOutlined /> {t('storedetail.afterSalesPanel')}</>}
            items={[
              { label: t('storedetail.returnRate'), value: `${detail.afterSales.returnRate}%` },
              { label: t('storedetail.returnAmount'), value: `¥${detail.afterSales.returnAmount.toLocaleString()}` },
              { label: t('storedetail.negativeReviews'), value: detail.afterSales.negativeReviews },
              { label: t('storedetail.unresolvedReviews'), value: detail.afterSales.unresolvedReviews },
              { label: t('storedetail.disputes'), value: `${detail.afterSales.disputes.pending} / ${detail.afterSales.disputes.processing}` },
            ]}
          />
        </Col>
        <Col xs={24} lg={12}>
          <DetailSection title={<><WarningOutlined /> {t('storedetail.inventoryPanel')}</>}>
            <Row gutter={12} style={{ marginBottom: detail.inventory.lowStockItems.length ? 12 : 0 }}>
              <Col span={6}><Statistic title={t('storedetail.totalSkus')} value={detail.inventory.totalSkus} /></Col>
              <Col span={6}><Statistic title={t('storedetail.lowStock')} value={detail.inventory.lowStockCount} valueStyle={{ color: 'var(--ark-orange)' }} /></Col>
              <Col span={6}><Statistic title={t('storedetail.outOfStock')} value={detail.inventory.outOfStockCount} valueStyle={{ color: 'var(--ark-red)' }} /></Col>
              <Col span={6}><Statistic title={t('storedetail.slowMoving')} value={detail.inventory.slowMovingCount} /></Col>
            </Row>
            {detail.inventory.lowStockItems.length > 0 && (
              <Table
                size="small"
                pagination={false}
                rowKey="sku"
                dataSource={detail.inventory.lowStockItems}
                columns={[
                  { title: t('storedetail.lowStockSku'), dataIndex: 'sku', width: 110 },
                  { title: t('storedetail.lowStockName'), dataIndex: 'name' },
                  { title: t('storedetail.lowStockStock'), dataIndex: 'stock', width: 70 },
                  { title: t('storedetail.lowStockSafety'), dataIndex: 'safetyStock', width: 90 },
                ]}
              />
            )}
          </DetailSection>
        </Col>
      </Row>

      <DetailSection title={<><TrophyOutlined /> {t('storedetail.topProducts')}</>}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {detail.topProducts.map((product, i) => (
            <div key={product.sku} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag color={rankColors[i] ?? 'default'} style={{ minWidth: 24, textAlign: 'center' }}>{i + 1}</Tag>
              <Typography.Text style={{ flex: 1 }} ellipsis>{product.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{product.orders} {t('storedetail.productOrders')}</Typography.Text>
              <Typography.Text strong>¥{product.gmv.toLocaleString()}</Typography.Text>
            </div>
          ))}
        </Space>
      </DetailSection>
    </>
  );
}
