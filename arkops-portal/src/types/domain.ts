export type StoreStatus = 'pending_login' | 'connected' | 'login_required' | 'expired' | 'revoked';
export type StoreAuthMethod = 'credentials' | 'api_key' | 'oauth';
export type StoreServiceType = 'store_backend' | 'advertising' | 'customer_service' | 'logistics' | 'finance' | 'other';
export type TaskStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AllMallId = number;

export interface StoreConnection {
  id: AllMallId;
  serviceName: string;
  serviceType: StoreServiceType;
  authMethod: StoreAuthMethod;
  status: StoreStatus;
  apiKey?: string;
  apiSecret?: string;
  account?: string;
  runtimeProvider: 'mulerun' | 'direct';
  runtimeSessionId?: string;
  lastVerifiedAt?: string;
  createdAt: string;
}

export interface Store {
  id: AllMallId;
  name: string;
  platform: string;
  status: StoreStatus;
  authMethod: StoreAuthMethod;
  runtimeProvider: 'mulerun';
  runtimeSessionId?: string;
  apiKey?: string;
  apiSecret?: string;
  oauthProvider?: string;
  account?: string;
  region?: string;
  currency?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  recentTaskIds: AllMallId[];
  connections: StoreConnection[];
}

export interface TimelineEvent {
  id: AllMallId;
  type:
    | 'run_started'
    | 'step_started'
    | 'step_completed'
    | 'approval_required'
    | 'login_required'
    | 'run_succeeded'
    | 'run_failed';
  title: string;
  summary: string;
  at: string;
  artifactUrl?: string;
}

