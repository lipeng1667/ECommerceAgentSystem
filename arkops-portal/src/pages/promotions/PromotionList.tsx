/**
 * Promotion List View — V1.1
 * Table view of all promotion campaigns with filters inherited from parent.
 */
import {
  CheckCircleOutlined, ClockCircleOutlined, FireOutlined,
  RobotOutlined, StopOutlined,
} from '@ant-design/icons';
import { Empty, Progress, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useI18n } from '../../app/i18n';
import type { PromotionCampaign, Store, Product } from '../../types/domain';

interface Props {
  campaigns: PromotionCampaign[];
  stores: Store[];
  products: Product[];
}

const TYPE_TAG: Record<string, { color: string; labelKey: string }> = {
  flash_sale: { color: 'red', labelKey: 'promotions.flashSale' },
  seckill: { color: 'volcano', labelKey: 'promotions.seckill' },
  coupon: { color: 'orange', labelKey: 'promotions.coupon' },
  bundle: { color: 'purple', labelKey: 'promotions.bundle' },
  full_reduction: { color: 'blue', labelKey: 'promotions.fullReduction' },
};

const STATUS_TAG: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
  active: { color: 'green', icon: <FireOutlined />, labelKey: 'promotions.active' },
  scheduled: { color: 'gold', icon: <ClockCircleOutlined />, labelKey: 'promotions.scheduled' },
  ended: { color: 'default', icon: <StopOutlined />, labelKey: 'promotions.ended' },
};

function formatCurrency(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function PromotionList({ campaigns, stores, products }: Props) {
  const { t } = useI18n();
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const productById = new Map(products.map((p) => [p.id, p]));

  const columns: ColumnsType<PromotionCampaign> = [
    {
      title: t('promotions.name'), dataIndex: 'name', width: 200, ellipsis: true,
      render: (text: string, r: PromotionCampaign) => (
        <Space size={4}>
          <Typography.Text strong>{text}</Typography.Text>
          {r.autoCreated && <Tag icon={<RobotOutlined />} color="cyan" style={{ fontSize: 10 }}>{t('promotions.autoCreated')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('promotions.type'), key: 'type', width: 100,
      render: (_: unknown, r: PromotionCampaign) => {
        const cfg = TYPE_TAG[r.type];
        return cfg ? <Tag color={cfg.color}>{t(cfg.labelKey)}</Tag> : <Tag>{r.type}</Tag>;
      },
    },
    {
      title: t('promotions.store'), key: 'store', width: 120,
      render: (_: unknown, r: PromotionCampaign) => storeById.get(r.storeId)?.name ?? '-',
    },
    {
      title: t('promotions.products'), key: 'products', width: 150, ellipsis: true,
      render: (_: unknown, r: PromotionCampaign) =>
        r.productIds.map((pid) => productById.get(pid)?.name ?? '').filter(Boolean).join('、') || '-',
    },
    {
      title: t('promotions.discount'), key: 'discount', width: 80, align: 'right',
      render: (_: unknown, r: PromotionCampaign) => (
        <Typography.Text strong style={{ color: 'var(--ark-red)' }}>{r.discount}% OFF</Typography.Text>
      ),
    },
    {
      title: t('promotions.period'), key: 'period', width: 160,
      render: (_: unknown, r: PromotionCampaign) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(r.startDate).format('MM/DD')} - {dayjs(r.endDate).format('MM/DD')}
        </Typography.Text>
      ),
    },
    {
      title: t('promotions.budget'), key: 'budget', width: 130,
      render: (_: unknown, r: PromotionCampaign) => (
        <Space direction="vertical" size={0}>
          <Typography.Text style={{ fontSize: 12 }}>{formatCurrency(r.spent)} / {formatCurrency(r.budget)}</Typography.Text>
          <Progress percent={r.budget > 0 ? +(r.spent / r.budget * 100).toFixed(0) : 0} size="small" showInfo={false} strokeColor={r.spent / r.budget > 0.8 ? '#ff4d4f' : '#52c41a'} />
        </Space>
      ),
    },
    {
      title: t('promotions.revenue'), key: 'revenue', width: 100, align: 'right',
      render: (_: unknown, r: PromotionCampaign) => (
        <Typography.Text>{formatCurrency(r.revenue)}</Typography.Text>
      ),
    },
    {
      title: 'ROI', key: 'roi', width: 70, align: 'right',
      render: (_: unknown, r: PromotionCampaign) => (
        <Typography.Text strong style={{ color: r.roi >= 5 ? 'var(--ark-green)' : r.roi >= 3 ? '#faad14' : 'var(--ark-red)' }}>
          {r.roi > 0 ? `${r.roi}x` : '-'}
        </Typography.Text>
      ),
    },
    {
      title: t('promotions.status'), key: 'status', width: 100, fixed: 'right',
      render: (_: unknown, r: PromotionCampaign) => {
        const cfg = STATUS_TAG[r.status];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{t(cfg.labelKey)}</Tag> : <Tag>{r.status}</Tag>;
      },
    },
  ];

  return (
    <Table<PromotionCampaign>
      rowKey="id"
      columns={columns}
      dataSource={campaigns}
      pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => t('cs.totalSessions', { count: total }) }}
      size="middle"
      scroll={{ x: 1200 }}
      locale={{ emptyText: <Empty description={t('promotions.noCampaigns')} /> }}
    />
  );
}
