import { makeConnectToken, mockDelay } from './client';
import { storeConfigs } from './storeMockData';
import { stores, tasks } from './mockData';
import { appendItem, insertFirst, replaceItem } from './mockRepository';
import type { AllMallId, Store, StoreConfig, StoreConnection, StoreServiceType } from '../types/domain';

export const storesApi = {
  list: () => mockDelay([...stores]),
  get: (storeId: AllMallId) => mockDelay(stores.find((store) => store.id === storeId)),
  recentTasks: (storeId: AllMallId) => mockDelay(tasks.filter((task) => task.storeId === storeId)),
  createConnectToken: (storeId: AllMallId) =>
    mockDelay({
      storeId,
      connectToken: makeConnectToken(storeId),
      expiresInMinutes: 30
    }),
  create: (input: { name: string; platform: string; authMethod?: Store['authMethod']; apiKey?: string; apiSecret?: string; account?: string; password?: string; region?: string; currency?: string; maxBudgetAdjust?: number; operationWindowStart?: string; operationWindowEnd?: string; autoReconnectRetry?: number; maxRetries?: number; services?: string[] }) => {
    const serviceIds: number[] = [];
    const connections: StoreConnection[] = (input.services ?? []).map((svc, i) => {
      const id = 5000 + stores.length * 10 + i;
      serviceIds.push(id);
      return {
        id,
        serviceName: svc === 'advertising' ? '广告服务' : svc === 'customer_service' ? '客服服务' : svc === 'logistics' ? '物流服务' : '财务服务',
        serviceType: svc as StoreServiceType,
        authMethod: 'credentials',
        status: 'pending_login',
        runtimeProvider: 'mulerun' as const,
        createdAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
      };
    });
    const store: Store = {
      id: 1000 + stores.length + 1,
      name: input.name,
      platform: input.platform,
      status: 'pending_login',
      authMethod: input.authMethod ?? 'credentials',
      runtimeProvider: 'mulerun',
      apiKey: input.apiKey,
      apiSecret: input.apiSecret ? `••••${input.apiSecret.slice(-4)}` : undefined,
      account: input.account,
      region: input.region,
      currency: input.currency,
      createdAt: new Date().toISOString(),
      recentTaskIds: serviceIds,
      connections
    };
    insertFirst(stores, store);
    // Auto-create store config
    appendItem(storeConfigs, {
      storeId: store.id,
      riskThresholds: { maxBudgetAdjustment: input.maxBudgetAdjust ?? 200, highRiskActions: ['adjust_budget', 'pause_campaign'] },
      operationWindow: { enabled: true, startTime: input.operationWindowStart ?? '09:00', endTime: input.operationWindowEnd ?? '22:00', timezone: 'Asia/Shanghai' },
      autoReconnect: { enabled: true, retryAfterMinutes: input.autoReconnectRetry ?? 5, maxRetries: input.maxRetries ?? 3 },
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false }
    });
    return mockDelay(store);
  },
  updateStatus: (storeId: AllMallId, status: Store['status']) => {
    const store = replaceItem(stores, (item) => item.id === storeId, (item) => ({ ...item, status }));
    return mockDelay(store);
  },
  getConfig: (storeId: AllMallId): Promise<StoreConfig> => {
    const existing = storeConfigs.find((c) => c.storeId === storeId);
    if (existing) return mockDelay(existing);
    const defaults: StoreConfig = {
      storeId,
      riskThresholds: { maxBudgetAdjustment: 200, highRiskActions: ['adjust_budget', 'pause_campaign'] },
      operationWindow: { enabled: true, startTime: '09:00', endTime: '22:00', timezone: 'Asia/Shanghai' },
      autoReconnect: { enabled: true, retryAfterMinutes: 5, maxRetries: 3 },
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false }
    };
    appendItem(storeConfigs, defaults);
    return mockDelay(defaults);
  },
  saveConfig: (storeId: AllMallId, input: Partial<StoreConfig>): Promise<StoreConfig> => {
    const existing = replaceItem(storeConfigs, (c) => c.storeId === storeId, (current) => ({ ...current, ...input, storeId }));
    if (existing) {
      return mockDelay(existing);
    }
    const defaults: StoreConfig = {
      storeId,
      riskThresholds: { maxBudgetAdjustment: 200, highRiskActions: [] },
      operationWindow: { enabled: true, startTime: '09:00', endTime: '22:00', timezone: 'Asia/Shanghai' },
      autoReconnect: { enabled: true, retryAfterMinutes: 5, maxRetries: 3 },
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false },
      ...input
    };
    appendItem(storeConfigs, defaults);
    return mockDelay(defaults);
  },
  addConnection: (storeId: AllMallId, input: { serviceName: string; serviceType: StoreConnection['serviceType']; authMethod: Store['authMethod']; apiKey?: string; account?: string }): Promise<StoreConnection> => {
    const store = stores.find((s) => s.id === storeId);
    const conn: StoreConnection = {
      id: Date.now(),
      serviceName: input.serviceName,
      serviceType: input.serviceType,
      authMethod: input.authMethod,
      status: 'pending_login',
      apiKey: input.apiKey,
      account: input.account,
      runtimeProvider: input.authMethod === 'api_key' ? 'direct' : 'mulerun',
      createdAt: new Date().toISOString()
    };
    if (store) replaceItem(stores, (s) => s.id === storeId, (current) => ({ ...current, connections: [...current.connections, conn] }));
    return mockDelay(conn);
  }
};
