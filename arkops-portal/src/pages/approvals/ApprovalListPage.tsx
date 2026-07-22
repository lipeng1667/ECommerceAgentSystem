import { EyeOutlined, InboxOutlined, RobotOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Segmented, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { approvalsApi } from '../../api/approvals';
import { approvalPolicyApi } from '../../api/approvalPolicies';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { URGENCY_COLORS, formatAge, formatRemaining, getApprovalUrgency } from '../inbox/urgency';
import type { AgentConfig, AgentType, Approval, ApprovalPolicy, ApprovalStatus } from '../../types/domain';

const actionLabels: Record<ApprovalPolicy['action'], string> = {
  auto_execute: 'agent.autoExecute',
  single_approval: 'agent.singleApproval',
  dual_approval: 'agent.dualApproval'
};

const actionTags: Record<ApprovalPolicy['action'], string> = {
  auto_execute: 'green',
  single_approval: 'blue',
  dual_approval: 'red'
};

export function ApprovalListPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });
  const { data: policies = [] } = useQuery({ queryKey: ['approval-policies'], queryFn: approvalPolicyApi.list });
  const [policyOpen, setPolicyOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState<AgentType | 'all'>('all');
  // WS-B (B5): default to pending so the list answers "what needs me right now"
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: approvals.length };
    for (const approval of approvals) {
      counts[approval.status] = (counts[approval.status] ?? 0) + 1;
    }
    return counts;
  }, [approvals]);

  const filteredApprovals = useMemo(() => {
    const matches = approvals.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (agentFilter !== 'all' && a.agentType !== agentFilter) return false;
      return true;
    });
    // Pending first, then soonest expiry; decided items newest first.
    return matches.sort((a, b) => {
      if ((a.status === 'pending') !== (b.status === 'pending')) {
        return a.status === 'pending' ? -1 : 1;
      }
      if (a.status === 'pending' && b.status === 'pending') {
        const ua = getApprovalUrgency(a);
        const ub = getApprovalUrgency(b);
        return (ua?.remainingMs ?? Infinity) - (ub?.remainingMs ?? Infinity);
      }
      return dayjs(b.requestedAt).valueOf() - dayjs(a.requestedAt).valueOf();
    });
  }, [approvals, agentFilter, statusFilter]);

  const agentPolicies = agents.map((agent) => {
    const policy = policies.find((p) => p.riskLevel === agent.riskLevel);
    return { ...agent, policy };
  });

  const approvalColumns: ColumnsType<Approval> = [
    {
      title: t('approvals.agentHeader'),
      dataIndex: 'agentType',
      render: (agentType: string) => t(`agent.${agentType}`)
    },
    { title: t('approvals.storeHeader'), dataIndex: 'storeName' },
    { title: t('approvals.item'), dataIndex: 'title', render: (title, record) => <Link to={`/approvals/${record.id}`}>{title}</Link> },
    { title: t('approvals.riskHeader'), dataIndex: 'riskLevel', render: (risk) => <StatusBadge value={risk} />, width: 100 },
    { title: t('approvals.statusHeader'), dataIndex: 'status', render: (status) => <StatusBadge value={status} />, width: 100 },
    {
      // WS-B (B5): "requested X ago / expires in Y" with color escalation
      title: t('inbox.ageColumn'),
      dataIndex: 'requestedAt',
      width: 190,
      render: (value: string, record) => {
        const urgency = record.status === 'pending' ? getApprovalUrgency(record) : undefined;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }} title={dayjs(value).format('YYYY-MM-DD HH:mm')}>
              {formatAge(t, value)}
            </Typography.Text>
            {urgency && (
              <Typography.Text strong style={{ fontSize: 12, color: URGENCY_COLORS[urgency.tone] }}>
                {formatRemaining(t, urgency.remainingMs)}
              </Typography.Text>
            )}
          </Space>
        );
      }
    }
  ];

  const policyColumns: ColumnsType<AgentConfig & { policy?: ApprovalPolicy }> = [
    {
      title: t('agent.name'),
      dataIndex: 'displayName',
      render: (name: string) => (
        <Typography.Text strong><RobotOutlined style={{ marginRight: 6, color: 'var(--ark-purple)' }} />{name}</Typography.Text>
      )
    },
    {
      title: t('agent.riskDesc'),
      dataIndex: 'riskLevel',
      width: 120,
      render: (risk: string) => <StatusBadge value={risk as AgentConfig['riskLevel']} />
    },
    {
      title: t('approval.rule'),
      width: 160,
      render: (_: unknown, record: AgentConfig & { policy?: ApprovalPolicy }) => {
        if (!record.policy) return <Tag>-</Tag>;
        return <Tag color={actionTags[record.policy.action]}>{t(actionLabels[record.policy.action])}</Tag>;
      }
    },
    {
      title: t('approval.explain'),
      render: (_: unknown, record: AgentConfig & { policy?: ApprovalPolicy }) => {
        if (!record.policy) return null;
        const key = `approval.explain_${record.riskLevel}_${record.policy.action}`;
        return <Typography.Text type="secondary">{t(key)}</Typography.Text>;
      }
    }
  ];

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('approvals.title')} description={t('approvals.description')} />
        <StoreConnectionEmptyState description="当前没有待审批事项。连接店铺并启用 Agent 后，需要人工确认的操作会出现在这里。" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* WS-B (B2): this page is a filtered view of the Action Inbox */}
      <PageHeader
        title={t('approvals.title')}
        description={t('approvals.description')}
        actions={
          <Link to="/inbox?type=approval">
            <Button icon={<InboxOutlined />}>{t('inbox.viewInInbox')}</Button>
          </Link>
        }
      />

      {/* 审批策略参考（可折叠） */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: 'var(--ark-panel-soft)' }}
      >
        <div
          onClick={() => setPolicyOpen(!policyOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Space>
            <EyeOutlined />
            <Typography.Text strong>{t('approval.policyTitle')}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('approval.policyDescription')}
            </Typography.Text>
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {policyOpen ? t('common.collapse') : t('common.expand')}
          </Typography.Text>
        </div>
        {policyOpen && (
          <Table
            rowKey="agentType"
            columns={policyColumns}
            dataSource={agentPolicies}
            pagination={false}
            size="small"
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* 审批列表 */}
      <DataTableCard<Approval>
        rowKey="id"
        columns={approvalColumns}
        dataSource={filteredApprovals}
        pagination={{ pageSize: 10, size: 'small' }}
        scroll={{ x: 900 }}
        toolbar={
          <PageFilterBar>
          {/* WS-B (B5): status segmented control, pending by default */}
          <Segmented
            size="small"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ApprovalStatus | 'all')}
            options={(['pending', 'approved', 'rejected', 'expired', 'all'] as const).map((status) => ({
              value: status,
              label:
                status === 'all'
                  ? `${t('inbox.filterAll')} (${statusCounts.all ?? 0})`
                  : `${t(`status.${status}`)} (${statusCounts[status] ?? 0})`
            }))}
          />
          <Select
            value={agentFilter}
            onChange={(v) => setAgentFilter(v)}
            options={[
              { value: 'all', label: t('exc.allAgents') },
              ...agents.map((a) => ({ value: a.agentType as AgentType, label: t(`agent.${a.agentType}`) }))
            ]}
          />
          </PageFilterBar>
        }
      />
    </div>
  );
}
