/**
 * Inventory Management Page — V1.1
 * Full inventory overview with replenish suggestions, transfers, and safety stock config.
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  WarningOutlined, ShopOutlined, SyncOutlined, RocketOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Modal, Progress, Row, Select, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { inventoryApi } from '../../api/inventory';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import type { AllMallId, InventoryItem, ReplenishSuggestion, SafetyStockConfig, TransferRecommendation } from '../../types/domain';

const ALERT_TAG: Record<string, { color: string; labelKey: string }> = {
  healthy: { color: 'green', labelKey: 'inventory.healthy' },
  low: { color: 'orange', labelKey: 'inventory.low' },
  critical: { color: 'red', labelKey: 'inventory.critical' },
};
const SOURCE_TAG: Record<string, string> = {
  physical: 'inventory.physical',
  shared_pool: 'inventory.sharedPool',
  virtual: 'inventory.virtual',
};

function formatCurrency(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function InventoryManagementPage() {
  const { t } = useI18n();
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>();
  const [alertFilter, setAlertFilter] = useState<string | undefined>();

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: items = [] } = useQuery({
    queryKey: ['inventory', storeFilter, alertFilter],
    queryFn: () => inventoryApi.list({ storeId: storeFilter, alertLevel: alertFilter }),
  });
  const { data: overview } = useQuery({ queryKey: ['inventoryOverview'], queryFn: inventoryApi.getOverview });
  const { data: replenish = [] } = useQuery({ queryKey: ['replenishSuggestions'], queryFn: inventoryApi.getReplenishSuggestions });
  const { data: transfers = [] } = useQuery({ queryKey: ['transferRecs'], queryFn: inventoryApi.getTransferRecommendations });
  const { data: safetyConfigs = [] } = useQuery({ queryKey: ['safetyConfigs'], queryFn: inventoryApi.getSafetyStockConfigs });

  if (stores.length === 0) return <StoreConnectionEmptyState description={t('inventory.emptyNoStore')} />;

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const critical = overview?.critical ?? 0;
  const low = overview?.low ?? 0;

  const itemColumns: ColumnsType<InventoryItem> = [
    { title: t('inventory.sku'), dataIndex: 'skuName', width: 150, ellipsis: true },
    { title: t('inventory.skuCode'), dataIndex: 'skuCode', width: 120 },
    { title: t('inventory.store'), key: 'store', width: 110, render: (_: unknown, r: InventoryItem) => storeById.get(r.storeId)?.name ?? '-' },
    {
      title: t('inventory.stock'), key: 'stock', width: 140,
      render: (_: unknown, r: InventoryItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ color: r.alertLevel === 'critical' ? 'var(--ark-red)' : 'inherit' }}>{r.currentStock}</Typography.Text>
          <Progress percent={r.safetyStock > 0 ? +(r.currentStock / r.safetyStock * 100).toFixed(0) : 100} size="small" showInfo={false} strokeColor={r.alertLevel === 'critical' ? '#ff4d4f' : r.alertLevel === 'low' ? '#faad14' : '#52c41a'} />
        </Space>
      ),
    },
    { title: t('inventory.safetyStock'), dataIndex: 'safetyStock', width: 80 },
    { title: t('inventory.dailySales'), dataIndex: 'dailySales', width: 80 },
    {
      title: t('inventory.daysLeft'), dataIndex: 'daysUntilStockout', width: 80,
      render: (v: number) => <Typography.Text strong style={{ color: v <= 2 ? 'var(--ark-red)' : v <= 7 ? '#faad14' : 'inherit' }}>{v}{t('inventory.days')}</Typography.Text>,
    },
    {
      title: t('inventory.source'), dataIndex: 'source', width: 90,
      render: (v: string) => <Tag>{t(SOURCE_TAG[v] ?? v)}</Tag>,
    },
    {
      title: t('inventory.alert'), dataIndex: 'alertLevel', width: 90,
      render: (v: string) => { const cfg = ALERT_TAG[v]; return cfg ? <Tag color={cfg.color}>{t(cfg.labelKey)}</Tag> : null; },
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title={t('nav.inventory')} description={t('inventory.subtitle')} />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ padding: '0 24px', marginBottom: 12 }}>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('inventory.criticalCount')} value={critical} valueStyle={{ color: 'var(--ark-red)', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('inventory.lowCount')} value={low} valueStyle={{ color: '#faad14', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('inventory.healthyCount')} value={overview?.healthy ?? 0} valueStyle={{ color: 'var(--ark-green)', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('inventory.totalStock')} value={overview?.totalStock ?? 0} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('inventory.totalValue')} value={formatCurrency(overview?.totalValue ?? 0)} /></Card></Col>
      </Row>

      {/* Alerts */}
      {(critical > 0 || low > 0) && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={t('inventory.alertMessage', { critical, low })}
          style={{ margin: '0 24px 12px' }}
        />
      )}

      {/* Filters */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Select value={storeFilter} onChange={setStoreFilter} allowClear placeholder={t('cs.filterByStore')} style={{ width: 140 }} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        <Select value={alertFilter} onChange={setAlertFilter} allowClear placeholder={t('inventory.filterAlert')} style={{ width: 120 }} options={['critical', 'low', 'healthy'].map((v) => ({ value: v, label: t(ALERT_TAG[v]?.labelKey ?? v) }))} />
      </div>

      {/* Content */}
      <Tabs defaultActiveKey="list" style={{ flex: 1, padding: '0 24px', overflow: 'auto' }} tabBarStyle={{ marginBottom: 12 }}
        items={[
          {
            key: 'list', label: <><DashboardOutlined />{t('inventory.stockTab')}</>,
            children: (
              <Table<InventoryItem> rowKey="id" columns={itemColumns} dataSource={items} pagination={{ pageSize: 15 }} size="middle" scroll={{ x: 1000 }} locale={{ emptyText: <Empty description={t('inventory.noItems')} /> }} />
            ),
          },
          {
            key: 'replenish', label: <><SyncOutlined />{t('inventory.replenishTab')} {replenish.length > 0 && <Tag color="red">{replenish.filter((r) => r.priority === 'urgent').length}</Tag>}</>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {replenish.map((s, i) => (
                  <Card key={i} size="small" title={<><Tag color={s.priority === 'urgent' ? 'red' : 'blue'}>{t(`inventory.priority_${s.priority}`)}</Tag>{s.productName}</>}>
                    <Row gutter={[16, 8]}>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.current')}: <Typography.Text strong>{s.currentStock}</Typography.Text></Typography.Text></Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.dailySales')}: <Typography.Text strong>{s.dailySales}</Typography.Text></Typography.Text></Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.supplier')}: {s.supplier}（{s.leadTimeDays}{t('inventory.days')}）</Typography.Text></Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.suggestedQuantity')}: <Typography.Text strong style={{ color: 'var(--ark-purple)' }}>{s.suggestedQuantity}</Typography.Text></Typography.Text></Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.suggestedDate')}: {dayjs(s.suggestedDate).format('YYYY-MM-DD')}</Typography.Text></Col>
                      <Col span={8}><Button size="small" type="primary" onClick={() => message.info(t('inventory.createOrderMock'))}>{t('inventory.createOrder')}</Button></Col>
                    </Row>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginTop: 6, marginBottom: 0 }}>{s.reason}</Typography.Paragraph>
                  </Card>
                ))}
                {replenish.length === 0 && <Empty description={t('inventory.noReplenish')} />}
              </Space>
            ),
          },
          {
            key: 'transfer', label: <><RocketOutlined />{t('inventory.transferTab')} {transfers.length > 0 && <Tag color="orange">{transfers.length}</Tag>}</>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {transfers.map((tr, i) => (
                  <Card key={i} size="small">
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <Space>
                          <Tag color={tr.urgency === 'urgent' ? 'red' : 'blue'}>{t(`inventory.priority_${tr.urgency}`)}</Tag>
                          <Typography.Text strong>{tr.productName}</Typography.Text>
                          <Typography.Text type="secondary">{tr.skuCode}</Typography.Text>
                        </Space>
                      </Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.fromStore')}: <Typography.Text strong>{storeById.get(tr.fromStoreId)?.name ?? '-'}</Typography.Text>（{tr.fromStock}{t('inventory.units')}）</Typography.Text></Col>
                      <Col span={8}><Typography.Text type="secondary">{t('inventory.toStore')}: <Typography.Text strong>{storeById.get(tr.toStoreId)?.name ?? '-'}</Typography.Text>（{tr.toStock}{t('inventory.units')}）</Typography.Text></Col>
                      <Col span={8}><Button size="small" type="primary" onClick={() => message.info(t('inventory.transferMock', { qty: tr.quantity, from: storeById.get(tr.fromStoreId)?.name ?? '-', to: storeById.get(tr.toStoreId)?.name ?? '-' }))}>{t('inventory.transferBtn', { qty: tr.quantity })}</Button></Col>
                    </Row>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginTop: 6, marginBottom: 0 }}>{tr.reason}</Typography.Paragraph>
                  </Card>
                ))}
                {transfers.length === 0 && <Empty description={t('inventory.noTransfers')} />}
              </Space>
            ),
          },
          {
            key: 'safety', label: <><ShopOutlined />{t('inventory.safetyStockTab')}</>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {safetyConfigs.map((sc, i) => (
                  <Card key={i} size="small" title={`${sc.productId} — ${storeById.get(sc.storeId)?.name ?? '-'}`}>
                    <Row gutter={16}>
                      <Col span={12}><Statistic title={t('inventory.currentSafety')} value={sc.currentSafetyStock} suffix={t('inventory.units')} /></Col>
                      <Col span={12}><Statistic title={t('inventory.suggestedSafety')} value={sc.suggestedSafetyStock} suffix={t('inventory.units')} valueStyle={{ color: 'var(--ark-purple)' }} /></Col>
                    </Row>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>{sc.recommendation}</Typography.Paragraph>
                  </Card>
                ))}
                {safetyConfigs.length === 0 && <Empty description={t('inventory.noSafety')} />}
              </Space>
            ),
          },
      ]} />
    </div>
  );
}
