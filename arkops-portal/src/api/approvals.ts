import { mockDelay } from './client';
import { approvalEvidence, approvalPriorApprovals, approvals, auditLogs, tasks } from './mockData';
import { insertFirst, replaceItem } from './mockRepository';
import { getPolicyForRisk } from './approvalPolicies';
import type { AllMallId, Approval, ApprovalStatus, AuditLog, RiskLevel, Task } from '../types/domain';

const CURRENT_ACTOR = '当前用户';

/** WS-B (B3): attach structured before/after evidence and dual-approval progress. */
function withEvidence(approval: Approval): Approval {
  return {
    ...approval,
    evidence: approval.evidence ?? approvalEvidence[approval.id],
    priorApprovals: approval.priorApprovals ?? approvalPriorApprovals[approval.id]
  };
}

/** WS-B (B4): outcome of a decision — dual approval may leave the item pending. */
export interface ApprovalDecisionResult {
  approval: Approval;
  /** false when a dual-approval item recorded its first approval and stays pending */
  finalized: boolean;
  /** number of approvals completed so far (dual approval) */
  approvalsCompleted: number;
  /** number of approvals required by policy */
  approvalsRequired: number;
}

function recordDecisionAudit(approval: Approval, action: string, summary: string): void {
  const auditLog: AuditLog = {
    id: 6000 + auditLogs.length + 1,
    actor: CURRENT_ACTOR,
    action,
    entity: '审批',
    entityId: approval.id,
    summary,
    at: new Date().toISOString(),
    category: 'approval',
    linkTo: '/approvals/' + approval.id
  };
  auditLogs.push(auditLog);
}

function syncTaskAfterDecision(approval: Approval, status: 'approved' | 'rejected'): void {
  const task: Task | undefined = tasks.find((t) => t.id === approval.taskId);
  if (!task) return;
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

export const approvalsApi = {
  list: () => mockDelay(approvals.map(withEvidence)),
  get: (approvalId: AllMallId) => {
    const approval = approvals.find((item) => item.id === approvalId);
    return mockDelay(approval ? withEvidence(approval) : undefined);
  },
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
  /**
   * WS-B (B4): record an approve/reject decision with an optional note.
   * High-risk items follow the dual-approval policy: the first approve is
   * recorded as progress and the item stays pending until the second approve.
   * Reject always finalizes immediately.
   */
  decide: (
    approvalId: AllMallId,
    status: Extract<ApprovalStatus, 'approved' | 'rejected'>,
    note?: string
  ): Promise<ApprovalDecisionResult | undefined> => {
    const current = approvals.find((item) => item.id === approvalId);
    if (!current) return mockDelay(undefined);

    const enriched = withEvidence(current);
    const policy = getPolicyForRisk(current.riskLevel);
    const approvalsRequired = policy?.action === 'dual_approval' ? 2 : 1;
    const priorApprovals = enriched.priorApprovals ?? [];

    // First approve of a dual-approval item: record progress, stay pending.
    if (status === 'approved' && approvalsRequired === 2 && priorApprovals.length + 1 < approvalsRequired) {
      const updated = replaceItem(approvals, (item) => item.id === approvalId, (item) => ({
        ...withEvidence(item),
        priorApprovals: [
          ...priorApprovals,
          { approver: CURRENT_ACTOR, at: new Date().toISOString(), note }
        ]
      }));
      if (updated) {
        recordDecisionAudit(updated, '一审通过', `${updated.title} - 双人审批 1/2 已通过${note ? `（备注：${note}）` : ''}`);
      }
      return mockDelay(
        updated
          ? { approval: updated, finalized: false, approvalsCompleted: priorApprovals.length + 1, approvalsRequired }
          : undefined
      );
    }

    const approval = replaceItem(approvals, (item) => item.id === approvalId, (item) => ({
      ...withEvidence(item),
      status,
      decidedAt: new Date().toISOString(),
      decidedBy: CURRENT_ACTOR,
      decisionNote: note
    }));
    if (approval) {
      syncTaskAfterDecision(approval, status);
      recordDecisionAudit(
        approval,
        status === 'approved' ? '审批通过' : '审批拒绝',
        `${approval.title} - ${status === 'approved' ? '已通过' : '已拒绝'}${note ? `（备注：${note}）` : ''}`
      );
    }
    return mockDelay(
      approval
        ? {
            approval,
            finalized: true,
            approvalsCompleted: status === 'approved' ? approvalsRequired : priorApprovals.length,
            approvalsRequired
          }
        : undefined
    );
  }
};
