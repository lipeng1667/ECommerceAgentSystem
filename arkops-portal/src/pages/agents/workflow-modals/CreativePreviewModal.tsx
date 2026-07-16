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

interface CreativePreviewModalProps {
  creativeOpen: boolean;
  onCloseCreative: () => void;
}

export function CreativePreviewModal(props: CreativePreviewModalProps) {
  const { t } = useI18n();
  const { creativeOpen, onCloseCreative } = props;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <Modal
            title={<><PictureOutlined style={{ color: '#7c3aed' }} /> {t('creative.previewTitle')}</>}
            open={creativeOpen}
            onCancel={() => onCloseCreative()}
            footer={null}
            width={780}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
              {t('creative.previewDesc', { count: mockCreatives.length })}
            </Typography.Text>
            <Row gutter={[16, 16]}>
              {mockCreatives.map(creative => (
                <Col xs={24} sm={8} key={creative.id}>
                  <Card
                    hoverable
                    size="small"
                    style={{ textAlign: 'center', borderTop: `4px solid ${creative.colors[0]}` }}
                  >
                    {/* 模拟广告图预览 */}
                    <div style={{
                      height: 140, margin: '-1px -1px 10px', borderRadius: '6px 6px 0 0',
                      background: `linear-gradient(135deg, ${creative.colors[0]} 0%, ${creative.colors[1]} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: creative.colors[2], fontSize: 18, fontWeight: 700, letterSpacing: 1,
                    }}>
                      {creative.previewText}
                    </div>
                    <Typography.Text strong style={{ fontSize: 12, display: 'block' }}>{creative.product}</Typography.Text>
                    <Space size={4} style={{ marginTop: 4 }}>
                      <Tag color="purple" style={{ fontSize: 9 }}>{creative.size}</Tag>
                      <Tag color="blue" style={{ fontSize: 9 }}>{creative.tone}</Tag>
                    </Space>
                    <Typography.Paragraph style={{ fontSize: 11, margin: '8px 0 0', color: '#64748b', whiteSpace: 'pre-line' }}>
                      {creative.copy}
                    </Typography.Paragraph>
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} style={{ fontSize: 11 }} onClick={() => { setSelectedId(creative.id); message.success(t('creative.selected')); onCloseCreative(); }}>
                        {t('creative.use')}
                      </Button>
                      <Button size="small" icon={<ReloadOutlined />} style={{ fontSize: 11 }} onClick={() => message.success(t('creative.regenerated'))}>
                        {t('creative.regenerate')}
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Modal>
  );
}
