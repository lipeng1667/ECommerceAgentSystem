import { mockDelay } from './client';
import { orders as initialOrders } from './orderMockData';
import { stores } from './mockData';
import { replaceItem } from './mockRepository';
import { recordAuditLog } from './auditLogger';
import { AUTO_FLOW_ORDER_STATUSES, EXCEPTION_ORDER_STATUSES } from '../types/domain';
import { isOrderActionable } from '../utils/orderSla';
import type { AllMallId, Order, OrderSyncResult } from '../types/domain';
import dayjs from 'dayjs';

/**
 * Every mutation in this module is operator-initiated (a person clicked something),
 * so it is logged as `human_ops` — the category the audit page filters on to answer
 * "what did a human change?". Agent-produced steps are not logged here.
 */
function logOrderAction(orderId: AllMallId, action: string, summary: string): void {
  recordAuditLog({
    actor: '当前用户',
    action,
    entity: '订单',
    entityId: orderId,
    summary,
    category: 'human_ops',
  });
}

// In-memory mutable store (matches stores.ts pattern).
const orders: Order[] = [...initialOrders];

function nowIso(): string {
  return dayjs().toISOString();
}

/**
 * Order sync state (D8/O1). Orders are pulled from the stores on a schedule, so the page
 * needs the same answers the products page gives: when did we last look, what did we
 * find, what did automation already handle, and is any store unreachable.
 */
let syncState: OrderSyncResult = {
  startedAt: dayjs().subtract(12, 'minute').toISOString(),
  lastSyncedAt: dayjs().subtract(12, 'minute').toISOString(),
  status: 'success',
  newOrderCount: initialOrders.length,
  autoHandledCount: initialOrders.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length,
  pendingDecisionCount: initialOrders.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length,
  perStore: [],
};

/** Recomputes the derived counts and per-store health from current data. */
function buildSyncResult(patch: Partial<OrderSyncResult>): OrderSyncResult {
  const perStore = stores.map((store) => ({
    storeId: store.id,
    lastSyncedAt: store.status === 'connected' ? syncState.lastSyncedAt : null,
    needsRelogin: store.status === 'login_required' || store.status === 'expired',
    // Connected but the last pass is old enough that the order list may be incomplete.
    stale: store.status === 'connected' && !!syncState.lastSyncedAt && dayjs().diff(syncState.lastSyncedAt, 'hour') >= 2,
  }));
  syncState = {
    ...syncState,
    autoHandledCount: orders.filter((o) => AUTO_FLOW_ORDER_STATUSES.includes(o.status)).length,
    pendingDecisionCount: orders.filter((o) => EXCEPTION_ORDER_STATUSES.includes(o.status)).length,
    perStore,
    ...patch,
  };
  // Hand back a copy: React Query skips the re-render when a cache write returns the
  // same object reference, which would leave the card showing a stale sync time.
  return { ...syncState, perStore: [...syncState.perStore] };
}

/**
 * Orders that need a person right now — exceptions plus anything about to miss (or that
 * has missed) its shipping deadline. Exported synchronously so the dashboard summary and
 * the sidebar badge count exactly what the orders page and inbox show.
 */
export function countActionableOrders(): number {
  return orders.filter((order) => isOrderActionable(order)).length;
}

