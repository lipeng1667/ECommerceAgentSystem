import { AlertOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, Col, Collapse, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { agentsApi, type AgentListItem } from '../api/agents';
import { dashboardApi } from '../api/dashboard';
import { useI18n } from '../app/i18n';

const mockChains = [
  { name: '店铺授权 → 数据同步', status: 'healthy' },
  { name: '竞品调研 → 定价建议', status: 'warning' },
  { name: '商品上架 → 内容优化', status: 'healthy' },
  { name: '评价监控 → 回复建议', status: 'healthy' },
  { name: '库存监控 → 补货提醒', status: 'critical' },
  { name: '客户分析 → 复购建议', status: 'warning' },
];

export function AutomationOverview() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: agents = [] } = useQuery<AgentListItem[]>({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  });
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getSummary });

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
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <RobotOutlined style={{ color: '#16a34a' }} />
          <Typography.Text strong>{t('auto.title')}</Typography.Text>
        </Space>
      }
      extra={
        <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={() => navigate('/agents')}>
          配置自动化方案
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
            value={dashboard?.pendingApprovals ?? 0}
            valueStyle={{ color: (dashboard?.pendingApprovals ?? 0) > 0 ? '#f59e0b' : '#16a34a', fontSize: 24 }}
            prefix={(dashboard?.pendingApprovals ?? 0) > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('auto.pendingApprovalsDesc')}</Typography.Text>
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>累计 Agent 任务</span>}
            value={dashboard?.taskStatusBreakdown.reduce((sum, item) => sum + item.count, 0) ?? 0}
            valueStyle={{ color: '#2563eb', fontSize: 24 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>当前体验空间全部任务</Typography.Text>
        </Col>
      </Row>
      <Collapse
        ghost
        style={{ marginTop: 8, borderTop: '1px solid var(--ark-border-soft)' }}
        items={[{
          key: 'chains',
          label: <Space><Typography.Text strong style={{ fontSize: 12 }}>自动化链路</Typography.Text><Tag color="warning">{brokenChains} 项需关注</Tag></Space>,
          children: (
            <Row gutter={[8, 8]}>
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
          ),
        }]}
      />
    </Card>
  );
}
