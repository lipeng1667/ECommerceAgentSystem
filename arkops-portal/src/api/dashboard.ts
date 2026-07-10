import { mockDelay } from './client';
import { approvals, stores, tasks } from './mockData';

// Order exception count is derived from the same logic as OrderAutomationPage
const orderExceptions = 2; // ord_004 (address_invalid) + ord_005 (fraud_blocked)

// Exception center pending count mirrors ExceptionCenterPage mock data
const exceptionCenterPending = 4; // 2 critical + 2 warning

export const dashboardApi = {
  getSummary: () =>
    mockDelay({
      connectedStores: stores.filter((store) => store.status === 'connected').length,
      runningTasks: tasks.filter((task) => task.status === 'running' || task.status === 'queued').length,
      pendingApprovals: approvals.filter((approval) => approval.status === 'pending').length,
      loginRequiredStores: stores.filter((store) => store.status === 'login_required').length,
      exceptionCenterPending,
      orderExceptions,
      recentTasks: [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
      recentApprovals: approvals.slice(0, 5),
      operationTrend: [
        { dayKey: 'dashboard.dayMon', runs: 12, approvals: 2, failures: 1 },
        { dayKey: 'dashboard.dayTue', runs: 18, approvals: 4, failures: 1 },
        { dayKey: 'dashboard.dayWed', runs: 16, approvals: 3, failures: 0 },
        { dayKey: 'dashboard.dayThu', runs: 24, approvals: 5, failures: 2 },
        { dayKey: 'dashboard.dayFri', runs: 22, approvals: 4, failures: 1 },
        { dayKey: 'dashboard.daySat', runs: 10, approvals: 1, failures: 0 },
        { dayKey: 'dashboard.daySun', runs: 8, approvals: 1, failures: 0 }
      ],
      taskStatusBreakdown: [
        { status: 'succeeded', count: 18 },
        { status: 'waiting_approval', count: 5 },
        { status: 'running', count: 3 },
        { status: 'failed', count: 2 }
      ],
      quotaUsage: [
        { key: 'dashboard.quotaWorker', used: 3, limit: 5, color: '#2563eb' },
        { key: 'dashboard.quotaBrowser', used: 7, limit: 12, color: '#0f766e' },
        { key: 'dashboard.quotaDailyOps', used: 392, limit: 1000, color: '#7c3aed' },
        { key: 'dashboard.quotaToken', used: 184200, limit: 500000, color: '#ea580c' }
      ],
      agentMix: [
        { agentType: 'ads_optimizer', count: 11, color: '#2563eb' },
        { agentType: 'product_launch', count: 7, color: '#0f766e' },
        { agentType: 'login_bootstrap', count: 4, color: '#ea580c' },
        { agentType: 'crm_retention', count: 3, color: '#7c3aed' }
      ],
      healthSignals: [
        { key: 'dashboard.healthSessions', value: '7 / 12', status: 'healthy' },
        { key: 'dashboard.healthSuccessRate', value: '93.4%', status: 'healthy' },
        { key: 'dashboard.healthApprovalLeadTime', value: '18 min', status: 'warning' },
        { key: 'dashboard.healthReauth', value: '1', status: 'warning' }
      ]
    }),

  /** Agent 今日成果 — 量化 AI 创造的价值 */
  getAgentAchievements: () =>
    mockDelay({
      hoursSaved: 12.5,
      hoursSavedTrend: 18,      // 同比变化百分比
      revenueUplift: 1247,
      revenueUpliftTrend: 23,
      tasksProcessed: 86,
      tasksSuccessRate: 97.7,
      topContributor: {
        agentType: 'pricing_strategy',
        amount: 340,
        insight: 'dashboard.insightPricing',
      },
    }),
};
