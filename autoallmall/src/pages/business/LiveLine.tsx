import React from 'react';
import { Card, Row, Col, Table, Tag, Typography, Button } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockLives, filterByStore } from '../../mock/data';

const { Text } = Typography;

const LiveLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockLives, storeId);
  const assistedCount = filtered.filter((l) => l.assisted).length;
  const upcomingCount = filtered.filter((l) => l.status === '待开播').length;

  const columns = [
    {
      title: t('business.live.colTitle'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('business.live.colDate'),
      dataIndex: 'date',
      key: 'date',
      width: 140,
    },
    {
      title: t('business.live.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '待开播': 'blue',
          '回放': 'default',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>{status}</Tag>
        );
      },
    },
    {
      title: t('business.live.colViewers'),
      dataIndex: 'viewers',
      key: 'viewers',
      width: 100,
    },
    {
      title: t('business.live.colRevenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      width: 110,
      render: (revenue: string) =>
        revenue !== '--' ? (
          <Text strong style={{ color: '#EF4444' }}>
            {revenue}
          </Text>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: t('business.live.colAssisted'),
      dataIndex: 'assisted',
      key: 'assisted',
      width: 110,
      render: (assisted: boolean) =>
        assisted ? (
          <Tag color="green">Agent 辅助</Tag>
        ) : (
          <Text type="secondary">--</Text>
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
        <Row align="middle" gutter={16} justify="space-between">
          <Col>
            <Row align="middle" gutter={16}>
              <Col>
                <Text strong style={{ fontSize: 15 }}>
                  {t('business.live.agentName')}
                </Text>
                <Tag style={{ marginLeft: 8 }}>待机</Tag>
                <Tag color="default" style={{ marginLeft: 4 }}>未启用</Tag>
              </Col>
              <Col>
                <Text type="secondary">
                  本周自动操作: {assistedCount} | 需人工处理: {filtered.length - assistedCount}
                </Text>
              </Col>
              {storeName && (
                <Col>
                  <Tag color="blue">{storeName}</Tag>
                </Col>
              )}
            </Row>
          </Col>
          <Col>
            <Button type="primary" ghost>
              启用 Agent
            </Button>
          </Col>
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
              直播场次
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
              待开播
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {upcomingCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              Agent 辅助
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {assistedCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              未辅助
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>
              {filtered.length - assistedCount}
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
            {t('nav.live')}（{filtered.length}）
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

export default LiveLine;
export { LiveLine };
