import { mockDelay } from './client';
import { orders as initialOrders } from './orderMockData';
import { replaceItem } from './mockRepository';
import { recordAuditLog } from './auditLogger';
import type { AllMallId, Order } from '../types/domain';
import dayjs from 'dayjs';

function logOrderAction(orderId: AllMallId, action: string, summary: string): void {
  recordAuditLog({
    actor: '当前用户',
    action,
    entity: '订单',
    entityId: orderId,
    summary,
    category: 'agent_action',
  });
}

// In-memory mutable store (matches stores.ts pattern).
const orders: Order[] = [...initialOrders];

function nowIso(): string {
  return dayjs().toISOString();
}

export const ordersApi = {
  /** List all orders. */
  list: (): Promise<Order[]> => mockDelay([...orders]),

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
        { title: '进入发货流程', at: '预计 2 小时内', icon: 'sync' as const, estimated: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm') },
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
          { title: '进入发货流程', at: '预计 2 小时内', icon: 'sync' as const, estimated: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm') },
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
      // release or cancel_refund — these go through the Tier 3 guarded modals
      return mockDelay(undefined);
    }

    const result = replaceItem(orders, (o) => o.id === orderId, () => updated);
    if (result) logOrderAction(orderId, '应用推荐动作', label);
    return mockDelay(result);
  },
};

/** Re-export the mutable array for use when order APIs need raw access (e.g. inbox). */
export { orders as orderMutableStore };