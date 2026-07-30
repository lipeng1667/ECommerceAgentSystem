/**
 * File: InboxAutoHandledTab.tsx
 * Purpose: "自动处理" tab of the 待办中心 (D9). Completes the division of labour the three
 * tabs describe — what needs me, what the system already did for me, what I decided.
 * This one answers "what did automation handle without asking?", the transparency side of
 * a Human-in-the-Loop product, and links the escalated share back to the pending queue.
 *
 * Author: TBD
 * Created: 2026-07-29
 *
 * Main exports:
 * - InboxAutoHandledTab: rendered inside InboxPage's tab layout.
 */
import { CheckCircleOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { useI18n } from '../../app/i18n';
import { DataTableCard } from '../../components/table/DataTableCard';
import { createAgentLogColumns } from '../operations/exceptionCenterColumns';
import { agentLogData } from '../operations/exceptionCenterMockData';

export function InboxAutoHandledTab({ onShowPending }: { onShowPending: () => void }) {
  const { t } = useI18n();

  const summary = useMemo(() => {
    const handled = agentLogData.filter((entry) => entry.result === 'success' || entry.result === 'auto_resolved').length;
    const escalated = agentLogData.filter((entry) => entry.result === 'escalated' || entry.result === 'blocked').length;
    return { handled, escalated, total: agentLogData.length };
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Same "results first" summary the products and orders digests use, at account
          scope: the value story is the point of this tab. */}
      <Card size="small">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space size={8} wrap>
            <ThunderboltOutlined style={{ color: 'var(--ark-purple)' }} />
            <Typography.Text strong>{t('inbox.autoSummaryTitle')}</Typography.Text>
            <Typography.Text style={{ fontSize: 13 }}>
              <CheckCircleOutlined style={{ color: 'var(--ark-green)', marginRight: 4 }} />
              {t('inbox.autoSummaryHandled', { count: summary.handled })}
            </Typography.Text>
            {summary.escalated > 0 && (
              <Typography.Text style={{ fontSize: 13 }}>
                <WarningOutlined style={{ color: 'var(--ark-orange)', marginRight: 4 }} />
                {t('inbox.autoSummaryEscalated', { count: summary.escalated })}
              </Typography.Text>
            )}
          </Space>
          {summary.escalated > 0 && (
            <Button size="small" type="link" style={{ padding: 0 }} onClick={onShowPending}>
              {t('inbox.autoSummaryGoPending')}
            </Button>
          )}
        </div>
      </Card>

      <DataTableCard
        rowKey="id"
        columns={createAgentLogColumns(t)}
        dataSource={agentLogData}
        pagination={{ pageSize: 10, size: 'small' }}
        cardProps={{ title: t('inbox.autoLogTitle') }}
        description={t('inbox.autoLogHint')}
      />
    </Space>
  );
}
