import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Card, Progress, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import type { AgentListItem } from '../../api/agents';
import { financeApi } from '../../api/finance';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { AgentConfig, AgentLayer, AgentType } from '../../types/domain';
import type { AgentRunStats } from '../../types/domain';

function getRecentRunText(stats?: AgentRunStats): string {
  if (!stats) return '-';
  // 趋势数组最后一个点离现在最近（假设每天一个点）
  const trend = stats.trend;
  if (!trend || trend.length === 0) return '-';
  const last = trend[trend.length - 1];
  const hoursAgo = (7 - trend.indexOf(last)) * 24; // 粗略估算
  if (hoursAgo <= 1) return '1 小时内';
  if (hoursAgo <= 24) return `${Math.round(hoursAgo)} 小时前`;
  return `${Math.round(hoursAgo / 24)} 天前`;
}

const layerOrder: AgentLayer[] = ['foundation', 'traffic', 'growth', 'support', 'standalone'];
const layerColors: Record<AgentLayer, string> = {
  foundation: '#dc2626',
  traffic: '#2563eb',
  growth: '#16a34a',
  support: '#7c3aed',
  standalone: '#ea580c'
};

/* ===== Agent 流程节点（见组件内 useI18n 调用） ===== */

export function AgentListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });

  const { data: trialStatus } = useQuery({
    queryKey: ['trialStatus'],
    queryFn: financeApi.getTrialStatus,
  });

  const isPremiumLocked = (agentType: string) => {
    return trialStatus?.premiumAgents.includes(agentType) ?? false;
  };

  const flowNodes = [
    { id: 'login_bootstrap', label: t('agent.login_bootstrap'), layer: 'foundation' as const, w: 80 },
    { id: 'competitor_intel', label: t('agent.competitor_intel'), layer: 'support' as const, w: 80 },
    { id: 'product_launch', label: t('agent.product_launch'), layer: 'foundation' as const, w: 80 },
    { id: 'creative_factory', label: t('agent.creative_factory'), layer: 'support' as const, w: 80 },
    { id: 'ads_optimizer', label: t('agent.ads_optimizer'), layer: 'traffic' as const, w: 90 },
    { id: 'pricing_strategy', label: t('agent.pricing_strategy'), layer: 'traffic' as const, w: 90 },
    { id: 'live_stream_ops', label: t('agent.live_stream_ops'), layer: 'traffic' as const, w: 90 },
  ];

  const growthSubLabels = [
    t('agent.crm_retention'),
    t('agent.review_manager'),
    t('agent.customer_service'),
    t('agent.after_sales'),
    t('agent.promotion_campaign')
  ];

  const toggleMutation = useMutation({
    mutationFn: (agentType: AgentType) => agentsApi.toggle(agentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      message.success(t('agent.toggleSuccess'));
    },
    onError: (error: Error) => {
      message.error(error.message);
    }
  });

  const getMissingDeps = (agent: AgentListItem) =>
    agent.dependsOn
      .filter((dep) => !agents.find((a) => a.agentType === dep)?.enabled)
      .map((dep) => t(`agent.${dep}`));

  const riskControl = agents.find((a) => a.agentType === 'risk_control');
  const riskControlOn = riskControl?.enabled === true;
  const isGuarded = (agent: AgentListItem) =>
    riskControlOn && agent.agentType !== 'risk_control' && agent.agentType !== 'finance_audit';

  const columns: ColumnsType<AgentListItem> = [
    {
      title: t('agent.name'),
      dataIndex: 'displayName',
      render: (name: string, record: AgentListItem) => {
        return (
          <div>
            <Typography.Text
              strong
              style={{ cursor: 'pointer', color: '#2563eb' }}
              onClick={() => navigate(`/agents/${record.agentType}`)}
            >
              {name}
            </Typography.Text>
            {record.required && <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>{t('agent.required')}</Tag>}
            {record.agentType === 'risk_control' && <Tag icon={<SafetyOutlined />} color="orange" style={{ marginLeft: 4, fontSize: 10 }}>{t('agent.systemGuard')}</Tag>}
            {isGuarded(record) && <Tag icon={<SafetyOutlined />} color="green" style={{ marginLeft: 4, fontSize: 10 }}>{t('agent.guarded')}</Tag>}
            {isPremiumLocked(record.agentType) && <Tag icon={<LockOutlined />} color="gold" style={{ marginLeft: 4, fontSize: 10 }}>{t('agent.premium')}</Tag>}
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '2px 0 0', maxWidth: 360 }} ellipsis={{ rows: 1 }}>
              {record.description}
            </Typography.Paragraph>
          </div>
        );
      }
    },
    {
      title: t('agent.enable'),
      width: 110,
      render: (_: unknown, record: AgentListItem) => {
        const missingDeps = getMissingDeps(record);
        const disabled = record.required || missingDeps.length > 0;
        const locked = isPremiumLocked(record.agentType);
        return (
          <Typography.Text>
            <Switch
              size="small"
              checked={locked ? false : record.enabled}
              disabled={disabled || locked}
              onChange={() => toggleMutation.mutate(record.agentType)}
            />
            {locked && (
              <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2, color: '#b45309' }}>
                <LockOutlined /> {t('agent.unlockToUpgrade')}
              </Typography.Text>
            )}
            {missingDeps.length > 0 && (
              <Typography.Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                {t('agent.dependsOn')}: {missingDeps.join(', ')}
              </Typography.Text>
            )}
          </Typography.Text>
        );
      }
    },
    {
      title: t('tasks.risk'),
      dataIndex: 'riskLevel',
      width: 90,
      render: (risk: string) => <StatusBadge value={risk as AgentConfig['riskLevel']} />
    },
    {
      title: '活跃任务',
      width: 90,
      align: 'center',
      render: (_: unknown, record: AgentListItem) => {
        const count = record.activeTaskCount ?? 0;
        if (!record.enabled) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>;
        if (count === 0) {
          return <Typography.Text type="secondary" style={{ fontSize: 12 }}>0</Typography.Text>;
        }
        return (
          <Tag
            color={count >= 3 ? 'blue' : 'green'}
            style={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate(`/agents/${record.agentType}`)}
          >
            {count}
          </Tag>
        );
      }
    },
    {
      title: '成功率',
      width: 110,
      render: (_: unknown, record: AgentListItem) => {
        const rate = record.runStats?.successRate ?? 0;
        if (!record.enabled) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Progress
              percent={rate}
              size="small"
              showInfo={false}
              style={{ width: 60, margin: 0 }}
              strokeColor={rate >= 90 ? '#16a34a' : rate >= 70 ? '#ea580c' : '#dc2626'}
            />
            <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: rate >= 90 ? '#16a34a' : rate >= 70 ? '#ea580c' : '#dc2626' }}>
              {rate}%
            </Typography.Text>
          </div>
        );
      }
    },
    {
      title: '最近执行',
      width: 100,
      render: (_: unknown, record: AgentListItem) => {
        if (!record.enabled) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>;
        return (
          <Typography.Text style={{ fontSize: 11 }} type="secondary">
            <ClockCircleOutlined style={{ marginRight: 4, fontSize: 10 }} />
            {getRecentRunText(record.runStats)}
          </Typography.Text>
        );
      }
    },
    {
      title: t('agent.strategyConfig'),
      width: 100,
      render: (_: unknown, record: AgentListItem) =>
        record.needsConfig
          ? <Tag icon={<SettingOutlined />} color="blue" style={{ fontSize: 10 }}>{t('common.yes')}</Tag>
          : <Tag icon={<SettingOutlined />} style={{ fontSize: 10 }}>{t('common.no')}</Tag>
    },
    {
      title: t('agent.needApproval'),
      width: 100,
      render: (_: unknown, record: AgentListItem) =>
        record.needsApproval
          ? <Tag icon={<CheckCircleOutlined />} color="orange" style={{ fontSize: 10 }}>{t('common.yes')}</Tag>
          : <Tag icon={<CloseCircleOutlined />} style={{ fontSize: 10 }}>{t('common.no')}</Tag>
    },
    {
      title: t('agent.triggerDesc'),
      width: 100,
      render: (_: unknown, record: AgentListItem) => (
        <Tag style={{ fontSize: 11 }}>
          {record.triggerMode === 'scheduled' ? t('agent.autoRun') : record.triggerMode === 'event' ? t('agent.eventRun') : t('agent.manualRun')}
        </Tag>
      )
    }
  ];

  const enabled = agents.filter((a) => a.enabled);
  const disabled = agents.filter((a) => !a.enabled);

  return (
    <div className="page-stack">
      <PageHeader
        title={t('agent.title')}
        description={t('agent.description')}
      />

      {/* 已开通 */}
      {enabled.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>
            <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 8 }} />
            {t('agent.enabledAgents')} · {enabled.length}
          </Typography.Title>
          <Card>
            <Table rowKey="agentType" columns={columns} dataSource={enabled} pagination={false} size="small" />
          </Card>
        </div>
      )}

      {/* 按层级分组 - 可开通 */}
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        <PlusOutlined style={{ color: '#2563eb', marginRight: 8 }} />
        {t('agent.availableAgents')}
      </Typography.Title>

      {layerOrder.map((layer) => {
        const layerAgents = disabled.filter((a) => a.layer === layer);
        if (layerAgents.length === 0) return null;
        return (
          <div key={layer} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: layerColors[layer], flexShrink: 0 }} />
              <Typography.Text strong style={{ fontSize: 13, color: 'var(--ark-muted)' }}>
                {t(`agent.layer_${layer}`)}
              </Typography.Text>
              <Tag style={{ fontSize: 10 }}>{layerAgents.length}</Tag>
            </div>
            <Card>
              <Table rowKey="agentType" columns={columns} dataSource={layerAgents} pagination={false} size="small" />
            </Card>
          </div>
        );
      })}

      {/* Agent 运行逻辑图 */}
      <Card
        title={
          <Typography.Text strong style={{ fontSize: 14 }}>
            {t('agent.flowTitle')}
          </Typography.Text>
        }
        style={{ marginTop: 8 }}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          {t('agent.flowDesc')}
        </Typography.Paragraph>

        {/* 汇总条 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          padding: '8px 14px', background: 'var(--ark-panel-soft)', borderRadius: 8, fontSize: 12,
        }}>
          <CheckCircleOutlined style={{ color: '#16a34a' }} />
          <Typography.Text style={{ fontSize: 12 }}>
            已启用 <b>{enabled.length}</b> / {agents.length} 个 Agent
          </Typography.Text>
          <div style={{ flex: 1 }} />
          <Space size={12}>
            <Space size={4}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>已启用</Typography.Text>
            </Space>
            <Space size={4}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#d4d4d8', border: '1.5px dashed #94a3b8' }} />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>未启用</Typography.Text>
            </Space>
          </Space>
        </div>

        <div className="agent-flow-diagram">
          {/* 第一行: 店铺保活 → 市场情报 → 商品上架 → 素材工厂 */}
          <div className="agent-flow-row">
            {flowNodes.slice(0, 4).map((node, i) => {
              const isEnabled = agents.find(a => a.agentType === node.id)?.enabled;
              return (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div className={`agent-flow-node agent-flow-node--${node.layer}${isEnabled ? '' : ' agent-flow-node--disabled'}`} style={{ width: node.w }}>
                    <span>{node.label}</span>
                    <span style={{ fontSize: 9, marginLeft: 4, opacity: isEnabled ? 1 : 0.4 }}>
                      {isEnabled ? '●' : '○'}
                    </span>
                  </div>
                  {i < 3 && <div className={`agent-flow-arrow${isEnabled && agents.find(a => a.agentType === flowNodes[i + 1].id)?.enabled ? '' : ' agent-flow-arrow--dim'}`}>→</div>}
                </div>
              );
            })}
          </div>

          {/* 分叉线 */}
          <div className="agent-flow-row" style={{ justifyContent: 'center', gap: 120 }}>
            <div style={{ width: 80 }} />
            <div className="agent-flow-split">
              <div className="agent-flow-split-vbar" style={{ background: layerColors.foundation }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {flowNodes.slice(4, 7).map((node, i) => {
                  const isEnabled = agents.find(a => a.agentType === node.id)?.enabled;
                  return (
                    <React.Fragment key={node.id}>
                      {i > 0 && <div style={{ width: 2, height: 6, background: 'var(--ark-border)' }} />}
                      {i === 0 && <div style={{ width: 2, height: 12, background: 'var(--ark-border)' }} />}
                      <div className={`agent-flow-node agent-flow-node--traffic${isEnabled ? '' : ' agent-flow-node--disabled'}`} style={{ width: 90 }}>
                        <span>{node.label}</span>
                        <span style={{ fontSize: 9, marginLeft: 4, opacity: isEnabled ? 1 : 0.4 }}>
                          {isEnabled ? '●' : '○'}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 侧边栏: 增值运营 + 库存预警 竖向标注 */}
          <div className="agent-flow-side">
            <div style={{ textAlign: 'center' }}>
              <div className={`agent-flow-node agent-flow-node--growth${agents.filter(a => a.layer === 'growth').some(a => a.enabled) ? '' : ' agent-flow-node--disabled'}`} style={{ width: 130 }}>
                <span>{t('agent.flowGrowth')}</span>
                <span style={{ fontSize: 9, marginLeft: 4, opacity: agents.filter(a => a.layer === 'growth').some(a => a.enabled) ? 1 : 0.4 }}>
                  {agents.filter(a => a.layer === 'growth').some(a => a.enabled) ? '●' : '○'}
                </span>
              </div>
              <div className="agent-flow-sublist">
                {growthSubLabels.map((s) => (
                  <Tag key={s} color="green" style={{ fontSize: 10, margin: '1px 2px' }}>{s}</Tag>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div className={`agent-flow-node agent-flow-node--support${agents.find(a => a.agentType === 'inventory_alert')?.enabled ? '' : ' agent-flow-node--disabled'}`} style={{ width: 90 }}>
                <span>{t('agent.inventory_alert')}</span>
                <span style={{ fontSize: 9, marginLeft: 4, opacity: agents.find(a => a.agentType === 'inventory_alert')?.enabled ? 1 : 0.4 }}>
                  {agents.find(a => a.agentType === 'inventory_alert')?.enabled ? '●' : '○'}
                </span>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
                {t('agent.flowFeedback')}
              </Typography.Text>
            </div>
          </div>

          {/* 底部: 风险控制 外框包裹 */}
          <div className="agent-flow-guard">
            <Tag icon={<SafetyOutlined />} color={riskControlOn ? 'green' : 'orange'} style={{ fontSize: 10 }}>
              {t('agent.flowRiskControl')} {riskControlOn ? '● 守护中' : '○ 未启用'}
            </Tag>
          </div>

          {/* 最底: 财务对账 */}
          <div className="agent-flow-row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <div className={`agent-flow-node agent-flow-node--standalone${agents.find(a => a.agentType === 'finance_audit')?.enabled ? '' : ' agent-flow-node--disabled'}`} style={{ width: 100 }}>
              <span>{t('agent.finance_audit')}</span>
              <span style={{ fontSize: 9, marginLeft: 4, opacity: agents.find(a => a.agentType === 'finance_audit')?.enabled ? 1 : 0.4 }}>
                {agents.find(a => a.agentType === 'finance_audit')?.enabled ? '●' : '○'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
