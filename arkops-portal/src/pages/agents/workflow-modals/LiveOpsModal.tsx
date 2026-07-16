import { CheckCircleOutlined, CloseCircleOutlined, CustomerServiceOutlined, EditOutlined, FundOutlined, PictureOutlined, PlayCircleOutlined, PushpinOutlined, ReloadOutlined, RobotOutlined, SafetyOutlined, SendOutlined, StarOutlined, TeamOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Input, Modal, Progress, Rate, Row, Space, Statistic, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { EmptyState } from '../../../components/EmptyState';
import {
  mockBreakerLogs,
  mockBudgetSuggestions,
  mockCampaigns,
  mockChats,
  mockChurnRisks,
  mockConversations,
  mockCoupons,
  mockCreatives,
  mockLiveComments,
  mockLiveMetrics,
  mockLiveProducts,
  mockReviews,
  mockRiskScans,
  mockSegments,
} from '../agentConfigMockData';

interface LiveOpsModalProps {
  liveOpen: boolean;
  onCloseLive: () => void;
}

export function LiveOpsModal(props: LiveOpsModalProps) {
  const { t } = useI18n();
  const { liveOpen, onCloseLive } = props;
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => mockLiveProducts.filter(p => p.pinned).map(p => p.id));

  return (
    <Modal
            title={<><PlayCircleOutlined style={{ color: '#ea580c', marginRight: 8 }} />{mockLiveMetrics.title}</>}
            open={liveOpen}
            onCancel={() => onCloseLive()}
            footer={null}
            width={860}
          >
            <Row gutter={[16, 16]}>
              {/* 核心指标 */}
              <Col span={24}>
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ background: '#fef2f2', textAlign: 'center' }}>
                      <Statistic title={t('live.currentViewers')} value={mockLiveMetrics.viewers} valueStyle={{ fontSize: 22, color: '#dc2626' }} />
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('live.peak')} {mockLiveMetrics.peakViewers}</Typography.Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic title={t('live.likes')} value={mockLiveMetrics.likes} valueStyle={{ fontSize: 20 }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic title={t('live.comments')} value={mockLiveMetrics.comments} valueStyle={{ fontSize: 20 }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic title={t('live.conversionRate')} value={mockLiveMetrics.conversionRate} suffix="%" valueStyle={{ fontSize: 20, color: '#16a34a' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ background: '#f0fdf4', textAlign: 'center' }}>
                      <Statistic title="GMV" value={mockLiveMetrics.gmv} prefix="$" valueStyle={{ fontSize: 20, color: '#16a34a' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic title={t('live.duration')} value={mockLiveMetrics.duration} valueStyle={{ fontSize: 16 }} />
                      <Tag color="green" style={{ fontSize: 9, marginTop: 2 }}>{t('live.liveNow')}</Tag>
                    </Card>
                  </Col>
                </Row>
              </Col>
    
              {/* 商品列表 */}
              <Col xs={24} md={14}>
                <Card size="small" title={<Typography.Text strong style={{ fontSize: 13 }}>{t('live.products', { count: mockLiveProducts.length })}</Typography.Text>}>
                  {mockLiveProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ark-border-soft)' }}>
                      <div>
                        <Typography.Text strong style={{ fontSize: 12 }}>
                          {pinnedIds.includes(p.id) && <PushpinOutlined style={{ color: '#ea580c', marginRight: 4, fontSize: 11 }} />}
                          {p.name}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>${p.price}</Typography.Text>
                      </div>
                      <Space size={8}>
                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('live.clicks')} {p.clicks} · {t('live.orders')} {p.orders}</Typography.Text>
                        {pinnedIds.includes(p.id) ? (
                          <Tag color="orange" style={{ fontSize: 9 }}>{t('live.pinned')}</Tag>
                        ) : (
                          <Button size="small" type="link" style={{ fontSize: 10, padding: 0 }} onClick={() => { setPinnedIds(prev => [...prev, p.id]); message.success(t('live.pinnedSuccess')); }}>{t('live.pin')}</Button>
                        )}
                      </Space>
                    </div>
                  ))}
                </Card>
              </Col>
    
              {/* 评论区 */}
              <Col xs={24} md={10}>
                <Card size="small" title={<Typography.Text strong style={{ fontSize: 13 }}>{t('live.commentsTitle', { count: mockLiveComments.length })}</Typography.Text>} style={{ height: '100%' }}>
                  {mockLiveComments.map(c => (
                    <div key={c.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Typography.Text strong style={{ fontSize: 11 }}>{c.user}</Typography.Text>
                        {c.replied ? (
                          <Tag color="green" style={{ fontSize: 9, padding: '0 3px' }}>
                            <RobotOutlined /> {t('live.aiReplied')}
                          </Tag>
                        ) : (
                          <Tag color="orange" style={{ fontSize: 9, padding: '0 3px' }}>{t('live.pendingReply')}</Tag>
                        )}
                      </div>
                      <Typography.Text style={{ fontSize: 11, display: 'block', padding: '4px 8px', background: '#eff6ff', borderRadius: 6 }}>
                        {c.text}
                      </Typography.Text>
                      {c.replied && c.aiReply && (
                        <Typography.Text style={{ fontSize: 10, color: '#16a34a', display: 'block', padding: '2px 8px', marginTop: 2 }}>
                          ↳ {c.aiReply}
                        </Typography.Text>
                      )}
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </Modal>
  );
}
