/**
 * Demo 模式专属 Mock 数据
 * 提供更丰富的运营场景数据，让用户在 2 分钟内看到完整运营闭环
 */
import type {
  AgentRunStats, Approval, Store,
  Task, Member
} from '../types/domain';

// ===== Demo 店铺 =====
export const demoStores: Store[] = [
  {
    id: 101, name: 'Demo 运动旗舰店', platform: 'Shopify',
    authMethod: 'api_key', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z', recentTaskIds: [4001, 4002, 4003],
    connections: [
      { id: 1, serviceName: 'Meta Ads', serviceType: 'advertising', authMethod: 'api_key', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
      { id: 2, serviceName: 'Zendesk', serviceType: 'customer_service', authMethod: 'api_key', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
      { id: 3, serviceName: 'ShipStation', serviceType: 'logistics', authMethod: 'api_key', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
      { id: 4, serviceName: 'QuickBooks', serviceType: 'finance', authMethod: 'api_key', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
    ],
  },
  {
    id: 102, name: 'Demo 数码配件店', platform: 'Amazon',
    authMethod: 'oauth', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z', recentTaskIds: [4007],
    connections: [
      { id: 5, serviceName: 'Amazon Ads', serviceType: 'advertising', authMethod: 'oauth', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
      { id: 6, serviceName: 'FBA', serviceType: 'logistics', authMethod: 'oauth', status: 'connected', runtimeProvider: 'mulerun', createdAt: '2026-07-01T00:00:00Z' },
    ],
  },
];

// ===== Demo 任务 =====
export const demoTasks: Task[] = [
  { id: 4001, title: '发布新品：透气跑步鞋 AirBoost 3.0', storeId: 101, agentType: 'product_launch', goal: '完成产品上架全流程', status: 'succeeded', riskLevel: 'low', createdAt: '2026-07-09T09:30:00Z', updatedAt: '2026-07-09T09:45:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '商品已上架', summary: '已发布到 Shopify。', at: '2026-07-09T09:45:00Z' }] },
  { id: 4002, title: '跑步鞋定价策略优化', storeId: 101, agentType: 'pricing_strategy', goal: '根据竞品数据调整定价', status: 'succeeded', riskLevel: 'medium', createdAt: '2026-07-09T10:00:00Z', updatedAt: '2026-07-09T10:15:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '定价已调整', summary: '从 $99.99 调至 $89.99。', at: '2026-07-09T10:15:00Z' }] },
  { id: 4003, title: 'Meta Ads 广告预算优化', storeId: 101, agentType: 'ads_optimizer', goal: '将低 ROI 广告预算转移', status: 'running', riskLevel: 'low', createdAt: '2026-07-09T10:30:00Z', updatedAt: '2026-07-09T10:30:00Z', timeline: [{ id: 1, type: 'run_started', title: '开始广告优化', summary: '正在分析近 7 天广告数据...', at: '2026-07-09T10:30:00Z' }] },
  { id: 4004, title: '回复 John D. 的 1 星差评', storeId: 101, agentType: 'review_manager', goal: '生成专业回复草稿', status: 'waiting_approval', riskLevel: 'high', createdAt: '2026-07-09T08:15:00Z', updatedAt: '2026-07-09T08:15:00Z', timeline: [{ id: 1, type: 'approval_required', title: '回复草稿已生成', summary: '等待运营人员审批。', at: '2026-07-09T08:15:00Z' }] },
  { id: 4005, title: '向 320 名沉睡客户发送唤醒优惠券', storeId: 101, agentType: 'crm_retention', goal: '召回 30 天未购买客户', status: 'queued', riskLevel: 'medium', createdAt: '2026-07-09T11:00:00Z', updatedAt: '2026-07-09T11:00:00Z', timeline: [{ id: 1, type: 'run_started', title: 'CRM 唤醒任务已排队', summary: '目标 320 人，$5 优惠券。', at: '2026-07-09T11:00:00Z' }] },
  { id: 4006, title: '运动水壶库存预警', storeId: 101, agentType: 'inventory_alert', goal: '库存低于阈值触发补货建议', status: 'succeeded', riskLevel: 'medium', createdAt: '2026-07-09T07:00:00Z', updatedAt: '2026-07-09T07:05:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '库存预警已发送', summary: '运动水壶库存 35 件。', at: '2026-07-09T07:05:00Z' }] },
  { id: 4007, title: '竞品价格监测：无线耳机品类', storeId: 102, agentType: 'competitor_intel', goal: '扫描竞品定价变化', status: 'succeeded', riskLevel: 'low', createdAt: '2026-07-09T06:00:00Z', updatedAt: '2026-07-09T06:30:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '竞品情报已更新', summary: '检测到 3 个竞品降价。', at: '2026-07-09T06:30:00Z' }] },
  { id: 4008, title: 'AI 自动回复客户咨询', storeId: 101, agentType: 'customer_service', goal: '自动回答尺码和发货问题', status: 'succeeded', riskLevel: 'low', createdAt: '2026-07-09T09:00:00Z', updatedAt: '2026-07-09T09:01:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '客服消息已回复', summary: '处理 3 条咨询。', at: '2026-07-09T09:01:00Z' }] },
  { id: 4009, title: '生成跑步鞋广告素材', storeId: 101, agentType: 'creative_factory', goal: '生成多尺寸广告图', status: 'succeeded', riskLevel: 'low', createdAt: '2026-07-08T14:00:00Z', updatedAt: '2026-07-08T14:20:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '素材已生成', summary: '生成 3 种尺寸素材。', at: '2026-07-08T14:20:00Z' }] },
  { id: 4010, title: '自动退款处理 #ORD-2058', storeId: 101, agentType: 'after_sales', goal: '审核退货并自动退款', status: 'succeeded', riskLevel: 'low', createdAt: '2026-07-08T16:30:00Z', updatedAt: '2026-07-08T16:35:00Z', timeline: [{ id: 1, type: 'run_succeeded', title: '退款已完成', summary: '退款 $29.99。', at: '2026-07-08T16:35:00Z' }] },
];

// ===== Demo Agent 运行统计 =====
export const demoAgentRunStats: Record<string, AgentRunStats> = {
  login_bootstrap: { totalRuns: 156, successRate: 0.98, avgDurationMinutes: 0.8, avgTokenUsage: 1200, avgCost: 0.02, trend: [], failureReasons: [] },
  product_launch: { totalRuns: 28, successRate: 0.96, avgDurationMinutes: 3, avgTokenUsage: 4500, avgCost: 0.08, trend: [], failureReasons: [] },
  ads_optimizer: { totalRuns: 220, successRate: 0.88, avgDurationMinutes: 5, avgTokenUsage: 8000, avgCost: 0.15, trend: [], failureReasons: [{ reason: 'ROI 数据不足', count: 15 }] },
  pricing_strategy: { totalRuns: 94, successRate: 0.95, avgDurationMinutes: 2, avgTokenUsage: 3000, avgCost: 0.05, trend: [], failureReasons: [] },
  crm_retention: { totalRuns: 80, successRate: 0.92, avgDurationMinutes: 1.5, avgTokenUsage: 2500, avgCost: 0.04, trend: [], failureReasons: [] },
  review_manager: { totalRuns: 65, successRate: 0.85, avgDurationMinutes: 1, avgTokenUsage: 2000, avgCost: 0.03, trend: [], failureReasons: [{ reason: '审批超时', count: 8 }] },
  customer_service: { totalRuns: 340, successRate: 0.97, avgDurationMinutes: 0.3, avgTokenUsage: 500, avgCost: 0.01, trend: [], failureReasons: [] },
  after_sales: { totalRuns: 42, successRate: 0.93, avgDurationMinutes: 5, avgTokenUsage: 1500, avgCost: 0.03, trend: [], failureReasons: [] },
  competitor_intel: { totalRuns: 180, successRate: 0.99, avgDurationMinutes: 30, avgTokenUsage: 20000, avgCost: 0.35, trend: [], failureReasons: [] },
  creative_factory: { totalRuns: 45, successRate: 0.91, avgDurationMinutes: 4, avgTokenUsage: 15000, avgCost: 0.28, trend: [], failureReasons: [] },
  inventory_alert: { totalRuns: 720, successRate: 0.99, avgDurationMinutes: 0.2, avgTokenUsage: 200, avgCost: 0.005, trend: [], failureReasons: [] },
  finance_audit: { totalRuns: 29, successRate: 0.97, avgDurationMinutes: 10, avgTokenUsage: 5000, avgCost: 0.1, trend: [], failureReasons: [] },
  promotion_campaign: { totalRuns: 12, successRate: 0.83, avgDurationMinutes: 6, avgTokenUsage: 4000, avgCost: 0.08, trend: [], failureReasons: [{ reason: '预算不足', count: 2 }] },
  live_stream_ops: { totalRuns: 8, successRate: 0.75, avgDurationMinutes: 120, avgTokenUsage: 6000, avgCost: 0.12, trend: [], failureReasons: [{ reason: '直播间断流', count: 2 }] },
  risk_control: { totalRuns: 580, successRate: 0.99, avgDurationMinutes: 0.1, avgTokenUsage: 300, avgCost: 0.005, trend: [], failureReasons: [] },
};

// ===== Demo 审批 =====
export const demoApprovals: Approval[] = [
  { id: 5001, taskId: 4004, storeId: 101, storeName: 'Demo 运动旗舰店', agentType: 'review_manager', title: '1星差评回复草稿审核', reason: '差评可能影响店铺评分', proposedAction: '发布 AI 生成的礼貌回复', beforeValue: '未回复', afterValue: '已生成回复草稿', riskLevel: 'high', status: 'pending', requestedAt: '2026-07-09T08:15:00Z' },
  { id: 5002, taskId: 4003, storeId: 101, storeName: 'Demo 运动旗舰店', agentType: 'promotion_campaign', title: '黑五促销活动预算审批', reason: '大促预算超出日常预算 3 倍', proposedAction: '批准 $2,000 预算分配', beforeValue: '预算 $500', afterValue: '预算 $2,000', riskLevel: 'medium', status: 'pending', requestedAt: '2026-07-09T09:00:00Z' },
  { id: 5003, taskId: 4003, storeId: 101, storeName: 'Demo 运动旗舰店', agentType: 'after_sales', title: '退款异常审核 #ORD-2071', reason: '同一客户 7 天内第 3 次退款', proposedAction: '人工审核退款合理性', beforeValue: '待退款', afterValue: '待审核', riskLevel: 'high', status: 'pending', requestedAt: '2026-07-09T10:20:00Z' },
];

// ===== Demo 成员 =====
export const demoMembers: Member[] = [
  { id: 1, name: '李鹏', email: 'lipeng@example.com', role: 'Owner', status: 'active' },
  { id: 2, name: '王芳', email: 'wangfang@example.com', role: 'Admin', status: 'active' },
  { id: 3, name: '张明', email: 'zhangming@example.com', role: 'Operator', status: 'active' },
  { id: 4, name: '陈静', email: 'chenjing@example.com', role: 'Approver', status: 'active' },
];

// ===== Demo 经营指标（复用主 mock 数据结构，数值更丰富）=====
export function getDemoBusinessMetrics() {
  return {
    gmv: { today: 8420, yesterday: 7820, lastWeekSameDay: 7650 },
    orders: { today: 236, yesterday: 205, lastWeekSameDay: 198 },
    aov: 35.7,
    storeCount: { online: 2, total: 2 },
    gmvTrend: [
      { date: '07-03', gmv: 7600, orders: 198 },
      { date: '07-04', gmv: 8100, orders: 215 },
      { date: '07-05', gmv: 7900, orders: 205 },
      { date: '07-06', gmv: 9200, orders: 248 },
      { date: '07-07', gmv: 8500, orders: 220 },
      { date: '07-08', gmv: 7800, orders: 205 },
      { date: '07-09', gmv: 8420, orders: 236 },
    ],
    storeGmvRank: [
      { storeName: 'Demo 运动旗舰店', platform: 'Shopify', gmv: 5210 },
      { storeName: 'Demo 数码配件店', platform: 'Amazon', gmv: 3210 },
    ],
    adMetrics: {
      todaySpend: 1200, roas: 8.2, cpm: 8.5, cpc: 0.48, ctr: 3.4, cvr: 2.8,
      budgetLimit: 1500, targetRoas: 5,
      trend: [{ date: '07-09', spend: 1200, gmv: 9840 }],
      lowPerformingPlans: [],
    },
    afterSales: {
      returnRate: 3.2, returnAmount: 320, negativeReviews: 3, respondedReviews: 1,
      reviewResponseRate: 33, storeRating: 4.3, disputes: { pending: 2, processing: 1 },
      avgResponseMinutes: 150, reviewTrend: [],
    },
    inventory: {
      totalSkus: 12, lowStockCount: 3, slowMovingCount: 1, outOfStockCount: 1,
    },
  };
}

// ===== Demo 财务 =====
export function getDemoFinance() {
  return {
    planTier: 'Professional' as const,
    trialDaysLeft: 14,
    trialStoreLimit: 5,
    trialOpsRemaining: { used: 86, total: 500 },
  };
}
