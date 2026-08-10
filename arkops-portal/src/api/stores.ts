import { makeConnectToken, mockDelay } from './client';
import { storeConfigs } from './storeMockData';
import { stores, tasks } from './mockData';
import { appendItem, insertFirst, replaceItem } from './mockRepository';
import { nextId, generateConnectToken } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type { AllMallId, Store, StoreConfig, StoreConnection, StoreServiceType, ServiceGap, StoreSmartSummary, BulkListingCandidate } from '../types/domain';

function logStoreAction(storeId: AllMallId, action: string, summary: string): void {
  recordAuditLog({
    actor: '当前用户',
    action,
    entity: '店铺',
    entityId: storeId,
    summary,
    category: 'store',
  });
}

/** How long a freshly established store session is assumed to stay valid (D7.3). */
const SESSION_VALID_DAYS = 30;

export const storesApi = {
  list: () => mockDelay([...stores]),

  get: (storeId: AllMallId) => mockDelay(stores.find((store) => store.id === storeId)),

  recentTasks: (storeId: AllMallId) => mockDelay(tasks.filter((task) => task.storeId === storeId)),

  createConnectToken: (storeId: AllMallId) =>
    mockDelay({
      storeId,
      connectToken: generateConnectToken(storeId as number),
      expiresInMinutes: 30,
    }),

  create: (input: {
    name: string;
    platform: string;
    authMethod?: Store['authMethod'];
    apiKey?: string;
    apiSecret?: string;
    account?: string;
    password?: string;
    region?: string;
    currency?: string;
    maxBudgetAdjust?: number;
    operationWindowStart?: string;
    operationWindowEnd?: string;
    autoReconnectRetry?: number;
    maxRetries?: number;
    services?: string[];
  }) => {
    const serviceIds: number[] = [];
    const connections: StoreConnection[] = (input.services ?? []).map((svc, i) => {
      const id = nextId('connections', stores.length * 10 + i);
      serviceIds.push(id);
      return {
        id,
        serviceName:
          svc === 'advertising'
            ? '广告服务'
            : svc === 'customer_service'
              ? '客服服务'
              : svc === 'logistics'
                ? '物流服务'
                : '财务服务',
        serviceType: svc as StoreServiceType,
        authMethod: 'credentials',
        status: 'pending_login',
        runtimeProvider: 'mulerun' as const,
        createdAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
      };
    });
    const store: Store = {
      id: nextId('stores', stores.length),
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
      connections,
    };
    insertFirst(stores, store);

    // Auto-create store config
    appendItem(storeConfigs, {
      storeId: store.id,
      riskThresholds: {
        maxBudgetAdjustment: input.maxBudgetAdjust ?? 200,
        highRiskActions: ['adjust_budget', 'pause_campaign'],
      },
      operationWindow: {
        enabled: true,
        startTime: input.operationWindowStart ?? '09:00',
        endTime: input.operationWindowEnd ?? '22:00',
        timezone: 'Asia/Shanghai',
      },
      autoReconnect: {
        enabled: true,
        retryAfterMinutes: input.autoReconnectRetry ?? 5,
        maxRetries: input.maxRetries ?? 3,
      },
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false },
    });

    logStoreAction(store.id, '创建店铺', `创建店铺: ${store.name}`);

    return mockDelay(store);
  },

  updateStatus: (storeId: AllMallId, status: Store['status']) => {
    const store = replaceItem(stores, (item) => item.id === storeId, (item) => ({
      ...item,
      status,
    }));
    if (store) {
      logStoreAction(storeId, '更新状态', `店铺状态更新为 ${status}`);
    }
    return mockDelay(store);
  },

  /**
   * D7.3: re-login / renew a store session. Unlike `updateStatus`, this also refreshes
   * the verification time and pushes out the predicted expiry, so the store leaves both
   * the reactive re-login list and the proactive expiry warning.
   */
  renewSession: (storeId: AllMallId) => {
    const renewedAt = new Date();
    const expiresAt = new Date(renewedAt.getTime() + SESSION_VALID_DAYS * 24 * 60 * 60 * 1000);
    const store = replaceItem(stores, (item) => item.id === storeId, (item) => ({
      ...item,
      status: 'connected' as const,
      lastVerifiedAt: renewedAt.toISOString(),
      authExpiresAt: expiresAt.toISOString(),
    }));
    if (store) {
      logStoreAction(storeId, '续期会话', `店铺会话已续期，有效期至 ${expiresAt.toISOString()}`);
    }
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
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false },
    };
    appendItem(storeConfigs, defaults);
    return mockDelay(defaults);
  },

  saveConfig: (storeId: AllMallId, input: Partial<StoreConfig>): Promise<StoreConfig> => {
    const existing = replaceItem(storeConfigs, (c) => c.storeId === storeId, (current) => ({
      ...current,
      ...input,
      storeId,
    }));
    if (existing) {
      logStoreAction(storeId, '保存配置', `店铺配置已更新`);
      return mockDelay(existing);
    }
    const defaults: StoreConfig = {
      storeId,
      riskThresholds: { maxBudgetAdjustment: 200, highRiskActions: [] },
      operationWindow: { enabled: true, startTime: '09:00', endTime: '22:00', timezone: 'Asia/Shanghai' },
      autoReconnect: { enabled: true, retryAfterMinutes: 5, maxRetries: 3 },
      approvalRules: { useIndependentApprover: false, enableSecondApproval: false },
      ...input,
    };
    appendItem(storeConfigs, defaults);
    logStoreAction(storeId, '创建配置', `店铺配置已创建`);
    return mockDelay(defaults);
  },

  addConnection: (
    storeId: AllMallId,
    input: {
      serviceName: string;
      serviceType: StoreConnection['serviceType'];
      authMethod: Store['authMethod'];
      apiKey?: string;
      account?: string;
    }
  ): Promise<StoreConnection> => {
    const store = stores.find((s) => s.id === storeId);
    const conn: StoreConnection = {
      id: nextId('connections', store?.connections?.length ?? 0),
      serviceName: input.serviceName,
      serviceType: input.serviceType,
      authMethod: input.authMethod,
      status: 'pending_login',
      apiKey: input.apiKey,
      account: input.account,
      runtimeProvider: input.authMethod === 'api_key' ? 'direct' : 'mulerun',
      createdAt: new Date().toISOString(),
    };
    if (store) {
      replaceItem(stores, (s) => s.id === storeId, (current) => ({
        ...current,
        connections: [...current.connections, conn],
      }));
    }
    logStoreAction(storeId, '添加连接', `添加服务连接: ${input.serviceName}`);
    return mockDelay(conn);
  },

  // ===== D7 Round 2: Store Smart Flow =====

  /** Detect missing high-value services for a store. */
  getServiceGaps: (storeId: AllMallId): Promise<ServiceGap[]> => {
    const store = stores.find((s) => s.id === storeId);
    if (!store || store.status === 'revoked') return mockDelay([]);
    const existingTypes = new Set(store.connections?.map((c) => c.serviceType) ?? []);
    const allServices: { type: StoreServiceType; name: string; agents: string[]; rationale: string; severity: ServiceGap['severity']; impact: number }[] = [
      { type: 'advertising', name: '千川广告', agents: ['ad_optimizer', 'pricing_agent'], rationale: '店铺有大量订单但未开启广告投放，开通后可自动化投放和优化', severity: 'high', impact: 12000 },
      { type: 'customer_service', name: '飞鸽客服', agents: ['coupon_agent', 'review_agent'], rationale: '店铺有订单但无法自动回复客户消息和处理售后', severity: 'high', impact: 8500 },
      { type: 'logistics', name: '物流服务', agents: ['stock_alert'], rationale: '缺少物流授权，库存预警 Agent 无法获取实时履约数据', severity: 'medium', impact: 3000 },
      { type: 'finance', name: '财务服务', agents: ['finance_audit'], rationale: '缺少财务授权，无法自动对账和生成财务报告', severity: 'low', impact: 1500 },
    ];
    const gaps: ServiceGap[] = allServices
      .filter((svc) => !existingTypes.has(svc.type))
      .map((svc, idx) => ({
        id: (nextId('fieldConflicts', existingTypes.size) + idx) as AllMallId,
        storeId,
        serviceType: svc.type,
        serviceName: svc.name,
        blockedAgents: svc.agents,
        rationale: svc.rationale,
        estimatedGmvImpact: svc.impact,
        severity: svc.severity,
      }));
    return mockDelay(gaps);
  },

  /** Generate smart summary after store connection. */
  getSmartSummary: (storeId: AllMallId): Promise<StoreSmartSummary | null> => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return mockDelay(null);
    const existingTypes = new Set(store.connections?.map((c) => c.serviceType) ?? []);
    const gaps: StoreSmartSummary['serviceGaps'] = [];
    if (!existingTypes.has('customer_service')) {
      gaps.push({ serviceType: 'customer_service', serviceName: '飞鸽客服', blockedAgents: ['coupon_agent', 'review_agent'] });
    }
    if (!existingTypes.has('advertising')) {
      gaps.push({ serviceType: 'advertising', serviceName: '千川广告', blockedAgents: ['ad_optimizer', 'pricing_agent'] });
    }
    const summary: StoreSmartSummary = {
      storeId,
      metrics: { products: 1236, skus: 3852, orders: 28410, reviews: 9642 },
      serviceGaps: gaps,
      recommendedFirstAction: gaps.length > 0
        ? { type: 'fill_service_gap', title: '补全服务授权', description: `检测到 ${gaps.length} 项缺失服务，补全后可解锁全部 Agent 能力` }
        : { type: 'start_agent', title: '开启首个 Agent', description: '推荐从差评巡检 Agent 开始，零风险观察店铺健康度' },
      listableProductCount: 68,
    };
    return mockDelay(summary);
  },

  /** Get products that can be bulk-listed to a store that doesn't have them yet. */
  getBulkListingCandidates: (storeId: AllMallId): Promise<BulkListingCandidate[]> => {
    const baseId = nextId('products', 0);
    const candidates: BulkListingCandidate[] = [
      {
        productId: baseId as AllMallId, spuCode: 'SPU-001',
        name: 'iPhone 防摔硅胶手机壳', image: '', suggestedPrice: 29.90,
        listedOnStores: ['拼多多旗舰店', '淘宝专营店'],
      },
      {
        productId: (baseId + 1) as AllMallId, spuCode: 'SPU-002',
        name: 'Type-C 快充数据线 1米', image: '', suggestedPrice: 15.90,
        listedOnStores: ['拼多多旗舰店', '淘宝专营店', '京东旗舰店'],
      },
      {
        productId: (baseId + 2) as AllMallId, spuCode: 'SPU-003',
        name: '无线蓝牙耳机 降噪版', image: '', suggestedPrice: 89.00,
        listedOnStores: ['拼多多旗舰店', '淘宝专营店'],
      },
      {
        productId: (baseId + 3) as AllMallId, spuCode: 'SPU-004',
        name: '手机支架 桌面折叠款', image: '', suggestedPrice: 12.50,
        listedOnStores: ['拼多多旗舰店'],
      },
      {
        productId: (baseId + 4) as AllMallId, spuCode: 'SPU-005',
        name: '屏幕清洁套装 喷雾+布', image: '', suggestedPrice: 9.90,
        listedOnStores: ['拼多多旗舰店', '淘宝专营店', '京东旗舰店'],
      },
    ];
    return mockDelay(candidates);
  },
};
