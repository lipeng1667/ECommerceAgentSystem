/**
 * File: csSla.ts
 * Purpose: The single definition of what "on-time customer service" means, shared by
 * the CS SLA monitor board, its fallback queue, and (later) the store health score —
 * so every surface agrees on the first-response target and what counts as breached.
 * Mirrors orderSla.ts for shipping deadlines.
 *
 * Two clocks, because platforms enforce two different things:
 *  - first-response target: how fast the FIRST reply must go out (AI 秒回 territory).
 *  - pending wait window: how long an unanswered buyer may sit before a human must
 *    step in (the fallback queue's urgency).
 *
 * Created: 2026-08-05
 */
import type { CustomerSession } from '../types/domain';

export type CsSlaTone = 'ok' | 'warning' | 'breached' | 'none';

/** Per-platform first-response target in seconds. Tunable — this is the "3 秒/1 分钟" knob. */
export const CS_SLA_RULES: Record<string, number> = {
  pinduoduo: 30,
  taobao: 60,
  jd: 60,
};
export const CS_DEFAULT_TARGET_SECONDS = 60;

/** Unanswered-buyer escalation window: warn at 3 min, breach at 5 min. */
export const CS_PENDING_WARN_SECONDS = 180;
export const CS_PENDING_BREACH_SECONDS = 300;

export function firstResponseTarget(platformId: string): number {
  return CS_SLA_RULES[platformId] ?? CS_DEFAULT_TARGET_SECONDS;
}

/** Whether an answered session met its first-response target (null while unanswered). */
export function firstResponseMet(session: CustomerSession): boolean | null {
  if (session.firstResponseSeconds == null) return null;
  return session.firstResponseSeconds <= firstResponseTarget(session.platformId);
}

/** How long a pending session's buyer has waited for a reply, in seconds. */
export function pendingWaitSeconds(session: CustomerSession, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(session.lastMessageAt).getTime()) / 1000));
}

/** Urgency of a pending session; 'none' for anything already answered/closed. */
export function pendingTone(session: CustomerSession, now: number = Date.now()): CsSlaTone {
  if (session.status !== 'pending_reply') return 'none';
  const waited = pendingWaitSeconds(session, now);
  if (waited >= CS_PENDING_BREACH_SECONDS) return 'breached';
  if (waited >= CS_PENDING_WARN_SECONDS) return 'warning';
  return 'ok';
}

export interface CsSlaSummary {
  total: number;
  answered: number;
  met: number;
  /** % of answered sessions that hit the first-response target (null if none answered). */
  metRate: number | null;
  /** Average first-response time across answered sessions, in seconds (null if none). */
  avgFirstResponse: number | null;
  pending: number;
  pendingBreached: number;
  pendingWarning: number;
  /** % of answered sessions the AI first-answered (null if none answered). */
  aiRate: number | null;
}

export function computeCsSla(sessions: CustomerSession[], now: number = Date.now()): CsSlaSummary {
  const answeredSessions = sessions.filter((s) => s.firstResponseSeconds != null);
  const met = answeredSessions.filter((s) => firstResponseMet(s) === true).length;
  const aiAnswered = answeredSessions.filter((s) => s.handledBy === 'ai').length;
  const pendingSessions = sessions.filter((s) => s.status === 'pending_reply');
  const avg =
    answeredSessions.length > 0
      ? Math.round(answeredSessions.reduce((sum, s) => sum + (s.firstResponseSeconds ?? 0), 0) / answeredSessions.length)
      : null;

  return {
    total: sessions.length,
    answered: answeredSessions.length,
    met,
    metRate: answeredSessions.length > 0 ? Math.round((met / answeredSessions.length) * 100) : null,
    avgFirstResponse: avg,
    pending: pendingSessions.length,
    pendingBreached: pendingSessions.filter((s) => pendingTone(s, now) === 'breached').length,
    pendingWarning: pendingSessions.filter((s) => pendingTone(s, now) === 'warning').length,
    aiRate: answeredSessions.length > 0 ? Math.round((aiAnswered / answeredSessions.length) * 100) : null,
  };
}

/** Overall health colour for a store's CS, from its first-response met-rate. */
export function metRateTone(metRate: number | null): CsSlaTone {
  if (metRate == null) return 'none';
  if (metRate >= 90) return 'ok';
  if (metRate >= 70) return 'warning';
  return 'breached';
}