export interface Task {
  id: AllMallId;
  title: string;
  storeId: AllMallId;
  agentType: AgentType;
  goal: string;
  status: TaskStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface Approval {
  id: AllMallId;
  taskId: AllMallId;
  storeId: AllMallId;
  storeName: string;
  agentType: string;
  title: string;
  reason: string;
  proposedAction: string;
  beforeValue: string;
  afterValue: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedAt: string;
  decidedAt?: string;
}

export type AuditCategory = 'approval' | 'agent_action' | 'human_ops' | 'system_event' | 'store_session';

export interface AuditLog {
  id: AllMallId;
  actor: string;
  action: string;
  entity: string;
  entityId: AllMallId | string;
  summary: string;
  at: string;
  category: AuditCategory;
  linkTo?: string;
}

export interface Member {
  id: AllMallId;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Operator' | 'Approver' | 'Finance' | 'Viewer';
  status: 'active' | 'invited';
}

// ===== Agent Management =====

export type AgentTriggerMode = 'manual' | 'scheduled' | 'event';

export type AgentType =
  | 'login_bootstrap'
  | 'product_launch'
  | 'ads_optimizer'
  | 'pricing_strategy'
  | 'crm_retention'
  | 'review_manager'
  | 'customer_service'
  | 'after_sales'
  | 'competitor_intel'
  | 'creative_factory'
  | 'inventory_alert'
  | 'risk_control'
  | 'finance_audit'
  | 'promotion_campaign'
  | 'live_stream_ops';

export type AgentLayer = 'foundation' | 'traffic' | 'growth' | 'support' | 'standalone';

export interface AgentConfig {
  agentType: AgentType;
  displayName: string;
  description: string;
  icon: string;
  layer: AgentLayer;
  riskLevel: RiskLevel;
  triggerMode: AgentTriggerMode;
  needsConfig: boolean;
  needsApproval: boolean;
  dependsOn: AgentType[];
  servesFor: AgentType[];
  required: boolean;           // 必须启用，不可关闭
  cronExpression?: string;
  eventTrigger?: string;
  executionParams: { key: string; label: string; defaultValue: string; type?: 'number' | 'text' | 'select'; options?: string[] }[];
  riskGuard: {
    maxBudgetPerAction: number;
    actionWhitelist: string[];
    actionBlacklist: string[];
  };
  approvalStrategy: {
    requireApproval: boolean;
    approverRole: string;
    requireSecondApproval: boolean;
  };
  modelBinding: {
    provider: string;
    model: string;
  };
  retryPolicy: {
    maxRetries: number;
    retryIntervalMinutes: number;
  };
  timeoutMinutes: number;
  enabled: boolean;
  strategyConfig?: AgentStrategyConfig;
}

export type PricingMode = 'market' | 'cost' | 'manual';

export interface AgentStrategyConfig {
  pricingRule?: {
    mode: PricingMode;
    // 市场驱动
    targetMargin?: number;
    competitorStrategy?: 'undercut' | 'match' | 'premium';
    // 成本驱动
    costMultiplier?: number;
    roundUp?: boolean;
    costFile?: string;
    // 自主定价
    floorPrice?: number;
    ceilingPrice?: number;
    // 通用
    currency: string;
  };
  adSpendBudget?: { dailyCap: number; monthlyCap: number; targetROI?: number; lookbackDays?: number };
  seoKeywords?: { keywords: string[]; lastGenerated: string; source: string };
  targetAudience?: { tags: string[]; lastGenerated: string; source: string };
  crmConfig?: { discountCap: number; segmentCount: number };
  afterSalesConfig?: { autoRefundCap: number; returnAddress: string };
  creativeConfig?: { outputSizes: string; copyTone: string };
  riskControlConfig?: RiskControlConfig;
  inventoryConfig?: { lowStockThreshold: number; deadStockDays: number; autoReplenishEnabled: boolean; replenishLeadTimeDays: number };
  intelConfig?: { monitorFrequencyHours: number; monitoredCategories: string[]; competitorUrls: string[] };
  financeConfig?: { autoReconcileDay: number; discrepancyAlertThreshold: number; autoGenerateReport: boolean };
  promotionConfig?: { maxDiscountPercent: number; campaignBudget: number; autoSchedule: boolean; targetPlatforms: string[] };
  liveStreamConfig?: { autoPinProducts: boolean; replyTemplate: string; performanceAlertThreshold: number; peakHourBoost: boolean };
  reviewConfig?: { autoReplyThreshold: number; replyTone: string };
  csConfig?: { autoReplyEnabled: boolean; escalateKeywords: string[] };
  bootstrapConfig?: { notifyChannels: string };
  productLaunchConfig?: { defaultCategory: string; targetMarket: string };
}

export interface RiskControlConfig {
  compliance: {
    adLawFilter: boolean;          // 广告法禁用词过滤
    platformRuleCheck: boolean;    // 平台规则合规检测
    falseClaimDetection: boolean;  // 虚假宣传检测
  };
  behavior: {
    roiFloorThreshold: number;     // ROI 红线
    actionFrequencyLimit: number;  // 操作频率限制（次/分钟）
    priceDeviationPercent: number; // 价格异常偏差阈值（%）
  };
  business: {
    minPriceRatio: number;         // 最低售价（成本×）
    categoryMatchCheck: boolean;   // 类目错放检测
    imageComplianceCheck: boolean; // 图片合规检测（水印/Logo/版权）
    inventorySafetyCheck: boolean; // 库存透支保护
    negativeReviewSurgeCheck: boolean; // 差评激增预警
  };
}

export interface AgentRunStats {
  totalRuns: number;
  successRate: number;
  avgDurationMinutes: number;
  avgTokenUsage: number;
  avgCost: number;
  trend: { date: string; runs: number; successRate: number }[];
  failureReasons: { reason: string; count: number }[];
}

// ===== Store Config =====

export interface StoreConfig {
  storeId: AllMallId;
  riskThresholds: {
    maxBudgetAdjustment: number;
    highRiskActions: string[];
  };
  operationWindow: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  autoReconnect: {
    enabled: boolean;
    retryAfterMinutes: number;
    maxRetries: number;
  };
  approvalRules: {
    useIndependentApprover: boolean;
    approverMemberId?: AllMallId;
    enableSecondApproval: boolean;
  };
}

// ===== Approval Policy =====

export interface ApprovalPolicy {
  id: AllMallId;
  riskLevel: RiskLevel;
  action: 'auto_execute' | 'single_approval' | 'dual_approval';
  approverType: 'role' | 'specific';
  approverRole?: string;
  approverMemberId?: AllMallId;
  timeoutHours: number;
  timeoutAction: 'auto_reject' | 'auto_approve' | 'escalate';
  storeSpecificRules: { storeId: AllMallId; riskLevel: RiskLevel; action: string }[];
}

// ===== Business Dashboard Metrics =====

export interface BusinessMetrics {
  gmv: { today: number; yesterday: number; lastWeekSameDay: number };
  orders: { today: number; yesterday: number; lastWeekSameDay: number };
  aov: number;
  storeCount: { online: number; total: number };
  gmvTrend: { date: string; gmv: number; orders: number }[];
  storeGmvRank: { storeName: string; gmv: number; platform: string }[];
  adMetrics: {
    todaySpend: number;
    roas: number;
    cpm: number;
    cpc: number;
    ctr: number;
    cvr: number;
    budgetLimit: number;
    targetRoas: number;
    trend: { date: string; spend: number; gmv: number }[];
    lowPerformingPlans: { name: string; spend: number; roi: number }[];
  };
  afterSales: {
    returnRate: number;
    returnAmount: number;
    negativeReviews: number;
    respondedReviews: number;
    reviewResponseRate: number;
    storeRating: number;
    disputes: { pending: number; processing: number };
    avgResponseMinutes: number;
    reviewTrend: { date: string; returnRate: number; negativeCount: number }[];
  };
  inventory: {
    totalSkus: number;
    lowStockCount: number;
    slowMovingCount: number;
    outOfStockCount: number;
  };
}

// ===== Finance =====

export interface SubscriptionPlan {
  tier: 'Free' | 'Starter' | 'Professional' | 'Enterprise';
  storeLimit: number;
  agentConcurrency: number;
  monthlyOps: number;
  tokenQuota: number;
  price: number;
  currency: string;
}

export interface BillingDetail {
  baseSubscription: number;
  overageItems: { description: string; amount: number; currency: string }[];
  discount: number;
  total: number;
  currency: string;
}

export interface BillingRecord {
  id: string;
  period: string;
  status: 'pending' | 'paid' | 'overdue';
  amount: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  invoiceUrl?: string;
}

export interface CostAnalysis {
  byStore: { storeName: string; agentCalls: number; tokenCost: number }[];
  byAgent: { agentType: string; calls: number; cost: number }[];
  estimatedSaving: { manualCostPerOp: number; automatedOps: number; savedAmount: number };
  recommendation: string;
}

// ===== Model Management =====

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  apiKey?: string;
  active: boolean;
}

