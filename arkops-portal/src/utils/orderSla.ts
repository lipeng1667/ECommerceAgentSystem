/**
 * File: orderSla.ts
 * Purpose: Shipping-deadline (SLA) rules for orders, shared by the orders page, the
 * Action Inbox and the sidebar badge so all three agree on what "urgent" means.
 *
 * Author: TBD
 * Created: 2026-07-28
 *
 * Main exports:
 * - getSlaTone: how close an order is to its platform shipping deadline.
 * - isOrderActionable: whether an order needs a person right now.
 */
import dayjs from 'dayjs';
import { EXCEPTION_ORDER_STATUSES } from '../types/domain';
import type { Order, OrderStatus } from '../types/domain';

/**
 * The deadline only means something before the parcel leaves: once an order is shipped,
 * completed or cancelled there is nothing left to miss.
 */
export const SLA_TRACKED_STATUSES: OrderStatus[] = ['auto_processing', 'awaiting_shipment', 'exception', 'fraud_blocked'];

export const SLA_CRITICAL_MS = 2 * 3600_000;
export const SLA_WARNING_MS = 6 * 3600_000;

export type SlaTone = 'none' | 'ok' | 'warning' | 'critical' | 'breached';

export interface SlaState {
  /** Milliseconds until the deadline; `Number.MAX_SAFE_INTEGER` when not tracked. */
  remainingMs: number;
  tone: SlaTone;
}

/** How close an order is to its platform shipping deadline. */
export function getSlaState(order: Order, now: dayjs.Dayjs = dayjs()): SlaState {
  if (!order.shipDeadlineAt || !SLA_TRACKED_STATUSES.includes(order.status)) {
    return { remainingMs: Number.MAX_SAFE_INTEGER, tone: 'none' };
  }
  const remainingMs = dayjs(order.shipDeadlineAt).diff(now);
  if (remainingMs <= 0) return { remainingMs, tone: 'breached' };
  if (remainingMs <= SLA_CRITICAL_MS) return { remainingMs, tone: 'critical' };
  if (remainingMs <= SLA_WARNING_MS) return { remainingMs, tone: 'warning' };
  return { remainingMs, tone: 'ok' };
}

/**
 * Whether an order needs a person now: it is an exception, or it is about to miss (or
 * has missed) the platform deadline. This is the single definition behind the orders
 * page's "needs you" count, the inbox items and the sidebar badge.
 */
export function isOrderActionable(order: Order, now: dayjs.Dayjs = dayjs()): boolean {
  if (EXCEPTION_ORDER_STATUSES.includes(order.status)) return true;
  const { tone } = getSlaState(order, now);
  return tone === 'breached' || tone === 'critical';
}
