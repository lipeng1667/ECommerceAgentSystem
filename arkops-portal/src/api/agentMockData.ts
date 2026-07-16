import type { AgentConfig, AgentRunStats } from '../types/domain';

/* ===== 15 Agent 完整配置 ===== */

const nowStr = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export const agentConfigs: AgentConfig[] = [
  // ===== 基础管道 =====
  {
    agentType: 'login_bootstrap',
    displayName: '店铺保活 Agent',
    description: '维持店铺登录态，掉线自动拉起，通知运营处理复杂验证。',
    icon: 'login',
    layer: 'foundation',
    riskLevel: 'low',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
    servesFor: ['product_launch', 'ads_optimizer', 'pricing_strategy', 'crm_retention', 'review_manager', 'customer_service', 'after_sales', 'competitor_intel', 'creative_factory', 'inventory_alert', 'live_stream_ops'],
    required: true,
    eventTrigger: 'store_session_expired',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['notify_operator', 'create_session'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'DeepSeek', model: 'deepseek-chat' },
    retryPolicy: { maxRetries: 3, retryIntervalMinutes: 2 },
    timeoutMinutes: 10,
    enabled: true,
    strategyConfig: {
      bootstrapConfig: { notifyChannels: '飞书,邮件', checkIntervalMinutes: 30, maxRetries: 3, autoRelaunchEnabled: true }
    }
  },
  {
    agentType: 'product_launch',
    displayName: '商品上架 Agent',
    description: '上传商品图片，AI 自动解析商品信息，生成 SEO 标题、卖点文案、详情页并上架。',
    icon: 'product',
    layer: 'foundation',
    riskLevel: 'medium',
    triggerMode: 'manual',
    needsConfig: true,
    needsApproval: true,
    dependsOn: ['risk_control'],
    required: false,
    servesFor: ['ads_optimizer', 'live_stream_ops'],
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['create_draft', 'publish_product'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: true, approverRole: 'Operator', requireSecondApproval: false },
    modelBinding: { provider: 'Anthropic', model: 'claude-sonnet-4-20250514' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 3 },
    timeoutMinutes: 20,
    enabled: false,
    strategyConfig: {
      productLaunchConfig: { defaultCategory: '', targetMarket: 'US' },
      seoKeywords: { keywords: ['fast charger', 'GaN charger', '65W charger', 'USB-C PD', '快充充电器'], lastGenerated: '2h ago', source: 'AI generated from product images' },
      targetAudience: { tags: ['tech enthusiasts', 'travelers', 'professionals', '数码爱好者'], lastGenerated: '2h ago', source: 'AI inferred from product category' }
    }
  },

  // ===== 流量引擎 =====
  {
    agentType: 'ads_optimizer',
    displayName: '广告投放 Agent',
    description: '根据目标 ROI 自动创建、调整、暂停广告计划。结合竞品数据优化投放策略。',
    icon: 'ads',
    layer: 'traffic',
    riskLevel: 'high',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: true,
    dependsOn: ['product_launch', 'competitor_intel', 'creative_factory'],
      required: false,
    servesFor: [],
    cronExpression: '0 */6 * * *',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 200, actionWhitelist: ['adjust_budget', 'pause_campaign', 'create_campaign'], actionBlacklist: ['delete_campaign'] },
    approvalStrategy: { requireApproval: true, approverRole: 'Approver', requireSecondApproval: false, autoApproveRules: { maxBudgetChange: 50 } },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 5 },
    timeoutMinutes: 30,
    enabled: false,
    strategyConfig: {
      adSpendBudget: { dailyCap: 500, monthlyCap: 10000, targetROI: 2.0, lookbackDays: 7 }
    }
  },
  {
    agentType: 'pricing_strategy',
    displayName: '定价策略 Agent',
    description: '根据竞品价格、成本和目标利润率动态调整商品售价，保持竞争力。',
    icon: 'ads',
    layer: 'traffic',
    riskLevel: 'medium',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: true,
    dependsOn: ['competitor_intel'],
      required: false,
    servesFor: [],
    cronExpression: '0 */4 * * *',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['adjust_price', 'set_sale_price'], actionBlacklist: ['set_below_floor'] },
    approvalStrategy: { requireApproval: true, approverRole: 'Operator', requireSecondApproval: false, autoApproveRules: { maxPriceChangePct: 5 } },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o-mini' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 5 },
    timeoutMinutes: 15,
    enabled: false,
    strategyConfig: {
      pricingRule: {
        mode: 'market',
        targetMargin: 30,
        competitorStrategy: 'undercut',
        currency: 'USD'
      }
    }
  },

  // ===== 增值运营 =====
  {
    agentType: 'crm_retention',
    displayName: 'CRM 复购 Agent',
    description: '分析客户购买行为，自动发放优惠券和触达消息，提升复购率。',
    icon: 'crm',
    layer: 'growth',
    riskLevel: 'medium',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
    required: false,
    servesFor: [],
    cronExpression: '0 0 * * 1',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 100, actionWhitelist: ['send_coupon', 'send_email'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'DeepSeek', model: 'deepseek-chat' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 10 },
    timeoutMinutes: 25,
    enabled: false,
    strategyConfig: {
      crmConfig: { discountCap: 20, segmentCount: 3 }
    }
  },
  {
    agentType: 'review_manager',
    displayName: '评价管理 Agent',
    description: '监控差评，自动生成回复模板，标记需人工处理的敏感评价。',
    icon: 'crm',
    layer: 'growth',
    riskLevel: 'low',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
      required: false,
    servesFor: [],
    cronExpression: '0 */2 * * *',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['generate_reply', 'post_reply'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'DeepSeek', model: 'deepseek-chat' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 3 },
    timeoutMinutes: 10,
    enabled: false,
    strategyConfig: {
      reviewConfig: { autoReplyThreshold: 2, replyTone: '专业友好' }
    }
  },
  {
    agentType: 'customer_service',
    displayName: '客服消息 Agent',
    description: '自动回复买家售前咨询，常见问题智能应答，复杂问题转人工。',
    icon: 'crm',
    layer: 'growth',
    riskLevel: 'low',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
      required: false,
    servesFor: [],
    eventTrigger: 'new_buyer_message',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['auto_reply', 'escalate_to_human'], actionBlacklist: ['promise_refund'] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o-mini' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 1 },
    timeoutMinutes: 5,
    enabled: false,
    strategyConfig: {
      csConfig: { autoReplyEnabled: true, escalateKeywords: ['退款', '投诉', '差评', '质量问题'] }
    }
  },
  {
    agentType: 'after_sales',
    displayName: '售后处理 Agent',
    description: '自动审核退货退款请求，物流追踪，低于阈值的订单自动通过。',
    icon: 'crm',
    layer: 'growth',
    riskLevel: 'medium',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: true,
    dependsOn: [],
      required: false,
    servesFor: [],
    eventTrigger: 'return_request_created',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 50, actionWhitelist: ['approve_return', 'issue_refund', 'track_logistics'], actionBlacklist: ['bulk_refund'] },
    approvalStrategy: { requireApproval: true, approverRole: 'Operator', requireSecondApproval: false },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o-mini' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 5 },
    timeoutMinutes: 15,
    enabled: false,
    strategyConfig: {
      afterSalesConfig: { autoRefundCap: 20, returnAddress: '' } // 空地址时 Agent 不自动通过退货，转为审批
    }
  },

  // ===== 支撑 Agent =====
  {
    agentType: 'competitor_intel',
    displayName: '市场情报 Agent',
    description: '采集竞品数据（价格/促销/SEO/人群）和市场趋势（热词/类目/消费者画像），为其他 Agent 提供数据燃料。',
    icon: 'ads',
    layer: 'support',
    riskLevel: 'low',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
    required: false,
    servesFor: ['product_launch', 'ads_optimizer', 'pricing_strategy', 'creative_factory', 'promotion_campaign'],
    cronExpression: '0 0 */2 * *',
    executionParams: [
      { key: 'competitorUrls', label: '竞品店铺 URL（换行分隔）', defaultValue: '' },
      { key: 'monitoredCategories', label: '监控类目', defaultValue: '消费电子,服装,家居' },
      { key: 'updateFrequencyH', label: '更新频率（小时）', defaultValue: '2', type: 'number' }
    ],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['scrape_data', 'analyze_market', 'analyze_trends'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'DeepSeek', model: 'deepseek-chat' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 30 },
    timeoutMinutes: 25,
    enabled: false,
    strategyConfig: {
      intelConfig: { monitorFrequencyHours: 2, monitoredCategories: ['消费电子', '服装', '家居'], competitorUrls: [], priceAlertThresholdPct: 5, autoPushDownstream: true }
    }
  },
  {
    agentType: 'creative_factory',
    displayName: '素材工厂 Agent',
    description: '从商品图片自动生成广告素材：主图裁剪、短视频、多尺寸投放图、广告文案。',
    icon: 'product',
    layer: 'support',
    riskLevel: 'medium',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: true,
    dependsOn: [],
      required: false,
    servesFor: ['ads_optimizer', 'product_launch'],
    eventTrigger: 'product_published',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['generate_image', 'generate_video', 'generate_copy'], actionBlacklist: ['use_competitor_logo'] },
    approvalStrategy: { requireApproval: true, approverRole: 'Operator', requireSecondApproval: false },
    modelBinding: { provider: 'Anthropic', model: 'claude-sonnet-4-20250514' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 5 },
    timeoutMinutes: 30,
    enabled: false,
    strategyConfig: {
      creativeConfig: { outputSizes: '1:1,16:9,9:16', copyTone: '简洁卖点' }
    }
  },
  {
    agentType: 'inventory_alert',
    displayName: '库存预警 Agent',
    description: '监控库存水位，低库存/滞销/断货自动告警并建议补货。',
    icon: 'product',
    layer: 'support',
    riskLevel: 'low',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
      required: false,
    servesFor: ['product_launch'],
    cronExpression: '0 */4 * * *',
    executionParams: [
      { key: 'safetyStockDays', label: '安全库存天数', defaultValue: '7', type: 'number' },
      { key: 'slowMovingDays', label: '滞销判定天数', defaultValue: '30', type: 'number' }
    ],
    riskGuard: { maxBudgetPerAction: 500, actionWhitelist: ['check_inventory', 'notify_operator', 'create_replenish_order'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false, autoApproveRules: { maxOrderValue: 500, lowRiskOnly: true } },
    modelBinding: { provider: 'DeepSeek', model: 'deepseek-chat' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 10 },
    timeoutMinutes: 10,
    enabled: false,
    strategyConfig: {
      inventoryConfig: { lowStockThreshold: 50, deadStockDays: 30, autoReplenishEnabled: true, replenishLeadTimeDays: 7 }
    }
  },

  // ===== 独立 =====
  {
    agentType: 'finance_audit',
    displayName: '财务对账 Agent',
    description: '自动拉取平台账单，标记差异，生成对账报告。',
    icon: 'finance',
    layer: 'standalone',
    riskLevel: 'medium',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: false,
    dependsOn: [],
      required: false,
    servesFor: [],
    cronExpression: '0 0 1 * *',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['fetch_billing', 'generate_report'], actionBlacklist: ['adjust_settlement'] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 5 },
    timeoutMinutes: 45,
    enabled: false,
    strategyConfig: {
      financeConfig: { autoReconcileDay: 5, discrepancyAlertThreshold: 100, autoGenerateReport: true }
    }
  },

  // ===== 风控 =====
  {
    agentType: 'risk_control',
    displayName: '风险控制 Agent',
    description: '全链路风控护栏：法规合规（广告法/平台规则）、行为监控（ROI/频率/价格）、业务保护（售价门槛/类目/图片/库存/差评）。开启后为所有 Agent 提供安全护栏。',
    icon: 'login',
    layer: 'standalone',
    riskLevel: 'high',
    triggerMode: 'scheduled',
    needsConfig: true,
    needsApproval: true,
    dependsOn: [],
    required: false,
    servesFor: ['login_bootstrap', 'product_launch', 'ads_optimizer', 'pricing_strategy', 'crm_retention', 'review_manager', 'customer_service', 'after_sales', 'competitor_intel', 'creative_factory', 'inventory_alert'],
    cronExpression: '0 */1 * * *',
    executionParams: [],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['detect_anomaly', 'trigger_circuit_breaker', 'notify_operator', 'block_violation'], actionBlacklist: [] },
    approvalStrategy: { requireApproval: true, approverRole: 'Owner', requireSecondApproval: false },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 2 },
    timeoutMinutes: 10,
    enabled: false,
    strategyConfig: {
      riskControlConfig: {
        compliance: {
          adLawFilter: true,
          platformRuleCheck: true,
          falseClaimDetection: true
        },
        behavior: {
          roiFloorThreshold: 1.2,
          actionFrequencyLimit: 10,
          priceDeviationPercent: 30
        },
        business: {
          minPriceRatio: 0.8,
          categoryMatchCheck: true,
          imageComplianceCheck: true,
          inventorySafetyCheck: true,
          negativeReviewSurgeCheck: true
        }
      }
    }
  },

  // ===== 促销活动 =====
  {
    agentType: 'promotion_campaign',
    displayName: '促销活动 Agent',
    description: '策划和管理闪购、大促、限时折扣等营销活动，自动创建活动计划、生成优惠策略、跨平台同步上线。',
    icon: 'crm',
    layer: 'growth',
    riskLevel: 'medium',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: true,
    dependsOn: ['competitor_intel'],
    required: false,
    servesFor: [],
    executionParams: [
      { key: 'defaultDurationDays', label: '默认活动周期（天）', defaultValue: '7', type: 'number' },
      { key: 'targetPlatforms', label: '目标平台', defaultValue: 'TikTok Shop,Amazon' }
    ],
    riskGuard: { maxBudgetPerAction: 500, actionWhitelist: ['create_campaign', 'set_discount', 'schedule_flash_sale', 'create_coupon_batch'], actionBlacklist: ['set_below_floor'] },
    approvalStrategy: { requireApproval: true, approverRole: 'Operator', requireSecondApproval: false, autoApproveRules: { maxBudgetChange: 200 } },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o-mini' },
    retryPolicy: { maxRetries: 1, retryIntervalMinutes: 5 },
    timeoutMinutes: 20,
    enabled: false,
    strategyConfig: {
      promotionConfig: { maxDiscountPercent: 50, campaignBudget: 2000, autoSchedule: true, targetPlatforms: ['TikTok Shop', 'Amazon'], autoTriggerRules: { deadStockDays: 60, deadStockDiscount: 35, lowStockClearance: true, competitorPriceDropThreshold: 15, seasonalAutoPromo: true } }
    }
  },

  // ===== 直播运营 =====
  {
    agentType: 'live_stream_ops',
    displayName: '直播运营 Agent',
    description: '自动化管理直播间的商品讲解排期、智能置顶热销品、自动回复评论区高频问题、实时监控直播数据（观看/成交/转化）。',
    icon: 'crm',
    layer: 'traffic',
    riskLevel: 'medium',
    triggerMode: 'event',
    needsConfig: true,
    needsApproval: false,
    dependsOn: ['product_launch'],
    required: false,
    servesFor: [],
    eventTrigger: 'live_stream_started',
    executionParams: [
      { key: 'productShowcaseDuration', label: '单品讲解时长（分钟）', defaultValue: '3', type: 'number' },
      { key: 'replyKeywords', label: '自动回复关键词', defaultValue: '价格,尺寸,材质,发货,优惠' }
    ],
    riskGuard: { maxBudgetPerAction: 0, actionWhitelist: ['pin_product', 'auto_reply', 'generate_script', 'monitor_metrics'], actionBlacklist: ['modify_price_live'] },
    approvalStrategy: { requireApproval: false, approverRole: '', requireSecondApproval: false },
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o-mini' },
    retryPolicy: { maxRetries: 2, retryIntervalMinutes: 1 },
    timeoutMinutes: 240,
    enabled: false,
    strategyConfig: {
      liveStreamConfig: { autoPinProducts: true, replyTemplate: '您好，{product} 正在直播优惠中，点击下方链接查看详情～', performanceAlertThreshold: 500, peakHourBoost: true }
    }
  }
];

