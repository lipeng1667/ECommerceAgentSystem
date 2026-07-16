/**
 * File: AgentConfigPage.tsx
 * Purpose: Route-level Agent detail page. Orchestrates Agent status, dependency checks,
 * strategy configuration, built-in task entry points, task creation, active runs, and logs.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 * Refactored: 2026-07-16 — extracted LoginBootstrapSessionCard, ProductLaunchDraftCard,
 *   RecognitionResultCard, AgentConditionalCards, and TaskCreateModal into separate modules.
 */

import {
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { agentsApi } from '../../api/agents';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { AgentBuiltinTasksSection } from './AgentBuiltinTasksSection';
import { AgentStrategyConfigSection } from './AgentStrategyConfigSection';
import { AgentConditionalCards } from './AgentConditionalCards';
import { LoginBootstrapSessionCard } from './LoginBootstrapSessionCard';
import { ProductLaunchDraftCard } from './ProductLaunchDraftCard';
import { RecognitionResultCard } from './RecognitionResultCard';
import type { AgentConfig, AgentType, AllMallId, Task, TaskStatus } from '../../types/domain';
import { recognitionVariants, type ProductRecognitionResult } from './agentConfigMockData';

/**
 * Renders the Agent detail page and coordinates Agent state, task creation, built-in workflows,
 * strategy configuration, active tasks, and historical logs.
 */
export function AgentConfigPage() {
  const { t } = useI18n();
  const { agentType } = useParams<{ agentType: AgentType }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<ProductRecognitionResult | null>(null);

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentType],
    queryFn: () => agentsApi.get(agentType!),
    enabled: Boolean(agentType),
  });

  const { data: allAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ['agent-stats', agentType],
    queryFn: () => agentsApi.getStats(agentType!),
    enabled: Boolean(agentType),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['agent-tasks', agentType],
    queryFn: () => agentsApi.getTasks(agentType!),
    enabled: Boolean(agentType),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: storesApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: () => agentsApi.toggle(agentType!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentType] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      message.success(t('common.operationSuccess'));
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const enableAllDepsMutation = useMutation({
    mutationFn: async () => {
      for (const depType of depsMissing) {
        await agentsApi.toggle(depType);
      }
    },
    onSuccess: () => {
      message.success(t('agent.depsEnabled'));
      queryClient.invalidateQueries({ queryKey: ['agent', agentType] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (values: { title?: string; goal?: string; storeId: AllMallId }) =>
      agentsApi.createTask(agentType!, {
        title: values.title || values.goal || '',
        goal: values.goal || '',
        storeId: values.storeId,
        images: fileList.map((f) => f.name),
      }),
    onSuccess: () => {
      message.success(t('agent.taskCreated'));
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', agentType] });
      setTaskModalOpen(false);
      taskForm.resetFields();
      setFileList([]);
      setRecognitionResult(null);
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: AllMallId) => agentsApi.cancelTask(taskId),
    onSuccess: () => {
      message.success(t('agent.taskCancelled'));
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', agentType] });
    },
  });

  const handleStartRecognize = () => {
    if (fileList.length === 0) {
      message.warning(t('agent.uploadHint'));
      return;
    }
    setRecognizing(true);
    const idx = Math.floor(Math.random() * recognitionVariants.length);
    setTimeout(() => {
      setRecognizing(false);
      setRecognitionResult(recognitionVariants[idx]);
      setTaskModalOpen(false);
    }, 1500);
  };

  const needsImages = agentType === 'product_launch';
  const isLoginBootstrap = agentType === 'login_bootstrap';
  const isProductLaunch = agentType === 'product_launch';
  const isCompetitorIntel = agentType === 'competitor_intel';
  const isCreativeFactory = agentType === 'creative_factory';
  const isAdsOptimizer = agentType === 'ads_optimizer';
  const isPricingStrategy = agentType === 'pricing_strategy';
  const isCrmRetention = agentType === 'crm_retention';
  const isReviewManager = agentType === 'review_manager';
  const isCustomerService = agentType === 'customer_service';
  const isAfterSales = agentType === 'after_sales';
  const isPromotionCampaign = agentType === 'promotion_campaign';
  const isInventoryAlert = agentType === 'inventory_alert';
  const isRiskControl = agentType === 'risk_control';
  const isFinanceAudit = agentType === 'finance_audit';
  const isLiveStreamOps = agentType === 'live_stream_ops';

  const exclusiveAgentTypes = [
    'login_bootstrap', 'product_launch', 'competitor_intel', 'creative_factory',
    'ads_optimizer', 'pricing_strategy', 'crm_retention', 'review_manager',
    'customer_service', 'after_sales', 'promotion_campaign', 'inventory_alert',
    'risk_control', 'finance_audit', 'live_stream_ops',
  ];
  const hasExclusiveCard = exclusiveAgentTypes.includes(agentType!);

  const activeStatuses: TaskStatus[] = ['draft', 'queued', 'running', 'waiting_approval'];
  const logStatuses: TaskStatus[] = ['succeeded', 'failed', 'cancelled'];
  const activeTasks = tasks.filter((t) => activeStatuses.includes(t.status));
  const logTasks = tasks.filter((t) => logStatuses.includes(t.status));

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;
  if (!agent) return <Typography.Text type="danger">{t('agent.notFound')}</Typography.Text>;

  const depsMissing = agent.dependsOn.filter((d) => !allAgents.find((a) => a.agentType === d)?.enabled);
  const switchDisabled = agent.required || depsMissing.length > 0;
  const riskControlOn = allAgents.find((a) => a.agentType === 'risk_control')?.enabled === true;
  const riskControlAgent = allAgents.find((a) => a.agentType === 'risk_control');
  const isGuarded =
    riskControlOn &&
    agent.agentType !== 'risk_control' &&
    (riskControlAgent?.servesFor.includes(agent.agentType) ?? false);

  function cronToHuman(cron: string): { freq: string; next: string } {
    const parts = cron.split(' ');
    if (parts.length < 5) return { freq: t('agent.cronCustom'), next: '-' };
    const [min, hour] = parts;
    let freq = '';
    if (hour === '*' && min.startsWith('*/')) {
      const interval = parseInt(min.replace('*/', ''));
      freq = interval === 1 ? t('agent.cronEveryMinute') : t('agent.cronEveryNMinutes', { n: interval });
    } else if (min === '0' && hour.startsWith('*/')) {
      const interval = parseInt(hour.replace('*/', ''));
      freq = interval === 1 ? t('agent.cronEveryHour') : t('agent.cronEveryNHours', { n: interval });
    } else if (min === '0' && hour !== '*') {
      const hours = hour.split(',').join(':00, ') + ':00';
      freq = t('agent.cronDaily', { time: hours });
    } else {
      freq = `${cron}`;
    }
    return { freq, next: '-' };
  }

  const cronDesc = agent.cronExpression ? cronToHuman(agent.cronExpression) : null;

  return (
    <div className="page-stack">
      <PageHeader
        title={
          <span>
            {agent.displayName}
            {isGuarded && (
              <Tag icon={<SafetyOutlined />} color="green" style={{ marginLeft: 8, fontSize: 11 }}>
                {t('agent.guarded')}
              </Tag>
            )}
          </span>
        }
        description={agent.description}
        actions={
          <Space>
            <span>{agent.enabled ? t('agent.enable') : t('agent.disable')}</span>
            <Popconfirm
              title={t('agent.toggleConfirmTitle', { action: agent.enabled ? t('agent.toggleDisable') : t('agent.toggleEnable') })}
              description={t('agent.toggleConfirmContent', { action: agent.enabled ? t('agent.toggleDisable') : t('agent.toggleEnable') })}
              onConfirm={() => toggleMutation.mutate()}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              disabled={switchDisabled}
            >
              <Switch checked={agent.enabled} disabled={switchDisabled} />
            </Popconfirm>
            {depsMissing.length > 0 && (
              <Typography.Text type="danger" style={{ fontSize: 11, display: 'block' }}>
                {t('agent.dependsOn')}: {depsMissing.map((d) => t(`agent.${d}`)).join(', ')}
                <Button
                  size="small" type="link" danger
                  loading={enableAllDepsMutation.isPending}
                  onClick={() => enableAllDepsMutation.mutate()}
                  style={{ padding: '0 4px', fontSize: 11, height: 'auto' }}
                >
                  ({t('agent.enableAll')})
                </Button>
              </Typography.Text>
            )}
          </Space>
        }
      />

      {/* 运行统计 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <MetricCard title={t('agent.totalRuns')} value={stats.totalRuns} prefix={<LineChartOutlined />} />
          </Col>
          <Col span={6}>
            <MetricCard title={t('agent.successRate')} value={`${stats.successRate}%`} valueStyle={{ color: stats.successRate >= 90 ? '#16a34a' : '#ea580c' }} />
          </Col>
          <Col span={6}>
            <MetricCard title={t('agent.succeededRuns')} value={Math.round(stats.totalRuns * stats.successRate / 100)} valueStyle={{ color: '#16a34a' }} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={6}>
            <MetricCard title={t('agent.failedRuns')} value={stats.totalRuns - Math.round(stats.totalRuns * stats.successRate / 100)} valueStyle={{ color: '#dc2626' }} prefix={<CloseCircleOutlined />} />
          </Col>
        </Row>
      )}

      {/* 运行说明 */}
      <Card title={<><InfoCircleOutlined /> {t('agent.operationGuide')}</>} style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label={t('agent.triggerMode')}>
            {agent.triggerMode === 'scheduled' && cronDesc ? (
              <><Tag color="purple">{cronDesc.freq}</Tag><Typography.Text type="secondary" style={{ fontSize: 11 }}>（{agent.cronExpression}）</Typography.Text></>
            ) : agent.triggerMode === 'event' ? (
              t('agent.eventDriven', { event: agent.eventTrigger ?? '' })
            ) : (
              t('agent.manualTrigger')
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('agent.riskLevel')}>
            <Tag color={agent.riskLevel === 'high' ? 'red' : agent.riskLevel === 'medium' ? 'orange' : 'green'}>
              {agent.riskLevel === 'high' ? t('agent.highRisk') : agent.riskLevel === 'medium' ? t('agent.mediumRisk') : t('agent.lowRisk')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('agent.depAgents')}>
            {agent.dependsOn.length > 0 ? agent.dependsOn.map((d) => t(`agent.${d}`)).join(' · ') : t('agent.noDeps')}
          </Descriptions.Item>
          <Descriptions.Item label={t('agent.servesFor')}>
            {agent.servesFor.length > 0 ? agent.servesFor.map((s) => t(`agent.${s}`)).join(' · ') : t('agent.none')}
          </Descriptions.Item>
          <Descriptions.Item label={t('agent.approvalReq')}>
            {agent.approvalStrategy?.requireApproval
              ? t('agent.needsApproval', { role: agent.approvalStrategy.approverRole, second: agent.approvalStrategy.requireSecondApproval ? t('agent.needsSecondApproval') : '' })
              : t('agent.noApprovalNeeded')}
          </Descriptions.Item>
          <Descriptions.Item label={t('agent.boundModel')}>
            {agent.modelBinding ? `${agent.modelBinding.provider} / ${agent.modelBinding.model}` : t('agent.notBound')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <AgentBuiltinTasksSection agentType={agent.agentType} />
      <AgentStrategyConfigSection agent={agent} />

      {/* login_bootstrap 专属：店铺会话状态 */}
      {isLoginBootstrap && <LoginBootstrapSessionCard stores={stores} />}

      {/* 各 Agent 专属操作卡片 */}
      <AgentConditionalCards agentType={agentType!} />

      {/* product_launch 专属：商品草稿 */}
      {isProductLaunch && (
        <ProductLaunchDraftCard
          activeTasks={activeTasks}
          onUploadClick={() => setTaskModalOpen(true)}
          onRegenerate={(taskId) => {
            cancelTaskMutation.mutate(taskId);
            setTaskModalOpen(true);
          }}
          onCancel={(taskId) => cancelTaskMutation.mutate(taskId)}
          onApprove={(taskId) => {
            cancelTaskMutation.mutate(taskId);
          }}
        />
      )}

      {/* 运行中任务 — 无专属卡片的 Agent 显示 */}
      {activeTasks.length > 0 && !hasExclusiveCard && (
        <Card
          title={<><UnorderedListOutlined /> {t('agent.activeTasks')} ({activeTasks.length})</>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskModalOpen(true)}>
              {t('agent.newTask')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <Table
            rowKey="id"
            dataSource={activeTasks}
            pagination={false}
            size="small"
            expandable={{
              expandedRowRender: (record: Task) => (
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, padding: 8 }}>
                  {record.goal}
                </Typography.Paragraph>
              ),
              rowExpandable: () => true,
            }}
            columns={[
              {
                title: t('entity.task'), dataIndex: 'title',
                render: (title: string) => (
                  <Typography.Text strong style={{ cursor: 'pointer', color: '#2563eb' }}>{title}</Typography.Text>
                ),
              },
              { title: t('stores.status'), dataIndex: 'status', width: 120, render: (status: TaskStatus) => <StatusBadge value={status} /> },
              { title: t('stores.createdAt'), dataIndex: 'createdAt', width: 140, render: (v: string) => new Date(v).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              {
                title: t('common.actions'), width: 80,
                render: (_: unknown, record: Task) => (
                  <Button
                    size="small" danger icon={<StopOutlined />}
                    loading={cancelTaskMutation.isPending}
                    onClick={() => cancelTaskMutation.mutate(record.id)}
                  >
                    {t('common.cancel')}
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* AI 识别结果编辑卡片 */}
      {isProductLaunch && recognitionResult && (
        <RecognitionResultCard
          result={recognitionResult}
          fileCount={fileList.length}
          loading={createTaskMutation.isPending}
          onResultChange={setRecognitionResult}
          onRegenerate={() => setTaskModalOpen(true)}
          onConfirm={() => {
            createTaskMutation.mutate({
              title: recognitionResult.seoTitle,
              goal: t('agent.taskTitle', { name: recognitionResult.productName, store: stores.find((s) => s.id === taskForm.getFieldValue('storeId'))?.name || stores[0]?.name || '' }),
              storeId: taskForm.getFieldValue('storeId') || stores[0]?.id,
            });
          }}
        />
      )}

      {/* 无运行中任务时的空白提示 */}
      {activeTasks.length === 0 && !recognitionResult && !isLoginBootstrap && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Typography.Paragraph type="secondary">{t('agent.noActiveTasks')}</Typography.Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskModalOpen(true)}>
              {isProductLaunch ? t('agent.uploadProduct') : t('agent.newTask')}
            </Button>
          </div>
        </Card>
      )}

      {/* 任务日志 */}
      {(hasExclusiveCard ? tasks.length > 0 : logTasks.length > 0) && (
        <Card
          title={
            <Space>
              <CheckCircleOutlined />
              {t('agent.taskLogs')} ({hasExclusiveCard ? tasks.length : logTasks.length})
            </Space>
          }
        >
          <Table
            rowKey="id"
            dataSource={hasExclusiveCard ? tasks : logTasks}
            pagination={{ pageSize: 10, size: 'small' }}
            size="small"
            columns={[
              { title: t('entity.task'), dataIndex: 'title', render: (title: string) => <Typography.Text strong>{title}</Typography.Text> },
              { title: t('agent.taskGoal'), dataIndex: 'goal', render: (goal: string) => <Typography.Text type="secondary" style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal}</Typography.Text> },
              { title: t('stores.status'), dataIndex: 'status', width: 120, render: (status: TaskStatus) => <StatusBadge value={status} /> },
              { title: t('stores.createdAt'), dataIndex: 'createdAt', width: 140, render: (v: string) => new Date(v).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              {
                title: t('agent.taskTimeline'), dataIndex: 'timeline',
                render: (timeline: Task['timeline']) =>
                  timeline.length > 0 ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {timeline[timeline.length - 1].title} · {new Date(timeline[timeline.length - 1].at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography.Text>
                  ) : '-',
              },
              {
                title: t('common.actions'), width: 100,
                render: (_: unknown, record: Task) => {
                  const needsAuth = record.timeline.some((e) => e.type === 'login_required');
                  if (!needsAuth) return null;
                  return (
                    <Button size="small" type="primary" icon={<KeyOutlined />} onClick={() => navigate(`/stores/${record.storeId}`)}>
                      {t('agent.manualAuth')}
                    </Button>
                  );
                },
              },
            ]}
          />
        </Card>
      )}

      {/* 新建任务弹窗 */}
      <Modal
        title={isProductLaunch ? t('agent.imageRecognition') : t('agent.newTask')}
        open={taskModalOpen}
        onOk={isProductLaunch ? undefined : () => taskForm.submit()}
        onCancel={() => {
          setTaskModalOpen(false);
          taskForm.resetFields();
          setFileList([]);
          setRecognitionResult(null);
        }}
        confirmLoading={createTaskMutation.isPending}
        width={isProductLaunch ? 760 : 520}
        footer={isProductLaunch ? null : undefined}
      >
        {isProductLaunch ? (
          <div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              {t('agent.imageRecognitionDesc')}
            </Typography.Paragraph>
            <Form layout="vertical">
              <Form.Item label={t('entity.storeName')}>
                <Select
                  style={{ width: '100%' }}
                  value={taskForm.getFieldValue('storeId') || stores[0]?.id}
                  onChange={(v) => taskForm.setFieldsValue({ storeId: v })}
                  options={stores.map((s) => ({ value: s.id, label: s.name }))}
                />
              </Form.Item>
              <Form.Item label={t('agent.uploadImages')}>
                <Upload
                  multiple listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  beforeUpload={() => false}
                  maxCount={10}
                >
                  {fileList.length < 10 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>{t('agent.upload')}</div></div>}
                </Upload>
                <Typography.Text type="secondary">{t('agent.uploadHint')}</Typography.Text>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={() => { setTaskModalOpen(false); setFileList([]); }}>
                {t('common.cancel')}
              </Button>
              <Button
                type="primary" icon={<CameraOutlined />} loading={recognizing}
                onClick={handleStartRecognize}
                style={{ marginLeft: 8 }}
                disabled={fileList.length === 0}
              >
                {recognizing ? t('agent.recognizing') : t('agent.startRecognize')}
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={taskForm} layout="vertical"
            onFinish={(values) => createTaskMutation.mutate(values)}
            initialValues={{ storeId: stores[0]?.id }}
          >
            <Form.Item label={t('entity.task')} name="title" rules={[{ required: true }]}>
              <Input placeholder={t('agent.taskTitlePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('agent.taskGoal')} name="goal" rules={[{ required: true }]}>
              <Input.TextArea rows={2} placeholder={t('agent.taskGoalPlaceholder')} />
            </Form.Item>
            <Form.Item label={t('entity.storeName')} name="storeId" rules={[{ required: true }]}>
              <Select options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
            {needsImages && (
              <Form.Item label={t('agent.uploadImages')}>
                <Upload
                  multiple listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  beforeUpload={() => false}
                  maxCount={10}
                >
                  {fileList.length < 10 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>{t('agent.upload')}</div></div>}
                </Upload>
                <Typography.Text type="secondary">{t('agent.uploadHint')}</Typography.Text>
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
}
