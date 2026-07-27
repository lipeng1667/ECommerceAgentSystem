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
  /** Predicted session expiry time — shown in proactive expiry warnings (D7.3). */
  authExpiresAt?: string;
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
  // WS-B (B3/B4): appended optional fields — structured evidence & decision metadata
  evidence?: ApprovalEvidenceField[];
  decisionNote?: string;
  decidedBy?: string;
  priorApprovals?: PriorApprovalRecord[];
}

export type AuditCategory = 'approval' | 'agent_action' | 'human_ops' | 'system_event' | 'store_session' | 'task' | 'agent' | 'exception' | 'store';

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
    autoApproveRules?: { maxOrderValue?: number; maxPriceChangePct?: number; maxBudgetChange?: number; lowRiskOnly?: boolean };
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
  intelConfig?: { monitorFrequencyHours: number; monitoredCategories: string[]; competitorUrls: string[]; priceAlertThresholdPct: number; autoPushDownstream: boolean };
  financeConfig?: { autoReconcileDay: number; discrepancyAlertThreshold: number; autoGenerateReport: boolean };
  promotionConfig?: { maxDiscountPercent: number; campaignBudget: number; autoSchedule: boolean; targetPlatforms: string[]; autoTriggerRules: { deadStockDays: number; deadStockDiscount: number; lowStockClearance: boolean; competitorPriceDropThreshold: number; seasonalAutoPromo: boolean } };
  liveStreamConfig?: { autoPinProducts: boolean; replyTemplate: string; performanceAlertThreshold: number; peakHourBoost: boolean };
  reviewConfig?: { autoReplyThreshold: number; replyTone: string };
  csConfig?: { autoReplyEnabled: boolean; escalateKeywords: string[] };
  bootstrapConfig?: { notifyChannels: string; checkIntervalMinutes: number; maxRetries: number; autoRelaunchEnabled: boolean };
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

// ===== WS-D: Scenario-first configuration & agent trust (S2/S3/S4) =====

/** 5 个托管场景包（product-design.md 五、D1 决策） */
export type ScenarioKey =
  | 'pricing_promo'      // 智能定价与促销
  | 'cs_aftersales'      // 客服与售后
  | 'inventory'          // 库存与补货
  | 'fulfillment_risk'   // 订单履约与风控
  | 'listing_content';   // 商品上架与内容

/** 场景自主等级：L1 全部需审批 / L2 仅高风险需审批 / L3 仅通知（D5 决策） */
export type AutonomyLevel = 'L1' | 'L2' | 'L3';

/** 场景的按店铺参数覆盖（scenario defaults → per-store overrides → per-agent advanced） */
export type ScenarioStoreOverride = Record<string, number | string | boolean>;

/** 场景运行时状态（mock 层持久化） */
export interface ScenarioState {
  key: ScenarioKey;
  enabled: boolean;
  autonomy: AutonomyLevel;
  /** 连续获批准的执行次数 — 用于"信任累积"建议 */
  approvedRunsStreak: number;
  /** 用户已忽略当前放宽建议 */
  trustSuggestionDismissed: boolean;
  /** storeId → 参数覆盖 */
  storeOverrides: Record<string, ScenarioStoreOverride>;
}

/** 周报摘要占位数据（S3 weekly digest stub） */
export interface WeeklyDigest {
  weekLabel: string;
  autonomousActions: number;
  approvalsRequested: number;
  approvalsApproved: number;
  hoursSaved: number;
  perScenario: { key: ScenarioKey; actions: number; approvals: number }[];
}

