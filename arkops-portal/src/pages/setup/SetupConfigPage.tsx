import {
  CheckCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SaveOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Checkbox, Col, Collapse, Empty, InputNumber, message, Row, Select, Space, Steps, Switch, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { SERVICE_ICONS, getSessionHealthColor, renderSessionTag } from '../../utils/storeDisplay';
import type { AgentType, Store } from '../../types/domain';

// 场景 → Agent 映射
const scenarioAgentMap: Record<string, AgentType[]> = {
  product: ['product_launch', 'pricing_strategy', 'creative_factory', 'competitor_intel', 'inventory_alert'],
  traffic: ['ads_optimizer', 'live_stream_ops'],
  customer: ['crm_retention', 'review_manager', 'customer_service'],
  aftersales: ['after_sales', 'finance_audit'],
  risk: ['risk_control'],
};

const scenarioMeta: Record<string, { icon: React.ReactNode; title: string; desc: string; color: string }> = {
  product: { icon: <ShoppingCartOutlined />, title: '商品全托管', desc: '上架 · 定价 · 素材 · 情报 · 库存', color: '#2563eb' },
  traffic: { icon: <ThunderboltOutlined />, title: '流量全托管', desc: '广告投放 · 直播运营', color: '#16a34a' },
  customer: { icon: <SmileOutlined />, title: '客户全托管', desc: 'CRM · 评价 · 客服', color: '#7c3aed' },
  aftersales: { icon: <SafetyCertificateOutlined />, title: '售后全托管', desc: '退货处理 · 财务对账', color: '#ea580c' },
  risk: { icon: <SafetyOutlined />, title: '安全风控', desc: '合规 · 熔断', color: '#dc2626' },
};

export function SetupConfigPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // ===== 店铺数据 =====
  const { data: storesData = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(),
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // ===== Agent 数据 =====
  const { data: allAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  });

  // 计算已开通的场景（全局 Agent 启用状态）
  const enabledScenariosGlobal = useMemo(() => {
    const enabledAgentTypes = new Set(allAgents.filter(a => a.enabled).map(a => a.agentType));
    return Object.entries(scenarioAgentMap)
      .filter(([, agents]) => agents.some(at => enabledAgentTypes.has(at)))
      .map(([key]) => key);
  }, [allAgents]);

  // 当前选中店铺（点击行展开配置，再点收起）
  const activeStoreId = selectedStoreId;

  // ===== 按店铺的配置状态 =====
  const [storeConfigs, setStoreConfigs] = useState<Record<string, {
    pricingMode: string; margin: number; adBudget: number;
    couponCap: number; autoRefund: number; stockAlert: number; autoReplenish: boolean;
  }>>({});
  const [storeScenarios, setStoreScenarios] = useState<Record<string, string[]>>({});

  // 当前店铺的配置与场景
  const currentConfig = storeConfigs[activeStoreId] ?? {
    pricingMode: 'market', margin: 30, adBudget: 500,
    couponCap: 20, autoRefund: 20, stockAlert: 50, autoReplenish: true,
  };
  const selectedScenarios = storeScenarios[activeStoreId] ?? (() => {
    // 首次打开：用全局已开通场景初始化
    const init = [...enabledScenariosGlobal];
    setStoreScenarios(prev => ({ ...prev, [activeStoreId]: init }));
    return init;
  })();

  const setCurrentConfig = (patch: Partial<typeof currentConfig>) =>
    setStoreConfigs(prev => ({ ...prev, [activeStoreId]: { ...currentConfig, ...patch } }));
  const setSelectedScenarios = (v: string[]) =>
    setStoreScenarios(prev => ({ ...prev, [activeStoreId]: v }));

  // 保存
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 开通 Agent（当前店铺选中场景）
      const agentsToEnable = selectedScenarios.flatMap(s => scenarioAgentMap[s] ?? []);
      if (agentsToEnable.length > 0) {
        await agentsApi.batchEnable(agentsToEnable);
      }
      await new Promise(r => setTimeout(r, 300));
    },
    onSuccess: () => {
      const storeName = storesData.find(s => String(s.id) === activeStoreId)?.name ?? activeStoreId;
      message.success(`「${storeName}」配置已保存，Agent 已开通`);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setSelectedStoreId('');
    },
  });

  const activeStore = storesData.find(s => String(s.id) === activeStoreId);
  const storeConnections = activeStore?.connections ?? [];

  // 计算将开通的 Agent 数量
  const newAgentCount = useMemo(() => {
    const enabledAgentTypes = new Set(allAgents.filter(a => a.enabled).map(a => a.agentType));
    const toEnable = selectedScenarios.flatMap(s => scenarioAgentMap[s] ?? []);
    return toEnable.filter(at => !enabledAgentTypes.has(at)).length;
  }, [allAgents, selectedScenarios]);

  return (
    <div className="page-stack">
      <PageHeader
        title={t('setup.configTitle')}
        description={t('setup.quickSetupDesc')}
      />

      {/* ===== Step 引导 ===== */}
      <Steps
        size="small"
        current={activeStoreId ? 1 : 0}
        style={{ marginBottom: 24 }}
        items={[
          { title: t('setup.step0'), description: t('setup.scenarioDesc') },
          { title: t('setup.step1'), description: '选择店铺并配置运营参数' },
          { title: '开始运营', description: '保存配置后 Agent 即可自动运行', icon: <CheckCircleOutlined /> },
        ]}
      />

      {/* ===== 全局：开通 Agent 场景 ===== */}
      <Card
        title={<><RobotOutlined style={{ marginRight: 8, color: '#7c3aed' }} />开通 Agent 场景</>}
        style={{ marginBottom: 16, borderLeft: '3px solid #7c3aed' }}
        extra={
          <Link to="/agents">
            <Button size="small">{t('setup.toAgentCenter')}</Button>
          </Link>
        }
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
          选择你希望 AI 自动处理的运营场景，系统将自动开通对应的 Agent。
          <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>全局适用 · 对所有店铺生效</Tag>
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginBottom: 16 }}>
          店铺保活 Agent 已默认开启。运营参数（如定价策略、补货阈值、广告预算）请选择店铺后在下方按店铺配置。
        </Typography.Paragraph>
        <Checkbox.Group
          style={{ width: '100%' }}
          value={selectedScenarios}
          onChange={v => setSelectedScenarios(v as string[])}
        >
          <Row gutter={[16, 16]}>
            {Object.entries(scenarioMeta).map(([key, meta]) => {
              const agentCount = scenarioAgentMap[key]?.length ?? 0;
              const allEnabled = scenarioAgentMap[key]?.every(at => allAgents.find(a => a.agentType === at)?.enabled) ?? false;
              return (
                <Col xs={24} sm={12} md={key === 'risk' ? 24 : 12} key={key}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      borderLeft: `4px solid ${meta.color}`,
                      background: selectedScenarios.includes(key) ? `${meta.color}08` : '#fff',
                    }}
                  >
                    <Checkbox value={key}>
                      <div>
                        <Space>
                          <span style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
                          <Typography.Text strong style={{ fontSize: 13 }}>{meta.title}</Typography.Text>
                          {allEnabled && <Tag color="green" style={{ fontSize: 10, marginLeft: 4 }}>已开通</Tag>}
                        </Space>
                        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2, marginLeft: 24 }}>
                          {meta.desc} · {agentCount} 个 Agent
                        </Typography.Text>
                      </div>
                    </Checkbox>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Checkbox.Group>
        {newAgentCount > 0 && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <Typography.Text style={{ fontSize: 12 }}>
              <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 4 }} />
              将新开通 {newAgentCount} 个 Agent，保存后即可开始自动运营。
            </Typography.Text>
          </div>
        )}
      </Card>

      {/* ===== 卡片 1：店铺管理 ===== */}
      <Card
        title={<><ShopOutlined style={{ marginRight: 8 }} />{t('setup.storeManagement')}</>}
        style={{ marginBottom: 16 }}
        extra={
          <Link to="/stores/new">
            <Button type="primary" size="small" icon={<PlusOutlined />}>新增店铺</Button>
          </Link>
        }
      >
        {storesData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="尚未连接任何店铺"
          >
            <Link to="/stores/new">
              <Button type="primary" icon={<PlusOutlined />}>连接我的店铺</Button>
            </Link>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            dataSource={storesData}
            pagination={false}
            size="small"
            rowClassName={(record) => String(record.id) === activeStoreId ? 'ant-table-row-selected' : ''}
              onRow={(record) => ({
                onClick: () => setSelectedStoreId(String(record.id) === activeStoreId ? '' : String(record.id)),
                style: { cursor: 'pointer' },
              })}
            columns={[
              { title: '店铺名称', dataIndex: 'name', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
              { title: '所属平台', dataIndex: 'platform', width: 120 },
              {
                title: '授权方式', dataIndex: 'authMethod', width: 100,
                render: (v: string) => {
                  const labelMap: Record<string, string> = { password: '账号密码', api_key: 'API Key', oauth: 'OAuth' };
                  return <Tag>{labelMap[v] ?? v}</Tag>;
                }
              },
              {
                title: <><WifiOutlined /> 会话状态</>, dataIndex: 'status', width: 110,
                render: (_status: string, record: Store) => (
                  <Space size={4}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: getSessionHealthColor(record.status) === 'green' ? '#16a34a' : getSessionHealthColor(record.status) === 'red' ? '#dc2626' : getSessionHealthColor(record.status) === 'orange' ? '#ea580c' : '#94a3b8',
                      flexShrink: 0
                    }} />
                    {renderSessionTag(record.status)}
                  </Space>
                )
              },
              {
                title: '开通服务', dataIndex: 'connections',
                render: (connections: Store['connections']) => {
                  if (!connections || connections.length === 0) return <Typography.Text type="secondary">-</Typography.Text>;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {connections.map((c) => (
                        <Tag key={c.id} icon={SERVICE_ICONS[c.serviceType] ?? SERVICE_ICONS.other}>
                          {c.serviceName}
                        </Tag>
                      ))}
                    </div>
                  );
                }
              },
            ]}
          />
        )}
      </Card>

      {/* ===== 配置区域 ===== */}
      {activeStoreId && storesData.length > 0 && (
        <Card
          title={
            <Space>
              <SettingOutlined style={{ color: '#2563eb' }} />
              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                {storesData.find(s => String(s.id) === activeStoreId)?.name ?? ''} · 运营参数
              </span>
            </Space>
          }
          style={{ marginBottom: 16, borderTop: '3px solid #2563eb' }}
        >
          <Card
            title={<><ApiOutlined style={{ marginRight: 8 }} />授权服务</>}
            style={{ marginBottom: 16 }}
            extra={
              <Link to={`/stores/${activeStoreId}`}>
                <Button size="small">店铺设置 →</Button>
              </Link>
            }
          >
            {storeConnections.length === 0 ? (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                尚未授权任何服务，请前往
                <Link to={`/stores/${activeStoreId}`}> 店铺设置 </Link>
                为店铺绑定平台子服务（如广告、客服、物流等）。
              </Typography.Text>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {storeConnections.map((c) => (
                  <Tag key={c.id} icon={SERVICE_ICONS[c.serviceType] ?? SERVICE_ICONS.other} style={{ fontSize: 12, padding: '4px 10px' }}>
                    {c.serviceName}
                  </Tag>
                ))}
                <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  在<Link to={`/stores/${activeStoreId}`}>店铺设置</Link>中管理
                </Typography.Text>
              </div>
            )}
          </Card>

          {/* ===== 卡片 3：运营参数配置（按店铺）===== */}
          <Card
            title={<><SettingOutlined style={{ marginRight: 8 }} />运营参数配置</>}
            extra={
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('setup.detailInAgentCenter')} <Link to="/agents">{t('setup.agentCenter')}</Link> {t('setup.adjustIndividually')}
              </Typography.Text>
            }
          >
            <Collapse
              defaultActiveKey={['pricing', 'ads', 'customer']}
              items={[
                {
                  key: 'pricing',
                  label: <><ShoppingCartOutlined style={{ marginRight: 8 }} />{t('setup.pricingConfig')}</>,
                  children: (
                    <Row gutter={[32, 16]}>
                      <Col span={12}>
                        <Typography.Text type="secondary">{t('setup.pricingMode')}</Typography.Text>
                        <Select value={currentConfig.pricingMode} onChange={v => setCurrentConfig({ pricingMode: v })} style={{ width: '100%' }}
                          options={[
                            { value: 'market', label: '市场跟价' },
                            { value: 'cost', label: '成本加成' },
                            { value: 'manual', label: '手动定价' },
                          ]}
                        />
                      </Col>
                      <Col span={12}>
                        <Typography.Text type="secondary">{t('setup.targetMargin')}</Typography.Text>
                        <InputNumber min={5} max={80} value={currentConfig.margin} onChange={v => setCurrentConfig({ margin: v ?? 30 })} suffix="%" style={{ width: '100%' }} />
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'ads',
                  label: <><ThunderboltOutlined style={{ marginRight: 8 }} />{t('setup.adsConfig')}</>,
                  children: (
                    <Row gutter={[32, 16]}>
                      <Col span={12}>
                        <Typography.Text type="secondary">日预算上限</Typography.Text>
                        <InputNumber min={0} step={50} value={currentConfig.adBudget} onChange={v => setCurrentConfig({ adBudget: v ?? 500 })} prefix="$" style={{ width: '100%' }} />
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'customer',
                  label: <><SmileOutlined style={{ marginRight: 8 }} />{t('setup.customerConfig')}</>,
                  children: (
                    <Row gutter={[32, 16]}>
                      <Col span={12}>
                        <Typography.Text type="secondary">优惠券折扣上限</Typography.Text>
                        <InputNumber min={0} max={100} value={currentConfig.couponCap} onChange={v => setCurrentConfig({ couponCap: v ?? 20 })} suffix="%" style={{ width: '100%' }} />
                      </Col>
                      <Col span={12}>
                        <Typography.Text type="secondary">自动退款上限</Typography.Text>
                        <InputNumber min={0} value={currentConfig.autoRefund} onChange={v => setCurrentConfig({ autoRefund: v ?? 20 })} prefix="$" style={{ width: '100%' }} />
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'inventory',
                  label: <><ShopOutlined style={{ marginRight: 8 }} />库存与补货</>,
                  children: (
                    <Row gutter={[32, 16]}>
                      <Col span={12}>
                        <Typography.Text type="secondary">低库存告警阈值</Typography.Text>
                        <InputNumber min={0} value={currentConfig.stockAlert} onChange={v => setCurrentConfig({ stockAlert: v ?? 50 })} suffix="件" style={{ width: '100%' }} />
                      </Col>
                      <Col span={12}>
                        <Typography.Text type="secondary">自动补货</Typography.Text>
                        <br />
                        <Switch checked={currentConfig.autoReplenish} onChange={v => setCurrentConfig({ autoReplenish: v })} />
                      </Col>
                    </Row>
                  )
                },
              ]}
            />
          </Card>
        </Card>
      )}

      {/* ===== 保存按钮 ===== */}
      {activeStoreId && storesData.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            保存配置
          </Button>
        </div>
      )}
    </div>
  );
}
