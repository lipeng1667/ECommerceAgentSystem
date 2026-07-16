import { mockDelay } from './client';
import { approvals, auditLogs, tasks } from './mockData';
import { insertFirst, replaceItem } from './mockRepository';
import type { AllMallId, ApprovalStatus, AuditLog, RiskLevel, Task } from '../types/domain';

export const approvalsApi = {
  list: () => mockDelay([...approvals]),
  get: (approvalId: AllMallId) => mockDelay(approvals.find((approval) => approval.id === approvalId)),
  create: (input: {
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
  }) => {
    const approval = {
      id: 5000 + approvals.length + 1,
      ...input,
      status: 'pending' as const,
      requestedAt: new Date().toISOString()
    };
    insertFirst(approvals, approval);
    return mockDelay(approval);
  },
  decide: (approvalId: AllMallId, status: Extract<ApprovalStatus, 'approved' | 'rejected'>) => {
    const approval = replaceItem(approvals, (item) => item.id === approvalId, (item) => ({
      ...item,
      status,
      decidedAt: new Date().toISOString()
    }));
    if (approval) {
      const task: Task | undefined = tasks.find((t) => t.id === approval.taskId);
      if (task) {
        replaceItem(tasks, (t) => t.id === task.id, (t) => ({
          ...t,
          status: (status === 'approved' ? 'running' : 'cancelled') as Task['status'],
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now(),
              type: (status === 'approved' ? 'run_started' : 'run_failed') as Task['timeline'][number]['type'],
              title: status === 'approved' ? '审批通过，任务继续执行' : '审批拒绝，任务已取消',
              summary: status === 'approved' ? '审批已通过，Agent 继续执行' : '审批未通过，任务已取消',
              at: new Date().toISOString()
            }
          ]
        }));
      }
      const auditLog: AuditLog = {
        id: 6000 + auditLogs.length + 1,
        actor: '当前用户',
        action: status === 'approved' ? '审批通过' : '审批拒绝',
        entity: '审批',
        entityId: approvalId,
        summary: `${approval.title} - ${status === 'approved' ? '已通过' : '已拒绝'}`,
        at: new Date().toISOString(),
        category: 'approval',
        linkTo: '/approvals/' + approvalId
      };
      auditLogs.push(auditLog);
    }
    return mockDelay(approval);
  }
};
