import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Card, Empty, message, Space, Table, Tooltip, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { approvalsApi } from '../api/approvals';
import { useI18n } from '../app/i18n';
import type { Approval } from '../types/domain';

export function ApprovalQueue() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const riskConfig: Record<string, { tag: string; dot: string }> = {
    low: { tag: t('approval.low'), dot: '#16a34a' },
    medium: { tag: t('approval.medium'), dot: '#f59e0b' },
    high: { tag: t('approval.high'), dot: '#ea580c' },
  };

  const decideMutation = useMutation({
    mutationFn: (params: { id: number; status: 'approved' | 'rejected' }) =>
      approvalsApi.decide(params.id, params.status),
    onSuccess: (_data, variables) => {
      message.success(variables.status === 'approved' ? t('approval.approved') : t('approval.rejected'));
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    }
  });

  const handleApprove = (id: number) => decideMutation.mutate({ id, status: 'approved' });
  const handleReject = (id: number) => decideMutation.mutate({ id, status: 'rejected' });

  const columns = [
    {
      title: t('approval.agent'),
      dataIndex: 'agentType',
      width: 90,
      render: (_: string, r: Approval) => (
        <Link to={`/approvals/${r.id}`}>
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
      width: 60,
      render: (v: string) => {
        const c = riskConfig[v];
        return <Tooltip title={c.tag}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.dot, cursor: 'pointer' }} /></Tooltip>;
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
      width: 100,
      render: (_: unknown, r: Approval) => (
        <Space size={0}>
          <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)} style={{ padding: '0 4px', color: '#16a34a' }}>
            {t('approval.approve')}
          </Button>
          <Button size="small" type="link" icon={<CloseOutlined />} onClick={() => handleReject(r.id)} style={{ padding: '0 4px', color: '#dc2626' }}>
            {t('approval.reject')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderTop: '3px solid #ea580c' }}
      bodyStyle={{ padding: 0 }}
      title={
        <Typography.Text strong style={{ fontSize: 13 }}>
          {t('approval.title')} ({pendingApprovals.length})
        </Typography.Text>
      }
    >
      {pendingApprovals.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('approval.noPending')} style={{ padding: '12px 0' }} />
      ) : (
        <Table dataSource={pendingApprovals} columns={columns} rowKey="id" pagination={false} size="small" />
      )}
    </Card>
  );
}
