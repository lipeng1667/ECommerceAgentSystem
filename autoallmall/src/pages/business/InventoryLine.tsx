import React from 'react';
import { Card, Row, Col, Table, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockInventories, type InventoryItem, filterByStore } from '../../mock/data';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  '充足': { label: '充足', color: 'green' },
  '不足': { label: '不足', color: 'orange' },
  '告急': { label: '告急', color: 'red' },
  '缺货': { label: '缺货', color: 'red' },
};

function deriveStatus(item: InventoryItem): string {
  if (item.currentStock === 0) return '缺货';
  if (item.currentStock <= item.safeStock * 0.3) return '告急';
  if (item.currentStock <= item.safeStock) return '不足';
  return '充足';
}

const InventoryLine: React.FC = () => {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();
  const storeName = storeId ? stores.find(s => s.id === storeId)?.name : null;

  const filtered = filterByStore(mockInventories, storeId);
  const fullCount = filtered.filter(
    (i) => i.currentStock > i.safeStock,
  ).length;
  const alertCount = filtered.filter(
    (i) => i.currentStock <= i.safeStock || i.currentStock === 0,
  ).length;

  const columns = [
    {
      title: t('business.inventory.colProduct'),
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: t('business.inventory.colWarehouse'),
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 100,
    },
    {
      title: t('business.inventory.colStock'),
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 120,
      render: (currentStock: number, record: InventoryItem) => {
        const isOut = currentStock === 0;
        const isLow = currentStock <= record.safeStock && currentStock > 0;
        return (
          <Text
            strong
            style={{
              color: isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
            }}
          >
            {currentStock}
          </Text>
        );
      },
    },
    {
      title: t('business.inventory.colSafe'),
      dataIndex: 'safeStock',
      key: 'safeStock',
      width: 100,
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_: unknown, record: InventoryItem) => {
        const status = deriveStatus(record);
        const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('business.inventory.colSuggestion'),
      dataIndex: 'suggestion',
      key: 'suggestion',
      render: (suggestion: string) => (
        <Text type={suggestion === '--' ? 'secondary' : undefined}>
          {suggestion}
        </Text>
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
              {t('business.inventory.agentName')}
            </Text>
            <Tag color="green" style={{ marginLeft: 8 }}>运行中</Tag>
            <Tag color="blue" style={{ marginLeft: 4 }}>半自动</Tag>
          </Col>
          <Col>
            <Text type="secondary">
              本周自动操作: {fullCount} 项正常 | 需人工处理: {alertCount} 项告警
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
              监控 SKU
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
              库存充足
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
              {fullCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              库存告警
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
              {alertCount}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              补货建议
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', marginTop: 4 }}>
              {alertCount}
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
            {t('nav.inventory')}（{filtered.length}）
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

export default InventoryLine;
export { InventoryLine };
