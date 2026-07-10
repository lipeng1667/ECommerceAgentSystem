import { mockDelay } from './client';
import { agentConfigs, agentRunStatsMap } from './agentMockData';
import { stores, tasks } from './mockData';
import { insertFirst, replaceItem } from './mockRepository';
import type { AgentConfig, AgentRunStats, AgentType, AllMallId, Task, TaskStatus } from '../types/domain';

export interface AgentListItem extends AgentConfig {
  runStats?: AgentRunStats;
  activeTaskCount?: number;
}

export const agentsApi = {
  list: (): Promise<AgentListItem[]> => mockDelay(agentConfigs.map((a) => {
    const stats = agentRunStatsMap[a.agentType];
    const activeTaskStatuses: TaskStatus[] = ['draft', 'queued', 'running', 'waiting_approval'];
    const activeCount = tasks.filter((t) => t.agentType === a.agentType && activeTaskStatuses.includes(t.status)).length;
    return { ...a, runStats: stats, activeTaskCount: activeCount };
  })),
  get: (agentType: AgentType): Promise<AgentConfig | undefined> =>
    mockDelay(agentConfigs.find((a) => a.agentType === agentType)),
  getStats: (agentType: AgentType) =>
    mockDelay(agentRunStatsMap[agentType]),
  getTasks: (agentType: AgentType): Promise<Task[]> =>
    mockDelay(tasks.filter((t) => t.agentType === agentType)),
  createTask: (agentType: AgentType, input: { title: string; goal: string; storeId: AllMallId; images?: string[] }): Promise<Task> => {
    const newId = 3000 + tasks.length + 1;
    const task: Task = {
      id: newId,
      title: input.title,
      storeId: input.storeId,
      agentType,
      goal: input.goal,
      status: 'draft' as TaskStatus,
      riskLevel: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: input.images ? input.images.map((name, i) => ({
        id: Date.now() + i,
        type: 'step_completed' as const,
        title: `上传图片 ${i + 1}`,
        summary: name,
        at: new Date().toISOString()
      })) : []
    };
    insertFirst(tasks, task);
    return mockDelay(task);
  },
  toggle: (agentType: AgentType): Promise<AgentConfig | undefined> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    if (agent) {
      // 开启时检查依赖是否已全部开通
      if (!agent.enabled) {
        const missing = agent.dependsOn.filter(
          (dep) => !agentConfigs.find((a) => a.agentType === dep)?.enabled
        );
        if (missing.length > 0) {
          throw new Error(`依赖未满足: ${missing.join(', ')}`);
        }
      }
      return mockDelay(replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        enabled: !current.enabled
      })));
    }
    return mockDelay(agent);
  },
  regenerateSeoKeywords: (agentType: AgentType): Promise<string[]> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    const pool = [
      'wireless earbuds', 'bluetooth 5.3', 'noise cancelling', 'long battery life',
      'IPX5 waterproof', 'ergonomic design', 'fast charging', 'premium audio',
      'gaming headset', 'sports earphones', 'ANC technology', 'dual driver',
      'ultra-lightweight', 'voice assistant', 'touch control', 'USB-C charging'
    ];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const keywords = shuffled.slice(0, 6 + Math.floor(Math.random() * 4));
    if (agent?.strategyConfig?.seoKeywords) {
      replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        strategyConfig: current.strategyConfig
          ? {
              ...current.strategyConfig,
              seoKeywords: current.strategyConfig.seoKeywords
                ? { ...current.strategyConfig.seoKeywords, keywords, lastGenerated: new Date().toISOString() }
                : undefined
            }
          : undefined
      }));
    }
    return mockDelay(keywords);
  },
  regenerateAudience: (agentType: AgentType): Promise<string[]> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    const pool = [
      '18-35岁', '科技爱好者', '运动健身人群', '通勤白领', '学生群体',
      '音乐发烧友', '数码极客', '户外旅行者', '潮流青年', '商务人士',
      '游戏玩家', '居家办公族', '宝妈人群', '银发一族', '跨境买家'
    ];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const tags = shuffled.slice(0, 4 + Math.floor(Math.random() * 4));
    if (agent?.strategyConfig?.targetAudience) {
      replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        strategyConfig: current.strategyConfig
          ? {
              ...current.strategyConfig,
              targetAudience: current.strategyConfig.targetAudience
                ? { ...current.strategyConfig.targetAudience, tags, lastGenerated: new Date().toISOString() }
                : undefined
            }
          : undefined
      }));
    }
    return mockDelay(tags);
  },
  saveStrategyConfig: (agentType: AgentType, config: { costMultiplier?: number; dailyCap?: number }): Promise<AgentConfig | undefined> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    if (agent?.strategyConfig) {
      const updated = replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        strategyConfig: current.strategyConfig
          ? {
              ...current.strategyConfig,
              pricingRule: current.strategyConfig.pricingRule && config.costMultiplier !== undefined
                ? { ...current.strategyConfig.pricingRule, costMultiplier: config.costMultiplier }
                : current.strategyConfig.pricingRule,
              adSpendBudget: current.strategyConfig.adSpendBudget && config.dailyCap !== undefined
                ? { ...current.strategyConfig.adSpendBudget, dailyCap: config.dailyCap }
                : current.strategyConfig.adSpendBudget
            }
          : undefined
      }));
      return mockDelay(updated);
    }
    return mockDelay(agent);
  },
  cancelTask: (taskId: AllMallId): Promise<Task | undefined> => {
    const task = replaceItem(tasks, (t) => t.id === taskId, (current) => ({
      ...current,
      status: 'cancelled' as const,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          id: Date.now(),
          type: 'run_failed' as const,
          title: '任务已取消',
          summary: '由用户手动取消',
          at: new Date().toISOString()
        }
      ]
    }));
    return mockDelay(task);
  },
  batchEnable: (agentTypes: AgentType[]) => {
    return mockDelay(600).then(() => {
      for (const ag of agentConfigs) {
        if (agentTypes.includes(ag.agentType)) {
          ag.enabled = true;
        }
      }
      return agentConfigs;
    });
  }
};
