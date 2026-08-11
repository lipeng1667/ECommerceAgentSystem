import React from 'react';
import { Card, Row, Col, Table, Tag, Typography } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockReviews, filterByStore } from '../../mock/data';

const { Text } = Typography;

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <StarFilled key={i} style={{ color: '#F59E0B', fontSize: 13 }} />,
      );
    } else {
      stars.push(
        <StarOutlined key={i} style={{ color: '#CBD5E1', fontSize: 13 }} />,
      );
    }
  }
  return <span style={{ display: 'inline-flex', gap: 1 }}>{stars}</span>;
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string }> = {
  positive: { label: '好评', color: 'green' },
  neutral: { label: '中评', color: 'default' },
  negative: { label: '差评', color: 'red' },
};

const ReviewLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockReviews, storeId);
  const autoCount = filtered.filter((r) => r.handledBy === 'auto').length;
  const manualCount = filtered.filter((r) => r.handledBy === 'manual').length;
  const positiveCount = filtered.filter(
    (r) => r.sentiment === 'positive',
  ).length;
  const negativeCount = filtered.filter(
    (r) => r.sentiment === 'negative',
  ).length;

  const columns = [
    {
      title: t('business.review.colBuyer'),
      dataIndex: 'buyer',
      key: 'buyer',
      width: 80,
    },
    {
      title: t('business.review.colProduct'),
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: t('business.review.colRating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 110,
      render: (rating: number) => renderStars(rating),
    },
    {
      title: t('business.review.colContent'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: t('business.review.colSentiment'),
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 80,
      render: (sentiment: string) => {
        const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('business.review.colTime'),
      dataIndex: 'time',
      key: 'time',
      width: 90,
    },
    {
      title: t('business.colHandledBy'),
      dataIndex: 'handledBy',
      key: 'handledBy',
      width: 100,
      render: (handledBy: 'auto' | 'manual') =>
        handledBy === 'auto' ? (
          <Tag color="green">自动</Tag>
        ) : (
          <Tag color="orange">人工</Tag>
        ),
    },
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Agent status bar */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          border: '1px solid #E2E8F0',
          borderRadius: 8,
        }}
      >
        <Row align="middle" gutter={16}>
          <Col>
            <Text strong style={{ fontSize: 15 }}>
              {t('business.review.agentName')}
            </Text>
            <Tag color="green" style={{ marginLeft: 8 }}>运行中</Tag>
            <Tag color="blue" style={{ marginLeft: 4 }}>全自动</Tag>
          </Col>
          <Col>
            <Text type="secondary">
              本周自动操作: {autoCount} | 需人工处理: {manualCount}
            </Text>
          </Col>
          {storeName && (
            <Col>
              <Tag color="blue">{storeName}</Tag>
            </Col>
          )}
        </Row>
      </Card>

      {/* Stats row */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              总评价
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>
              {filtered.length}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              好评数
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {positiveCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              差评数
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', marginTop: 4 }}>
              {negativeCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              自动处理率
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {filtered.length > 0
                ? Math.round((autoCount / filtered.length) * 100)
                : 0}
              %
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main table */}
      <Card
        size="small"
        style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
        title={
          <Text strong>
            {t('nav.review')}（{filtered.length}）
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ReviewLine;
export { ReviewLine };
