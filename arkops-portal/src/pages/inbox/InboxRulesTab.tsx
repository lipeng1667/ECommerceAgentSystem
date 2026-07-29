/**
 * File: InboxRulesTab.tsx
 * Purpose: "规则与日志" tab of the Action Inbox (D9). Two read-only references that used
 * to live on the pages folded into the inbox: which risk levels need approval (from the
 * approval centre) and what automation already handled on its own (from the exception
 * centre). Neither is a to-do, which is why they sit apart from the pending queue.
 *
 * Author: TBD
 * Created: 2026-07-29
 *
 * Main exports:
 * - InboxRulesTab: rendered inside InboxPage's tab layout.
 */
import { RobotOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { approvalPolicyApi } from '../../api/approvalPolicies';
import { useI18n } from '../../app/i18n';
import { StatusBadge } from '../../components/StatusBadge';
import { DataTableCard } from '../../components/table/DataTableCard';
import { createAgentLogColumns } from '../operations/exceptionCenterColumns';
import { agentLogData } from '../operations/exceptionCenterMockData';
import type { AgentConfig, ApprovalPolicy } from '../../types/domain';

const actionLabels: Record<ApprovalPolicy['action'], string> = {
  auto_execute: 'agent.autoExecute',
  single_approval: 'agent.singleApproval',
  dual_approval: 'agent.dualApproval',
};

const actionTags: Record<ApprovalPolicy['action'], string> = {
  auto_execute: 'green',
  single_approval: 'blue',
  dual_approval: 'red',
};

type AgentWithPolicy = AgentConfig & { policy?: ApprovalPolicy };

export function InboxRulesTab() {
  const { t } = useI18n();
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });
  const { data: policies = [] } = useQuery({ queryKey: ['approval-policies'], queryFn: approvalPolicyApi.list });

  const agentPolicies: AgentWithPolicy[] = agents.map((agent) => ({
    ...agent,
    policy: policies.find((policy) => policy.riskLevel === agent.riskLevel),
  }));

  // Same four columns the approval centre showed; kept read-only (D9-1) — the dials
  // themselves live in scenario setup.
  const policyColumns: ColumnsType<AgentWithPolicy> = [
    {
      title: t('agent.name'),
      dataIndex: 'displayName',
      render: (name: string) => (
        <Typography.Text strong><RobotOutlined style={{ marginRight: 6, color: 'var(--ark-purple)' }} />{name}</Typography.Text>
      ),
    },
    {
      title: t('agent.riskDesc'),
      dataIndex: 'riskLevel',
      width: 120,
      render: (risk: string) => <StatusBadge value={risk as AgentConfig['riskLevel']} />,
    },
    {
      title: t('approval.rule'),
      width: 160,
      render: (_: unknown, record: AgentWithPolicy) =>
        record.policy ? <Tag color={actionTags[record.policy.action]}>{t(actionLabels[record.policy.action])}</Tag> : <Tag>-</Tag>,
    },
    {
      title: t('approval.explain'),
      render: (_: unknown, record: AgentWithPolicy) =>
        record.policy
          ? <Typography.Text type="secondary">{t(`approval.explain_${record.riskLevel}_${record.policy.action}`)}</Typography.Text>
          : null,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <DataTableCard<AgentWithPolicy>
        rowKey="agentType"
        columns={policyColumns}
        dataSource={agentPolicies}
        pagination={false}
        cardProps={{
          title: t('inbox.rulesPolicyTitle'),
          extra: <Link to="/setup"><Button size="small">{t('inbox.rulesPolicyLink')}</Button></Link>,
        }}
        description={t('inbox.rulesPolicyHint')}
      />

      <DataTableCard
        rowKey="id"
        columns={createAgentLogColumns(t)}
        dataSource={agentLogData}
        pagination={{ pageSize: 10, size: 'small' }}
        cardProps={{ title: t('inbox.rulesAgentLogTitle') }}
        description={t('inbox.rulesAgentLogHint')}
      />
    </Space>
  );
}
