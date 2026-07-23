import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  CopyOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  LockOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ShoppingOutlined,
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
  Modal,
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
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { approvalsApi } from '../../api/approvals';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { queueDailyLoopTour } from '../../components/OnboardingTour';

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

interface MigrationCategory {
  key: string;
  name: string;
  count: number;
}

/** Persisted snapshot of the wizard so the merchant can leave and resume (A5). */
interface WizardSavedState {
  journey: Journey | null;
  step: number;
  sourcePlatform: PlatformKey;
  targetPlatform: PlatformKey;
  storeName: string;
  connected: boolean;
  authAttempts: number;
  selectedEntities: SyncEntityKey[];
  orderRange: string;
  syncProgress: number;
  syncInterrupted: boolean;
  syncResumed: boolean;
  migrationScope: string;
  selectedCategories: string[];
  priceMode: string;
  priceAdjustment: number;
  stockMode: string;
  safeStock: number;
  optimizeContent: boolean;
  publishProgress: number;
  targetAuthorized: boolean;
  targetAuthAttempts: number;
  storeCreated: { id: number; name: string; platform: string } | null;
}

const WIZARD_STORAGE_KEY = 'allmall-store-wizard';
/** Session-scoped flag: first-time merchant has seen the welcome dialog this session. */
const WELCOME_SEEN_KEY = 'allmall-onboarding-welcome-seen';

function loadWizardState(): Partial<WizardSavedState> | null {
  try {
    const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<WizardSavedState>;
  } catch {
    return null;
  }
}

