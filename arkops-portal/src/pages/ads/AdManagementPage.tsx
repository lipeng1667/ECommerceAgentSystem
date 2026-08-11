/**
 * Ad Campaign Management Page — V1.1
 * Campaign overview, ROI tracking, creative preview, AI optimization.
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  RobotOutlined, LineChartOutlined, PictureOutlined,
  PlayCircleOutlined, PauseCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Modal, Progress, Row, Select, Space, Statistic, Table, Tag, Tabs, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adsApi } from '../../api/ads';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { TrendBarChart } from '../../components/charts/TrendBarChart';
import type { AdCampaign, AdCreative, AllMallId, Store } from '../../types/domain';

const STATUS_TAG: Record<string, { color: string; labelKey: string }> = {
  active: { color: 'green', labelKey: 'ads.active' },
  paused: { color: 'orange', labelKey: 'ads.paused' },
  ended: { color: 'default', labelKey: 'ads.ended' },
};
const PLATFORM_TAG: Record<string, string> = {
  douyin: '抖音', pinduoduo: '拼多多', taobao: '淘宝', jd: '京东',
};

function formatNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
}
function formatCurrency(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function AdManagementPage() {
  const { t } = useI18n();
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [creativeModalCampaign, setCreativeModalCampaign] = useState<AdCampaign | null>(null);

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['ads', storeFilter, statusFilter, platformFilter],
    queryFn: () => adsApi.list({ storeId: storeFilter, status: statusFilter, platform: platformFilter }),
  });
  const { data: overview } = useQuery({ queryKey: ['adsOverview'], queryFn: adsApi.getOverview });
  const { data: trend = [] } = useQuery({ queryKey: ['adsTrend'], queryFn: adsApi.getTrend });

  if (stores.length === 0) return <StoreConnectionEmptyState description={t('ads.emptyNoStore')} />;

  const active = overview?.active ?? 0;

  const columns: ColumnsType<AdCampaign> = [
    { title: t('ads.name'), dataIndex: 'name', width: 180, ellipsis: true },
    {
      title: t('ads.platform'), key: 'platform', width: 80,
      render: (_: unknown, r: AdCampaign) => <Tag>{PLATFORM_TAG[r.platform] ?? r.platform}</Tag>,
    },
    {
      title: t('ads.budget'), key: 'budget', width: 130,
      render: (_: unknown, r: AdCampaign) => (
        <Space direction="vertical" size={0}>
          <Typography.Text style={{ fontSize: 12 }}>{formatCurrency(r.spent)} / {formatCurrency(r.budget)}</Typography.Text>
          <Progress percent={r.budget > 0 ? +(r.spent / r.budget * 100).toFixed(0) : 0} size="small" showInfo={false} strokeColor={r.spent / r.budget > 0.9 ? '#ff4d4f' : '#1890ff'} />
        </Space>
      ),
    },
    { title: t('ads.impressions'), key: 'impressions', width: 90, align: 'right', render: (_: unknown, r: AdCampaign) => formatNum(r.impressions) },
    { title: t('ads.clicks'), key: 'clicks', width: 80, align: 'right', render: (_: unknown, r: AdCampaign) => formatNum(r.clicks) },
    { title: 'CTR', key: 'ctr', width: 60, align: 'right', render: (_: unknown, r: AdCampaign) => r.ctr > 0 ? `${r.ctr}%` : '-' },
    { title: 'CPC', key: 'cpc', width: 60, align: 'right', render: (_: unknown, r: AdCampaign) => r.cpc > 0 ? `¥${r.cpc.toFixed(2)}` : '-' },
    { title: t('ads.conversions'), key: 'conversions', width: 70, align: 'right', render: (_: unknown, r: AdCampaign) => formatNum(r.conversions) },
    { title: t('ads.revenue'), key: 'revenue', width: 90, align: 'right', render: (_: unknown, r: AdCampaign) => formatCurrency(r.revenue) },
    {
      title: 'ROI', key: 'roi', width: 60, align: 'right',
      render: (_: unknown, r: AdCampaign) => (
        <Typography.Text strong style={{ color: r.roi >= 3 ? 'var(--ark-green)' : r.roi >= 1.5 ? '#faad14' : 'var(--ark-red)' }}>
          {r.roi > 0 ? `${r.roi}x` : '-'}
        </Typography.Text>
      ),
    },
    {
      title: t('ads.status'), key: 'status', width: 80, fixed: 'right',
      render: (_: unknown, r: AdCampaign) => {
        const cfg = STATUS_TAG[r.status];
        return cfg ? <Tag color={cfg.color}>{t(cfg.labelKey)}</Tag> : <Tag>{r.status}</Tag>;
      },
    },
    {
      title: t('ads.actions'), key: 'actions', width: 100, fixed: 'right',
      render: (_: unknown, r: AdCampaign) => (
        <Space>
          <Button size="small" type="link" icon={<LineChartOutlined />} onClick={() => {}}>{t('ads.detail')}</Button>
          <Button size="small" type="link" icon={<PictureOutlined />} onClick={() => setCreativeModalCampaign(r)}>{t('ads.creatives')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title={t('nav.ads')} description={t('ads.subtitle')} />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ padding: '0 24px', marginBottom: 12 }}>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('ads.activeCount')} value={active} valueStyle={{ color: 'var(--ark-green)', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('ads.totalSpend')} value={formatCurrency(overview?.totalSpend ?? 0)} /></Card></Col>
        <Col xs={12} sm={4}><Card size="small"><Statistic title={t('ads.totalRevenue')} value={formatCurrency(overview?.totalRevenue ?? 0)} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('ads.impressions')} value={formatNum(overview?.totalImpressions ?? 0)} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('ads.avgRoi')} value={`${overview?.avgRoi ?? 0}x`} valueStyle={{ color: 'var(--ark-purple)', fontSize: 20 }} /></Card></Col>
      </Row>

      {/* Filters */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Select value={storeFilter} onChange={setStoreFilter} allowClear placeholder={t('cs.filterByStore')} style={{ width: 140 }} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        <Select value={statusFilter} onChange={setStatusFilter} allowClear placeholder={t('ads.filterStatus')} style={{ width: 120 }} options={['active', 'paused', 'ended'].map((v) => ({ value: v, label: t(STATUS_TAG[v]?.labelKey ?? v) }))} />
        <Select value={platformFilter} onChange={setPlatformFilter} allowClear placeholder={t('ads.filterPlatform')} style={{ width: 120 }} options={['douyin', 'pinduoduo', 'taobao', 'jd'].map((v) => ({ value: v, label: PLATFORM_TAG[v] }))} />
      </div>

      {/* Content */}
      <Tabs defaultActiveKey="campaigns" style={{ flex: 1, padding: '0 24px', overflow: 'auto' }} tabBarStyle={{ marginBottom: 12 }}
        items={[
          {
            key: 'campaigns', label: <><LineChartOutlined />{t('ads.campaignsTab')}</>,
            children: (
              <Table<AdCampaign> rowKey="id" columns={columns} dataSource={campaigns} pagination={{ pageSize: 15 }} size="middle" scroll={{ x: 1300 }} locale={{ emptyText: <Empty description={t('ads.noCampaigns')} /> }} />
            ),
          },
          {
            key: 'trend', label: <><LineChartOutlined />{t('ads.trendTab')}</>,
            children: trend.length > 0 ? (
              <Card size="small" title={t('ads.spendRevenueTrend')}>
                <TrendBarChart
                  points={trend.map((d) => ({
                    key: d.date,
                    label: d.date.slice(5),
                    bars: [
                      { value: d.spend, title: `${t('ads.spend')}: ¥${Math.round(d.spend)}`, color: '#1890ff' },
                      { value: d.revenue, title: `${t('ads.revenue')}: ¥${Math.round(d.revenue)}`, color: '#52c41a' },
                    ],
                  }))}
                />
              </Card>
            ) : <Empty />,
          },
          {
            key: 'agent', label: <><RobotOutlined />{t('ads.aiOptimizeTab')}</>,
            children: (
              <Card size="small">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}><Statistic title={t('ads.autoOptimizedCount')} value={campaigns.filter((c) => c.autoOptimized).length} suffix={t('ads.campaigns')} /></Col>
                    <Col span={12}><Statistic title={t('ads.avgOptRoi')} value={campaigns.filter((c) => c.autoOptimized && c.roi > 0).length > 0 ? +(campaigns.filter((c) => c.autoOptimized).reduce((s, c) => s + c.roi, 0) / campaigns.filter((c) => c.autoOptimized).length).toFixed(2) : 0} prefix="ROI " suffix="x" valueStyle={{ color: 'var(--ark-purple)' }} /></Col>
                  </Row>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t('ads.aiOptimizeDesc')}
                  </Typography.Text>
                  <Button type="primary" ghost icon={<RobotOutlined />} onClick={() => message.info(t('ads.aiRunMock'))}>{t('ads.aiRunOptimize')}</Button>
                </Space>
              </Card>
            ),
          },
      ]} />

      {/* Creative Modal */}
      <CreativeModal campaign={creativeModalCampaign} onClose={() => setCreativeModalCampaign(null)} stores={stores} />
    </div>
  );
}

