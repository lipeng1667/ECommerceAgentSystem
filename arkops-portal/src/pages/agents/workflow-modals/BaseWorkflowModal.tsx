/**
 * BaseWorkflowModal — reusable Modal + Tabs wrapper for Agent workflow modals.
 *
 * All 28 workflow-modals in the agents module followed the same pattern:
 * Modal with an icon title, Tabs with multiple content sections, and
 * EmptyState for empty data. This component standardizes that pattern,
 * reducing boilerplate and ensuring consistent UX.
 *
 * Usage:
 * ```tsx
 * <BaseWorkflowModal
 *   open={pricingOpen}
 *   onClose={onClosePricing}
 *   title={t('pricing.title')}
 *   icon={<DollarOutlined />}
 *   iconColor="#ea580c"
 *   tabs={[
 *     { key: 'analysis', label: t('pricing.analysisTab'), children: <AnalysisView /> },
 *     { key: 'rules', label: t('pricing.rulesTab'), children: <RulesView /> },
 *   ]}
 * />
 * ```
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import type { ReactNode } from 'react';
import { Modal, Tabs } from 'antd';
import { useI18n } from '../../../app/i18n';

export interface WorkflowModalTab {
  key: string;
  label: string;
  /** Optional badge count shown next to the tab label */
  badge?: number;
  children: ReactNode;
}

export interface BaseWorkflowModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Modal title text */
  title: string;
  /** Icon element displayed in the title */
  icon?: ReactNode;
  /** Color for the title icon (default: '#2563eb') */
  iconColor?: string;
  /** Tab definitions */
  tabs: WorkflowModalTab[];
  /** Default active tab key */
  defaultActiveKey?: string;
  /** Modal width (default: 860) */
  width?: number;
  /** Additional footer content */
  footer?: ReactNode;
  /** Content rendered before the Tabs (e.g. summary statistics) */
  preContent?: ReactNode;
}

export function BaseWorkflowModal({
  open,
  onClose,
  title,
  icon,
  iconColor = '#2563eb',
  tabs,
  defaultActiveKey,
  width = 860,
  footer,
  preContent,
}: BaseWorkflowModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      title={
        <>
          {icon && <span style={{ color: iconColor, marginRight: 8 }}>{icon}</span>}
          {title}
        </>
      }
      open={open}
      onCancel={onClose}
      footer={footer ?? null}
      width={width}
      destroyOnClose
    >
      {preContent}
      <Tabs
        defaultActiveKey={defaultActiveKey ?? tabs[0]?.key}
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.badge != null ? `${tab.label} (${tab.badge})` : tab.label,
          children: <div style={{ maxHeight: 500, overflow: 'auto' }}>{tab.children}</div>,
        }))}
      />
    </Modal>
  );
}
