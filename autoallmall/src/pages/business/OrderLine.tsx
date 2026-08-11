import React from 'react';
import { Card, Row, Col, Table, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockOrders, filterByStore } from '../../mock/data';

const { Text } = Typography;

const OrderLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockOrders, storeId);
  const autoCount = filtered.filter((o) => o.handledBy === 'auto').length;
  const manualCount = filtered.filter((o) => o.handledBy === 'manual').length;
  const autoRate =
    filtered.length > 0
      ? Math.round((autoCount / filtered.length) * 100)
      : 0;

  const columns = [
    {
      title: t('business.order.colId'),
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: t('business.order.colBuyer'),
      dataIndex: 'buyer',
      key: 'buyer',
      width: 80,
    },
    {
      title: t('business.order.colProduct'),
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: t('business.order.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => (
        <Text strong style={{ color: '#EF4444' }}>
          &yen;{amount}
        </Text>
      ),
    },
    {
      title: t('business.order.colTime'),
      dataIndex: 'time',
      key: 'time',
      width: 90,
    },
    {
      title: t('business.order.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '已发货': 'blue',
          '待发货': 'orange',
          '已签收': 'green',
          '退款中': 'red',
          '已完成': 'green',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>{status}</Tag>
        );
      },
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
              {t('business.order.agentName')}
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
              总订单
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
              自动处理
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
              自动处理率
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {autoRate}%
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
            {t('nav.order')}（{filtered.length}）
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

export default OrderLine;
export { OrderLine };
