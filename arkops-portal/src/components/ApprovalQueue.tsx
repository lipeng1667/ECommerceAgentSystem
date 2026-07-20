import { RightOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Table, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { approvalsApi } from '../api/approvals';
import { useI18n } from '../app/i18n';
import type { Approval } from '../types/domain';

export function ApprovalQueue() {
  const { t } = useI18n();
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const riskConfig: Record<string, { tag: string; color: string }> = {
    low: { tag: t('approval.low'), color: 'green' },
    medium: { tag: t('approval.medium'), color: 'gold' },
    high: { tag: t('approval.high'), color: 'red' },
  };

  const columns = [
    {
      title: t('approval.agent'),
      dataIndex: 'agentType',
      width: 90,
      render: (_: string, r: Approval) => (
        <Link to={`/agents/approvals/${r.id}`}>
          <Typography.Text strong style={{ fontSize: 12, color: '#2563eb' }}>{t(`agent.${r.agentType}`)}</Typography.Text>
        </Link>
      ),
    },
    {
      title: t('approval.request'),
      dataIndex: 'proposedAction',
      width: 300,
      ellipsis: true,
      render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('approval.risk'),
      dataIndex: 'riskLevel',
      width: 88,
      render: (v: string) => {
        const c = riskConfig[v];
        return <Tag color={c.color}>{c.tag}</Tag>;
      },
    },
    {
      title: t('approval.time'),
      dataIndex: 'requestedAt',
      width: 70,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{dayjs(v).format('HH:mm')}</Typography.Text>,
    },
    {
      title: t('common.actions'),
      width: 110,
      render: (_: unknown, r: Approval) => (
        <Link to={`/agents/approvals/${r.id}`}>
          <Button size="small" type="link" style={{ padding: 0 }}>查看并处理 <RightOutlined /></Button>
        </Link>
      ),
    },
  ];

  return (
    <Card
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0 }}
      title={
        <Typography.Text strong style={{ fontSize: 13 }}>
          {t('approval.title')} ({pendingApprovals.length})
        </Typography.Text>
      }
      extra={<Link to="/agents/approvals" style={{ fontSize: 12 }}>查看全部</Link>}
    >
      {pendingApprovals.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('approval.noPending')} style={{ padding: '12px 0' }} />
      ) : (
        <Table dataSource={pendingApprovals.slice(0, 3)} columns={columns} rowKey="id" pagination={false} size="small" />
      )}
    </Card>
  );
}
