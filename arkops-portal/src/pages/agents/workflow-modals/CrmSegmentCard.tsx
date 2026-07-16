import { GiftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockCoupons, mockSegments } from '../agentConfigMockData';

export function CrmSegmentCard() {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [sendingCoupons, setSendingCoupons] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('2h ago');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh('just now');
      message.success(t('crm.refreshDone'));
    }, 2000);
  };

  const handleBatchCoupon = () => {
    setSendingCoupons(true);
    setTimeout(() => {
      setSendingCoupons(false);
      message.success(t('crm.couponDone'));
    }, 1500);
  };

  const [segmentData, setSegmentData] = useState(() =>
    Object.values(mockSegments).map((val, idx) => ({
      key: idx,
      ...val,
      issued: false,
    })),
  );

  const handleSendCoupon = (key: number) => {
    setSegmentData(prev => prev.map(s => (s.key === key ? { ...s, issued: true } : s)));
    message.success(t('crm.couponDone'));
  };

  const [couponData, setCouponData] = useState(() =>
    mockCoupons.map(c => ({
      ...c,
      issued: Math.floor(c.estimatedCost / 10),
      total: 500,
      couponStatus: 'active' as 'active' | 'disabled',
    })),
  );

  const handleDisableCoupon = (id: number) => {
    setCouponData(prev => prev.map(c => (c.id === id ? { ...c, couponStatus: 'disabled' as const } : c)));
    message.success(t('crm.couponDisabled'));
  };

  const segmentColumns = [
    {
      title: t('crm.segmentName'),
      dataIndex: 'label',
      render: (v: string, record: typeof segmentData[0]) => (
        <Tag color={record.color} style={{ fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: t('crm.customerCount'),
      dataIndex: 'count',
      width: 100,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>{v.toLocaleString()}</Typography.Text>,
    },
    {
      title: t('crm.avgOrderValue'),
      dataIndex: 'avgOrderValue',
      width: 120,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof segmentData[0]) =>
        r.issued ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('crm.issued')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleSendCoupon(r.key)}>
            {t('crm.sendCoupon')}
          </Button>
        ),
    },
  ];

  const couponColumns = [
    {
      title: t('crm.couponName'),
      dataIndex: 'name',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('crm.discount'),
      dataIndex: 'value',
      width: 130,
      render: (v: string) => <Tag color="purple" style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: t('crm.issuedTotal'),
      width: 120,
      render: (_: unknown, r: typeof couponData[0]) => (
        <Typography.Text style={{ fontSize: 13 }}>{r.issued}/{r.total}</Typography.Text>
      ),
    },
    {
      title: t('crm.statusCol'),
      dataIndex: 'couponStatus',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : 'default'} style={{ fontSize: 11 }}>
          {v === 'active' ? t('crm.statusActive') : t('crm.statusInactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof couponData[0]) => (
        <Button
          size="small"
          type="link"
          danger
          disabled={r.couponStatus === 'disabled'}
          style={{ fontSize: 12, padding: 0 }}
          onClick={() => handleDisableCoupon(r.id)}
        >
          {t('crm.disable')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #7c3aed' }}
      title={
        <Space>
          <GiftOutlined style={{ color: '#7c3aed' }} />
          {t('crm.segmentCardTitle')}
          <Badge status="processing" />
          <Tag color="purple" style={{ fontSize: 11 }}>{t('crm.lastRefresh')}: {lastRefresh}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
            {t('crm.refreshNow')}
          </Button>
          <Button size="small" type="primary" icon={<GiftOutlined />} loading={sendingCoupons} onClick={handleBatchCoupon}>
            {t('crm.batchCoupon')}
          </Button>
        </Space>
      }
    >
      <Tabs
        size="small"
        defaultActiveKey="segments"
        items={[
          {
            key: 'segments',
            label: t('crm.segmentTab'),
            children: <Table dataSource={segmentData} columns={segmentColumns} rowKey="key" pagination={false} size="small" />,
          },
          {
            key: 'coupons',
            label: t('crm.couponTab'),
            children: <Table dataSource={couponData} columns={couponColumns} rowKey="id" pagination={false} size="small" />,
          },
        ]}
      />
    </Card>
  );
}
