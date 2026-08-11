import React from 'react';
import { Card, Row, Col, Table, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockMarketings, filterByStore } from '../../mock/data';

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  '满减': 'blue',
  '闪购': 'purple',
  '优惠券': 'orange',
  '折扣': 'cyan',
};

const STATUS_COLORS: Record<string, string> = {
  '进行中': 'green',
  '待审批': 'orange',
  '已结束': 'default',
};

const MarketingLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockMarketings, storeId);
  const autoCount = filtered.filter((m) => m.createdBy === 'auto').length;
  const manualCount = filtered.filter((m) => m.createdBy === 'manual').length;
  const activeCount = filtered.filter((m) => m.status === '进行中').length;

  const columns = [
    {
      title: t('business.marketing.colName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('business.marketing.colType'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={TYPE_COLORS[type] || 'default'}>{type}</Tag>
      ),
    },
    {
      title: t('business.marketing.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: t('business.marketing.colRoi'),
      dataIndex: 'roi',
      key: 'roi',
      width: 80,
      render: (roi: string) => (
        <Text strong style={{ color: '#10B981' }}>
          {roi}
        </Text>
      ),
    },
    {
      title: t('business.marketing.colRevenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      width: 110,
    },
    {
      title: t('business.marketing.colCreated'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
      render: (createdBy: 'auto' | 'manual') =>
        createdBy === 'auto' ? (
          <Tag color="green">自动</Tag>
        ) : (
          <Tag>人工</Tag>
        ),
    },
    {
      title: t('business.marketing.colTime'),
      dataIndex: 'time',
      key: 'time',
      width: 80,
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
              {t('business.marketing.agentName')}
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
              全部活动
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
              进行中
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {activeCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              自动创建
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
              人工创建
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
              {manualCount}
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
            {t('nav.marketing')}（{filtered.length}）
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

export default MarketingLine;
export { MarketingLine };
