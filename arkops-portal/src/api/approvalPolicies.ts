import { mockDelay } from './client';
import { insertFirst, replaceItem } from './mockRepository';
import { nextId } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type { AllMallId, ApprovalPolicy } from '../types/domain';

const policies: ApprovalPolicy[] = [
  {
    id: 8001,
    riskLevel: 'low',
    action: 'auto_execute',
    approverType: 'role',
    timeoutHours: 24,
    timeoutAction: 'auto_approve',
    storeSpecificRules: [],
  },
  {
    id: 8002,
    riskLevel: 'medium',
    action: 'single_approval',
    approverType: 'role',
    approverRole: 'Approver',
    timeoutHours: 24,
    timeoutAction: 'auto_reject',
    storeSpecificRules: [],
  },
  {
    id: 8003,
    riskLevel: 'high',
    action: 'dual_approval',
    approverType: 'role',
    approverRole: 'Approver',
    timeoutHours: 12,
    timeoutAction: 'escalate',
    storeSpecificRules: [],
  },
];

export const approvalPolicyApi = {
  list: (): Promise<ApprovalPolicy[]> => mockDelay([...policies]),

  get: (id: AllMallId): Promise<ApprovalPolicy | undefined> =>
    mockDelay(policies.find((p) => p.id === id)),

  create: (input: Partial<ApprovalPolicy>): Promise<ApprovalPolicy> => {
    const policy: ApprovalPolicy = {
      id: nextId('policies', policies.length),
      riskLevel: input.riskLevel ?? 'low',
      action: input.action ?? 'single_approval',
      approverType: input.approverType ?? 'role',
      approverRole: input.approverRole,
      approverMemberId: input.approverMemberId,
      timeoutHours: input.timeoutHours ?? 24,
      timeoutAction: input.timeoutAction ?? 'auto_reject',
      storeSpecificRules: input.storeSpecificRules ?? [],
    };
    insertFirst(policies, policy); // Consistent: use insertFirst for new items

    recordAuditLog({
      actor: '当前用户',
      action: '创建策略',
      entity: '审批策略',
      entityId: policy.id,
      summary: `创建审批策略: [${policy.riskLevel}] ${policy.action}`,
      category: 'approval',
    });

    return mockDelay(policy);
  },

  update: (id: AllMallId, input: Partial<ApprovalPolicy>): Promise<ApprovalPolicy | undefined> => {
    const policy = replaceItem(policies, (item) => item.id === id, (item) => ({
      ...item,
      ...input,
    }));

    if (policy) {
      recordAuditLog({
        actor: '当前用户',
        action: '更新策略',
        entity: '审批策略',
        entityId: id,
        summary: `审批策略已更新: [${policy.riskLevel}]`,
        category: 'approval',
      });
    }

    return mockDelay(policy);
  },
};
