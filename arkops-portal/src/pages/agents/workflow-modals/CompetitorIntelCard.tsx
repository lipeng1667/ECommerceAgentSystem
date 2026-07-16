import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined, RadarChartOutlined, ReloadOutlined, RiseOutlined, SendOutlined, ShopOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Progress, Row, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';

const mockCompetitorPrices = [
  { id: 1, competitor: 'TechNova Official', product: 'Wireless Earbuds Pro 2', theirPrice: 28.99, ourPrice: 32.99, lastChangePct: -5.2, lastUpdated: '2h ago' },
  { id: 2, competitor: 'GadgetHub Store', product: 'Wireless Earbuds Pro 2', theirPrice: 31.50, ourPrice: 32.99, lastChangePct: 0, lastUpdated: '5h ago' },
  { id: 3, competitor: 'SoundWave Direct', product: 'Bluetooth Speaker Mini', theirPrice: 19.99, ourPrice: 18.99, lastChangePct: 8.5, lastUpdated: '1h ago' },
  { id: 4, competitor: 'TechNova Official', product: 'USB-C Fast Charger 65W', theirPrice: 24.99, ourPrice: 24.99, lastChangePct: -3.1, lastUpdated: '3h ago' },
  { id: 5, competitor: 'PowerDeal Shop', product: 'USB-C Fast Charger 65W', theirPrice: 22.49, ourPrice: 24.99, lastChangePct: -12.0, lastUpdated: '6h ago' },
  { id: 6, competitor: 'GadgetHub Store', product: 'Smart Watch Lite', theirPrice: 45.00, ourPrice: 39.99, lastChangePct: 2.3, lastUpdated: '4h ago' },
];

const mockProductResearch = [
  { id: 1, category: 'Wireless Earbuds', marketCapacity: '$2.4M/mo', competitorCount: 47, avgPrice: 29.50, priceRange: '$12 - $89', monthlySales: 82000, opportunityScore: 72 },
  { id: 2, category: 'Bluetooth Speakers', marketCapacity: '$1.1M/mo', competitorCount: 31, avgPrice: 22.00, priceRange: '$8 - $65', monthlySales: 50000, opportunityScore: 58 },
  { id: 3, category: 'Smart Watches', marketCapacity: '$3.8M/mo', competitorCount: 89, avgPrice: 42.00, priceRange: '$15 - $120', monthlySales: 90000, opportunityScore: 81 },
  { id: 4, category: 'USB-C Chargers', marketCapacity: '$0.9M/mo', competitorCount: 25, avgPrice: 21.00, priceRange: '$9 - $45', monthlySales: 43000, opportunityScore: 45 },
];

const mockTrendingKeywords = [
  { keyword: 'bluetooth 5.3', searchVolume: 124000, growthRate: 34, trend: 'rising' },
  { keyword: 'noise cancelling', searchVolume: 98000, growthRate: 18, trend: 'rising' },
  { keyword: 'gaming earbuds', searchVolume: 67000, growthRate: 52, trend: 'rising' },
  { keyword: 'usb-c charger', searchVolume: 89000, growthRate: -5, trend: 'declining' },
  { keyword: 'smart watch', searchVolume: 156000, growthRate: 8, trend: 'stable' },
  { keyword: 'wireless charging', searchVolume: 73000, growthRate: 22, trend: 'rising' },
];

const mockNewProducts = [
  { id: 1, name: 'Open-ear Earbuds X1', competitor: 'SoundWave Direct', firstSeen: '3 days ago', initialPrice: 38.99 },
  { id: 2, name: 'Mini Power Bank 5000mAh', competitor: 'PowerDeal Shop', firstSeen: '1 week ago', initialPrice: 15.99 },
  { id: 3, name: 'LED Strip RGB 5m', competitor: 'TechNova Official', firstSeen: '5 days ago', initialPrice: 12.49 },
  { id: 4, name: 'Portable SSD 1TB', competitor: 'GadgetHub Store', firstSeen: '2 weeks ago', initialPrice: 89.99 },
];

const trendConfig = {
  rising: { color: '#16a34a', icon: <RiseOutlined /> },
  stable: { color: '#64748b', icon: <MinusOutlined /> },
  declining: { color: '#dc2626', icon: <ArrowDownOutlined /> },
};

