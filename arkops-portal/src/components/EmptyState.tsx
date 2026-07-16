import { InboxOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
import { memo, type ReactNode } from 'react';
import { useI18n } from '../app/i18n';

interface EmptyStateProps {
  description?: string;
  /** Optional action button text */
  actionText?: string;
  /** Optional action button icon */
  actionIcon?: ReactNode;
  /** Callback when action button is clicked */
  onAction?: () => void;
}

/**
 * Renders a reusable localized empty state with optional action button.
 * Unified template: icon + description + primary action button.
 */
export const EmptyState = memo(function EmptyState({ description, actionText, actionIcon, onAction }: EmptyStateProps) {
  const { t } = useI18n();
  return (
    <Empty
      image={<InboxOutlined style={{ fontSize: 44, color: '#94a3b8' }} />}
      description={description ?? t('common.empty')}
    >
      {onAction && actionText && (
        <Button type="primary" icon={actionIcon} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  );
});