function CreativeModal({ campaign, onClose, stores }: { campaign: AdCampaign | null; onClose: () => void; stores: Store[] }) {
  const { t } = useI18n();
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const { data: creatives = [] } = useQuery({
    queryKey: ['adCreatives', campaign?.id],
    queryFn: () => adsApi.getCreatives(campaign!.id),
    enabled: !!campaign,
  });

  if (!campaign) return null;

  const creativeColumns: ColumnsType<AdCreative> = [
    { title: t('ads.creative.title'), dataIndex: 'title', ellipsis: true },
    {
      title: t('ads.creative.type'), dataIndex: 'type',
      render: (v: string) => {
        const icon = v === 'video' ? <PlayCircleOutlined /> : v === 'carousel' ? <PictureOutlined /> : <PictureOutlined />;
        return <Tag icon={icon}>{v}</Tag>;
      },
    },
    { title: t('ads.creative.impressions'), dataIndex: ['performance', 'impressions'], align: 'right', render: (v: number) => formatNum(v) },
    { title: 'CTR', dataIndex: ['performance', 'ctr'], align: 'right', render: (v: number) => v > 0 ? `${v}%` : '-' },
    {
      title: t('ads.creative.status'), dataIndex: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { approved: 'green', pending: 'orange', rejected: 'red' };
        return <Tag color={colors[v]}>{v}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={`${t('ads.creatives')} — ${campaign.name}`}
      open={!!campaign}
      onCancel={onClose}
      footer={null}
      width={750}
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        <Tag>{PLATFORM_TAG[campaign.platform] ?? campaign.platform}</Tag>
        <Tag>{storeById.get(campaign.storeId)?.name ?? '-'}</Tag>
        {t('ads.conversions')}: {campaign.conversions} | ROI: {campaign.roi}x
      </Typography.Paragraph>
      <Table<AdCreative> rowKey="id" columns={creativeColumns} dataSource={creatives} pagination={false} size="small" />
    </Modal>
  );
}
