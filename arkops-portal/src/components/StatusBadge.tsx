/**
 * File: StatusBadge.tsx
 * Purpose: Shared localized badge component for store, task, approval, and risk statuses.
 * It keeps status color mapping and translation key usage consistent across pages.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - StatusBadge: renders a translated Ant Design status tag.
 *
 * Major updates:
 * - 2026-07-03: Added ownership and function documentation for AI-assisted collaboration.
 */
import { memo } from 'react';
import { Tag } from 'antd';
import { useI18n } from '../app/i18n';
import type { ApprovalStatus, RiskLevel, StoreStatus, TaskStatus } from '../types/domain';

const colors: Record<string, string> = {
  connected: 'green',
  pending_login: 'blue',
  login_required: 'orange',
  expired: 'red',
  revoked: 'default',
  draft: 'default',
  queued: 'blue',
  running: 'processing',
  waiting_approval: 'orange',
  succeeded: 'green',
  failed: 'red',
  canceled: 'default',
  cancelled: 'default',
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  low: 'green',
  medium: 'gold',
  high: 'red'
};

/**
 * Renders a localized colored tag for supported domain status values.
 *
 * @param value - Store, task, approval, or risk status value.
 * @returns React element containing the translated status badge.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
export const StatusBadge = memo(function StatusBadge({ value }: { value: StoreStatus | TaskStatus | ApprovalStatus | RiskLevel }) {
  const { t } = useI18n();
  return <Tag color={colors[value]}>{t(`status.${value}`)}</Tag>;
});
