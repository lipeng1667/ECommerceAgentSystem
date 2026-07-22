/**
 * File: AgentOutcomesSection.tsx
 * Purpose: WS-D (D9/S4) mock "decisions & outcomes" section on the agent detail page.
 * Shows each significant action → metric before → after 3/7 days → assessment, defining
 * the data contract a future backend must fill.
 *
 * Author: Michael Lee (WS-D)
 * Created: 2026-07-22
 */
import { LineChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag, Typography } from 'antd';
import { agentsApi } from '../../api/agents';
import { useI18n } from '../../app/i18n';
import type { AgentOutcomeRecord, AgentType } from '../../types/domain';

interface AgentOutcomesSectionProps {
  agentType: AgentType;
}

const ASSESSMENT_META: Record<AgentOutcomeRecord['assessment'], { color: string; labelKey: string }> = {
  positive: { color: 'green', labelKey: 'agenttrust.outcomePositive' },
  neutral: { color: 'default', labelKey: 'agenttrust.outcomeNeutral' },
  negative: { color: 'red', labelKey: 'agenttrust.outcomeNegative' },
  pending: { color: 'blue', labelKey: 'agenttrust.outcomePending' },
};

const DECISION_META: Record<AgentOutcomeRecord['decision'], { color: string; labelKey: string }> = {
  auto: { color: 'green', labelKey: 'agenttrust.outcomeDecisionAuto' },
  approved: { color: 'blue', labelKey: 'agenttrust.outcomeDecisionApproved' },
  rejected: { color: 'red', labelKey: 'agenttrust.outcomeDecisionRejected' },
};

export function AgentOutcomesSection({ agentType }: AgentOutcomesSectionProps) {
  const { t } = useI18n();
  const { data: outcomes = [] } = useQuery({
    queryKey: ['agent-outcomes', agentType],
    queryFn: () => agentsApi.getOutcomes(agentType),
  });

  if (outcomes.length === 0) return null;

  return (
    <Card
      title={<><LineChartOutlined /> {t('agenttrust.outcomesTitle')}</>}
      style={{ marginBottom: 16 }}
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
        {t('agenttrust.outcomesDesc')}
      </Typography.Paragraph>
      <div style={{ overflowX: 'auto' }}>
        <Table
          rowKey="id"
          dataSource={outcomes}
          pagination={false}
          size="small"
          columns={[
            {
              title: t('agenttrust.outcomeAction'),
              dataIndex: 'action',
              render: (action: string, record: AgentOutcomeRecord) => (
                <div>
                  <Typography.Text style={{ fontSize: 12 }}>{action}</Typography.Text>
                  <div style={{ marginTop: 2 }}>
                    <Tag color={DECISION_META[record.decision].color} style={{ fontSize: 10 }}>
                      {t(DECISION_META[record.decision].labelKey)}
                    </Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                      {new Date(record.decidedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            { title: t('agenttrust.outcomeMetric'), dataIndex: 'metric', width: 110, render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
            { title: t('agenttrust.outcomeBefore'), dataIndex: 'before', width: 90, render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
            { title: t('agenttrust.outcomeAfter3d'), dataIndex: 'after3d', width: 90, render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text> },
            {
              title: t('agenttrust.outcomeAfter7d'), dataIndex: 'after7d', width: 90,
              render: (v?: string) =>
                v ? (
                  <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>
                ) : (
                  <Tag color="blue" style={{ fontSize: 10 }}>{t('agenttrust.outcomePending')}</Tag>
                ),
            },
            {
              title: t('agenttrust.outcomeAssessment'),
              width: 200,
              render: (_: unknown, record: AgentOutcomeRecord) => (
                <div>
                  <Tag color={ASSESSMENT_META[record.assessment].color} style={{ fontSize: 10 }}>
                    {t(ASSESSMENT_META[record.assessment].labelKey)}
                  </Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    {record.assessmentNote}
                  </Typography.Text>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Card>
  );
}
