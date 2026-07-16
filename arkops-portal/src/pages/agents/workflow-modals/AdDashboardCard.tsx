import { CheckCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockCampaigns } from '../agentConfigMockData';

export function AdDashboardCard() {
  const { t } = useI18n();
  const [patrolling, setPatrolling] = useState(false);
  const [applying, setApplying] = useState(false);
  const [lastPatrol, setLastPatrol] = useState('2h ago');
  const [campaigns, setCampaigns] = useState(
    mockCampaigns.map(c => ({ ...c, status: c.status as 'active' | 'adjusted' })),
  );

  const handleAdjustBudget = (id: string) => {
    setCampaigns(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'adjusted' as const, roi: Number((Math.random() * 3 + 1).toFixed(2)) }
          : c,
      ),
    );
    message.success(t('ads.adjusted'));
  };

  const handlePatrol = () => {
    setPatrolling(true);
    setTimeout(() => {
      setPatrolling(false);
      setLastPatrol('just now');
      message.success(t('ads.patrolDone'));
    }, 2000);
  };

  const handleApplySuggestion = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      message.success(t('ads.suggestionApplied'));
    }, 1500);
  };

  const columns = [
    {
      title: t('ads.campaignName'),
      dataIndex: 'name',
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('ads.statusCol'),
      dataIndex: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : v === 'adjusted' ? 'blue' : 'default'} style={{ fontSize: 11 }}>
          {v === 'active' ? t('ads.active') : v === 'adjusted' ? t('ads.budgetAdjusted') : t('ads.paused')}
        </Tag>
      ),
    },
    {
      title: t('ads.spend'),
      dataIndex: 'spend',
      width: 100,
      render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('ads.roi'),
      dataIndex: 'roi',
      width: 80,
      render: (v: number) => {
        const color = v >= 1.5 ? '#16a34a' : v >= 1.0 ? '#f59e0b' : '#dc2626';
        return <Typography.Text style={{ fontSize: 13, color, fontWeight: 600 }}>{v.toFixed(2)}×</Typography.Text>;
      },
    },
    {
      title: t('common.actions'),
      width: 110,
      render: (_: unknown, r: typeof campaigns[0]) => (
        <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleAdjustBudget(r.id)}>
          {t('ads.adjustBudget')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #2563eb' }}
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#2563eb' }} />
          {t('ads.dashboardTitle')}
          <Badge status="processing" />
          <Tag color="blue" style={{ fontSize: 11 }}>{t('ads.lastPatrol')}: {lastPatrol}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={patrolling} onClick={handlePatrol}>
            {t('ads.patrolNow')}
          </Button>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={applying} onClick={handleApplySuggestion}>
            {t('ads.applySuggestion')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={campaigns} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
