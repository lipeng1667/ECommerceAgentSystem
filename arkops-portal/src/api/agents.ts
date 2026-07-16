import { mockDelay } from './client';
import { agentConfigs, agentRunStatsMap } from './agentMockData';
import { stores, tasks } from './mockData';
import { insertFirst, replaceItem } from './mockRepository';
import { nextId } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type {
  AgentConfig,
  AgentRunStats,
  AgentStrategyConfig,
  AgentType,
  AllMallId,
  Task,
  TaskStatus,
} from '../types/domain';

export interface AgentListItem extends AgentConfig {
  runStats?: AgentRunStats;
  activeTaskCount?: number;
}

export const agentsApi = {
  list: (): Promise<AgentListItem[]> =>
    mockDelay(
      agentConfigs.map((a) => {
        const stats = agentRunStatsMap[a.agentType];
        const activeTaskStatuses: TaskStatus[] = ['draft', 'queued', 'running', 'waiting_approval'];
        const activeCount = tasks.filter(
          (t) => t.agentType === a.agentType && activeTaskStatuses.includes(t.status)
        ).length;
        return { ...a, runStats: stats, activeTaskCount: activeCount };
      })
    ),

  get: (agentType: AgentType): Promise<AgentConfig | undefined> =>
    mockDelay(agentConfigs.find((a) => a.agentType === agentType)),

  getStats: (agentType: AgentType) => mockDelay(agentRunStatsMap[agentType]),

  getTasks: (agentType: AgentType): Promise<Task[]> =>
    mockDelay(tasks.filter((t) => t.agentType === agentType)),

  createTask: (
    agentType: AgentType,
    input: { title: string; goal: string; storeId: AllMallId; images?: string[] }
  ): Promise<Task> => {
    const task: Task = {
      id: nextId('tasks', tasks.length),
      title: input.title,
      storeId: input.storeId,
      agentType,
      goal: input.goal,
      status: 'queued' as TaskStatus, // Consistent: all new tasks start as 'queued'
      riskLevel: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: input.images
        ? input.images.map((name, i) => ({
            id: Date.now() + i,
            type: 'step_completed' as const,
            title: `上传图片 ${i + 1}`,
            summary: name,
            at: new Date().toISOString(),
          }))
        : [],
    };
    insertFirst(tasks, task);

    recordAuditLog({
      actor: '当前用户',
      action: '创建任务',
      entity: '任务',
      entityId: task.id,
      summary: `Agent [${agentType}] 创建任务: ${input.title}`,
      category: 'task',
    });

    return mockDelay(task);
  },

  toggle: (agentType: AgentType): Promise<AgentConfig | undefined> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    if (agent) {
      // Check dependencies before enabling
      if (!agent.enabled) {
        const missing = agent.dependsOn.filter(
          (dep) => !agentConfigs.find((a) => a.agentType === dep)?.enabled
        );
        if (missing.length > 0) {
          throw new Error(`依赖未满足: ${missing.join(', ')}`);
        }
      }
      const updated = replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        enabled: !current.enabled,
      }));

      recordAuditLog({
        actor: '当前用户',
        action: updated?.enabled ? '启用 Agent' : '停用 Agent',
        entity: 'Agent',
        entityId: agentType as unknown as number,
        summary: `Agent [${agentType}] 已${updated?.enabled ? '启用' : '停用'}`,
        category: 'agent',
      });

      return mockDelay(updated);
    }
    return mockDelay(agent);
  },

  batchEnable: (agentTypes: AgentType[]): Promise<AgentConfig[]> => {
    // Check dependencies for each agent before batch enabling
    // This was previously missing dependency checks (security fix)
    for (const agentType of agentTypes) {
      const agent = agentConfigs.find((a) => a.agentType === agentType);
      if (agent && !agent.enabled) {
        const missing = agent.dependsOn.filter(
          (dep) => !agentConfigs.find((a) => a.agentType === dep)?.enabled
        );
        if (missing.length > 0) {
          throw new Error(
            `Agent [${agentType}] 依赖未满足: ${missing.join(', ')}`
          );
        }
      }
    }

    return mockDelay(600).then(() => {
      for (const ag of agentConfigs) {
        if (agentTypes.includes(ag.agentType)) {
          ag.enabled = true;
        }
      }

      recordAuditLog({
        actor: '当前用户',
        action: '批量启用',
        entity: 'Agent',
        entityId: 0,
        summary: `批量启用 ${agentTypes.length} 个 Agent: ${agentTypes.join(', ')}`,
        category: 'agent',
      });

      return agentConfigs;
    });
  },

  regenerateSeoKeywords: (agentType: AgentType): Promise<string[]> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    const pool = [
      'wireless earbuds',
      'bluetooth 5.3',
      'noise cancelling',
      'long battery life',
      'IPX5 waterproof',
      'ergonomic design',
      'fast charging',
      'premium audio',
      'gaming headset',
      'sports earphones',
      'ANC technology',
      'dual driver',
      'ultra-lightweight',
      'voice assistant',
      'touch control',
      'USB-C charging',
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
                ? {
                    ...current.strategyConfig.seoKeywords,
                    keywords,
                    lastGenerated: new Date().toISOString(),
                  }
                : undefined,
            }
          : undefined,
      }));
    }
    return mockDelay(keywords);
  },

  regenerateAudience: (agentType: AgentType): Promise<string[]> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    const pool = [
      '18-35岁',
      '科技爱好者',
      '运动健身人群',
      '通勤白领',
      '学生群体',
      '音乐发烧友',
      '数码极客',
      '户外旅行者',
      '潮流青年',
      '商务人士',
      '游戏玩家',
      '居家办公族',
      '宝妈人群',
      '银发一族',
      '跨境买家',
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
                ? {
                    ...current.strategyConfig.targetAudience,
                    tags,
                    lastGenerated: new Date().toISOString(),
                  }
                : undefined,
            }
          : undefined,
      }));
    }
    return mockDelay(tags);
  },

  saveStrategyConfig: (
    agentType: AgentType,
    config: Partial<AgentStrategyConfig>
  ): Promise<AgentConfig | undefined> => {
    const agent = agentConfigs.find((a) => a.agentType === agentType);
    if (agent?.strategyConfig) {
      const updated = replaceItem(agentConfigs, (a) => a.agentType === agentType, (current) => ({
        ...current,
        strategyConfig: {
          ...current.strategyConfig!,
          ...config,
        },
      }));

      recordAuditLog({
        actor: '当前用户',
        action: '保存策略配置',
        entity: 'Agent',
        entityId: agentType as unknown as number,
        summary: `Agent [${agentType}] 策略配置已更新`,
        category: 'agent',
      });

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
          at: new Date().toISOString(),
        },
      ],
    }));

    if (task) {
      recordAuditLog({
        actor: '当前用户',
        action: '取消任务',
        entity: '任务',
        entityId: taskId,
        summary: `任务已取消: ${task.title}`,
        category: 'task',
      });
    }

    return mockDelay(task);
  },
};
