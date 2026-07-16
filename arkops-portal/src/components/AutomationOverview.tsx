import { AlertOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { agentsApi, type AgentListItem } from '../api/agents';
import { useI18n } from '../app/i18n';

const mockPendingApprovals = 5;
const mockAutoTasksToday = 47;

const mockChains = [
  { name: 'Login → Store Active', status: 'healthy' },
  { name: 'Intel → Pricing → Ads', status: 'warning' },
  { name: 'Listing → Creative → Ads', status: 'healthy' },
  { name: 'Reviews → Auto Reply', status: 'healthy' },
  { name: 'Inventory → Replenish', status: 'critical' },
  { name: 'CRM → Retention', status: 'warning' },
];

export function AutomationOverview() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: agents = [] } = useQuery<AgentListItem[]>({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  });

  const enabledCount = agents.filter(a => a.enabled).length;
  const totalCount = agents.length;
  const coveragePct = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

  const avgSuccessRate = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + (a.runStats?.successRate ?? 0), 0) / agents.length * 10) / 10
    : 0;

  const brokenChains = mockChains.filter(c => c.status !== 'healthy').length;

  const chainStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    healthy: { color: '#16a34a', icon: <CheckCircleOutlined /> },
    warning: { color: '#f59e0b', icon: <ExclamationCircleOutlined /> },
    critical: { color: '#dc2626', icon: <AlertOutlined /> },
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)', border: '1px solid #86efac' }}
      title={
        <Space>
          <RobotOutlined style={{ color: '#16a34a' }} />
          <Typography.Text strong>{t('auto.title')}</Typography.Text>
        </Space>
      }
      extra={
        <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={() => navigate('/agents')}>
          {t('auto.oneClickEnable')}
        </Button>
      }
    >
      <Row gutter={[24, 16]}>
        <Col xs={12} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Progress type="circle" percent={coveragePct} size={80} strokeColor={{ '0%': '#3b82f6', '100%': '#16a34a' }} />
            <Typography.Text style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#64748b' }}>
              {t('auto.coverage')}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t('auto.coverageDesc', { enabled: enabledCount, total: totalCount })}
            </Typography.Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('auto.healthScore')}</span>}
            value={avgSuccessRate}
            suffix="%"
            valueStyle={{ color: avgSuccessRate >= 90 ? '#16a34a' : avgSuccessRate >= 80 ? '#f59e0b' : '#dc2626', fontSize: 24 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('auto.healthScoreDesc')}</Typography.Text>
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('auto.pendingApprovals')}</span>}
            value={mockPendingApprovals}
            valueStyle={{ color: mockPendingApprovals > 0 ? '#f59e0b' : '#16a34a', fontSize: 24 }}
            prefix={mockPendingApprovals > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('auto.pendingApprovalsDesc')}</Typography.Text>
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('auto.autoTasksToday')}</span>}
            value={mockAutoTasksToday}
            valueStyle={{ color: '#2563eb', fontSize: 24 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('auto.autoTasksTodayDesc')}</Typography.Text>
        </Col>
      </Row>
      <Row gutter={[8, 4]} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
        <Col span={24}>
          <Typography.Text strong style={{ fontSize: 12 }}>{t('auto.pipelineStatus')}: </Typography.Text>
          {brokenChains === 0 ? (
            <Tag color="success" style={{ fontSize: 11 }}>{t('auto.chainHealthy', { count: mockChains.length })}</Tag>
          ) : (
            <Tag color="warning" style={{ fontSize: 11 }}>{t('auto.chainBroken', { count: brokenChains })}</Tag>
          )}
        </Col>
        {mockChains.map((chain, i) => {
          const cfg = chainStatusConfig[chain.status];
          return (
            <Col key={i} xs={24} sm={12} md={8}>
              <Space size={4}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <Typography.Text style={{ fontSize: 11 }}>{chain.name}</Typography.Text>
              </Space>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
