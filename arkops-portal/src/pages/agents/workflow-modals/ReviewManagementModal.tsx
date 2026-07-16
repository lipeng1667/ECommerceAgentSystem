import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, RobotOutlined, StarOutlined } from '@ant-design/icons';
import { Button, Card, Input, Rate, Space, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { EmptyState } from '../../../components/EmptyState';
import { BaseWorkflowModal } from './BaseWorkflowModal';
import { mockReviews } from '../agentConfigMockData';

type ReviewStatus = 'pending' | 'replied' | 'dismissed';

interface ReviewManagementModalProps {
  reviewOpen: boolean;
  onCloseReview: () => void;
}

export function ReviewManagementModal(props: ReviewManagementModalProps) {
  const { t } = useI18n();
  const { reviewOpen, onCloseReview } = props;
  const [reviewState, setReviewState] = useState<Record<number, ReviewStatus>>({
    1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending',
  });
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewEdits, setReviewEdits] = useState<Record<number, string>>({});

  return (
    <BaseWorkflowModal
      open={reviewOpen}
      onClose={() => { onCloseReview(); setEditingReviewId(null); }}
      title={t('agent.reviewCard')}
      icon={<StarOutlined />}
      iconColor="#ea580c"
      width={780}
      defaultActiveKey="pending"
      tabs={[
        {
          key: 'pending',
          label: t('review.pendingTab', { count: mockReviews.filter(r => reviewState[r.id] === 'pending').length }),
          children: (
            <div style={{ maxHeight: 460, overflow: 'auto' }}>
              {mockReviews.filter(r => reviewState[r.id] === 'pending').length === 0 ? (
                <EmptyState description={t('review.allProcessed')} />
              ) : (
                mockReviews.filter(r => reviewState[r.id] === 'pending').map(review => (
                  <Card
                    key={review.id}
                    size="small"
                    style={{
                      marginBottom: 12,
                      borderLeft: `4px solid ${review.severity === 'high' ? '#dc2626' : review.severity === 'medium' ? '#ea580c' : '#f59e0b'}`
                    }}
                  >
                    {/* 评分 & 买家信息 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <Rate disabled defaultValue={review.rating} style={{ fontSize: 14 }} />
                        <Typography.Text strong style={{ marginLeft: 8 }}>{review.buyer}</Typography.Text>
                        <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                          {review.product}
                        </Typography.Text>
                      </div>
                      <Space size={4}>
                        <Tag color={review.severity === 'high' ? 'red' : review.severity === 'medium' ? 'orange' : 'gold'} style={{ fontSize: 10 }}>
                          {review.severity === 'high' ? t('review.severityHigh') : review.severity === 'medium' ? t('review.severityMedium') : t('review.severityLow')}
                        </Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                          {review.platform} · {review.orderId}
                        </Typography.Text>
                      </Space>
                    </div>
    
                    {/* 差评原文 */}
                    <Typography.Paragraph style={{ fontSize: 12, marginBottom: 10, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontStyle: 'italic' }}>
                      "{review.content}"
                    </Typography.Paragraph>
    
                    {/* AI 建议回复 */}
                    <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 10, border: '1px solid #bbf7d0' }}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
                        <RobotOutlined style={{ marginRight: 4 }} />{t('agent.reviewReply')} · {review.date}
                      </Typography.Text>
                      {editingReviewId === review.id ? (
                        <Input.TextArea
                          autoSize={{ minRows: 3, maxRows: 6 }}
                          value={reviewEdits[review.id] ?? review.aiReply}
                          onChange={(e) => setReviewEdits(prev => ({ ...prev, [review.id]: e.target.value }))}
                          style={{ fontSize: 12 }}
                        />
                      ) : (
                        <Typography.Paragraph style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line' }}>
                          {reviewEdits[review.id] || review.aiReply}
                        </Typography.Paragraph>
                      )}
                    </div>
    
                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {editingReviewId === review.id ? (
                        <>
                          <Button size="small" onClick={() => { setEditingReviewId(null); setReviewEdits(prev => { const next = { ...prev }; delete next[review.id]; return next; }); }}>
                            {t('review.cancelEdit')}
                          </Button>
                          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => {
                            setEditingReviewId(null);
                            setReviewState(prev => ({ ...prev, [review.id]: 'replied' }));
                            message.success(t('agent.reviewSent'));
                          }}>
                            {t('review.confirmSend')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" icon={<CloseCircleOutlined />} onClick={() => setReviewState(prev => ({ ...prev, [review.id]: 'dismissed' }))}>
                            {t('agent.reviewDismiss')}
                          </Button>
                          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingReviewId(review.id); if (!reviewEdits[review.id]) setReviewEdits(prev => ({ ...prev, [review.id]: review.aiReply })); }}>
                            {t('agent.reviewEdit')}
                          </Button>
                          <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => {
                            setReviewState(prev => ({ ...prev, [review.id]: 'replied' }));
                            message.success(t('agent.reviewSent'));
                          }}>
                            {t('agent.reviewSend')}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )
        },
        {
          key: 'replied',
          label: t('review.repliedTab', { count: mockReviews.filter(r => reviewState[r.id] === 'replied').length }),
          children: (
            <div style={{ maxHeight: 460, overflow: 'auto' }}>
              {mockReviews.filter(r => reviewState[r.id] === 'replied').length === 0 ? (
                <EmptyState description={t('review.noReplied')} />
              ) : (
                mockReviews.filter(r => reviewState[r.id] === 'replied').map(review => (
                  <Card key={review.id} size="small" style={{ marginBottom: 12, borderLeft: '4px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Space size={4}>
                        <Rate disabled defaultValue={review.rating} style={{ fontSize: 12 }} />
                        <Typography.Text strong style={{ fontSize: 12 }}>{review.buyer}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{review.product}</Typography.Text>
                      </Space>
                      <Tag color="green" style={{ fontSize: 10 }}>
                        <CheckCircleOutlined /> {t('review.repliedTag')} · {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </Tag>
                    </div>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: '0 0 6px', padding: '6px 10px', background: '#fef2f2', borderRadius: 6 }}>
                      "{review.content.slice(0, 80)}..."
                    </Typography.Paragraph>
                    <Typography.Paragraph style={{ fontSize: 11, margin: 0, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6 }}>
                      {reviewEdits[review.id] || review.aiReply}
                    </Typography.Paragraph>
                  </Card>
                ))
              )}
            </div>
          )
        },
        {
          key: 'dismissed',
          label: t('review.dismissedTab', { count: mockReviews.filter(r => reviewState[r.id] === 'dismissed').length }),
          children: (
            <div style={{ maxHeight: 460, overflow: 'auto' }}>
              {mockReviews.filter(r => reviewState[r.id] === 'dismissed').length === 0 ? (
                <EmptyState description={t('review.noDismissed')} />
              ) : (
                mockReviews.filter(r => reviewState[r.id] === 'dismissed').map(review => (
                  <Card key={review.id} size="small" style={{ marginBottom: 12, borderLeft: '4px solid #94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space size={4}>
                        <Rate disabled defaultValue={review.rating} style={{ fontSize: 12 }} />
                        <Typography.Text strong style={{ fontSize: 12 }}>{review.buyer}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{review.product}</Typography.Text>
                      </Space>
                      <Tag style={{ fontSize: 10 }}>{t('review.dismissedTag')}</Tag>
                    </div>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: '6px 0 0', padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>
                      "{review.content.slice(0, 80)}..."
                    </Typography.Paragraph>
                  </Card>
                ))
              )}
            </div>
          )
        }
      ]}
    />
  );
}