function clearWizardState() {
  try {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    // ignore
  }
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

const migrationCategories: MigrationCategory[] = [
  { key: 'bags', name: '箱包皮具', count: 52 },
  { key: 'apparel', name: '女装', count: 46 },
  { key: 'toys', name: '玩具乐器', count: 30 },
  { key: 'outdoor', name: '户外装备', count: 24 },
  { key: 'shoes', name: '鞋靴运动', count: 18 },
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
  { title: '完成', description: '开启第一个 Agent' },
];

const migrationSteps = [
  { title: '选择目标', description: '确定来源和目标店铺' },
  { title: '选择商品', description: '筛选准备迁移的商品' },
  { title: '迁移规则', description: '设置价格、库存与内容' },
  { title: '智能检查', description: '预览平台适配结果' },
  { title: '确认并创建草稿', description: '审核后创建商品草稿' },
];

/** Number of unanswered negative reviews found by the first-agent scan (A9 demo). */
const FIRST_AGENT_REVIEW_COUNT = 3;

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

function JourneyChoice({ onSelect, allowMigrate }: { onSelect: (journey: Journey) => void; allowMigrate: boolean }) {
  return (
    <div className={`onboarding-choice-grid ${allowMigrate ? '' : 'single'}`}>
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
      {/* 迁移依赖已同步的商品，对全新商家无意义 —— 首次开店时隐藏，导入完成后再作为二级动作出现 */}
      {allowMigrate && (
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
      )}
    </div>
  );
}

export function StoreOnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateExperience, user } = useAuth();
  const [searchParams] = useSearchParams();
  // 全新商家（尚未连接任何店铺）只需专注导入，隐藏跨平台迁移这一进阶入口
  const isFirstTimeMerchant = user?.experience === 'onboarding';

  // A5: hydrate once from localStorage so leaving the page never loses progress.
  const [saved] = useState(() => loadWizardState());

  const [journey, setJourney] = useState<Journey | null>(() => {
    if (saved?.journey === 'import' || saved?.journey === 'migrate') return saved.journey;
    const requestedJourney = searchParams.get('journey');
    return requestedJourney === 'import' || requestedJourney === 'migrate' ? requestedJourney : null;
  });
  const [step, setStep] = useState(saved?.step ?? 0);
  const [sourcePlatform, setSourcePlatform] = useState<PlatformKey>(saved?.sourcePlatform ?? 'pinduoduo');
  const [targetPlatform, setTargetPlatform] = useState<PlatformKey>(saved?.targetPlatform ?? 'taobao');
  const [storeName, setStoreName] = useState(saved?.storeName ?? '我的拼多多店铺');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(saved?.connected ?? false);
  // A4: the first authorization attempt fails (simulated) and must be retried.
  const [authAttempts, setAuthAttempts] = useState(saved?.authAttempts ?? 0);
  const [authError, setAuthError] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<SyncEntityKey[]>(saved?.selectedEntities ?? syncEntities.map(item => item.key));
  const [orderRange, setOrderRange] = useState(saved?.orderRange ?? '12_months');
  const [syncProgress, setSyncProgress] = useState(saved?.syncProgress ?? 0);
  const [syncing, setSyncing] = useState(false);
  // A4: the first full sync is interrupted mid-way and resumes from a checkpoint.
  const [syncInterrupted, setSyncInterrupted] = useState(saved?.syncInterrupted ?? false);
  const [syncResumed, setSyncResumed] = useState(saved?.syncResumed ?? false);
  const [migrationScope, setMigrationScope] = useState(saved?.migrationScope ?? 'all_active');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(saved?.selectedCategories ?? ['bags', 'apparel', 'toys']);
  const [priceMode, setPriceMode] = useState(saved?.priceMode ?? 'smart');
  const [priceAdjustment, setPriceAdjustment] = useState(saved?.priceAdjustment ?? 5);
  const [stockMode, setStockMode] = useState(saved?.stockMode ?? 'shared');
  const [safeStock, setSafeStock] = useState(saved?.safeStock ?? 5);
  const [optimizeContent, setOptimizeContent] = useState(saved?.optimizeContent ?? true);
  const [publishProgress, setPublishProgress] = useState(saved?.publishProgress ?? 0);
  const [publishing, setPublishing] = useState(false);
  // A6: the migration target store requires its own authorization before continuing.
  const [targetAuthorized, setTargetAuthorized] = useState(saved?.targetAuthorized ?? false);
  const [targetAuthAttempts, setTargetAuthAttempts] = useState(saved?.targetAuthAttempts ?? 0);
  const [targetAuthError, setTargetAuthError] = useState(false);
  const [targetConnecting, setTargetConnecting] = useState(false);
  // A1: the store record created when the first sync completes.
  const [storeCreated, setStoreCreated] = useState<WizardSavedState['storeCreated']>(saved?.storeCreated ?? null);
  // A9: first-agent moment state (not persisted — re-runnable after a reload).
  const [agentMoment, setAgentMoment] = useState<'idle' | 'enabling' | 'running' | 'done'>('idle');
  const [firstApprovalId, setFirstApprovalId] = useState<number | null>(null);
  const [showResume, setShowResume] = useState(() => Boolean(saved?.journey && ((saved.step ?? 0) > 0 || saved.connected)));
  // 首次商家落地时的一次性欢迎弹窗：说明接下来要做什么，避免登录后直接掉进流程的突兀感。
  // 恢复进度（断点续传）或已看过则不再弹出。
  const [showWelcome, setShowWelcome] = useState(() => {
    if (user?.experience !== 'onboarding') return false;
    const resuming = Boolean(saved?.journey && ((saved.step ?? 0) > 0 || saved.connected));
    if (resuming) return false;
    try {
      // sessionStorage (not localStorage): greet on each fresh login/session, but
      // stay quiet across in-tab refreshes. Resets exactly when the session resets.
      return sessionStorage.getItem(WELCOME_SEEN_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const markWelcomeSeen = () => {
    try {
      sessionStorage.setItem(WELCOME_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const startFromWelcome = () => {
    markWelcomeSeen();
    setShowWelcome(false);
  };

  const dismissWelcomeLater = () => {
    markWelcomeSeen();
    setShowWelcome(false);
    navigate('/stores');
  };

  const source = platforms.find(item => item.key === sourcePlatform)!;
  const target = platforms.find(item => item.key === targetPlatform)!;
  const steps = journey === 'migrate' ? migrationSteps : importSteps;

  // A5: persist every meaningful selection so "稍后继续" is actually true.
  useEffect(() => {
    const payload: WizardSavedState = {
      journey, step, sourcePlatform, targetPlatform, storeName, connected, authAttempts,
      selectedEntities, orderRange, syncProgress, syncInterrupted, syncResumed,
      migrationScope, selectedCategories, priceMode, priceAdjustment, stockMode, safeStock,
      optimizeContent, publishProgress, targetAuthorized, targetAuthAttempts, storeCreated,
    };
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [journey, step, sourcePlatform, targetPlatform, storeName, connected, authAttempts,
    selectedEntities, orderRange, syncProgress, syncInterrupted, syncResumed,
    migrationScope, selectedCategories, priceMode, priceAdjustment, stockMode, safeStock,
    optimizeContent, publishProgress, targetAuthorized, targetAuthAttempts, storeCreated]);

  // A1: if a reload reset the in-memory mock data, re-insert the connected store.
  useEffect(() => {
    if (!storeCreated) return;
    let cancelled = false;
    storesApi.get(storeCreated.id).then((existing) => {
      if (cancelled || existing) return;
      storesApi.create({ name: storeCreated.name, platform: storeCreated.platform, authMethod: 'oauth', region: 'CN', currency: 'CNY', services: [] }).then((recreated) => {
        storesApi.updateStatus(recreated.id, 'connected');
        if (!cancelled) {
          setStoreCreated({ id: recreated.id, name: recreated.name, platform: recreated.platform });
          queryClient.invalidateQueries({ queryKey: ['stores'] });
        }
      });
    });
    return () => { cancelled = true; };
    // Run once on mount only — later storeCreated changes come from this effect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A7: auto-start (and auto-resume after a reload) the sync when entering the sync step.
  useEffect(() => {
    if (journey !== 'import' || step !== 3) return;
    if (syncing || syncInterrupted || syncProgress >= 100) return;
    setSyncing(true);
  }, [journey, step, syncing, syncInterrupted, syncProgress]);

  useEffect(() => {
    if (!syncing) return;
    const timer = window.setInterval(() => {
      setSyncProgress(current => {
        const next = Math.min(current + (current < 48 ? 8 : current < 84 ? 4 : 2), 100);
        // A4: simulate a session drop on the first run; the retry resumes from here.
        if (!syncResumed && next >= 52) {
          window.clearInterval(timer);
          setSyncing(false);
          setSyncInterrupted(true);
          return 52;
        }
        if (next === 100) {
          window.clearInterval(timer);
          setSyncing(false);
        }
        return next;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [syncing, syncResumed]);

  // A1: when the first sync completes, create the store record and flip the persona
  // flag so /stores, dashboard and the navigation all reflect the connected store.
  useEffect(() => {
    if (journey !== 'import' || syncProgress !== 100 || storeCreated) return;
    let cancelled = false;
    (async () => {
      const created = await storesApi.create({
        name: storeName.trim() || `我的${source.name}店铺`,
        platform: sourcePlatform,
        authMethod: 'oauth',
        region: 'CN',
        currency: 'CNY',
        services: [],
      });
      await storesApi.updateStatus(created.id, 'connected');
      if (cancelled) return;
      setStoreCreated({ id: created.id, name: created.name, platform: created.platform });
      updateExperience('established');
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      message.success(t('storewizard.storeCreatedToast', { name: created.name }));
    })();
    return () => { cancelled = true; };
  }, [journey, syncProgress, storeCreated, storeName, sourcePlatform, source.name, updateExperience, queryClient, t]);

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
  const categoryCount = migrationCategories
    .filter(category => selectedCategories.includes(category.key))
    .reduce((sum, category) => sum + category.count, 0);
  const selectedCount = migrationScope === 'all_active' ? 1108 : migrationScope === 'in_stock' ? 982 : categoryCount;

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
    setAuthError(false);
    window.setTimeout(() => {
      setConnecting(false);
      // A4: reject the very first authorization attempt, then succeed on retry.
      if (authAttempts === 0) {
        setAuthAttempts(1);
        setAuthError(true);
        return;
      }
      setConnected(true);
    }, 1100);
  };

  const authorizeTarget = () => {
    setTargetConnecting(true);
    setTargetAuthError(false);
    window.setTimeout(() => {
      setTargetConnecting(false);
      // A4/A6: first target authorization fails (simulated), retry succeeds.
      if (targetAuthAttempts === 0) {
        setTargetAuthAttempts(1);
        setTargetAuthError(true);
        return;
      }
      setTargetAuthorized(true);
    }, 1100);
  };

  const resumeSync = () => {
    setSyncResumed(true);
    setSyncInterrupted(false);
    setSyncing(true);
  };

  const beginMigration = () => {
    setJourney('migrate');
    setStep(0);
    setConnected(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startOver = () => {
    clearWizardState();
    window.location.assign(window.location.pathname);
  };

  // Wizard exits: clear the saved progress so the next visit starts fresh.
  const finishToDashboard = () => {
    clearWizardState();
    queueDailyLoopTour();
    navigate('/dashboard');
  };

  const finishToFirstApproval = () => {
    if (firstApprovalId == null) return;
    clearWizardState();
    navigate(`/agents/approvals/${firstApprovalId}`);
  };

  const finishMigration = () => {
    clearWizardState();
    navigate('/products');
  };

  // A9: enable the recommended read-only agent, simulate its first run, and seed
  // one pending approval so the merchant can complete their first decision.
  const enableFirstAgent = async () => {
    if (!storeCreated) return;
    setAgentMoment('enabling');
    const agent = await agentsApi.get('review_manager');
    if (agent && !agent.enabled) {
      await agentsApi.toggle('review_manager');
    }
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    setAgentMoment('running');
    window.setTimeout(async () => {
      const task = await agentsApi.createTask('review_manager', {
        title: '差评巡检与回复草稿',
        goal: '扫描最近同步的商品评价，为超过 24 小时未回复的差评生成回复草稿。',
        storeId: storeCreated.id,
      });
      const approval = await approvalsApi.create({
        taskId: task.id,
        storeId: storeCreated.id,
        storeName: storeCreated.name,
        agentType: 'review_manager',
        title: `发布 ${FIRST_AGENT_REVIEW_COUNT} 条差评回复`,
        reason: `首次巡检发现 ${FIRST_AGENT_REVIEW_COUNT} 条 1-2 星差评超过 24 小时未回复，长期不回复会影响店铺评分。`,
        proposedAction: `使用生成的专业友好话术回复这 ${FIRST_AGENT_REVIEW_COUNT} 条差评，不做任何其他修改。`,
        beforeValue: `${FIRST_AGENT_REVIEW_COUNT} 条差评未回复`,
        afterValue: `${FIRST_AGENT_REVIEW_COUNT} 条差评已回复（草稿见任务详情）`,
        riskLevel: 'low',
      });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setFirstApprovalId(approval.id);
      setAgentMoment('done');
    }, 1600);
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
      // A6: use the same "暂不支持迁移" label as the summary cards for blocked items.
      title: '检查结果', dataIndex: 'status', width: 120,
      render: (status: MigrationPreview['status']) => status === 'ready'
        ? <Tag color="success">可直接迁移</Tag>
        : status === 'needs_input' ? <Tag color="warning">需补充信息</Tag> : <Tag color="error">暂不支持迁移</Tag>,
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
                  setStoreName(`我的${platform.name}店铺`);
                  setConnected(false);
                  setAuthError(false);
                }} />
              </Col>
            ))}
          </Row>
          <div className="onboarding-inline-form">
            <div>
              <Typography.Text strong>店铺备注名称</Typography.Text>
              <Typography.Text type="secondary">仅在 AllMall 内用于区分店铺</Typography.Text>
            </div>
            <Input value={storeName} onChange={event => setStoreName(event.target.value)} placeholder="例如：我的拼多多店铺" />
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
              {connected ? '已安全连接' : authError ? t('storewizard.retryAuth') : `打开${source.name}并授权`}
            </Button>
          </Card>
          {authError && (
            <Alert
              type="error"
              showIcon
              message={t('storewizard.authFailedTitle')}
              description={t('storewizard.authFailedDesc')}
              action={<Button size="small" danger onClick={connectStore} loading={connecting}>{t('storewizard.retryAuth')}</Button>}
            />
          )}
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
            <Typography.Title level={2}>{syncProgress === 100 ? '店铺数据已同步' : syncInterrupted ? t('storewizard.syncInterruptedTitle') : '正在智能同步店铺数据'}</Typography.Title>
            <Typography.Paragraph type="secondary">你可以离开此页面，进度会自动保存，回来后从断点继续。</Typography.Paragraph>
          </div>
          <Progress percent={syncProgress} status={syncing ? 'active' : syncInterrupted ? 'exception' : syncProgress === 100 ? 'success' : 'normal'} size={['100%', 10]} />
          {syncInterrupted && (
            <Alert
              type="error"
              showIcon
              message={t('storewizard.syncInterruptedTitle')}
              description={t('storewizard.syncInterruptedDesc', { percent: syncProgress })}
              action={<Button size="small" type="primary" onClick={resumeSync}>{t('storewizard.resumeSync')}</Button>}
            />
          )}
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
        </div>
      );
    }

    return (
      <div className="onboarding-section narrow">
        <div className="onboarding-success-hero">
          <span><CheckOutlined /></span>
          <Typography.Title level={2}>{storeCreated?.name ?? storeName} 已准备就绪</Typography.Title>
          <Typography.Paragraph type="secondary">完整数据已经进入 AllMall，日常增量同步也已自动开启。店铺已出现在「店铺管理」和经营总览中。</Typography.Paragraph>
        </div>
        <Row gutter={[12, 12]} className="onboarding-result-grid">
          {[['商品', '1,236'], ['SKU', '3,852'], ['订单', '28,410'], ['评价', '9,642']].map(([label, value]) => (
            <Col span={6} key={label}><Card size="small"><Typography.Text type="secondary">{label}</Typography.Text><Typography.Title level={3}>{value}</Typography.Title></Card></Col>
          ))}
        </Row>
        <Alert type="success" showIcon message="每日自动同步已开启" description="订单每 15 分钟、商品与库存每小时、评价和经营指标每天自动更新。" />

        {/* A9: guided first-agent moment — the onboarding arc ends at the first approval. */}
        <Card className="onboarding-first-agent-card">
          <Space align="start" size={16} style={{ width: '100%' }}>
            <span className="onboarding-journey-icon" style={{ flexShrink: 0 }}><RobotOutlined /></span>
            <Space direction="vertical" size={8} style={{ flex: 1 }}>
              <Space size={6} wrap>
                <Typography.Title level={4} style={{ margin: 0 }}>{t('onboarding.firstAgentTitle')}</Typography.Title>
                <Tag color="green">{t('onboarding.firstAgentReadOnly')}</Tag>
                <Tag color="blue">{t('onboarding.firstAgentLowRisk')}</Tag>
              </Space>
              {agentMoment === 'idle' && (
                <>
                  <Typography.Paragraph type="secondary" style={{ margin: 0 }}>{t('onboarding.firstAgentDesc')}</Typography.Paragraph>
                  <Button type="primary" size="large" icon={<RobotOutlined />} onClick={enableFirstAgent} disabled={!storeCreated}>
                    {t('onboarding.enableFirstAgent')}
                  </Button>
                </>
              )}
              {(agentMoment === 'enabling' || agentMoment === 'running') && (
                <>
                  <Typography.Paragraph type="secondary" style={{ margin: 0 }}>{t('onboarding.firstAgentRunning')}</Typography.Paragraph>
                  <Progress percent={agentMoment === 'enabling' ? 30 : 70} status="active" showInfo={false} size={['100%', 8]} />
                </>
              )}
              {agentMoment === 'done' && (
                <>
                  <Alert
                    type="success"
                    showIcon
                    message={t('onboarding.firstAgentDoneTitle')}
                    description={t('onboarding.firstAgentDoneDesc', { count: FIRST_AGENT_REVIEW_COUNT })}
                  />
                  <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={finishToFirstApproval}>
                    {t('onboarding.goFirstApproval')}
                  </Button>
                </>
              )}
            </Space>
          </Space>
        </Card>

        {/* A7: migration upsell demoted to a secondary follow-up action. */}
        <div className="onboarding-next-action">
          <div>
            <Typography.Title level={4}>之后，把生意扩展到新平台</Typography.Title>
            <Typography.Paragraph type="secondary">使用刚同步的商品，一键生成适合其他平台的商品草稿。</Typography.Paragraph>
          </div>
          <Button size="large" icon={<CopyOutlined />} onClick={beginMigration}>复制到其他平台</Button>
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
                onChange={value => {
                  setTargetPlatform(value);
                  setTargetAuthorized(false);
                  setTargetAuthError(false);
                }}
                size="large"
                style={{ width: '100%', marginTop: 12 }}
                options={platforms.filter(item => item.key !== sourcePlatform).map(item => ({ label: item.name, value: item.key }))}
              />
              {targetAuthorized ? (
                <div className="onboarding-target-status"><CheckCircleFilled style={{ color: '#16a34a' }} /> {t('storewizard.targetAuthorized')} · 上架前仍需你确认</div>
              ) : (
                <>
                  {/* A6: the target store must be authorized before drafts can be written to it. */}
                  <Button type="primary" block loading={targetConnecting} onClick={authorizeTarget} style={{ marginTop: 12 }}>
                    {targetAuthError ? t('storewizard.retryAuth') : t('storewizard.authorizeTarget', { platform: target.name })}
                  </Button>
                  <div className="onboarding-target-status"><SafetyCertificateOutlined /> {t('storewizard.targetAuthRequired')}</div>
                </>
              )}
            </Card>
          </div>
          {targetAuthError && (
            <Alert
              type="error"
              showIcon
              message={t('storewizard.targetAuthFailedTitle')}
              description={t('storewizard.targetAuthFailedDesc')}
              action={<Button size="small" danger onClick={authorizeTarget} loading={targetConnecting}>{t('storewizard.retryAuth')}</Button>}
            />
          )}
          <Alert type="info" showIcon message={`还没有${target.name}店铺？`} description="完成平台实名认证、类目资质和保证金后返回此处授权，我们会保留当前迁移配置。" action={<Button size="small" onClick={() => navigate('/settings/guide')}>查看开店指引</Button>} />
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
            <Radio.Button value="selected"><ShopOutlined /> 按分类选择 <strong>{categoryCount}</strong><span>当前选择 {selectedCategories.length} 个分类</span></Radio.Button>
          </Radio.Group>
          {migrationScope === 'selected' && (
            /* A6: real category picker backing the "按分类选择" scope. */
            <Card size="small" className="onboarding-advanced-card">
              <div style={{ marginBottom: 12 }}>
                <Typography.Text strong>{t('storewizard.categoryLabel')}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t('storewizard.categoryHint')}</Typography.Text>
              </div>
              <Checkbox.Group
                value={selectedCategories}
                onChange={values => setSelectedCategories(values as string[])}
                style={{ width: '100%' }}
              >
                <Row gutter={[12, 12]}>
                  {migrationCategories.map(category => (
                    <Col xs={12} md={8} key={category.key}>
                      <Checkbox value={category.key}>
                        {category.name}（{category.count}）
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Card>
          )}
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
          <Card title="商品转换预览" extra={<Typography.Text type="secondary">{t('storewizard.previewShownHint', { total: selectedCount.toLocaleString() })}</Typography.Text>}>
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
          <Typography.Title level={2}>{publishProgress === 100 ? `${target.name}商品草稿已创建` : '确认并创建商品草稿'}</Typography.Title>
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
            {/* A6: rejected items get an explanation and a remediation path. */}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('storewizard.rejectedHint')}</Typography.Text>
            <Alert type="success" showIcon message="迁移任务已完成" description="草稿已保存到目标店铺。你可以前往商品管理完成最终审核和正式发布。" />
          </>
        )}
      </div>
    );
  };

  const canContinue = journey === 'import'
    ? (step === 0 ? Boolean(storeName.trim()) : step === 1 ? connected : step === 2 ? selectedEntities.length > 0 : step === 3 ? syncProgress === 100 : true)
    : (step === 0 ? targetAuthorized : step === 1 ? selectedCount > 0 : true);

  const isLastStep = journey ? step === steps.length - 1 : false;

  return (
    <div className="store-onboarding-page">
      <Modal
        open={showWelcome}
        onCancel={dismissWelcomeLater}
        footer={null}
        width={468}
        centered
        maskClosable={false}
        className="onboarding-welcome-modal"
      >
        <div className="onboarding-welcome-modal-body">
          <span className="onboarding-welcome-modal-icon"><ThunderboltOutlined /></span>
          <Typography.Title level={3}>欢迎使用 AllMall</Typography.Title>
          <Typography.Paragraph type="secondary">
            接下来大约 3 分钟，我们一起把你的生意接入 AllMall。只需三步：
          </Typography.Paragraph>
          <div className="onboarding-welcome-steps">
            <div className="onboarding-welcome-step">
              <span className="onboarding-welcome-step-index">1</span>
              <div>
                <Typography.Text strong>连接店铺</Typography.Text>
                <Typography.Text type="secondary">安全授权拼多多、淘宝或京东，无需提供密码。</Typography.Text>
              </div>
            </div>
            <div className="onboarding-welcome-step">
              <span className="onboarding-welcome-step-index">2</span>
              <div>
                <Typography.Text strong>同步数据</Typography.Text>
                <Typography.Text type="secondary">自动导入商品、订单、评价和库存，进度自动保存。</Typography.Text>
              </div>
            </div>
            <div className="onboarding-welcome-step">
              <span className="onboarding-welcome-step-index">3</span>
              <div>
                <Typography.Text strong>开启第一个 Agent</Typography.Text>
                <Typography.Text type="secondary">试跑一次，结果由你确认后才会生效。</Typography.Text>
              </div>
            </div>
          </div>
          <div className="onboarding-welcome-trust">
            <SafetyCertificateOutlined /> 全程只读，任何写入都需要你确认
          </div>
          <Button type="primary" size="large" block icon={<RocketOutlined />} onClick={startFromWelcome}>
            开始连接店铺
          </Button>
          <Button type="text" block onClick={dismissWelcomeLater}>稍后再说</Button>
        </div>
      </Modal>

      {showResume && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={() => setShowResume(false)}
          message={t('storewizard.resumeBanner')}
          action={<Button size="small" onClick={startOver}>{t('storewizard.startOver')}</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {!journey ? (
        <div className="onboarding-welcome">
          <div className="onboarding-welcome-copy">
            <div className="onboarding-eyebrow"><span /> 你的套餐已生效</div>
            <Typography.Title>{isFirstTimeMerchant ? '先连接你的第一家店铺' : '先告诉我们，你现在想完成什么？'}</Typography.Title>
            <Typography.Paragraph>无需理解复杂配置，跟着步骤完成授权，剩下的交给 AllMall。</Typography.Paragraph>
            <div className="onboarding-eta"><ThunderboltOutlined /> 预计约 3 分钟 · 共 {importSteps.length} 步 · 进度自动保存</div>
          </div>
          <JourneyChoice onSelect={selectJourney} allowMigrate={!isFirstTimeMerchant} />
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
              <div className="onboarding-aside-eta">第 {step + 1} / {steps.length} 步 · 进度自动保存</div>
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
              {/* A9/A7: the first-agent card is the star of the finish screen. Once the
                  agent has run, "进入经营总览" steps down to a secondary escape so the
                  primary "去第一个审批" CTA in the card stays visually dominant. */}
              {isLastStep && journey === 'import' && (
                <Button type={agentMoment === 'done' ? 'default' : 'primary'} size="large" onClick={finishToDashboard}>
                  进入经营总览
                </Button>
              )}
              {isLastStep && journey === 'migrate' && publishProgress === 100 && (
                <Button type="primary" size="large" onClick={finishMigration}>前往商品管理 <ArrowRightOutlined /></Button>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