export const ordersApi = {
  /** List all orders. */
  list: (): Promise<Order[]> => mockDelay([...orders]),

  /** Current order sync digest. */
  getSyncResult: (): Promise<OrderSyncResult> => mockDelay(buildSyncResult({})),

  /**
   * Runs a sync pass. The mock finds nothing new — the point is the honest feedback
   * ("checked, still current"), which a silent no-op button cannot give.
   */
  resync: (): Promise<OrderSyncResult> => {
    const startedAt = nowIso();
    const result = buildSyncResult({
      startedAt,
      lastSyncedAt: startedAt,
      status: 'success',
      newOrderCount: 0,
      errorMessage: undefined,
    });
    // Not tied to one order, so it is logged against the collection rather than via
    // logOrderAction (which takes an order id).
    recordAuditLog({
      actor: '当前用户',
      action: '同步订单',
      entity: '订单',
      entityId: 'all',
      summary: '手动触发订单同步',
      category: 'human_ops',
    });
    return mockDelay(result, 900);
  },

  /** Get a single order by its AllMallId. */
  get: (orderId: AllMallId): Promise<Order | undefined> =>
    mockDelay(orders.find((o) => o.id === orderId)),

  /** Cancel an order and initiate a refund (Tier 3 — requires reason). */
  cancelAndRefund: (orderId: AllMallId, reason: string): Promise<Order | undefined> => {
    const now = nowIso();
    const result = replaceItem(orders, (o) => o.id === orderId, (o) => ({
      ...o,
      status: 'cancelled' as Order['status'],
      agentAction: `运营取消并退款 — ${now}`,
      exceptionReason: undefined,
      exceptionType: undefined,
      recommendation: undefined,
      timeline: [
        ...o.timeline,
        { title: '运营取消并退款', at: now, icon: 'close' as const, note: reason },
        { title: '退款已发起', at: now, icon: 'check' as const, automated: true },
      ],
    }));
    if (result) logOrderAction(orderId, '取消并退款', `原因: ${reason}`);
    return mockDelay(result);
  },

  /** Release a fraud-blocked order into normal processing (Tier 3 — requires reason). */
  releaseFraud: (orderId: AllMallId, reason: string): Promise<Order | undefined> => {
    const now = nowIso();
    const result = replaceItem(orders, (o) => o.id === orderId, (o) => ({
      ...o,
      status: 'awaiting_shipment' as Order['status'],
      agentAction: '运营人工审核通过 → 订单放行，进入正常发货流程',
      exceptionReason: undefined,
      exceptionType: undefined,
      recommendation: undefined,
      timeline: [
        ...o.timeline,
        { title: '人工审核通过（放行）', at: now, icon: 'check' as const, note: reason },
        { title: '进入发货流程', at: now, icon: 'sync' as const, estimated: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm') },
      ],
    }));
    if (result) logOrderAction(orderId, '放行风控订单', `原因: ${reason}`);
    return mockDelay(result);
  },

  /** Apply the recommended action for an exception order (Tier 2 — one-click). */
  applyRecommendation: (orderId: AllMallId): Promise<Order | undefined> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.recommendation) return mockDelay(undefined);
    const now = nowIso();
    const { action, label } = order.recommendation;

    let updated: Order;
    if (action === 'apply_address_fix') {
      updated = {
        ...order,
        status: 'awaiting_shipment' as Order['status'],
        agentAction: `地址已补全（${label}）→ 订单放行，进入正常发货流程`,
        exceptionReason: undefined,
        exceptionType: undefined,
        recommendation: undefined,
        timeline: [
          ...order.timeline,
          { title: label, at: now, icon: 'check' as const, automated: true },
          { title: '进入发货流程', at: now, icon: 'sync' as const, estimated: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm') },
        ],
      };
    } else if (action === 'reallocate_stock') {
      updated = {
        ...order,
        status: 'awaiting_shipment' as Order['status'],
        agentAction: `库存已调拨（${label}）→ 订单放行`,
        exceptionReason: undefined,
        exceptionType: undefined,
        recommendation: undefined,
        timeline: [
          ...order.timeline,
          { title: label, at: now, icon: 'sync' as const, automated: true },
          { title: '订单恢复处理', at: now, icon: 'check' as const, automated: true },
        ],
      };
    } else if (action === 'send_payment_reminder') {
      updated = {
        ...order,
        agentAction: `支付提醒已发送（${label}）`,
        recommendation: undefined,
        timeline: [
          ...order.timeline,
          { title: label, at: now, icon: 'sync' as const, automated: true },
        ],
      };
    } else {
      // release / cancel_refund are Tier 3: they must go through the guarded modal
      // that captures a reason. Fail loudly rather than returning undefined, which a
      // caller cannot tell apart from "order not found".
      throw new Error(`applyRecommendation: ${action} is a Tier 3 action — use releaseFraud/cancelAndRefund`);
    }

    const result = replaceItem(orders, (o) => o.id === orderId, () => updated);
    if (result) logOrderAction(orderId, '应用推荐动作', label);
    return mockDelay(result);
  },
};