export interface ModelUsageStats {
  modelId: string;
  modelName: string;
  totalCalls: number;
  totalTokens: number;
  trend: { date: string; calls: number }[];
}

export interface AgentModelBinding {
  agentType: AgentType;
  agentDisplayName: string;
  boundModelId: string;
  boundModelName: string;
}

// ===== Store Business Detail =====

export interface StoreBusinessDetail {
  storeId: AllMallId;
  storeName: string;
  gmv: { today: number; yesterday: number; trend: { date: string; value: number }[] };
  orders: { today: number; yesterday: number; trend: { date: string; value: number }[] };
  aov: number;
  adMetrics: {
    todaySpend: number;
    roas: number;
    cpm: number;
    cpc: number;
    ctr: number;
    cvr: number;
    budgetLimit: number;
    trend: { date: string; spend: number; gmv: number }[];
    campaigns: { name: string; spend: number; roi: number; status: string }[];
  };
  afterSales: {
    returnRate: number;
    returnAmount: number;
    negativeReviews: number;
    unresolvedReviews: number;
    storeRating: number;
    disputes: { pending: number; processing: number };
  };
  inventory: {
    totalSkus: number;
    lowStockCount: number;
    slowMovingCount: number;
    outOfStockCount: number;
    lowStockItems: { sku: string; name: string; stock: number; safetyStock: number }[];
  };
  topProducts: { name: string; gmv: number; orders: number; sku: string }[];
}
