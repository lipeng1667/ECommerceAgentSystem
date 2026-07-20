import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  CopyOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  LockOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Input,
  InputNumber,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Journey = 'import' | 'migrate';
type PlatformKey = 'pinduoduo' | 'taobao' | 'jd';
type SyncEntityKey = 'products' | 'skus' | 'orders' | 'reviews' | 'inventory';

interface PlatformOption {
  key: PlatformKey;
  name: string;
  short: string;
  color: string;
  soft: string;
  description: string;
}

interface SyncEntity {
  key: SyncEntityKey;
  name: string;
  description: string;
  count: number;
}

interface MigrationPreview {
  key: string;
  name: string;
  sourceCategory: string;
  targetCategory: string;
  sourcePrice: number;
  targetPrice: number;
  confidence: number;
  status: 'ready' | 'needs_input' | 'blocked';
}

const platforms: PlatformOption[] = [
  { key: 'pinduoduo', name: '拼多多', short: '拼', color: '#e02e24', soft: '#fff1f0', description: '拼多多商家后台' },
  { key: 'taobao', name: '淘宝', short: '淘', color: '#ff6a00', soft: '#fff7e6', description: '千牛商家工作台' },
  { key: 'jd', name: '京东', short: '京', color: '#e1251b', soft: '#fff1f0', description: '京麦商家中心' },
];

const syncEntities: SyncEntity[] = [
  { key: 'products', name: '商品', description: '在售、下架商品及图片', count: 1236 },
  { key: 'skus', name: 'SKU 与规格', description: '颜色、尺寸、售价等规格', count: 3852 },
  { key: 'orders', name: '历史订单', description: '默认同步最近 12 个月', count: 28410 },
  { key: 'reviews', name: '商品评价', description: '评分、内容和回复状态', count: 9642 },
  { key: 'inventory', name: '当前库存', description: '各 SKU 的实时库存', count: 3852 },
];

const previewRows: MigrationPreview[] = [
  { key: '1', name: '轻奢通勤真皮托特包', sourceCategory: '女包 › 托特包', targetCategory: '箱包皮具 › 女包 › 托特包', sourcePrice: 129, targetPrice: 139, confidence: 98, status: 'ready' },
  { key: '2', name: '夏季冰丝防晒衬衫', sourceCategory: '女装 › 衬衫', targetCategory: '女装 › 衬衫 › 防晒衫', sourcePrice: 59.9, targetPrice: 65.9, confidence: 96, status: 'ready' },
  { key: '3', name: '儿童积木桌多功能套装', sourceCategory: '玩具 › 积木', targetCategory: '玩具 › 积木拼插 › 积木桌', sourcePrice: 168, targetPrice: 189, confidence: 91, status: 'ready' },
  { key: '4', name: '便携式户外露营灯', sourceCategory: '户外 › 照明', targetCategory: '户外装备 › 户外照明', sourcePrice: 39.9, targetPrice: 45.9, confidence: 76, status: 'needs_input' },
  { key: '5', name: '品牌运动休闲鞋', sourceCategory: '鞋靴 › 运动鞋', targetCategory: '运动鞋 › 休闲运动鞋', sourcePrice: 199, targetPrice: 219, confidence: 42, status: 'blocked' },
];

const importSteps = [
  { title: '选择店铺', description: '告诉我们数据在哪里' },
  { title: '安全连接', description: '授权并检查数据权限' },
  { title: '同步范围', description: '确认需要导入的数据' },
  { title: '智能同步', description: '自动拉取和整理数据' },
  { title: '完成', description: '开始使用经营数据' },
];

const migrationSteps = [
  { title: '选择目标', description: '确定来源和目标店铺' },
  { title: '选择商品', description: '筛选准备迁移的商品' },
  { title: '迁移规则', description: '设置价格、库存与内容' },
  { title: '智能检查', description: '预览平台适配结果' },
  { title: '批量上架', description: '确认后创建商品' },
];