/* ===== Agent 运行统计 ===== */

const makeTrend = (days: number, avgRuns: number, baseRate: number) => {
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    trend.push({
      date: d.toLocaleDateString('en', { weekday: 'short' }),
      runs: Math.round(avgRuns + (Math.random() - 0.5) * avgRuns * 0.4),
      successRate: Math.round(Math.min(100, Math.max(60, baseRate + (Math.random() - 0.5) * 10)))
    });
  }
  return trend;
};

export const agentRunStatsMap: Record<string, AgentRunStats> = {
  login_bootstrap: {
    totalRuns: 203, successRate: 76.8, avgDurationMinutes: 5, avgTokenUsage: 1800, avgCost: 0.02,
    trend: makeTrend(7, 29, 77),
    failureReasons: [{ reason: '人机校验超时', count: 28 }, { reason: '运营未响应', count: 15 }, { reason: 'Profile 失效', count: 4 }]
  },
  product_launch: {
    totalRuns: 87, successRate: 94.3, avgDurationMinutes: 12, avgTokenUsage: 8600, avgCost: 0.18,
    trend: makeTrend(7, 12, 94),
    failureReasons: [{ reason: '内容审核不通过', count: 3 }, { reason: '图片处理失败', count: 2 }]
  },
  ads_optimizer: {
    totalRuns: 142, successRate: 88.7, avgDurationMinutes: 18, avgTokenUsage: 12400, avgCost: 0.42,
    trend: makeTrend(7, 20, 89),
    failureReasons: [{ reason: '审批超时', count: 5 }, { reason: '店铺掉线', count: 4 }, { reason: 'API 限制', count: 3 }]
  },
  pricing_strategy: {
    totalRuns: 64, successRate: 92.2, avgDurationMinutes: 8, avgTokenUsage: 4500, avgCost: 0.06,
    trend: makeTrend(7, 9, 92),
    failureReasons: [{ reason: '竞品数据未更新', count: 3 }, { reason: '价格低于限价', count: 2 }]
  },
  crm_retention: {
    totalRuns: 56, successRate: 91.1, avgDurationMinutes: 15, avgTokenUsage: 7200, avgCost: 0.08,
    trend: makeTrend(7, 8, 91),
    failureReasons: [{ reason: '客户数据不完整', count: 3 }, { reason: '邮件发送失败', count: 2 }]
  },
  review_manager: {
    totalRuns: 330, successRate: 97.6, avgDurationMinutes: 3, avgTokenUsage: 2100, avgCost: 0.03,
    trend: makeTrend(7, 47, 98),
    failureReasons: [{ reason: '平台 API 限频', count: 5 }, { reason: '敏感词过滤', count: 3 }]
  },
  customer_service: {
    totalRuns: 512, successRate: 85.4, avgDurationMinutes: 2, avgTokenUsage: 1500, avgCost: 0.01,
    trend: makeTrend(7, 73, 85),
    failureReasons: [{ reason: '意图识别错误', count: 42 }, { reason: '转人工超时', count: 33 }]
  },
  after_sales: {
    totalRuns: 38, successRate: 89.5, avgDurationMinutes: 10, avgTokenUsage: 3200, avgCost: 0.05,
    trend: makeTrend(7, 5, 90),
    failureReasons: [{ reason: '物流信息缺失', count: 2 }, { reason: '超过自动退款上限', count: 2 }]
  },
  competitor_intel: {
    totalRuns: 180, successRate: 93.9, avgDurationMinutes: 15, avgTokenUsage: 9800, avgCost: 0.12,
    trend: makeTrend(7, 26, 94),
    failureReasons: [{ reason: '目标网站屏蔽', count: 6 }, { reason: '数据解析异常', count: 5 }]
  },
  creative_factory: {
    totalRuns: 45, successRate: 88.9, avgDurationMinutes: 22, avgTokenUsage: 18500, avgCost: 0.55,
    trend: makeTrend(7, 6, 89),
    failureReasons: [{ reason: '图片质量不足', count: 3 }, { reason: '生成超时', count: 2 }]
  },
  inventory_alert: {
    totalRuns: 720, successRate: 99.7, avgDurationMinutes: 2, avgTokenUsage: 800, avgCost: 0.01,
    trend: makeTrend(7, 103, 100),
    failureReasons: [{ reason: '数据同步延迟', count: 2 }]
  },
  finance_audit: {
    totalRuns: 24, successRate: 95.8, avgDurationMinutes: 22, avgTokenUsage: 15600, avgCost: 0.35,
    trend: makeTrend(7, 3, 96),
    failureReasons: [{ reason: '平台账单 API 超时', count: 1 }]
  },
  risk_control: {
    totalRuns: 1440, successRate: 99.2, avgDurationMinutes: 1, avgTokenUsage: 600, avgCost: 0.01,
    trend: makeTrend(7, 206, 99),
    failureReasons: [{ reason: '误报调整', count: 8 }, { reason: '数据延迟', count: 3 }]
  },
  promotion_campaign: {
    totalRuns: 12, successRate: 83.3, avgDurationMinutes: 15, avgTokenUsage: 5200, avgCost: 0.08,
    trend: makeTrend(7, 2, 83),
    failureReasons: [{ reason: '折扣低于限价', count: 1 }, { reason: '活动时间冲突', count: 1 }]
  },
  live_stream_ops: {
    totalRuns: 8, successRate: 100, avgDurationMinutes: 180, avgTokenUsage: 15000, avgCost: 0.25,
    trend: makeTrend(7, 1, 100),
    failureReasons: []
  }
};
