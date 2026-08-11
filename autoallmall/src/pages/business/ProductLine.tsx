import React from 'react';
import { Card, Row, Col, Table, Tag, Typography, Progress } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockProducts, type ProductItem, filterByStore } from '../../mock/data';

const { Text } = Typography;

const statusConfig: Record<ProductItem['status'], { label: string; color: string }> = {
  auto: { label: '自动', color: 'green' },
  manual: { label: '人工', color: 'default' },
  warning: { label: '缺货', color: 'orange' },
  critical: { label: '告急', color: 'red' },
};

const ProductLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockProducts, storeId);
  const autoCount = filtered.filter((p) => p.status === 'auto').length;
  const warningCount = filtered.filter((p) => p.status === 'warning' || p.status === 'critical').length;

  const columns = [
    {
      title: t('business.product.colImage'),
      dataIndex: 'image',
      key: 'image',
      width: 60,
      render: (image: string) => (
        <span style={{ fontSize: 20 }}>{image}</span>
      ),
    },
    {
      title: t('business.product.colName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('business.product.colPrice'),
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#EF4444' }}>
          &yen;{price}
        </Text>
      ),
    },
    {
      title: t('business.product.colStock'),
      dataIndex: 'stock',
      key: 'stock',
      width: 160,
      render: (_: number, record: ProductItem) => {
        const percent = Math.round((record.stock / record.maxStock) * 100);
        const strokeColor =
          record.stock === 0
            ? '#EF4444'
            : record.stock <= record.maxStock * 0.3
            ? '#F59E0B'
            : '#10B981';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={strokeColor}
              style={{ flex: 1, margin: 0 }}
            />
            <Text style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
              {record.stock}/{record.maxStock}
            </Text>
          </div>
        );
      },
    },
    {
      title: t('business.product.colStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: ProductItem['status']) => {
        const cfg = statusConfig[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('business.colHandledBy'),
      key: 'handledBy',
      width: 100,
      render: (_: unknown, record: ProductItem) =>
        record.status === 'auto' ? (
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
              {t('business.product.agentName')}
            </Text>
            <Tag color="green" style={{ marginLeft: 8 }}>运行中</Tag>
            <Tag color="blue" style={{ marginLeft: 4 }}>全自动</Tag>
          </Col>
          <Col>
            <Text type="secondary">
              本周自动操作: {autoCount} SKU | 需人工处理: {warningCount} SKU
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
              管理 SKU
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
              自动定价
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              47 次
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              铺货
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              12 次
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
              {warningCount}
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
            {t('nav.product')}（{filtered.length}）
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

export default ProductLine;
export { ProductLine };
