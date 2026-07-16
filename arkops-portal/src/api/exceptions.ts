import { mockDelay } from './client';
import { exceptionItems } from '../pages/operations/exceptionCenterMockData';
import { batchUpdate, replaceItem } from './mockRepository';
import { recordAuditLog } from './auditLogger';

export interface ExceptionItem {
  id: string;
  type: 'review_negative' | 'chat_escalation' | 'ad_low_roi' | 'logistics_stuck' | 'compliance_flag';
  title: string;
  storeName: string;
  agentType: string;
  level: 'critical' | 'warning' | 'info';
  summary: string;
  detail: string;
  suggestedAction: string;
  createdAt: string;
  resolved: boolean;
  ignored: boolean;
  assignee?: string;
  linkTo?: string;
}

function logExceptionAction(id: string, action: string, detail: string): void {
  recordAuditLog({
    actor: '当前用户',
    action,
    entity: '异常',
    entityId: id as unknown as number,
    summary: `${detail} - ${id}`,
    category: 'exception',
  });
}

export const exceptionsApi = {
  list: (): Promise<ExceptionItem[]> => mockDelay([...exceptionItems]),

  resolve: (id: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      resolved: true,
      ignored: false,
    }));
    logExceptionAction(id, '解决异常', `异常已解决`);
    return mockDelay(undefined);
  },

  ignore: (id: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      ignored: true,
    }));
    logExceptionAction(id, '忽略异常', `异常已忽略`);
    return mockDelay(undefined);
  },

  unignore: (id: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      ignored: false,
    }));
    logExceptionAction(id, '取消忽略', `取消忽略异常`);
    return mockDelay(undefined);
  },

  assign: (id: string, assignee: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      assignee,
    }));
    logExceptionAction(id, '分配异常', `分配给 ${assignee}`);
    return mockDelay(undefined);
  },

  batchResolve: (ids: string[]) => {
    batchUpdate(exceptionItems, (item) => ids.includes(item.id), (item) => ({
      ...item,
      resolved: true,
      ignored: false,
    }));
    recordAuditLog({
      actor: '当前用户',
      action: '批量解决',
      entity: '异常',
      entityId: 0,
      summary: `批量解决 ${ids.length} 个异常: ${ids.join(', ')}`,
      category: 'exception',
    });
    return mockDelay(undefined);
  },

  batchIgnore: (ids: string[]) => {
    batchUpdate(exceptionItems, (item) => ids.includes(item.id), (item) => ({
      ...item,
      ignored: true,
    }));
    recordAuditLog({
      actor: '当前用户',
      action: '批量忽略',
      entity: '异常',
      entityId: 0,
      summary: `批量忽略 ${ids.length} 个异常: ${ids.join(', ')}`,
      category: 'exception',
    });
    return mockDelay(undefined);
  },
};
