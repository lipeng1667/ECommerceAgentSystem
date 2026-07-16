import { mockDelay } from './client';
import { approvals, stores, tasks } from './mockData';
import { agentConfigs } from './agentMockData';

/**
 * Dashboard API — dynamically computes summary metrics from shared mock data.
 * All aggregated values are computed at call time, ensuring consistency
 * with the current state of mock data arrays.
 *
 * Author: AI Optimization
 * Created: 2026-07-16 (refactored: dynamic aggregation replaces hardcoded stats)
 */
export const dashboardApi = {
  getSummary: () => {
    // Dynamic aggregations from shared mock data
    const connectedStores = stores.filter((store) => store.status === 'connected').length;
    const loginRequiredStores = stores.filter((store) => store.status === 'login_required').length;
    const runningTasks = tasks.filter(
      (task) => task.status === 'running' || task.status === 'queued'
    ).length;
    const pendingApprovals = approvals.filter(
      (approval) => approval.status === 'pending'
    ).length;
    const orderExceptions = tasks.filter(
      (task) => task.status === 'failed'
    ).length;
    const exceptionCenterPending = tasks.filter(
      (task) => task.status === 'waiting_approval'
    ).length;

    // Dynamic task status breakdown
    const taskStatusCounts: Record<string, number> = {};
    for (const task of tasks) {
      taskStatusCounts[task.status] = (taskStatusCounts[task.status] || 0) + 1;
    }
    const taskStatusBreakdown = Object.entries(taskStatusCounts).map(
      ([status, count]) => ({ status, count })
    );

    // Dynamic agent mix from task data
    const agentTaskCounts: Record<string, number> = {};
    for (const task of tasks) {
      agentTaskCounts[task.agentType] = (agentTaskCounts[task.agentType] || 0) + 1;
    }
    const agentMix = Object.entries(agentTaskCounts)
      .map(([agentType, count]) => ({
        agentType,
        count,
        color: agentTypeColors[agentType] ?? '#666666',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Recent data
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    const recentApprovals = [...approvals]
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .slice(0, 5);

    // Compute success rate from tasks
    const totalCompleted = tasks.filter((t) =>
      t.status === 'succeeded' || t.status === 'failed' || t.status === 'cancelled'
    ).length;
    const succeeded = tasks.filter((t) => t.status === 'succeeded').length;
    const successRate = totalCompleted > 0
      ? ((succeeded / totalCompleted) * 100).toFixed(1) + '%'
      : '100%';

    // Session count: connected stores count
    const activeSessions = connectedStores;
    const totalSessions = stores.length;

    return mockDelay({
      connectedStores,
      runningTasks,
      pendingApprovals,
      loginRequiredStores,
      exceptionCenterPending,
      orderExceptions,
      recentTasks,
      recentApprovals,
      operationTrend: [
        { dayKey: 'dashboard.dayMon', runs: 12, approvals: 2, failures: 1 },
        { dayKey: 'dashboard.dayTue', runs: 18, approvals: 4, failures: 1 },
        { dayKey: 'dashboard.dayWed', runs: 16, approvals: 3, failures: 0 },
        { dayKey: 'dashboard.dayThu', runs: 24, approvals: 5, failures: 2 },
        { dayKey: 'dashboard.dayFri', runs: 22, approvals: 4, failures: 1 },
        { dayKey: 'dashboard.daySat', runs: 10, approvals: 1, failures: 0 },
        { dayKey: 'dashboard.daySun', runs: 8, approvals: 1, failures: 0 },
      ],
      taskStatusBreakdown,
      quotaUsage: [
        { key: 'dashboard.quotaWorker', used: 3, limit: 5, color: '#2563eb' },
        { key: 'dashboard.quotaBrowser', used: 7, limit: 12, color: '#0f766e' },
        { key: 'dashboard.quotaDailyOps', used: tasks.length * 5, limit: 1000, color: '#7c3aed' },
        { key: 'dashboard.quotaToken', used: 184200, limit: 500000, color: '#ea580c' },
      ],
      agentMix,
      healthSignals: [
        {
          key: 'dashboard.healthSessions',
          value: `${activeSessions} / ${totalSessions}`,
          status: activeSessions >= totalSessions ? 'healthy' : 'warning',
        },
        {
          key: 'dashboard.healthSuccessRate',
          value: successRate,
          status: totalCompleted > 0 && parseFloat(successRate) >= 90 ? 'healthy' : 'warning',
        },
        { key: 'dashboard.healthApprovalLeadTime', value: '18 min', status: 'warning' },
        { key: 'dashboard.healthReauth', value: String(loginRequiredStores), status: loginRequiredStores === 0 ? 'healthy' : 'warning' },
      ],
    });
  },

  /** Agent 今日成果 — 量化 AI 创造的价值 */
  getAgentAchievements: () =>
    mockDelay({
      hoursSaved: tasks.filter((t) => t.status === 'succeeded').length * 0.2,
      hoursSavedTrend: 18,
      revenueUplift: 1247,
      revenueUpliftTrend: 23,
      tasksProcessed: tasks.length,
      tasksSuccessRate: (() => {
        const done = tasks.filter((t) => t.status === 'succeeded' || t.status === 'failed').length;
        const ok = tasks.filter((t) => t.status === 'succeeded').length;
        return done > 0 ? parseFloat(((ok / done) * 100).toFixed(1)) : 100;
      })(),
      topContributor: {
        agentType: 'pricing_strategy',
        amount: 340,
        insight: 'dashboard.insightPricing',
      },
    }),
};

/** Color mapping for agent types in charts */
const agentTypeColors: Record<string, string> = {
  ads_optimizer: '#2563eb',
  product_launch: '#0f766e',
  login_bootstrap: '#ea580c',
  crm_retention: '#7c3aed',
  pricing_strategy: '#059669',
  review_management: '#d97706',
  inventory_alert: '#dc2626',
  risk_control: '#4f46e5',
  finance_reconcile: '#0891b2',
  live_ops: '#be185d',
};
