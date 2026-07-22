/**
 * File: AgentPreEnableDrawer.tsx
 * Purpose: WS-D (D4) shared pre-enable confirmation drawer. Before an agent is enabled
 * from either the list page or the detail page, the merchant sees what the agent will
 * do (built-in tasks), how often it runs (cadence), its risk level, approval policy,
 * budget guardrails, and dependency status — then explicitly confirms.
 *
 * Author: Michael Lee (WS-D)
 * Created: 2026-07-22
 */
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Divider, Drawer, Space, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { BUILTIN_TASKS } from '../../pages/agents/AgentBuiltinTasksSection';
import type { AgentConfig } from '../../types/domain';

interface AgentPreEnableDrawerProps {
  agent: AgentConfig | null;
  open: boolean;
  confirmLoading?: boolean;
  /** All agents — used to display dependency enabled-state. */
  allAgents: AgentConfig[];
  onConfirm: () => void;
  onClose: () => void;
}

function describeCadence(agent: AgentConfig, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (agent.triggerMode === 'event') return t('agenttrust.cadenceEvent', { event: agent.eventTrigger ?? '-' });
  if (agent.triggerMode === 'manual') return t('agenttrust.cadenceManual');
  const cron = agent.cronExpression ?? '';
  const parts = cron.split(' ');
  if (parts.length >= 5) {
    const [min, hour] = parts;
    if (min === '0' && hour.startsWith('*/')) {
      return t('agent.cronEveryNHours', { n: parseInt(hour.replace('*/', ''), 10) });
    }
    if (hour === '*' && min.startsWith('*/')) {
      return t('agent.cronEveryNMinutes', { n: parseInt(min.replace('*/', ''), 10) });
    }
  }
  return cron || t('agent.cronCustom');
}

export function AgentPreEnableDrawer({
  agent,
  open,
  confirmLoading,
  allAgents,
  onConfirm,
  onClose,
}: AgentPreEnableDrawerProps) {
  const { t } = useI18n();
  if (!agent) return null;

  const riskColor = agent.riskLevel === 'high' ? 'red' : agent.riskLevel === 'medium' ? 'orange' : 'green';
  const riskLabel = agent.riskLevel === 'high' ? t('agent.highRisk') : agent.riskLevel === 'medium' ? t('agent.mediumRisk') : t('agent.lowRisk');
  const tasks = BUILTIN_TASKS[agent.agentType] ?? [];
  const rules = agent.approvalStrategy?.autoApproveRules;

  return (
    <Drawer
      title={t('agenttrust.preEnableTitle', { name: agent.displayName })}
      open={open}
      onClose={onClose}
      width={440}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={confirmLoading} onClick={onConfirm}>
            {t('agenttrust.confirmEnable')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        {agent.description}
      </Typography.Paragraph>

      {/* 它会做什么 */}
      <Divider orientation="left" plain style={{ margin: '12px 0 8px' }}>
        <ThunderboltOutlined style={{ marginRight: 6 }} />{t('agenttrust.whatItDoes')}
      </Divider>
      {tasks.length > 0 ? (
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {tasks.map((task) => (
            <li key={task.titleKey} style={{ marginBottom: 6 }}>
              <Typography.Text style={{ fontSize: 13 }} strong>{t(`agent.${task.titleKey}`)}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                {t(`agent.${task.descKey}`)}
              </Typography.Text>
            </li>
          ))}
        </ul>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agent.none')}</Typography.Text>
      )}

      {/* 运行节奏 */}
      <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
        <ClockCircleOutlined style={{ marginRight: 6 }} />{t('agenttrust.cadence')}
      </Divider>
      <Tag color="purple">{describeCadence(agent, t)}</Tag>

      {/* 风险与审批 */}
      <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
        <SafetyOutlined style={{ marginRight: 6 }} />{t('agenttrust.riskPolicy')}
      </Divider>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <div>
          <Tag color={riskColor}>{riskLabel}</Tag>
          {agent.riskGuard.maxBudgetPerAction > 0 && (
            <Tag>{t('agenttrust.budgetGuard', { amount: agent.riskGuard.maxBudgetPerAction })}</Tag>
          )}
        </div>
        <Alert
          type={agent.approvalStrategy?.requireApproval ? 'warning' : 'info'}
          showIcon
          message={
            agent.approvalStrategy?.requireApproval
              ? t('agenttrust.needsApprovalNote', { role: agent.approvalStrategy.approverRole || '-' })
              : t('agenttrust.autoExecNote')
          }
          description={
            rules ? (
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agenttrust.autoApproveRules')}:</Typography.Text>
                {rules.maxPriceChangePct !== undefined && (
                  <Typography.Text style={{ fontSize: 12 }}>· {t('agenttrust.autoApprovePricePct', { pct: rules.maxPriceChangePct })}</Typography.Text>
                )}
                {rules.maxBudgetChange !== undefined && (
                  <Typography.Text style={{ fontSize: 12 }}>· {t('agenttrust.autoApproveBudget', { amount: rules.maxBudgetChange })}</Typography.Text>
                )}
                {rules.maxOrderValue !== undefined && (
                  <Typography.Text style={{ fontSize: 12 }}>· {t('agenttrust.autoApproveOrder', { amount: rules.maxOrderValue })}</Typography.Text>
                )}
              </Space>
            ) : undefined
          }
        />
      </Space>

      {/* 依赖 */}
      {agent.dependsOn.length > 0 && (
        <>
          <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
            <CheckCircleOutlined style={{ marginRight: 6 }} />{t('agenttrust.deps')}
          </Divider>
          <Space size={6} wrap>
            {agent.dependsOn.map((dep) => {
              const depEnabled = allAgents.find((a) => a.agentType === dep)?.enabled === true;
              return (
                <Tag key={dep} color={depEnabled ? 'green' : 'red'}>
                  {t(`agent.${dep}`)} · {depEnabled ? t('agenttrust.depsSatisfied') : t('agenttrust.depMissingTag')}
                </Tag>
              );
            })}
          </Space>
        </>
      )}
    </Drawer>
  );
}
