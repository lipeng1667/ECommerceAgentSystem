import { mockDelay } from './client';
import type { BillingDetail, BillingRecord, CostAnalysis, SubscriptionPlan } from '../types/domain';

const plans: SubscriptionPlan[] = [
  { tier: 'Free', storeLimit: 1, agentConcurrency: 1, monthlyOps: 100, tokenQuota: 100000, price: 0, currency: 'USD' },
  { tier: 'Starter', storeLimit: 5, agentConcurrency: 2, monthlyOps: 500, tokenQuota: 500000, price: 49, currency: 'USD' },
  { tier: 'Professional', storeLimit: 20, agentConcurrency: 5, monthlyOps: 2000, tokenQuota: 2000000, price: 199, currency: 'USD' },
  { tier: 'Enterprise', storeLimit: 999, agentConcurrency: 999, monthlyOps: 99999, tokenQuota: 99999999, price: 599, currency: 'USD' }
];

const billingRecords: BillingRecord[] = [
  { id: 'inv_202606', period: '2026年6月', status: 'pending', amount: 49, currency: 'USD', dueDate: '2026-07-01' },
  { id: 'inv_202605', period: '2026年5月', status: 'paid', amount: 49, currency: 'USD', dueDate: '2026-06-01', paidAt: '2026-05-28', invoiceUrl: '#' },
  { id: 'inv_202604', period: '2026年4月', status: 'paid', amount: 49, currency: 'USD', dueDate: '2026-05-01', paidAt: '2026-04-29', invoiceUrl: '#' }
];

let currentPlan: SubscriptionPlan = { ...plans[1] };

export const financeApi = {
  getCurrentPlan: (): Promise<SubscriptionPlan> => mockDelay({ ...currentPlan }),
  getAllPlans: (): Promise<SubscriptionPlan[]> => mockDelay(plans.map((p) => ({ ...p }))),
  upgradePlan: (tier: SubscriptionPlan['tier']): Promise<SubscriptionPlan> => {
    const plan = plans.find((p) => p.tier === tier);
    if (plan) currentPlan = { ...plan };
    return mockDelay({ ...currentPlan });
  },
  /** 获取试用状态 — 当前计划 + 剩余天数 + 用量上限 */
  getTrialStatus: (): Promise<{
    planTier: SubscriptionPlan['tier'];
    trialDaysLeft: number;
    trialStoreLimit: number;
    usedStores: number;
    usedAgentCalls: number;
    agentCallLimit: number;
    premiumAgents: string[];
  }> =>
    mockDelay({
      planTier: 'Starter',
      trialDaysLeft: 12,
      trialStoreLimit: 5,
      usedStores: 3,
      usedAgentCalls: 665,
      agentCallLimit: 500,
      premiumAgents: ['competitor_intel', 'creative_factory', 'live_stream_ops', 'promotion_campaign'],
    }),
  getBillingRecords: (): Promise<BillingRecord[]> => mockDelay([...billingRecords]),
  getCurrentBillDetail: (): Promise<BillingDetail> =>
    mockDelay({
      baseSubscription: 49,
      overageItems: [
        { description: '广告优化 Agent (超额 120 次)', amount: 9.6, currency: 'USD' },
        { description: 'CRM 复购 Agent (超额 45 次)', amount: 3.6, currency: 'USD' },
        { description: 'Token 超额 186,000', amount: 5.58, currency: 'USD' }
      ],
      discount: 0,
      total: 67.78,
      currency: 'USD'
    }),
  getUsageOverview: () =>
    mockDelay({
      agentCalls: { used: 665, limit: 500, unit: '次' },
      tokenUsage: { used: 686000, limit: 500000, unit: 'tokens' },
      browserSessions: { used: 7, limit: 12, unit: '个' },
      workers: { used: 3, limit: 5, unit: '个' },
      stores: { used: 3, limit: 5, unit: '个' }
    }),
  getUsageTrend: () =>
    mockDelay([
      { month: '1月', agentCalls: 380, tokenUsage: 420, browserSessions: 5, stores: 2 },
      { month: '2月', agentCalls: 420, tokenUsage: 450, browserSessions: 6, stores: 2 },
      { month: '3月', agentCalls: 510, tokenUsage: 480, browserSessions: 6, stores: 3 },
      { month: '4月', agentCalls: 490, tokenUsage: 520, browserSessions: 8, stores: 3 },
      { month: '5月', agentCalls: 580, tokenUsage: 600, browserSessions: 7, stores: 3 },
      { month: '6月', agentCalls: 665, tokenUsage: 686, browserSessions: 7, stores: 3 }
    ]),
  getCostAnalysis: (): Promise<CostAnalysis> =>
    mockDelay({
      byStore: [
        { storeName: 'TikTok Shop 美国旗舰店', agentCalls: 320, tokenCost: 28.5 },
        { storeName: 'Amazon 户外用品店', agentCalls: 245, tokenCost: 18.2 },
        { storeName: 'Shopify 独立站', agentCalls: 100, tokenCost: 6.8 }
      ],
      byAgent: [
        { agentType: 'ads_optimizer', calls: 220, cost: 22.4 },
        { agentType: 'product_launch', calls: 180, cost: 12.6 },
        { agentType: 'login_bootstrap', calls: 156, cost: 4.8 },
        { agentType: 'crm_retention', calls: 80, cost: 6.5 },
        { agentType: 'finance_audit', calls: 29, cost: 7.2 }
      ],
      estimatedSaving: { manualCostPerOp: 15, automatedOps: 665, savedAmount: 9975 },
      recommendation: '当前费用在 Starter 套餐范围内，建议保持。广告优化 Agent 可考虑切换至 DeepSeek 模型降低 Token 成本约 40%。'
    })
};
