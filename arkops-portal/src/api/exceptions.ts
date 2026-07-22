import { mockDelay } from './client';
import { exceptionItems } from '../pages/operations/exceptionCenterMockData';
import type { ExceptionItem } from '../pages/operations/exceptionCenterMockData';
import { batchUpdate, replaceItem } from './mockRepository';
import { recordAuditLog } from './auditLogger';

// WS-B (B6): the ExceptionItem shape lives in exceptionCenterMockData.ts;
// re-export it so API consumers keep a single source of truth.
export type { ExceptionItem };

const CURRENT_ACTOR = '当前用户';

function logExceptionAction(id: string, action: string, detail: string): void {
  recordAuditLog({
    actor: CURRENT_ACTOR,
    action,
    entity: '异常',
    entityId: id as unknown as number,
    summary: `${detail} - ${id}`,
    category: 'exception',
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

export const exceptionsApi = {
  list: (): Promise<ExceptionItem[]> => mockDelay([...exceptionItems]),

  // WS-B (B6): resolve/ignore capture an optional note plus actor + timestamp.
  resolve: (id: string, note?: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      resolved: true,
      ignored: false,
      resolvedBy: CURRENT_ACTOR,
      resolvedAt: nowIso(),
      resolutionNote: note,
    }));
    logExceptionAction(id, '解决异常', `异常已解决${note ? `（备注：${note}）` : ''}`);
    return mockDelay(undefined);
  },

  ignore: (id: string, note?: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      ignored: true,
      ignoredBy: CURRENT_ACTOR,
      ignoredAt: nowIso(),
      ignoreNote: note,
    }));
    logExceptionAction(id, '忽略异常', `异常已忽略${note ? `（备注：${note}）` : ''}`);
    return mockDelay(undefined);
  },

  unignore: (id: string) => {
    replaceItem(exceptionItems, (item) => item.id === id, (item) => ({
      ...item,
      ignored: false,
      ignoredBy: undefined,
      ignoredAt: undefined,
      ignoreNote: undefined,
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
      resolvedBy: CURRENT_ACTOR,
      resolvedAt: nowIso(),
    }));
    recordAuditLog({
      actor: CURRENT_ACTOR,
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
      ignoredBy: CURRENT_ACTOR,
      ignoredAt: nowIso(),
    }));
    recordAuditLog({
      actor: CURRENT_ACTOR,
      action: '批量忽略',
      entity: '异常',
      entityId: 0,
      summary: `批量忽略 ${ids.length} 个异常: ${ids.join(', ')}`,
      category: 'exception',
    });
    return mockDelay(undefined);
  },
};
