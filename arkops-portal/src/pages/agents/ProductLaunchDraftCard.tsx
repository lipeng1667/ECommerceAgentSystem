/**
 * ProductLaunchDraftCard — product_launch Agent 专属商品草稿状态卡片。
 *
 * 从 AgentConfigPage 拆分而来，展示商品草稿列表、合规状态、审批/重新生成/取消操作。
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import { CameraOutlined, CheckCircleOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useI18n } from '../../app/i18n';
import { StatusBadge } from '../../components/StatusBadge';
import { ProductDraftPreview } from './ProductDraftPreview';
import { TaskTimelinePreview } from './TaskTimelinePreview';
import { productDrafts } from './agentConfigMockData';
import type { AllMallId, Task, TaskStatus } from '../../types/domain';

export interface ProductLaunchDraftCardProps {
  activeTasks: Task[];
  onUploadClick: () => void;
  onRegenerate: (taskId: AllMallId) => void;
  onCancel: (taskId: AllMallId) => void;
  onApprove: (taskId: AllMallId) => void;
}

export function ProductLaunchDraftCard({
  activeTasks,
  onUploadClick,
  onRegenerate,
  onCancel,
  onApprove,
}: ProductLaunchDraftCardProps) {
  const { t } = useI18n();

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #16a34a' }}
      title={
        <Space>
          <CameraOutlined style={{ color: '#16a34a' }} />
          {t('agent.productDraftStatus')}
          {activeTasks.length > 0 && (
            <Tag
              color={activeTasks.some((t) => t.status === 'waiting_approval') ? 'orange' : 'blue'}
              style={{ fontSize: 11 }}
            >
              {activeTasks.filter((t) => t.status === 'draft').length} {t('agent.draftPending')} ·{' '}
              {activeTasks.filter((t) => t.status === 'waiting_approval').length} {t('agent.draftReviewing')}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onUploadClick}>
          {t('agent.uploadProduct')}
        </Button>
      }
    >
      {activeTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            {t('agent.noDraftHint')}
          </Typography.Paragraph>
          <Button type="primary" icon={<PlusOutlined />} onClick={onUploadClick}>
            {t('agent.uploadProduct')}
          </Button>
        </div>
      ) : (
        <Table
          rowKey="id"
          dataSource={activeTasks}
          pagination={false}
          size="small"
          expandable={{
            expandedRowRender: (record: Task) => {
              const draft = productDrafts[record.id];
              if (!draft) {
                return <TaskTimelinePreview task={record} emptyText={t('common.empty')} />;
              }
              return (
                <ProductDraftPreview
                  draft={draft}
                  task={record}
                  onRegenerate={onRegenerate}
                  onCancel={onCancel}
                />
              );
            },
            rowExpandable: () => true,
          }}
          columns={[
            {
              title: t('agent.productName'),
              dataIndex: 'title',
              render: (title: string, record: Task) => {
                const draft = productDrafts[record.id];
                return (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong style={{ fontSize: 13 }}>{title}</Typography.Text>
                    {draft && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{draft.category}</Typography.Text>
                    )}
                  </Space>
                );
              },
            },
            {
              title: t('agent.draftPrice'), width: 100,
              render: (_: unknown, record: Task) => {
                const draft = productDrafts[record.id];
                return draft ? <Typography.Text style={{ fontSize: 13 }}>${draft.sellingPrice}</Typography.Text> : '-';
              },
            },
            {
              title: t('stores.status'), dataIndex: 'status', width: 100,
              render: (status: TaskStatus) => <StatusBadge value={status} />,
            },
            {
              title: t('agent.complianceStatus'), width: 100,
              render: (_: unknown, record: Task) => {
                const draft = productDrafts[record.id];
                if (!draft) return <Typography.Text type="secondary" style={{ fontSize: 11 }}>-</Typography.Text>;
                const hasIssue = record.timeline.some((e) => e.type === 'approval_required');
                return hasIssue ? (
                  <Tag color="orange" style={{ fontSize: 11 }}>{t('agent.complianceWarning')}</Tag>
                ) : (
                  <Tag color="green" style={{ fontSize: 11 }}>{t('agent.compliancePassed')}</Tag>
                );
              },
            },
            {
              title: t('common.actions'), width: 180,
              render: (_: unknown, record: Task) => (
                <Space size="small">
                  {(record.status === 'draft' || record.status === 'queued') && (
                    <>
                      <Button
                        size="small" type="primary" icon={<CheckCircleOutlined />}
                        onClick={() => {
                          message.success(t('agent.draftApproved'));
                          onApprove(record.id);
                        }}
                      >
                        {t('agent.approvePublish')}
                      </Button>
                      <Button
                        size="small" icon={<ReloadOutlined />}
                        onClick={() => onRegenerate(record.id)}
                      >
                        {t('agent.regenerate')}
                      </Button>
                    </>
                  )}
                  <Button size="small" danger icon={<StopOutlined />} onClick={() => onCancel(record.id)}>
                    {t('common.cancel')}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
