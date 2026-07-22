import { CheckCircleOutlined, DeleteOutlined, KeyOutlined, LineChartOutlined, PlusOutlined, RobotOutlined, ThunderboltOutlined, WalletOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { modelsApi } from '../../api/models';
import { useI18n } from '../../app/i18n';
import { TrendBarChart } from '../../components/charts/TrendBarChart';
import { MetricCard } from '../../components/metrics/MetricCard';
import { PageHeader } from '../../components/PageHeader';
import type { AgentModelBinding, ModelInfo } from '../../types/domain';

// WS-F F2: rough public per-1K-token rates (CNY) used to translate raw token
// counts into a merchant-friendly cost estimate. Mock values for the prototype.
const MODEL_RATES_PER_1K: Record<string, number> = {
  auto: 0.008,
  'ark-ecommerce-v1': 0.008,
  'gpt-4o': 0.09,
  'gpt-4o-mini': 0.005,
  'claude-sonnet-4': 0.1,
  'deepseek-v3': 0.004,
  'deepseek-r1': 0.008,
  'qwen-max': 0.02
};
const DEFAULT_RATE_PER_1K = 0.01;

// The plain-language recommended default for non-technical merchants.
const RECOMMENDED_MODEL_ID = 'auto';

function estimateCost(modelId: string, totalTokens: number) {
  return (totalTokens / 1000) * (MODEL_RATES_PER_1K[modelId] ?? DEFAULT_RATE_PER_1K);
}

export function ModelListPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [keyVerified, setKeyVerified] = useState(false);
  const [addForm] = Form.useForm();

  const { data: platformModels = [] } = useQuery({ queryKey: ['models-platform'], queryFn: modelsApi.listPlatform });
  const { data: customModels = [] } = useQuery({ queryKey: ['models-custom'], queryFn: modelsApi.listCustom });
  const { data: bindings = [] } = useQuery({ queryKey: ['model-bindings'], queryFn: modelsApi.getBindings });
  const { data: usageStats = [] } = useQuery({ queryKey: ['modelUsage'], queryFn: modelsApi.getUsageStats });

  const addMutation = useMutation({
    mutationFn: modelsApi.addCustom,
    onSuccess: () => {
      message.success(t('model.added'));
      queryClient.invalidateQueries({ queryKey: ['models-custom'] });
      setAddModalOpen(false);
      setKeyVerified(false);
      addForm.resetFields();
    }
  });

  const removeMutation = useMutation({
    mutationFn: modelsApi.removeCustom,
    onSuccess: () => {
      message.success(t('model.removed'));
      queryClient.invalidateQueries({ queryKey: ['models-custom'] });
    }
  });

  const bindMutation = useMutation({
    mutationFn: (params: { agentType: string; modelId: string; modelName: string }) =>
      modelsApi.updateBinding(params.agentType, params.modelId, params.modelName),
    onSuccess: () => {
      message.success(t('model.bindingSaved'));
      queryClient.invalidateQueries({ queryKey: ['model-bindings'] });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: modelsApi.verifyKey,
    onSuccess: (result) => {
      setKeyVerified(result.ok);
      if (result.ok) {
        message.success(t('modelsv2.keyVerified'));
      } else {
        message.error(t('modelsv2.keyVerifyFailed'));
      }
    }
  });

  const activePlatform = platformModels.filter((m) => m.active);
  const activeCustom = customModels.filter((m) => m.active);
  const allActive = [...activePlatform, ...activeCustom];
  const totalCalls = usageStats.reduce((sum, s) => sum + s.totalCalls, 0);
  const totalEstimatedCost = usageStats.reduce((sum, s) => sum + estimateCost(s.modelId, s.totalTokens), 0);

  // 合并平台 + 自定义模型为下拉选项（含通俗描述与推荐标记）
  const allModelOptions = [
    ...activePlatform.map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description,
      recommended: m.id === RECOMMENDED_MODEL_ID,
      custom: false
    })),
    ...activeCustom.map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description,
      recommended: false,
      custom: true
    }))
  ];

  const agentColumns: ColumnsType<AgentModelBinding> = [
    {
      title: t('agent.name'),
      dataIndex: 'agentDisplayName',
      width: 200,
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>
    },
    {
      title: t('model.modelName'),
      width: 300,
      render: (_: unknown, record: AgentModelBinding) => (
        <Select
          value={record.boundModelId}
          style={{ width: '100%' }}
          options={allModelOptions}
          optionRender={(option) => {
            const data = option.data as (typeof allModelOptions)[number];
            return (
              <div style={{ padding: '2px 0' }}>
                <Space size={6}>
                  <Typography.Text strong style={{ fontSize: 13 }}>{data.label}</Typography.Text>
                  {data.recommended && <Tag color="blue" style={{ fontSize: 11, marginInlineEnd: 0 }}>{t('modelsv2.recommended')}</Tag>}
                  {data.custom && <Tag color="purple" style={{ fontSize: 11, marginInlineEnd: 0 }}>{t('modelsv2.customBadge')}</Tag>}
                </Space>
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, whiteSpace: 'normal' }}>
                  {data.description}
                </Typography.Paragraph>
              </div>
            );
          }}
          labelRender={(props) => {
            const data = allModelOptions.find((o) => o.value === props.value);
            return (
              <Space size={6}>
                <span>{data?.label ?? props.label}</span>
                {data?.recommended && <Tag color="blue" style={{ fontSize: 11, marginInlineEnd: 0 }}>{t('modelsv2.recommended')}</Tag>}
                {data?.custom && <Tag color="purple" style={{ fontSize: 11, marginInlineEnd: 0 }}>{t('modelsv2.customBadge')}</Tag>}
              </Space>
            );
          }}
          onChange={(modelId: string) => {
            const opt = allModelOptions.find((o) => o.value === modelId);
            if (opt) bindMutation.mutate({ agentType: record.agentType, modelId, modelName: opt.label });
          }}
        />
      )
    },
    {
      title: t('modelsv2.modelPurpose'),
      render: (_: unknown, record: AgentModelBinding) => {
        const bound = allModelOptions.find((o) => o.value === record.boundModelId);
        return (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {bound?.description ?? '-'}
          </Typography.Text>
        );
      },
      responsive: ['md']
    }
  ];

  const customColumns: ColumnsType<ModelInfo> = [
    {
      title: t('model.modelName'),
      dataIndex: 'name',
      render: (name: string, record: ModelInfo) => (
        <Space size={6}>
          <Typography.Text strong>{name}</Typography.Text>
          <Tag color="purple" style={{ fontSize: 11 }}>{t('modelsv2.customBadge')}</Tag>
          {record.apiKey && (
            <Tag color="green" style={{ fontSize: 11 }}>
              {t('model.keyConfigured')}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: t('model.description'),
      dataIndex: 'description',
      render: (desc: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{desc}</Typography.Text>
    },
    { title: 'API Key', dataIndex: 'apiKey', width: 120, render: (key: string | undefined) => key ?? '-' },
    {
      title: t('common.actions'),
      width: 80,
      key: 'actions',
      render: (_: unknown, record: ModelInfo) => (
        <Popconfirm title={t('common.confirmDelete')} onConfirm={() => removeMutation.mutate(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="page-stack">
      <PageHeader title={t('model.title')} description={t('model.descriptionSimple')} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <MetricCard title={t('model.totalModels')} value={allActive.length} prefix={<ThunderboltOutlined />} />
        </Col>
        <Col xs={12} sm={8}>
          <MetricCard title={t('model.totalCalls')} value={totalCalls} prefix={<LineChartOutlined />} />
        </Col>
        <Col xs={12} sm={8}>
          <MetricCard
            title={t('modelsv2.estimatedCost')}
            value={totalEstimatedCost}
            precision={2}
            prefix={<WalletOutlined />}
            suffix="元"
            helper={t('modelsv2.estimatedCostHelper')}
          />
        </Col>
      </Row>

      {/* Agent 模型分配（含平台模型选择） */}
      <Card
        title={<><RobotOutlined /> {t('model.agentBinding')}</>}
        extra={<Typography.Text type="secondary">{t('modelsv2.agentBindingHint')}</Typography.Text>}
        style={{ marginBottom: 24 }}
      >
        <Table rowKey="agentType" columns={agentColumns} dataSource={bindings} pagination={false} scroll={{ x: 640 }} />
      </Card>

      {/* 我的模型 */}
      <Card
        title={<><KeyOutlined /> {t('model.myModels')}</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>{t('model.addCustom')}</Button>}
        style={{ marginBottom: 24 }}
      >
        {customModels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Typography.Paragraph type="secondary">{t('model.noCustom')}</Typography.Paragraph>
            <Button icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>{t('model.addCustom')}</Button>
          </div>
        ) : (
          <Table rowKey="id" columns={customColumns} dataSource={customModels} pagination={false} scroll={{ x: 640 }} />
        )}
      </Card>

      {/* 使用统计 */}
      <Card title={<><LineChartOutlined /> {t('model.usageStats')}</>} style={{ marginBottom: 24 }}>
        {usageStats.length === 0 ? (
          <Typography.Text type="secondary">{t('model.noStats')}</Typography.Text>
        ) : (
          <>
            <TrendBarChart
              className="usage-chart"
              barAreaHeight={110}
              maxBarHeight={100}
              labelMaxWidth={60}
              points={usageStats.map((stat) => ({
                key: stat.modelId,
                label: stat.modelName,
                bars: [
                  {
                    value: stat.totalCalls,
                    max: Math.max(...usageStats.map((item) => item.totalCalls), 1),
                    title: `${stat.modelName}: ${stat.totalCalls.toLocaleString()} 次`,
                    color: '#2563eb',
                    minHeight: 12,
                    width: 22
                  }
                ]
              }))}
            />
            <div style={{ marginTop: 12 }}>
              {usageStats.map((stat) => (
                <div key={stat.modelId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--ark-border-soft)' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>{stat.modelName}</Typography.Text>
                  <Space size="large">
                    <Typography.Text style={{ fontSize: 13, color: '#2563eb' }}>{stat.totalCalls.toLocaleString()} 次</Typography.Text>
                    <Tooltip title={`${stat.totalTokens.toLocaleString()} Tokens`}>
                      <Typography.Text style={{ fontSize: 13, color: '#7c3aed' }}>
                        {t('modelsv2.costAbout')} ¥{estimateCost(stat.modelId, stat.totalTokens).toFixed(2)}
                      </Typography.Text>
                    </Tooltip>
                  </Space>
                </div>
              ))}
            </div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              {t('modelsv2.estimatedCostHelper')}
            </Typography.Paragraph>
          </>
        )}
      </Card>

      {/* 添加模型弹窗 */}
      <Modal
        title={t('model.addCustom')}
        open={addModalOpen}
        onOk={() => addForm.submit()}
        okButtonProps={{ disabled: !keyVerified }}
        okText={keyVerified ? t('common.confirm') : t('modelsv2.keyVerifyRequired')}
        onCancel={() => { setAddModalOpen(false); setKeyVerified(false); addForm.resetFields(); }}
        confirmLoading={addMutation.isPending}
      >
        <Form form={addForm} layout="vertical" onFinish={(values) => addMutation.mutate(values)} initialValues={{ modelType: 'gpt-4o' }}>
          <Form.Item label={t('model.modelName')} name="modelType" rules={[{ required: true }]}>
            <Select
              showSearch
              options={[
                { value: 'gpt-4o', label: 'GPT-4o' }, { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }, { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' }, { value: 'claude-opus-4', label: 'Claude Opus 4' },
                { value: 'deepseek-v3', label: 'DeepSeek-V3' }, { value: 'deepseek-r1', label: 'DeepSeek-R1' },
                { value: 'qwen-max', label: '通义千问 Max' }, { value: 'glm-4', label: '智谱 GLM-4' },
                { value: 'moonshot-v1', label: 'Moonshot v1' }, { value: 'other', label: t('model.otherModel') }
              ]}
            />
          </Form.Item>
          <Form.Item label={t('model.description')} name="description">
            <Input placeholder={t('model.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item label="API Key" required style={{ marginBottom: 0 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="apiKey" noStyle rules={[{ required: true }]}>
                <Input.Password placeholder="sk-..." onChange={() => setKeyVerified(false)} />
              </Form.Item>
              <Button
                icon={keyVerified ? <CheckCircleOutlined /> : undefined}
                type={keyVerified ? 'default' : 'primary'}
                loading={verifyMutation.isPending}
                onClick={() => {
                  const key = addForm.getFieldValue('apiKey') as string | undefined;
                  if (!key) {
                    message.warning(t('modelsv2.keyVerifyRequired'));
                    return;
                  }
                  verifyMutation.mutate(key);
                }}
              >
                {keyVerified ? t('modelsv2.keyVerified') : t('modelsv2.verifyKey')}
              </Button>
            </Space.Compact>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('modelsv2.keyHint')}</Typography.Text>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
