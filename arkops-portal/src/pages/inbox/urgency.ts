/**
 * File: urgency.ts
 * Purpose: WS-B shared helpers for approval expiry/aging. Derives the expiry
 * deadline from the approval policy (requestedAt + timeoutHours), formats
 * relative ages and countdowns, and maps the remaining window to an
 * escalation tone used for color coding across the inbox and approval pages.
 *
 * Author: Michael Lee
 * Created: 2026-07-22
 *
 * Main exports:
 * - getApprovalUrgency: expiry deadline, remaining time, and tone for an approval.
 * - formatAge / formatRemaining: localized relative-time strings via t().
 * - URGENCY_COLORS: token-based colors per tone (dark-mode safe).
 *
 * Major updates:
 * - 2026-07-22: WS-B — created for B1/B4/B5 (Action Inbox & approval safeguards).
 */
import dayjs from 'dayjs';
import { getPolicyForRisk } from '../../api/approvalPolicies';
import type { Approval, ApprovalEvidenceField, ApprovalPolicy } from '../../types/domain';

export type UrgencyTone = 'safe' | 'warning' | 'critical';

export interface ApprovalUrgency {
  policy: ApprovalPolicy;
  expiresAt: dayjs.Dayjs;
  /** milliseconds until expiry; <= 0 means past due */
  remainingMs: number;
  /** fraction (0..1) of the timeout window still remaining */
  fractionLeft: number;
  tone: UrgencyTone;
}

/** Token-based colors per urgency tone; red falls back until a token exists. */
export const URGENCY_COLORS: Record<UrgencyTone, string> = {
  safe: 'var(--ark-green)',
  warning: 'var(--ark-orange)',
  critical: 'var(--ark-red)'
};

type TFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Derive expiry data for a pending approval from its risk-level policy.
 * Returns undefined when no policy exists for the risk level.
 */
export function getApprovalUrgency(approval: Approval, at: dayjs.Dayjs = dayjs()): ApprovalUrgency | undefined {
  const policy = getPolicyForRisk(approval.riskLevel);
  if (!policy) return undefined;
  const expiresAt = dayjs(approval.requestedAt).add(policy.timeoutHours, 'hour');
  const windowMs = policy.timeoutHours * 3600_000;
  const remainingMs = expiresAt.diff(at);
  const fractionLeft = Math.max(0, Math.min(1, remainingMs / windowMs));
  const tone: UrgencyTone = fractionLeft <= 0.25 ? 'critical' : fractionLeft <= 0.5 ? 'warning' : 'safe';
  return { policy, expiresAt, remainingMs, fractionLeft, tone };
}

/** "刚刚 / X 分钟前 / X 小时前 / X 天前" for a past timestamp. */
export function formatAge(t: TFunction, iso: string, at: dayjs.Dayjs = dayjs()): string {
  const minutes = Math.max(0, at.diff(dayjs(iso), 'minute'));
  if (minutes < 1) return t('inbox.justNow');
  if (minutes < 60) return t('inbox.minutesAgo', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('inbox.hoursAgo', { hours });
  return t('inbox.daysAgo', { days: Math.floor(hours / 24) });
}

/** "剩余 X 小时 Y 分 / 剩余 X 分钟 / 已到期" for a countdown. */
export function formatRemaining(t: TFunction, remainingMs: number): string {
  if (remainingMs <= 0) return t('inbox.pastDue');
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  if (totalMinutes < 60) return t('inbox.remainMinutes', { minutes: totalMinutes });
  return t('inbox.remainHoursMinutes', { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 });
}

/** Timeout consequence copy key for a policy's timeoutAction. */
export function timeoutConsequenceKey(policy: ApprovalPolicy): string {
  return `inbox.timeout_${policy.timeoutAction}`;
}

export interface EvidenceDelta {
  text: string;
  direction: 'up' | 'down';
}

/**
 * WS-B (B3): compute the delta of one evidence field from its numeric values.
 * Returns undefined when the field is non-numeric or unchanged.
 */
export function computeEvidenceDelta(field: ApprovalEvidenceField): EvidenceDelta | undefined {
  if (field.beforeNumeric === undefined || field.afterNumeric === undefined) return undefined;
  const delta = Number((field.afterNumeric - field.beforeNumeric).toFixed(2));
  if (delta === 0) return undefined;
  const sign = delta > 0 ? '+' : '-';
  const abs = Math.abs(delta);
  const text = field.unit === '¥' ? `${sign}¥${abs}` : `${sign}${abs}${field.unit ?? ''}`;
  return { text, direction: delta > 0 ? 'up' : 'down' };
}
