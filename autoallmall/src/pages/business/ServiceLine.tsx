import React from 'react';
import { Card, Row, Col, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockServices, type ServiceItem, filterByStore } from '../../mock/data';

const { Text } = Typography;

const ServiceLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockServices, storeId);
  const autoCount = filtered.filter((s) => s.handledBy === 'auto').length;
  const manualCount = filtered.filter((s) => s.handledBy === 'manual').length;
  const autoRate =
    filtered.length > 0
      ? Math.round((autoCount / filtered.length) * 100)
      : 0;

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
              {t('business.service.agentName')}
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
              总会话
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
              自动回复
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {autoCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              需人工处理
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
              {manualCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              智能回复率
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {autoRate}%
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customer message list */}
      <Card
        size="small"
        style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
        title={
          <Text strong>
            {t('nav.service')}（{filtered.length}）
          </Text>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item: ServiceItem) => (
            <Card
              key={item.id}
              size="small"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                borderLeft: `3px solid ${
                  item.handledBy === 'auto' ? '#10B981' : '#F59E0B'
                }`,
              }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>{item.customer}</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      {item.time}
                    </Text>
                  </div>
                  <Text>{item.message}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                  <Tag>{item.status}</Tag>
                  {item.handledBy === 'auto' ? (
                    <Tag color="green">自动</Tag>
                  ) : (
                    <Tag color="orange">人工</Tag>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ServiceLine;
export { ServiceLine };
