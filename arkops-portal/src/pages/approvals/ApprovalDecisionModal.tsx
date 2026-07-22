/**
 * File: ApprovalDecisionModal.tsx
 * Purpose: WS-B (B4) shared confirm step for approval decisions. Both the
 * approval detail page and the Action Inbox quick actions route approve/reject
 * through this modal so no decision can be committed with a single click.
 * Shows the consequence of the decision, the real change summary, dual-approval
 * context, and captures an optional note that is written to the audit log.
 *
 * Author: Michael Lee
 * Created: 2026-07-22
 *
 * Main exports:
 * - ApprovalDecisionModal: confirm dialog with consequence copy + optional note.
 *
 * Major updates:
 * - 2026-07-22: WS-B — created for B4 decision safeguards.
 */
import { ArrowRightOutlined } from '@ant-design/icons';
import { Alert, Input, Modal, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '../../app/i18n';
import { getPolicyForRisk } from '../../api/approvalPolicies';
import { computeEvidenceDelta } from '../inbox/urgency';
import type { Approval } from '../../types/domain';

export type ApprovalDecision = 'approved' | 'rejected';

interface ApprovalDecisionModalProps {
  approval: Approval | null;
  decision: ApprovalDecision | null;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}

/**
 * Confirm dialog for approve/reject decisions with consequence explanation,
 * real evidence summary, and an optional decision note.
 */
export function ApprovalDecisionModal({ approval, decision, submitting, onCancel, onConfirm }: ApprovalDecisionModalProps) {
  const { t } = useI18n();
  const [note, setNote] = useState('');
  const open = !!approval && !!decision;

  useEffect(() => {
    if (open) setNote('');
  }, [open, approval?.id, decision]);

  if (!approval || !decision) {
    return null;
  }

  const isApprove = decision === 'approved';
  const policy = getPolicyForRisk(approval.riskLevel);
  const isDual = policy?.action === 'dual_approval';
  const completedApprovals = approval.priorApprovals?.length ?? 0;
  const isFirstOfDual = isApprove && isDual && completedApprovals + 1 < 2;

  const consequence = isApprove
    ? isDual
      ? t('approvalDetail.dualApproveConsequence', { step: completedApprovals + 1 })
      : t('approvalDetail.approveConsequence')
    : t('approvalDetail.rejectConsequence');

  return (
    <Modal
      open={open}
      title={isApprove ? t('approvalDetail.confirmApproveTitle') : t('approvalDetail.confirmRejectTitle')}
      okText={
        isFirstOfDual
          ? t('approvalDetail.confirmFirstApprove')
          : isApprove
            ? t('approvalDetail.confirmApprove')
            : t('approvalDetail.confirmReject')
      }
      cancelText={t('common.cancel')}
      okButtonProps={{ danger: !isApprove, loading: submitting }}
      onOk={() => onConfirm(note.trim())}
      onCancel={onCancel}
      destroyOnClose
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert type={isApprove ? 'info' : 'warning'} showIcon message={consequence} />
        <div>
          <Typography.Text strong>{approval.title}</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 4, fontSize: 12 }}>
            {approval.storeName} · {t(`agent.${approval.agentType}`)}
          </Typography.Paragraph>
          {approval.evidence?.length ? (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {approval.evidence.map((field) => {
                const delta = computeEvidenceDelta(field);
                return (
                  <Typography.Text key={field.label} style={{ fontSize: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{field.label}：</Typography.Text>
                    {field.before} <ArrowRightOutlined style={{ fontSize: 10, color: 'var(--ark-muted)' }} /> {field.after}
                    {delta && (
                      <Tag
                        style={{ marginLeft: 6, fontSize: 10 }}
                        color={delta.direction === 'up' ? 'blue' : 'orange'}
                      >
                        {delta.text}
                      </Tag>
                    )}
                  </Typography.Text>
                );
              })}
            </Space>
          ) : (
            <Typography.Text style={{ fontSize: 12 }}>
              {approval.beforeValue} <ArrowRightOutlined style={{ fontSize: 10, color: 'var(--ark-muted)' }} /> {approval.afterValue}
            </Typography.Text>
          )}
        </div>
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            {t('approvalDetail.noteLabel')}
          </Typography.Text>
          <Input.TextArea
            rows={2}
            maxLength={200}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('approvalDetail.notePlaceholder')}
          />
        </div>
      </Space>
    </Modal>
  );
}