function PlatformCard({ platform, selected, onClick }: { platform: PlatformOption; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`onboarding-platform-card ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="onboarding-platform-logo" style={{ color: platform.color, background: platform.soft }}>{platform.short}</span>
      <span className="onboarding-platform-copy">
        <Typography.Text strong>{platform.name}</Typography.Text>
        <Typography.Text type="secondary">{platform.description}</Typography.Text>
      </span>
      {selected && <CheckCircleFilled className="onboarding-selected-check" />}
    </button>
  );
}

function JourneyChoice({ onSelect }: { onSelect: (journey: Journey) => void }) {
  return (
    <div className="onboarding-choice-grid">
      <button type="button" className="onboarding-journey-card import" onClick={() => onSelect('import')}>
        <span className="onboarding-journey-icon"><CloudDownloadOutlined /></span>
        <span>
          <Tag color="blue">推荐从这里开始</Tag>
          <Typography.Title level={3}>导入我已有的店铺</Typography.Title>
          <Typography.Paragraph type="secondary">
            安全连接拼多多、淘宝或京东，一次性同步商品、订单、评价和库存。
          </Typography.Paragraph>
          <span className="onboarding-card-link">开始导入 <ArrowRightOutlined /></span>
        </span>
      </button>
      <button type="button" className="onboarding-journey-card migrate" onClick={() => onSelect('migrate')}>
        <span className="onboarding-journey-icon"><CopyOutlined /></span>
        <span>
          <Tag color="purple">跨平台经营</Tag>
          <Typography.Title level={3}>复制商品到新平台</Typography.Title>
          <Typography.Paragraph type="secondary">
            把已同步的商品智能转换为其他平台格式，审核后一键批量上架。
          </Typography.Paragraph>
          <span className="onboarding-card-link">开始迁移 <ArrowRightOutlined /></span>
        </span>
      </button>
    </div>
  );
}

export function StoreOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [journey, setJourney] = useState<Journey | null>(() => {
    const requestedJourney = searchParams.get('journey');
    return requestedJourney === 'import' || requestedJourney === 'migrate' ? requestedJourney : null;
  });
  const [step, setStep] = useState(0);
  const [sourcePlatform, setSourcePlatform] = useState<PlatformKey>('pinduoduo');
  const [targetPlatform, setTargetPlatform] = useState<PlatformKey>('taobao');
  const [storeName, setStoreName] = useState('拼多多旗舰店');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<SyncEntityKey[]>(syncEntities.map(item => item.key));
  const [orderRange, setOrderRange] = useState('12_months');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [migrationScope, setMigrationScope] = useState('all_active');
  const [priceMode, setPriceMode] = useState('smart');
  const [priceAdjustment, setPriceAdjustment] = useState(5);
  const [stockMode, setStockMode] = useState('shared');
  const [safeStock, setSafeStock] = useState(5);
  const [optimizeContent, setOptimizeContent] = useState(true);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);

  const source = platforms.find(item => item.key === sourcePlatform)!;
  const target = platforms.find(item => item.key === targetPlatform)!;
  const steps = journey === 'migrate' ? migrationSteps : importSteps;

  useEffect(() => {
    if (!syncing) return;
    const timer = window.setInterval(() => {
      setSyncProgress(current => {
        const next = Math.min(current + (current < 48 ? 8 : current < 84 ? 4 : 2), 100);
        if (next === 100) {
          window.clearInterval(timer);
          setSyncing(false);
        }
        return next;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [syncing]);

  useEffect(() => {
    if (!publishing) return;
    const timer = window.setInterval(() => {
      setPublishProgress(current => {
        const next = Math.min(current + 5, 100);
        if (next === 100) {
          window.clearInterval(timer);
          setPublishing(false);
        }
        return next;
      });
    }, 360);
    return () => window.clearInterval(timer);
  }, [publishing]);

  const overallProgress = journey ? Math.round(((step + 1) / steps.length) * 100) : 0;
  const selectedCount = migrationScope === 'all_active' ? 1108 : migrationScope === 'in_stock' ? 982 : 128;

  const selectJourney = (next: Journey) => {
    setJourney(next);
    setStep(0);
    if (next === 'migrate') {
      setConnected(true);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(current => current - 1);
      return;
    }
    setJourney(null);
  };

  const connectStore = () => {
    setConnecting(true);
    window.setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 1100);
  };

  const startSync = () => {
    setSyncProgress(0);
    setSyncing(true);
  };

  const beginMigration = () => {
    setJourney('migrate');
    setStep(0);
    setConnected(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importEntityProgress = (entity: SyncEntity, index: number) => {
    const start = index * 16;
    return Math.max(0, Math.min(100, Math.round((syncProgress - start) * 2.2)));
  };

  const previewColumns: ColumnsType<MigrationPreview> = useMemo(() => [
    {
      title: '商品', dataIndex: 'name',
      render: (value: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.sourceCategory}</Typography.Text>
        </Space>
      ),
    },
    {
      title: `${target.name}类目`, dataIndex: 'targetCategory',
      render: (value: string, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{value}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>匹配置信度 {row.confidence}%</Typography.Text>
        </Space>
      ),
    },
    { title: '原售价', dataIndex: 'sourcePrice', width: 90, render: (value: number) => `¥${value.toFixed(2)}` },
    { title: '建议售价', dataIndex: 'targetPrice', width: 100, render: (value: number) => <Typography.Text strong style={{ color: '#2563eb' }}>¥{value.toFixed(2)}</Typography.Text> },
    {
      title: '检查结果', dataIndex: 'status', width: 120,
      render: (status: MigrationPreview['status']) => status === 'ready'
        ? <Tag color="success">可直接迁移</Tag>
        : status === 'needs_input' ? <Tag color="warning">需补充信息</Tag> : <Tag color="error">需要处理</Tag>,
    },
  ], [target.name]);

  const renderImportStep = () => {
    if (step === 0) {
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="blue">步骤 1</Tag>
            <Typography.Title level={2}>选择你已有的店铺</Typography.Title>
            <Typography.Paragraph type="secondary">一次连接一个店铺，完成后可以继续添加其他店铺。</Typography.Paragraph>
          </div>
          <Row gutter={[16, 16]}>
            {platforms.map(platform => (
              <Col xs={24} md={8} key={platform.key}>
                <PlatformCard platform={platform} selected={sourcePlatform === platform.key} onClick={() => {
                  setSourcePlatform(platform.key);
                  if (targetPlatform === platform.key) {
                    setTargetPlatform(platforms.find(item => item.key !== platform.key)!.key);
                  }
                  setStoreName(`${platform.name.replace(' / 天猫', '')}旗舰店`);
                  setConnected(false);
                }} />
              </Col>
            ))}
          </Row>
          <div className="onboarding-inline-form">
            <div>
              <Typography.Text strong>店铺备注名称</Typography.Text>
              <Typography.Text type="secondary">仅在 AllMall 内用于区分店铺</Typography.Text>
            </div>
            <Input value={storeName} onChange={event => setStoreName(event.target.value)} placeholder="例如：拼多多旗舰店" />
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="onboarding-section narrow">
          <div className="onboarding-section-heading centered">
            <span className="onboarding-security-icon"><LockOutlined /></span>
            <Typography.Title level={2}>安全连接 {source.name}</Typography.Title>
            <Typography.Paragraph type="secondary">我们将打开商家后台，请按页面提示完成登录或扫码验证。</Typography.Paragraph>
          </div>
          <Card className="onboarding-connect-card">
            <div className="onboarding-store-summary">
              <span className="onboarding-platform-logo large" style={{ color: source.color, background: source.soft }}>{source.short}</span>
              <div>
                <Typography.Title level={4}>{storeName}</Typography.Title>
                <Typography.Text type="secondary">{source.description}</Typography.Text>
              </div>
              <Tag color={connected ? 'success' : 'default'} icon={connected ? <CheckOutlined /> : undefined}>
                {connected ? '连接正常' : '等待授权'}
              </Tag>
            </div>
            <Divider />
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div className="onboarding-permission-row"><CheckCircleFilled /> 读取商品、SKU 与库存</div>
              <div className="onboarding-permission-row"><CheckCircleFilled /> 读取订单、评价与经营指标</div>
              <div className="onboarding-permission-row muted"><SafetyCertificateOutlined /> 只读访问，不会修改商品或处理订单</div>
            </Space>
            <Button type="primary" size="large" block loading={connecting} disabled={connected} onClick={connectStore} style={{ marginTop: 24 }}>
              {connected ? '已安全连接' : `打开${source.name}并授权`}
            </Button>
          </Card>
          {connected && (
            <Alert type="success" showIcon message="权限检测已完成" description="商品、订单、评价、库存均可读取，预计共有 1,236 个商品。" />
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="blue">推荐配置</Tag>
            <Typography.Title level={2}>确认首次同步范围</Typography.Title>
            <Typography.Paragraph type="secondary">我们已经为大多数店铺选好合适的范围，你可以直接继续。</Typography.Paragraph>
          </div>
          <div className="onboarding-data-grid">
            {syncEntities.map(entity => {
              const checked = selectedEntities.includes(entity.key);
              return (
                <button
                  type="button"
                  key={entity.key}
                  className={`onboarding-data-card ${checked ? 'is-selected' : ''}`}
                  onClick={() => setSelectedEntities(current => checked ? current.filter(item => item !== entity.key) : [...current, entity.key])}
                >
                  <Checkbox checked={checked} />
                  <span>
                    <Typography.Text strong>{entity.name}</Typography.Text>
                    <Typography.Text type="secondary">{entity.description}</Typography.Text>
                  </span>
                  <Typography.Text className="onboarding-count">约 {entity.count.toLocaleString()}</Typography.Text>
                </button>
              );
            })}
          </div>
          <Card size="small" className="onboarding-advanced-card">
            <div className="onboarding-rule-row">
              <div><Typography.Text strong>历史订单范围</Typography.Text><Typography.Text type="secondary">时间越长，首次同步耗时越久</Typography.Text></div>
              <Segmented value={orderRange} onChange={value => setOrderRange(String(value))} options={[{ label: '最近 3 个月', value: '3_months' }, { label: '最近 12 个月', value: '12_months' }, { label: '全部', value: 'all' }]} />
            </div>
          </Card>
          <Alert type="info" showIcon icon={<InfoCircleOutlined />} message="首次同步只读取数据" description="同步期间不会修改平台上的商品、库存、订单或评价。完成后会自动转为日常增量同步。" />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="onboarding-section narrow">
          <div className="onboarding-section-heading centered">
            <span className={`onboarding-sync-orbit ${syncing ? 'is-running' : ''}`}><CloudSyncOutlined /></span>
            <Typography.Title level={2}>{syncProgress === 100 ? '店铺数据已同步' : '正在智能同步店铺数据'}</Typography.Title>
            <Typography.Paragraph type="secondary">你可以离开此页面，任务会在后台继续执行。</Typography.Paragraph>
          </div>
          <Progress percent={syncProgress} status={syncing ? 'active' : syncProgress === 100 ? 'success' : 'normal'} size={['100%', 10]} />
          <div className="onboarding-sync-list">
            {syncEntities.filter(entity => selectedEntities.includes(entity.key)).map((entity, index) => {
              const progress = importEntityProgress(entity, index);
              const current = Math.round(entity.count * progress / 100);
              return (
                <div className="onboarding-sync-row" key={entity.key}>
                  <span className="onboarding-sync-icon">{progress === 100 ? <CheckOutlined /> : <DatabaseOutlined />}</span>
                  <div>
                    <Typography.Text strong>{entity.name}</Typography.Text>
                    <Typography.Text type="secondary">{progress === 0 ? '等待同步' : `${current.toLocaleString()} / ${entity.count.toLocaleString()}`}</Typography.Text>
                  </div>
                  <Progress percent={progress} showInfo={false} size="small" />
                  <Tag color={progress === 100 ? 'success' : progress > 0 ? 'processing' : 'default'}>{progress === 100 ? '完成' : progress > 0 ? '同步中' : '等待'}</Tag>
                </div>
              );
            })}
          </div>
          {syncProgress === 0 && <Button type="primary" size="large" block icon={<SyncOutlined />} onClick={startSync}>开始首次全量同步</Button>}
        </div>
      );
    }

    return (
      <div className="onboarding-section narrow">
        <div className="onboarding-success-hero">
          <span><CheckOutlined /></span>
          <Typography.Title level={2}>{storeName} 已准备就绪</Typography.Title>
          <Typography.Paragraph type="secondary">完整数据已经进入 AllMall，日常增量同步也已自动开启。</Typography.Paragraph>
        </div>
        <Row gutter={[12, 12]} className="onboarding-result-grid">
          {[['商品', '1,236'], ['SKU', '3,852'], ['订单', '28,410'], ['评价', '9,642']].map(([label, value]) => (
            <Col span={6} key={label}><Card size="small"><Typography.Text type="secondary">{label}</Typography.Text><Typography.Title level={3}>{value}</Typography.Title></Card></Col>
          ))}
        </Row>
        <Alert type="success" showIcon message="每日自动同步已开启" description="订单每 15 分钟、商品与库存每小时、评价和经营指标每天自动更新。" />
        <div className="onboarding-next-action">
          <div>
            <Typography.Title level={4}>下一步，把生意扩展到新平台</Typography.Title>
            <Typography.Paragraph type="secondary">使用刚同步的商品，一键生成适合其他平台的商品草稿。</Typography.Paragraph>
          </div>
          <Button type="primary" size="large" icon={<CopyOutlined />} onClick={beginMigration}>复制到其他平台</Button>
        </div>
      </div>
    );
  };

  const renderMigrationStep = () => {
    if (step === 0) {
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="purple">跨平台迁移</Tag>
            <Typography.Title level={2}>从哪里复制，要上架到哪里？</Typography.Title>
            <Typography.Paragraph type="secondary">系统会根据目标平台规则自动转换类目、属性、内容和价格。</Typography.Paragraph>
          </div>
          <div className="onboarding-route-picker">
            <Card className="onboarding-route-card">
              <Typography.Text type="secondary">来源店铺</Typography.Text>
              <div className="onboarding-store-summary compact">
                <span className="onboarding-platform-logo" style={{ color: source.color, background: source.soft }}>{source.short}</span>
                <div><Typography.Text strong>{storeName}</Typography.Text><Typography.Text type="secondary">1,236 个商品已同步</Typography.Text></div>
                <Tag color="success">数据最新</Tag>
              </div>
            </Card>
            <span className="onboarding-route-arrow"><ArrowRightOutlined /></span>
            <Card className="onboarding-route-card">
              <Typography.Text type="secondary">目标平台</Typography.Text>
              <Select
                value={targetPlatform}
                onChange={value => setTargetPlatform(value)}
                size="large"
                style={{ width: '100%', marginTop: 12 }}
                options={platforms.filter(item => item.key !== sourcePlatform).map(item => ({ label: item.name, value: item.key }))}
              />
              <div className="onboarding-target-status"><SafetyCertificateOutlined /> 上架前需要你确认</div>
            </Card>
          </div>
          <Alert type="info" showIcon message={`还没有${target.name}店铺？`} description="完成平台实名认证、类目资质和保证金后返回此处授权，我们会保留当前迁移配置。" action={<Button size="small">查看开店指引</Button>} />
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="purple">智能筛选</Tag>
            <Typography.Title level={2}>选择准备迁移的商品</Typography.Title>
            <Typography.Paragraph type="secondary">优先迁移在售且有库存的商品，减少无效草稿。</Typography.Paragraph>
          </div>
          <Radio.Group value={migrationScope} onChange={event => setMigrationScope(event.target.value)} className="onboarding-scope-list">
            <Radio.Button value="all_active"><ShoppingOutlined /> 全部在售商品 <strong>1,108</strong><span>包含当前所有在售商品</span></Radio.Button>
            <Radio.Button value="in_stock"><CheckCircleFilled /> 仅有库存商品 <strong>982</strong><span>自动排除缺货 SKU</span></Radio.Button>
            <Radio.Button value="selected"><ShopOutlined /> 按分类选择 <strong>128</strong><span>当前选择 3 个分类</span></Radio.Button>
          </Radio.Group>
          <Card className="onboarding-selection-summary">
            <div><Typography.Text type="secondary">本次将迁移</Typography.Text><Typography.Title level={2}>{selectedCount.toLocaleString()} 个商品</Typography.Title></div>
            <Divider type="vertical" />
            <div><Typography.Text type="secondary">预计生成草稿</Typography.Text><Typography.Title level={2}>{Math.round(selectedCount * 0.94).toLocaleString()}</Typography.Title></div>
            <Divider type="vertical" />
            <div><Typography.Text type="secondary">预计需人工补充</Typography.Text><Typography.Title level={2} style={{ color: '#ea580c' }}>{Math.round(selectedCount * 0.06)}</Typography.Title></div>
          </Card>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="purple">一套规则，批量应用</Tag>
            <Typography.Title level={2}>设置 {target.name} 上架规则</Typography.Title>
            <Typography.Paragraph type="secondary">不用逐个修改商品，系统会根据规则生成可审核的草稿。</Typography.Paragraph>
          </div>
          <div className="onboarding-rules-stack">
            <Card title={<Space><span className="onboarding-mini-icon blue">¥</span>定价方式</Space>}>
              <Segmented block value={priceMode} onChange={value => setPriceMode(String(value))} options={[{ label: 'AI 智能建议', value: 'smart' }, { label: '按比例调整', value: 'ratio' }, { label: '保持原价', value: 'same' }]} />
              <div className="onboarding-rule-detail">
                {priceMode === 'smart' ? <><ThunderboltOutlined /> 结合目标平台竞品价格、佣金和目标毛利率，逐个生成建议价。</> : priceMode === 'ratio' ? <Space>在来源售价基础上调整 <Space.Compact><InputNumber value={priceAdjustment} onChange={value => setPriceAdjustment(value ?? 0)} /><Button disabled>%</Button></Space.Compact></Space> : '直接沿用来源平台售价，仍会检查最低利润率。'}
              </div>
            </Card>
            <Card title={<Space><span className="onboarding-mini-icon green"><DatabaseOutlined /></span>库存方式</Space>}>
              <Radio.Group value={stockMode} onChange={event => setStockMode(event.target.value)}>
                <Space direction="vertical"><Radio value="shared">跨平台共享库存，自动扣减</Radio><Radio value="ratio">目标平台使用来源库存的 50%</Radio><Radio value="independent">目标平台使用独立库存</Radio></Space>
              </Radio.Group>
              <div className="onboarding-rule-detail"><Space>每个 SKU 保留安全库存 <Space.Compact><InputNumber min={0} value={safeStock} onChange={value => setSafeStock(value ?? 0)} /><Button disabled>件</Button></Space.Compact></Space></div>
            </Card>
            <Card title={<Space><span className="onboarding-mini-icon purple">AI</span>商品内容</Space>}>
              <div className="onboarding-rule-row"><div><Typography.Text strong>自动适配目标平台内容</Typography.Text><Typography.Text type="secondary">优化标题、类目、属性、详情页并检查禁限售词</Typography.Text></div><Switch checked={optimizeContent} onChange={setOptimizeContent} /></div>
            </Card>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const readyCount = Math.round(selectedCount * 0.89);
      return (
        <div className="onboarding-section">
          <div className="onboarding-section-heading">
            <Tag color="success">智能适配完成</Tag>
            <Typography.Title level={2}>上架前检查结果</Typography.Title>
            <Typography.Paragraph type="secondary">系统已转换类目和属性，并根据目标平台行情生成建议售价。</Typography.Paragraph>
          </div>
          <Row gutter={[12, 12]} className="onboarding-check-stats">
            <Col span={8}><Card><Typography.Text type="secondary">可直接创建草稿</Typography.Text><Typography.Title level={2} style={{ color: '#16a34a' }}>{readyCount}</Typography.Title><Progress percent={89} showInfo={false} strokeColor="#16a34a" /></Card></Col>
            <Col span={8}><Card><Typography.Text type="secondary">需要补充信息</Typography.Text><Typography.Title level={2} style={{ color: '#ea580c' }}>{Math.round(selectedCount * 0.09)}</Typography.Title><Progress percent={9} showInfo={false} strokeColor="#ea580c" /></Card></Col>
            <Col span={8}><Card><Typography.Text type="secondary">暂不支持迁移</Typography.Text><Typography.Title level={2} style={{ color: '#dc2626' }}>{Math.round(selectedCount * 0.02)}</Typography.Title><Progress percent={2} showInfo={false} strokeColor="#dc2626" /></Card></Col>
          </Row>
          <Card title="商品转换预览" extra={<Button>查看全部 {selectedCount.toLocaleString()} 个商品</Button>}>
            <Table columns={previewColumns} dataSource={previewRows} pagination={false} size="small" scroll={{ x: 840 }} />
          </Card>
          <Alert type="warning" showIcon message="创建草稿前需要你的确认" description="系统不会自动发布商品。确认后将先在目标平台创建商品草稿，完成最终检查后再由你选择是否正式上架。" />
        </div>
      );
    }

    const created = Math.round(selectedCount * publishProgress / 100);
    return (
      <div className="onboarding-section narrow">
        <div className="onboarding-section-heading centered">
          <span className={`onboarding-sync-orbit purple ${publishing ? 'is-running' : ''}`}><RocketOutlined /></span>
          <Typography.Title level={2}>{publishProgress === 100 ? `${target.name}商品草稿已创建` : '准备批量创建商品草稿'}</Typography.Title>
          <Typography.Paragraph type="secondary">仅创建草稿，不会在未确认的情况下直接发布。</Typography.Paragraph>
        </div>
        <Card className="onboarding-publish-card">
          <div className="onboarding-store-summary compact">
            <span className="onboarding-platform-logo" style={{ color: source.color, background: source.soft }}>{source.short}</span>
            <ArrowRightOutlined />
            <span className="onboarding-platform-logo" style={{ color: target.color, background: target.soft }}>{target.short}</span>
            <div><Typography.Text strong>{source.name} → {target.name}</Typography.Text><Typography.Text type="secondary">{selectedCount.toLocaleString()} 个商品</Typography.Text></div>
          </div>
          <Progress percent={publishProgress} status={publishing ? 'active' : publishProgress === 100 ? 'success' : 'normal'} size={['100%', 10]} style={{ marginTop: 24 }} />
          {publishProgress > 0 && <Typography.Text type="secondary">已处理 {created.toLocaleString()} / {selectedCount.toLocaleString()} 个商品</Typography.Text>}
          {publishProgress === 0 && (
            <Button type="primary" size="large" block icon={<RocketOutlined />} onClick={() => setPublishing(true)} style={{ marginTop: 24 }}>确认并创建 {selectedCount.toLocaleString()} 个商品草稿</Button>
          )}
        </Card>
        {publishProgress === 100 && (
          <>
            <Row gutter={[12, 12]} className="onboarding-result-grid">
              <Col span={8}><Card size="small"><Typography.Text type="secondary">成功创建</Typography.Text><Typography.Title level={3} style={{ color: '#16a34a' }}>{Math.round(selectedCount * 0.94)}</Typography.Title></Card></Col>
              <Col span={8}><Card size="small"><Typography.Text type="secondary">等待补充</Typography.Text><Typography.Title level={3} style={{ color: '#ea580c' }}>{Math.round(selectedCount * 0.04)}</Typography.Title></Card></Col>
              <Col span={8}><Card size="small"><Typography.Text type="secondary">平台拒绝</Typography.Text><Typography.Title level={3} style={{ color: '#dc2626' }}>{Math.round(selectedCount * 0.02)}</Typography.Title></Card></Col>
            </Row>
            <Alert type="success" showIcon message="迁移任务已完成" description="草稿已保存到目标店铺。你可以前往商品管理完成最终审核和正式发布。" />
          </>
        )}
      </div>
    );
  };

  const canContinue = journey === 'import'
    ? (step === 0 ? Boolean(storeName.trim()) : step === 1 ? connected : step === 2 ? selectedEntities.length > 0 : step === 3 ? syncProgress === 100 : true)
    : true;

  const isLastStep = journey ? step === steps.length - 1 : false;

  return (
    <div className="store-onboarding-page">
      <div className="onboarding-topbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => journey ? goBack() : navigate('/stores')}>{journey ? '返回上一步' : '返回店铺管理'}</Button>
        <div className="onboarding-brand-pill"><ThunderboltOutlined /> AllMall 智能开店助手</div>
        <Button type="text" onClick={() => navigate('/stores')}>稍后继续</Button>
      </div>

      {!journey ? (
        <div className="onboarding-welcome">
          <div className="onboarding-welcome-copy">
            <div className="onboarding-eyebrow"><span /> 你的套餐已生效</div>
            <Typography.Title>先告诉我们，你现在想完成什么？</Typography.Title>
            <Typography.Paragraph>无需理解复杂配置，跟着步骤完成授权，剩下的交给 AllMall。</Typography.Paragraph>
          </div>
          <JourneyChoice onSelect={selectJourney} />
          <div className="onboarding-trust-row">
            <span><SafetyCertificateOutlined /> 银行级加密</span>
            <span><LockOutlined /> 导入过程只读</span>
            <span><CloudSyncOutlined /> 支持断点续传</span>
            <span><CheckCircleFilled /> 上架前必须确认</span>
          </div>
        </div>
      ) : (
        <div className="onboarding-workspace">
          <aside className="onboarding-sidebar">
            <div>
              <Tag color={journey === 'import' ? 'blue' : 'purple'}>{journey === 'import' ? '已有店铺导入' : '跨平台商品迁移'}</Tag>
              <Typography.Title level={4}>{journey === 'import' ? '同步店铺数据' : '复制到新平台'}</Typography.Title>
              <Progress percent={overallProgress} showInfo={false} strokeColor={journey === 'import' ? '#2563eb' : '#7c3aed'} />
            </div>
            <Steps direction="vertical" current={step} items={steps} size="small" />
            <div className="onboarding-help-card"><SafetyCertificateOutlined /><div><Typography.Text strong>全程安全可控</Typography.Text><Typography.Text type="secondary">读取自动进行，写入必须确认。</Typography.Text></div></div>
          </aside>
          <main className="onboarding-main">
            {journey === 'import' ? renderImportStep() : renderMigrationStep()}
            <div className="onboarding-footer-actions">
              <Button size="large" onClick={goBack}>{step === 0 ? '重新选择流程' : '上一步'}</Button>
              {!isLastStep && (
                <Button type="primary" size="large" disabled={!canContinue || syncing || publishing} onClick={() => setStep(current => current + 1)}>
                  继续 <ArrowRightOutlined />
                </Button>
              )}
              {isLastStep && journey === 'import' && (
                <Button size="large" onClick={() => navigate('/dashboard')}>进入经营总览</Button>
              )}
              {isLastStep && journey === 'migrate' && publishProgress === 100 && (
                <Button type="primary" size="large" onClick={() => navigate('/products')}>前往商品管理 <ArrowRightOutlined /></Button>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
