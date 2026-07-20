import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Row, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { approvalsApi } from '../../api/approvals';
import { useI18n } from '../../app/i18n';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { DetailSection } from '../../components/detail/DetailSection';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { parseAllMallId } from '../../utils/id';

export function ApprovalDetailPage() {
  const { t } = useI18n();
  const { approvalId } = useParams();
  const parsedApprovalId = parseAllMallId(approvalId);
  const queryClient = useQueryClient();
  const { data: approval } = useQuery({
    queryKey: ['approval', parsedApprovalId],
    queryFn: () => approvalsApi.get(parsedApprovalId!),
    enabled: parsedApprovalId !== undefined
  });
  const decide = useMutation({
    mutationFn: (status: 'approved' | 'rejected') => approvalsApi.decide(parsedApprovalId!, status),
    onSuccess: () => {
      message.success(t('approvals.updated'));
      queryClient.invalidateQueries({ queryKey: ['approval', parsedApprovalId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    }
  });

  const comparisonData = useMemo(() => {
    if (!approval) return null;
    const titleLower = approval.title.toLowerCase();
    if (titleLower.includes('budget')) {
      return {
        beforeItems: [
          { label: '旧预算', value: '¥5,000.00' },
          { label: '日上限', value: '¥200/天' },
          { label: '月上限', value: '¥5,000/月' },
        ],
        afterItems: [
          { label: '新预算', value: '¥8,000.00' },
          { label: '日上限', value: '¥350/天' },
          { label: '月上限', value: '¥8,000/月' },
        ],
        changeAmount: '+¥3,000.00',
      };
    }
    if (titleLower.includes('price')) {
      return {
        beforeItems: [
          { label: '原价', value: '¥39.99' },
          { label: '成本', value: '¥18.50' },
          { label: '利润率', value: '53.7%' },
        ],
        afterItems: [
          { label: '新价', value: '¥45.99' },
          { label: '成本', value: '¥18.50' },
          { label: '利润率', value: '59.8%' },
        ],
        changeAmount: '+¥6.00',
      };
    }
    return {
      beforeItems: [
        { label: t('approvals.before'), value: approval.beforeValue || '-' },
      ],
      afterItems: [
        { label: t('approvals.after'), value: approval.afterValue || '-' },
      ],
      changeAmount: '-',
    };
  }, [approval, t]);

  if (!approval) return <EmptyState description={t('approval.notFound')} />;

  return (
    <div className="page-stack">
      <PageHeader
        title={approval.title}
        description={approval.reason}
        actions={
          approval.status === 'pending' ? (
            <Space>
              <Button icon={<CloseOutlined />} danger onClick={() => decide.mutate('rejected')}>
                {t('approvals.reject')}
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => decide.mutate('approved')}>
                {t('approvals.approve')}
              </Button>
            </Space>
          ) : null
        }
      />
      <DescriptionPanel
        column={2}
        size="default"
        items={[
          { label: t('approvals.agentHeader'), value: t(`agent.${approval.agentType}`) },
          { label: t('approvals.storeHeader'), value: approval.storeName },
          { label: t('approvals.item'), value: approval.title },
          { label: t('approvals.riskHeader'), value: <StatusBadge value={approval.riskLevel} /> },
          { label: t('approvals.statusHeader'), value: <StatusBadge value={approval.status} /> },
          { label: t('approvals.requested'), value: dayjs(approval.requestedAt).format('YYYY-MM-DD HH:mm') },
          { label: t('entity.task'), value: approval.taskId },
          {
            label: t('approvals.decided'),
            value: approval.decidedAt ? dayjs(approval.decidedAt).format('YYYY-MM-DD HH:mm') : t('approvals.waiting'),
          },
        ]}
      />
      <DetailSection title={t('approvals.detail')}>
        <Typography.Paragraph>{approval.proposedAction}</Typography.Paragraph>
      </DetailSection>
      {comparisonData && (
        <Card
          title={<Space><span>{t('approvals.proposedAction')}</span><Tag color="blue">{t('approvals.changeAmount')}: {comparisonData.changeAmount}</Tag></Space>}
          style={{ marginTop: 16 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card size="small" title={t('approvals.before')} style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                {comparisonData.beforeItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                    <Typography.Text>{item.value}</Typography.Text>
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title={t('approvals.after')} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                {comparisonData.afterItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                    <Typography.Text strong style={{ color: '#16a34a' }}>{item.value}</Typography.Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
