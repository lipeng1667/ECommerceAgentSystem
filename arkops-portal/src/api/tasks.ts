import { mockDelay } from './client';
import { tasks } from './mockData';
import { insertFirst } from './mockRepository';
import { nextId } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type { AllMallId, Task } from '../types/domain';

export const tasksApi = {
  list: () => mockDelay([...tasks]),

  get: (taskId: AllMallId) => mockDelay(tasks.find((task) => task.id === taskId)),

  create: (input: Pick<Task, 'storeId' | 'agentType' | 'goal'>) => {
    const task: Task = {
      id: nextId('tasks', tasks.length),
      title: input.goal.slice(0, 58),
      storeId: input.storeId,
      agentType: input.agentType,
      goal: input.goal,
      status: 'queued', // Consistent initial status: all new tasks start as 'queued'
      riskLevel: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: Date.now(),
          type: 'run_started',
          title: '任务已排队',
          summary: 'AllMall 已为 Runtime Adapter 创建任务载荷。',
          at: new Date().toISOString(),
        },
      ],
    };
    insertFirst(tasks, task);

    recordAuditLog({
      actor: '当前用户',
      action: '创建任务',
      entity: '任务',
      entityId: task.id,
      summary: `创建任务: ${task.title}`,
      category: 'task',
    });

    return mockDelay(task);
  },
};