/** 决策与结果记录（S4 outcomes 数据契约，mock） */
export interface AgentOutcomeRecord {
  id: AllMallId;
  agentType: AgentType;
  /** 动作描述，如 "上调 SKU A-102 售价 ¥86 → ¥92" */
  action: string;
  decidedAt: string;
  decision: 'auto' | 'approved' | 'rejected';
  /** 关联指标名，如 "日均销量" */
  metric: string;
  before: string;
  after3d: string;
  /** 未回收时为空 */
  after7d?: string;
  assessment: 'positive' | 'neutral' | 'negative' | 'pending';
  assessmentNote: string;
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

// ===== WS-F: Notification channels & event matrix (appended) =====

export type NotificationChannelType = 'feishu' | 'dingtalk' | 'webhook';

export type NotificationEventKey = 'approval_required' | 'relogin_required' | 'run_failed';

export interface NotificationChannelConfig {
  id: string;
  type: NotificationChannelType;
  name: string;
  status: 'connected' | 'not_configured';
  endpoint?: string;
  /** Event subscription matrix: which runtime events this channel receives. */
  events: Record<NotificationEventKey, boolean>;
}

// ===== WS-B: Action Inbox & approval evidence (appended) =====

/**
 * WS-B (B3): one structured before/after evidence field for an approval.
 * `beforeNumeric`/`afterNumeric` allow deltas to be computed from data
 * instead of being hardcoded in the UI; `unit` renders alongside deltas.
 */
export interface ApprovalEvidenceField {
  label: string;
  before: string;
  after: string;
  beforeNumeric?: number;
  afterNumeric?: number;
  unit?: string;
}

/** WS-B (B4): one completed approval step for dual-approval progress. */
export interface PriorApprovalRecord {
  approver: string;
  at: string;
  note?: string;
}

/** WS-B (B1): item kinds aggregated by the unified Action Inbox (/inbox). */
/**
 * 'product_draft' added in D6/§3.14.9: draft/pending_review product listings fold into
 * the inbox. 'product_new'/'product_merge'/'product_conflict' added for Smart Sync
 * Tier 2 decisions (§ Smart Sync, Node 3) — 'store_relogin' reuses the existing
 * 'relogin' kind rather than introducing a parallel representation.
 */
export type InboxItemKind = 'approval' | 'exception' | 'relogin' | 'product_draft' | 'product_new' | 'product_merge' | 'product_conflict';

// ===== Products (D6: SPU + per-store Listing, product-design.md §3.14) =====
//
// A row in the product list is a merchant-owned master product (SPU), unique across
// stores. The store is an *attribute* of the product — how/where it's listed — not the
// primary grouping. A master may exist with zero listings (create first, list later).
// "Not listed on store X" is derived (merchant's stores − stores with a listing), never
// stored redundantly.

export type ListingStatus = 'listed' | 'draft' | 'pending_review' | 'delisted';
export type InventoryMode = 'shared' | 'independent';
/** Provenance of a master attribute value: seeded from a store's sync, or user-edited (locked from sync overwrite). */
export type AttributeProvenance = { source: 'ai'; storeId: AllMallId } | { source: 'manual' };

/** Per-field provenance for the master attributes that can be AI-seeded then user-locked (D6 sub-decision 2). */
export interface ProductProvenance {
  name: AttributeProvenance;
  images: AttributeProvenance;
  category: AttributeProvenance;
  cost: AttributeProvenance;
  description: AttributeProvenance;
}

/** Master product (SPU) — merchant-owned, unique across stores. May have zero listings. */
export interface Product {
  id: AllMallId;
  /** Merchant SKU/货号 — the primary merge key for cross-store matching (D6 sub-decision 1). */
  spuCode: string;
  name: string;
  images: string[];
  category: string;
  cost: number;
  description: string;
  /** Shared total stock pool the master holds; listings draw from or carve out of it. */
  totalStock: number;
  /** Store whose values seeded the master attributes; snapshotted default = highest GMV, user-overridable. */
  primaryStoreId: AllMallId;
  provenance: ProductProvenance;
  createdBy: 'ai' | 'manual';
  createdAt: string;
}

/** A product's presence on one store — the "shelf listing", not the product itself. */
export interface ProductListing {
  id: AllMallId;
  productId: AllMallId;
  storeId: AllMallId;
  /** External platform product/SKU reference — not an AllMall-owned id. */
  platformSkuRef: string;
  sellingPrice: number;
  status: ListingStatus;
  inventoryMode: InventoryMode;
  /** Only meaningful when inventoryMode === 'independent': a fixed slice carved from the product's totalStock. */
  allocation?: number;
  /** Only meaningful when inventoryMode === 'shared': reserved from the shared pool, never sold. */
  safetyStock?: number;
  lastSyncedAt: string;
}

/** Derived, never stored: available-to-sell units for one listing (D6 sub-decision 3). */
export function listingAvailableStock(product: Product, listing: ProductListing): number {
  if (listing.inventoryMode === 'independent') return listing.allocation ?? 0;
  return Math.max(0, product.totalStock - (listing.safetyStock ?? 0));
}

/** A "possible duplicate" match between two masters awaiting human review (60–95% confidence band, D6 sub-decision 1). */
export interface ProductMergeSuggestion {
  id: AllMallId;
  productAId: AllMallId;
  productBId: AllMallId;
  confidence: number;
  /** Which signals contributed to the match, for the reviewer to judge (e.g. "标题相似度 92%"). */
  matchFactors: string[];
  createdAt: string;
}

// ===== Smart Sync (Products) — one-way platform → AllMall read-only pull =====
//
// The system proactively syncs, reconciles, and pre-computes recommendations in the
// background; the merchant reviews a results digest and confirms (mostly one-click)
// instead of operating step by step. Sync only pulls; listing/price pushes back to a
// platform go only through the existing publish flow (list-to-store, edit listing).
//
// Two tiers: Tier 0/1 changes are low-risk and applied automatically (price/stock
// updates, delists, and ≥95%-confidence/same-SPU matches); Tier 2 changes need a human
// call and surface as Action Inbox decisions with an AI-recommended default.

export type SyncRunStatus = 'idle' | 'running' | 'success' | 'failed';

/** A low-risk change the sync engine applied automatically, with no review needed (Tier 0/1). */
export interface AutoSyncChange {
  id: AllMallId;
  type: 'price_update' | 'stock_update' | 'delist' | 'auto_merge';
  productId: AllMallId;
  storeId?: AllMallId;
  summary: string;
  at: string;
}

/** The kinds of decisions a sync pass can leave pending for a human (Tier 2). 'store_relogin' is represented by the existing relogin inbox item, not a stored record here. */
export type SyncDecisionType = 'new_product' | 'merge_suggestion' | 'field_conflict' | 'store_relogin';

/** One store's health as of the last sync pass — derived, not stored redundantly. */
export interface StoreSyncHealth {
  storeId: AllMallId;
  lastSyncedAt: string | null;
  needsRelogin: boolean;
  /** Connected but hasn't synced recently. */
  stale: boolean;
}

/** The digest of one sync pass — what the merchant reviews instead of operating step by step. */
export interface SyncResult {
  startedAt: string;
  /** Timestamp of the last *successful* pass — kept as-is (not overwritten) on failure. */
  lastSyncedAt: string;
  status: SyncRunStatus;
  autoApplied: AutoSyncChange[];
  pendingDecisionCount: number;
  perStore: StoreSyncHealth[];
  /** Set when status is 'failed'. */
  errorMessage?: string;
}

/** A platform listing the sync pass couldn't confidently match to an existing master (Tier 2). */
export interface NewProductCandidate {
  id: AllMallId;
  storeId: AllMallId;
  platformSkuRef: string;
  name: string;
  images: string[];
  category: string;
  cost: number;
  sellingPrice: number;
  recommendation: 'create_new' | 'likely_duplicate';
  /** Set when recommendation is 'likely_duplicate'. */
  possibleDuplicateOfProductId?: AllMallId;
  createdAt: string;
}

/** A manually-locked master field the platform tried to change during sync (Tier 2, D6 sub-decision 2). */
export interface FieldConflict {
  id: AllMallId;
  productId: AllMallId;
  storeId: AllMallId;
  field: 'name' | 'category' | 'cost' | 'description';
  yourValue: string;
  platformValue: string;
  recommendation: 'keep_yours' | 'accept_platform';
  createdAt: string;
}

// ===== Orders (D8: orders smart flow) =====

export type OrderStatus = 'auto_processing' | 'awaiting_shipment' | 'auto_shipped' | 'auto_completed' | 'exception' | 'fraud_blocked' | 'cancelled';

/** Statuses handled end-to-end by automation (cancellations deliberately excluded). */
export const AUTO_FLOW_ORDER_STATUSES: OrderStatus[] = ['auto_processing', 'awaiting_shipment', 'auto_shipped', 'auto_completed'];
export const EXCEPTION_ORDER_STATUSES: OrderStatus[] = ['exception', 'fraud_blocked'];

export type OrderExceptionType = 'address_invalid' | 'fraud_suspected' | 'out_of_stock' | 'payment_failed' | 'buyer_dispute';

/** Priority-based urgency: breached > critical > warning > ok. */
export type OrderSlaTone = 'ok' | 'warning' | 'critical' | 'breached';

export interface OrderTimelineStep {
  title: string;
  at: string; // ISO
  icon: 'check' | 'shield' | 'truck' | 'sync' | 'warning' | 'stop' | 'close';
  /** Only set for automation-produced steps. */
  automated?: boolean;
  estimated?: string;
  /** Operator-entered reason recorded with manual interventions. */
  note?: string;
}

export interface OrderRecommendation {
  action: 'apply_address_fix' | 'reallocate_stock' | 'send_payment_reminder' | 'release' | 'cancel_refund';
  label: string;
  rationale: string;
  /** How confident the system is in its recommendation (0-1). Above 0.7 = strong, recommend accepting. */
  confidence: number;
  /** Whether this recommendation can be batched with other orders of the same type. */
  batchable: boolean;
}

export interface Order {
  id: AllMallId;
  orderNo: string; // display string, e.g. #ORD-2406-0820
  /** Relationship field; the display name is resolved from the store list. */
  storeId: AllMallId;
  buyerName: string;
  items: string;
  amount: number;
  status: OrderStatus;
  trackingNo?: string;
  logisticsStatus?: string;
  exceptionType?: OrderExceptionType;
  exceptionReason?: string;
  agentAction: string;
  createdAt: string; // ISO
  paidAt?: string; // ISO — when payment was confirmed
  /** Derived from paidAt + platform fulfillment SLA (A1 assumption). */
  shipDeadlineAt?: string; // ISO
  timeline: OrderTimelineStep[];
  /** Recommendation from the mock engine for exceptions; absent for non-exception orders. */
  recommendation?: OrderRecommendation;
}
