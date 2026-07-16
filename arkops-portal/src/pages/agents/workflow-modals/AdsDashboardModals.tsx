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

interface AdsDashboardModalsProps {
  adsDashboardOpen: boolean;
  onCloseAdsDashboard: () => void;
}

export function AdsDashboardModals(props: AdsDashboardModalsProps) {
  const { t } = useI18n();
  const { adsDashboardOpen, onCloseAdsDashboard } = props;
  const [adOptimizeOpen, setAdOptimizeOpen] = useState(false);

  return (
    <>
      {/* 广告投放：投放仪表盘弹窗 */}
            <Modal
              title={<><FundOutlined style={{ color: '#2563eb' }} /> {t('agent.adDashboard')}</>}
              open={adsDashboardOpen}
              onCancel={() => onCloseAdsDashboard()}
              footer={null}
              width={800}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                {`${t('ads.last7DaysOverview')} · ${t('ads.targetROI')}: 1.5× · ${t('ads.totalSpend')}: $${mockCampaigns.reduce((s, c) => s + c.spend, 0)}`}
              </Typography.Text>
              {mockCampaigns.map(c => (
                <Card
                  key={c.id}
                  size="small"
                  hoverable
                  style={{ marginBottom: 12, borderLeft: `4px solid ${c.roi >= 1.5 ? '#16a34a' : c.roi >= 1.0 ? '#ea580c' : '#dc2626'}` }}
                  onClick={() => { onCloseAdsDashboard(); setAdOptimizeOpen(true); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 14 }}>{c.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>{c.id} · {c.status === 'active' ? t('ads.active') : t('ads.paused')}</Typography.Text>
                    </div>
                    <Space size={8}>
                      <Tag color={c.roi >= 1.5 ? 'green' : c.roi >= 1.0 ? 'orange' : 'red'} style={{ fontSize: 11 }}>
                        ROI {c.roi}× {c.roi >= 1.5 ? t('ads.meetStandard') : c.roi >= 1.0 ? t('ads.lowROI') : t('ads.notMeetStandard')}
                      </Tag>
                    </Space>
                  </div>
                  <Row gutter={[16, 8]}>
                    <Col span={6}>
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('ads.budgetUsed')}</Typography.Text>
                        <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>${c.budget}</Typography.Text>
                      </div>
                      <Progress
                        percent={Math.round(c.spend / c.budget * 100)}
                        size="small"
                        status={c.roi < 1.0 ? 'exception' : c.roi >= 1.5 ? 'success' : 'active'}
                        format={() => `$${c.spend}`}
                      />
                    </Col>
                    <Col span={4}>
                      <Statistic title="ROI" value={c.roi} suffix="×" valueStyle={{ fontSize: 20, color: c.roi >= 1.5 ? '#16a34a' : c.roi >= 1.0 ? '#ea580c' : '#dc2626' }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title={t('ads.impressions')} value={(c.impressions / 1000).toFixed(1)} suffix="k" valueStyle={{ fontSize: 14 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title={t('ads.clicks')} value={c.clicks} valueStyle={{ fontSize: 14 }} />
                    </Col>
                    <Col span={4}>
                      <Statistic title="CTR" value={(c.clicks / c.impressions * 100).toFixed(1)} suffix="%" valueStyle={{ fontSize: 14 }} />
                    </Col>
                    <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Button size="small" type="link" icon={<ToolOutlined />} style={{ fontSize: 11, padding: 0 }} onClick={() => { onCloseAdsDashboard(); setAdOptimizeOpen(true); }}>
                        {t('ads.adjust')}
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button type="primary" icon={<ToolOutlined />} onClick={() => { onCloseAdsDashboard(); setAdOptimizeOpen(true); }}>
                  {t('agent.adOptimize')}
                </Button>
              </div>
            </Modal>
      
            {/* 广告投放：预算优化弹窗 */}
            <Modal
              title={<><ToolOutlined /> {t('agent.adOptimize')}</>}
              open={adOptimizeOpen}
              onCancel={() => setAdOptimizeOpen(false)}
              onOk={() => { setAdOptimizeOpen(false); message.success(t('ads.budgetReallocated')); }}
              okText={t('agent.adApply')}
              width={680}
            >
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                {t('ads.aiAnalysisDesc')}
              </Typography.Paragraph>
              {mockBudgetSuggestions.map(s => (
                <Card key={s.campaignId} size="small" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Typography.Text strong style={{ fontSize: 13 }}>{s.campaignId}</Typography.Text>
                    <Tag color={s.suggested > s.current ? 'green' : s.suggested < s.current ? 'red' : 'default'} style={{ fontSize: 10 }}>
                      {s.suggested > s.current ? t('ads.increase') : s.suggested < s.current ? t('ads.decrease') : t('ads.noChange')}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('ads.current')}</Typography.Text>
                          <Typography.Text strong style={{ display: 'block', fontSize: 16, color: '#64748b' }}>${s.current}</Typography.Text>
                        </Col>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('ads.suggested')}</Typography.Text>
                          <Typography.Text strong style={{ display: 'block', fontSize: 16, color: s.suggested > s.current ? '#16a34a' : s.suggested < s.current ? '#dc2626' : '#64748b' }}>
                            ${s.suggested}
                          </Typography.Text>
                        </Col>
                      </Row>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 11, flex: 1, textAlign: 'right' }}>{s.reason}</Typography.Text>
                  </div>
                </Card>
              ))}
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <Typography.Text style={{ fontSize: 12 }}>
                  <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 4 }} />
                  {t('ads.expectedROI')}
                </Typography.Text>
              </div>
            </Modal>
    </>
  );
}