export function CompetitorIntelCard() {
  const { t } = useI18n();
  const [collecting, setCollecting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [lastCollect, setLastCollect] = useState('2h ago');

  const handleCollect = () => {
    setCollecting(true);
    setTimeout(() => {
      setCollecting(false);
      setLastCollect('just now');
      message.success(t('intel.collectDone'));
    }, 2000);
  };

  const handlePush = () => {
    setPushing(true);
    setTimeout(() => {
      setPushing(false);
      message.success(t('intel.pushDone'));
    }, 1500);
  };

  const priceColumns = [
    {
      title: t('intel.competitor'), dataIndex: 'competitor', width: 160,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    { title: t('intel.product'), dataIndex: 'product', ellipsis: true },
    {
      title: t('intel.theirPrice'), dataIndex: 'theirPrice', width: 100,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('intel.ourPrice'), dataIndex: 'ourPrice', width: 100,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('intel.priceDiff'), width: 110,
      render: (_: unknown, r: typeof mockCompetitorPrices[0]) => {
        const diff = r.theirPrice - r.ourPrice;
        if (Math.abs(diff) < 0.01) return <Tag style={{ fontSize: 11 }}>{t('intel.priceParity')}</Tag>;
        if (diff < 0) return <Tag color="red" style={{ fontSize: 11 }}>{t('intel.cheaperThanUs')} ${Math.abs(diff).toFixed(2)}</Tag>;
        return <Tag color="green" style={{ fontSize: 11 }}>{t('intel.moreExpensive')} ${diff.toFixed(2)}</Tag>;
      },
    },
    {
      title: t('intel.lastUpdated'), dataIndex: 'lastUpdated', width: 110,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text>,
    },
  ];

  const researchColumns = [
    {
      title: t('intel.category'), dataIndex: 'category', width: 160,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    { title: t('intel.marketCapacity'), dataIndex: 'marketCapacity', width: 120 },
    { title: t('intel.competitorCount'), dataIndex: 'competitorCount', width: 100, render: (v: number) => <Tag>{v}</Tag> },
    { title: t('intel.avgPrice'), dataIndex: 'avgPrice', width: 90, render: (v: number) => `$${v.toFixed(2)}` },
    { title: t('intel.priceRange'), dataIndex: 'priceRange', width: 110 },
    { title: t('intel.monthlySales'), dataIndex: 'monthlySales', width: 110, render: (v: number) => v.toLocaleString() },
    {
      title: t('intel.opportunityScore'), dataIndex: 'opportunityScore', width: 120,
      render: (v: number) => {
        const color = v >= 75 ? '#16a34a' : v >= 50 ? '#f59e0b' : '#dc2626';
        return <Progress percent={v} size="small" strokeColor={color} format={(p) => <span style={{ fontSize: 12, color }}>{p}</span>} />;
      },
    },
  ];

  const keywordColumns = [
    {
      title: t('intel.trendingKeywords'), dataIndex: 'keyword',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('intl.searchVolume'), dataIndex: 'searchVolume', width: 140,
      render: (v: number) => {
        const w = Math.min(v / 156000 * 100, 100);
        return <Space><div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${w}%`, height: '100%', background: '#2563eb' }} /></div><Typography.Text type="secondary" style={{ fontSize: 11 }}>{(v / 1000).toFixed(0)}k</Typography.Text></Space>;
      },
    },
    {
      title: t('intel.growthRate'), dataIndex: 'growthRate', width: 100,
      render: (v: number) => {
        const trend = v > 5 ? 'rising' : v < -5 ? 'declining' : 'stable';
        const cfg = trendConfig[trend as keyof typeof trendConfig];
        return <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 11 }}>{v > 0 ? '+' : ''}{v}%</Tag>;
      },
    },
  ];

  const newProductColumns = [
    {
      title: t('intel.productNameCol'), dataIndex: 'name',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('intel.competitor'), dataIndex: 'competitor', width: 160,
      render: (v: string) => <Tag icon={<ShopOutlined />} style={{ fontSize: 11 }}>{v}</Tag>,
    },
    { title: t('intel.firstSeen'), dataIndex: 'firstSeen', width: 120, render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text> },
    { title: t('intel.initialPrice'), dataIndex: 'initialPrice', width: 100, render: (v: number) => `$${v.toFixed(2)}` },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #7c3aed' }}
      title={
        <Space>
          <RadarChartOutlined style={{ color: '#7c3aed' }} />
          {t('intel.snapshotTitle')}
          <Badge status="processing" />
          <Tag color="purple" style={{ fontSize: 11 }}>{t('intel.lastCollect')}: {lastCollect}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={collecting} onClick={handleCollect}>
            {t('intel.collectNow')}
          </Button>
          <Button size="small" type="primary" icon={<SendOutlined />} loading={pushing} onClick={handlePush}>
            {t('intel.pushDownstream')}
          </Button>
        </Space>
      }
    >
      <Tabs
        size="small"
        defaultActiveKey="price"
        items={[
          {
            key: 'price',
            label: t('intel.priceMonitorTab', { count: mockCompetitorPrices.length }),
            children: <Table dataSource={mockCompetitorPrices} columns={priceColumns} rowKey="id" pagination={false} size="small" />,
          },
          {
            key: 'research',
            label: t('intel.productResearchTab', { count: mockProductResearch.length }),
            children: (
              <Row gutter={[12, 12]}>
                {mockProductResearch.map(r => (
                  <Col xs={24} sm={12} key={r.id}>
                    <Card size="small" style={{ borderLeft: `3px solid ${r.opportunityScore >= 75 ? '#16a34a' : r.opportunityScore >= 50 ? '#f59e0b' : '#dc2626'}` }}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text strong style={{ fontSize: 13 }}>{r.category}</Typography.Text>
                          <Tag color={r.opportunityScore >= 75 ? 'green' : r.opportunityScore >= 50 ? 'gold' : 'red'} style={{ fontSize: 11 }}>{r.opportunityScore}</Tag>
                        </Space>
                        <Space size="large">
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('intel.marketCapacity')}: {r.marketCapacity}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('intel.competitorCount')}: {r.competitorCount}</Typography.Text>
                        </Space>
                        <Space size="large">
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('intel.avgPrice')}: ${r.avgPrice.toFixed(2)}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('intel.priceRange')}: {r.priceRange}</Typography.Text>
                        </Space>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('intel.monthlySales')}: {r.monthlySales.toLocaleString()}</Typography.Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
          {
            key: 'trends',
            label: t('intel.trendTab', { count: mockTrendingKeywords.length }),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={14}>
                  <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('intel.trendingKeywords')}</Typography.Title>
                  <Table dataSource={mockTrendingKeywords} columns={keywordColumns} rowKey="keyword" pagination={false} size="small" />
                </Col>
                <Col xs={24} md={10}>
                  <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('intel.newProducts', { count: mockNewProducts.length })}</Typography.Title>
                  <Table dataSource={mockNewProducts} columns={newProductColumns} rowKey="id" pagination={false} size="small" scroll={{ y: 240 }} />
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Card>
  );
}
