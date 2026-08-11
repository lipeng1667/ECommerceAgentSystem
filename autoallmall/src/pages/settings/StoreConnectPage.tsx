import {
  PlusOutlined,
  SyncOutlined,
  LinkOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Table,
  Tag,
  Typography,
  message,
  Space,
} from 'antd';
import { useState } from 'react';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import type { StoreInfo } from '../../app/storeScope';
import {
  mockStores,
  mockProducts,
  mockOrders,
  mockAgents,
} from '../../mock/data';

const { Title, Text } = Typography;

export function StoreConnectPage() {
  const { t } = useI18n();
  const { setStoreId } = useStoreScope();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (storeId: string) => {
    setSyncing(storeId);
    await new Promise((r) => setTimeout(r, 1500));
    setSyncing(null);
    message.success(t('store.synced'));
  };

  const handleView = (storeId: string) => {
    setStoreId(storeId);
    message.success('已切换到该店铺视角');
  };

  const handleAddStore = () => {
    message.info('店铺连接功能即将上线');
  };

  const columns = [
    {
      title: t('store.shopName'),
      key: 'name',
      render: (_: unknown, r: StoreInfo) => (
        <Space>
          <Text style={{ fontSize: 18 }}>{r.platformIcon}</Text>
          <div>
            <Text strong>{r.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.platform}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('store.status'),
      key: 'status',
      width: 100,
      render: (_: unknown, r: StoreInfo) =>
        r.status === 'connected' ? (
          <Tag color="green">已连接</Tag>
        ) : (
          <Tag color="default">未连接</Tag>
        ),
    },
    {
      title: t('store.lastSync'),
      key: 'lastSync',
      width: 140,
      render: (_: unknown, r: StoreInfo) =>
        r.status === 'connected' ? (
          <Text type="secondary">3 分钟前</Text>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: '订单数',
      key: 'orderCount',
      width: 80,
      render: (_: unknown, r: StoreInfo) => {
        const count = mockOrders.filter((o) => o.storeId === r.id).length;
        return <Text>{count}</Text>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, r: StoreInfo) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(r.id)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<SyncOutlined spin={syncing === r.id} />}
            onClick={() => handleSync(r.id)}
            loading={syncing === r.id}
            disabled={r.status === 'disconnected'}
          >
            同步
          </Button>
          {r.status === 'disconnected' && (
            <Button
              size="small"
              icon={<LinkOutlined />}
              type="primary"
              ghost
            >
              重新连接
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const connectedCount = mockStores.filter(
    (s) => s.status === 'connected',
  ).length;
  const connectedStoreIds = mockStores
    .filter((s) => s.status === 'connected')
    .map((s) => s.id);
  const productCount = mockProducts.filter((p) =>
    connectedStoreIds.includes(p.storeId),
  ).length;
  const orderCount = mockOrders.filter((o) =>
    connectedStoreIds.includes(o.storeId),
  ).length;
  const runningAgentCount = mockAgents.filter((a) => a.running).length;
  const totalAgentCount = mockAgents.length;

  return (
    <div style={{ padding: '20px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontSize: 20 }}>
            {t('nav.store')}
          </Title>
          <Text type="secondary">
            已连接 {connectedCount}/{mockStores.length} 个店铺
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStore}
        >
          {t('store.addStore')}
        </Button>
      </div>

      {mockStores.length === 0 ? (
        <Empty description={t('store.noStores')}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddStore}
          >
            {t('store.addStore')}
          </Button>
        </Empty>
      ) : (
        <Card
          size="small"
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Table
            columns={columns}
            dataSource={mockStores}
            rowKey="id"
            size="middle"
            pagination={false}
          />
        </Card>
      )}

      <Row gutter={12}>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('nav.product')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>
              {productCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('nav.order')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>
              {orderCount.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('hub.agentCoverage')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {runningAgentCount}/{totalAgentCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              已连接店铺
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {connectedCount}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
