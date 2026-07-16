/**
 * Centralized audit logging utility for AllMall mock API layer.
 *
 * Ensures all state-changing operations in the mock data layer generate
 * consistent audit log entries. Previously, only approvals.ts wrote audit
 * logs; now all mutation operations across all API modules will do so.
 *
 * In production, this would call POST /api/audit-logs.
 * For prototype, log entries are appended to the shared auditLogs array.
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import type { AllMallId, AuditLog } from '../types/domain';
import { nextId } from './idGenerator';

/** Reference to the shared auditLogs array (set via initAuditLogger) */
let auditLogsRef: AuditLog[] | null = null;

/**
 * Initialize the audit logger with a reference to the shared auditLogs array.
 * Must be called once during app initialization.
 */
export function initAuditLogger(logs: AuditLog[]): void {
  auditLogsRef = logs;
}

/**
 * Record an audit log entry for a state-changing operation.
 * Safe to call even if the audit logger hasn't been initialized (no-op).
 */
export function recordAuditLog(input: {
  actor: string;
  action: string;
  entity: string;
  entityId: AllMallId;
  summary: string;
  category: AuditLog['category'];
  linkTo?: string;
}): void {
  if (!auditLogsRef) {
    console.warn('[auditLogger] Not initialized — skipping audit log:', input.summary);
    return;
  }

  const entry: AuditLog = {
    id: nextId('auditLogs', auditLogsRef.length),
    actor: input.actor,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    at: new Date().toISOString(),
    category: input.category,
    linkTo: input.linkTo,
  };

  auditLogsRef.push(entry);
}
