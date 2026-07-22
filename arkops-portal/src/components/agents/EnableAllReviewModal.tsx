/**
 * File: EnableAllReviewModal.tsx
 * Purpose: WS-D (D4/D1) risk-grouped review modal replacing the blind "一键启用全部"
 * Popconfirm. Groups candidate agents by risk level with per-agent checkboxes and
 * approval implications; high-risk agents are unchecked by default. Also reused as
 * the scenario activation review surface on SetupConfigPage.
 *
 * Author: Michael Lee (WS-D)
 * Created: 2026-07-22
 */
import { CheckCircleOutlined, ExclamationCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Checkbox, Modal, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../app/i18n';
import type { AgentConfig, AgentType, RiskLevel } from '../../types/domain';

interface EnableAllReviewModalProps {
  open: boolean;
  title: string;
  /** Optional intro line above the risk groups (defaults to bulk-enable copy). */
  intro?: string;
  /** Candidate agents to review (disabled agents to be enabled). */
  candidates: AgentConfig[];
  /** Extra dependency agents that will be auto-included (informational). */
  extraDeps?: AgentType[];
  confirmLoading?: boolean;
  onConfirm: (selected: AgentType[]) => void;
  onCancel: () => void;
}

const RISK_ORDER: RiskLevel[] = ['high', 'medium', 'low'];

const RISK_META: Record<RiskLevel, { color: string; labelKey: string }> = {
  high: { color: '#dc2626', labelKey: 'agenttrust.riskGroupHigh' },
  medium: { color: '#ea580c', labelKey: 'agenttrust.riskGroupMedium' },
  low: { color: '#16a34a', labelKey: 'agenttrust.riskGroupLow' },
};

export function EnableAllReviewModal({
  open,
  title,
  intro,
  candidates,
  extraDeps = [],
  confirmLoading,
  onConfirm,
  onCancel,
}: EnableAllReviewModalProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<AgentType>>(new Set());

  // Default selection whenever the modal (re)opens: low + medium checked, high unchecked.
  // Depends on `open` only — candidates arrays are recreated on parent renders and must
  // not reset the user's in-progress selection.
  useEffect(() => {
    if (open) {
      setSelected(new Set(candidates.filter((a) => a.riskLevel !== 'high').map((a) => a.agentType)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const groups = useMemo(
    () =>
      RISK_ORDER.map((risk) => ({
        risk,
        agents: candidates.filter((a) => a.riskLevel === risk),
      })).filter((g) => g.agents.length > 0),
    [candidates]
  );

  const toggle = (agentType: AgentType, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(agentType);
      else next.delete(agentType);
      return next;
    });
  };

  return (
    <Modal
      open={open}
      title={<><ThunderboltOutlined style={{ marginRight: 8, color: '#7c3aed' }} />{title}</>}
      width={640}
      okText={t('agenttrust.enableSelected', { count: selected.size })}
      okButtonProps={{ disabled: selected.size === 0 }}
      cancelText={t('common.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => onConfirm([...selected])}
      onCancel={onCancel}
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        {intro ?? t('agenttrust.bulkEnableIntro')}
      </Typography.Paragraph>

      {groups.map((group) => (
        <div key={group.risk} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              padding: '4px 10px', borderRadius: 6,
              background: `${RISK_META[group.risk].color}10`,
              borderLeft: `3px solid ${RISK_META[group.risk].color}`,
            }}
          >
            <ExclamationCircleOutlined style={{ color: RISK_META[group.risk].color }} />
            <Typography.Text strong style={{ fontSize: 13 }}>
              {t(RISK_META[group.risk].labelKey)}
            </Typography.Text>
            <Tag style={{ fontSize: 11 }}>{group.agents.length}</Tag>
          </div>
          <Space direction="vertical" size={8} style={{ width: '100%', paddingLeft: 4 }}>
            {group.agents.map((agent) => (
              <div key={agent.agentType} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Checkbox
                  checked={selected.has(agent.agentType)}
                  onChange={(e) => toggle(agent.agentType, e.target.checked)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space size={6} wrap>
                    <Typography.Text strong style={{ fontSize: 13 }}>{agent.displayName}</Typography.Text>
                    {agent.approvalStrategy?.requireApproval ? (
                      <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>
                        {t('agenttrust.needsApprovalTag')} · {agent.approvalStrategy.approverRole || '-'}
                      </Tag>
                    ) : (
                      <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 10, margin: 0 }}>
                        {t('agenttrust.autoExecTag')}
                      </Tag>
                    )}
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }} ellipsis>
                    {agent.description}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </Space>
        </div>
      ))}

      {extraDeps.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 8 }}
          message={t('scenario.extraDepsNote', { agents: extraDeps.map((d) => t(`agent.${d}`)).join('、') })}
        />
      )}
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
        {t('agenttrust.depsAutoInclude')}
      </Typography.Text>
    </Modal>
  );
}
