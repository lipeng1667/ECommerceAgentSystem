import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { notificationsApi } from '../../api/notifications';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import type { NotificationChannelConfig, NotificationChannelType, NotificationEventKey } from '../../types/domain';

const EVENT_ROWS: { key: NotificationEventKey; labelKey: string; policyKey: string }[] = [
  { key: 'approval_required', labelKey: 'settings.eventApprovalRequired', policyKey: 'settings.policyApprovalRequired' },
  { key: 'relogin_required', labelKey: 'settings.eventLoginRequired', policyKey: 'settings.policyLoginRequired' },
  { key: 'run_failed', labelKey: 'settings.eventRunFailed', policyKey: 'settings.policyRunFailed' }
];

const CHANNEL_TYPE_OPTIONS: { value: NotificationChannelType; label: string }[] = [
  { value: 'feishu', label: '飞书' },
  { value: 'dingtalk', label: '钉钉' },
  { value: 'webhook', label: 'Webhook' }
];

export function NotificationsSettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const { data: channels = [] } = useQuery({ queryKey: ['notification-channels'], queryFn: notificationsApi.listChannels });

  const toggleMutation = useMutation({
    mutationFn: (params: { channelId: string; event: NotificationEventKey; enabled: boolean }) =>
      notificationsApi.toggleEvent(params.channelId, params.event, params.enabled),
    onSuccess: () => {
      message.success(t('notify.matrixSaved'));
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    }
  });

  const addMutation = useMutation({
    mutationFn: notificationsApi.addChannel,
    onSuccess: (channel) => {
      message.success(t('notify.channelAdded', { name: channel.name }));
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      setAddModalOpen(false);
      addForm.resetFields();
    }
  });

  const testMutation = useMutation({
    mutationFn: notificationsApi.testSend,
    onSuccess: (result, channelId) => {
      const channel = channels.find((c) => c.id === channelId);
      if (result.ok) {
        message.success(t('notify.testSent', { name: channel?.name ?? '' }));
      } else {
        message.error(t('notify.testFailed', { name: channel?.name ?? '' }));
      }
    }
  });

  const columns: ColumnsType<(typeof EVENT_ROWS)[number]> = [
    {
      title: t('settings.events'),
      dataIndex: 'labelKey',
      fixed: 'left',
      width: 220,
      render: (_: unknown, row) => (
        <div>
          <Typography.Text strong>{t(row.labelKey)}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t(row.policyKey)}</Typography.Text>
        </div>
      )
    },
    ...channels.map((channel) => ({
      title: (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space size={6}>
            <Typography.Text strong>{channel.name}</Typography.Text>
            <Tag color={channel.status === 'connected' ? 'green' : 'default'} style={{ fontSize: 11 }}>
              {channel.status === 'connected' ? t('notify.connected') : t('notify.notConfigured')}
            </Tag>
          </Space>
          <Button
            size="small"
            icon={<SendOutlined />}
            disabled={channel.status !== 'connected'}
            loading={testMutation.isPending && testMutation.variables === channel.id}
            onClick={() => testMutation.mutate(channel.id)}
          >
            {t('notify.testSend')}
          </Button>
        </Space>
      ),
      key: channel.id,
      align: 'center' as const,
      width: 150,
      render: (_: unknown, row: (typeof EVENT_ROWS)[number]) => (
        <Switch
          size="small"
          checked={channel.events[row.key]}
          disabled={channel.status !== 'connected'}
          onChange={(checked) => toggleMutation.mutate({ channelId: channel.id, event: row.key, enabled: checked })}
        />
      )
    }))
  ];

  const selectedType = Form.useWatch('type', addForm) as NotificationChannelType | undefined;

  return (
    <div className="page-stack">
      <PageHeader
        title={t('settings.notificationsTitle')}
        description={t('settings.notificationsDescription')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            {t('settings.addChannel')}
          </Button>
        }
      />
      <Card title={t('notify.matrixTitle')}>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          {t('notify.matrixDesc')}
        </Typography.Paragraph>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={EVENT_ROWS}
          pagination={false}
          size="middle"
          scroll={{ x: 640 }}
        />
      </Card>

      <Modal
        title={t('settings.addChannel')}
        open={addModalOpen}
        onOk={() => addForm.submit()}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields(); }}
        confirmLoading={addMutation.isPending}
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ type: 'feishu' }}
          onFinish={(values: { type: NotificationChannelType; name?: string; endpoint?: string }) => {
            const fallbackName = CHANNEL_TYPE_OPTIONS.find((o) => o.value === values.type)?.label ?? values.type;
            addMutation.mutate({ type: values.type, name: values.name?.trim() || fallbackName, endpoint: values.endpoint });
          }}
        >
          <Form.Item label={t('notify.channelType')} name="type" rules={[{ required: true }]}>
            <Select options={CHANNEL_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label={t('notify.channelName')} name="name">
            <Input placeholder={t('notify.channelNamePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={selectedType === 'webhook' ? 'Webhook URL' : t('notify.botWebhookUrl')}
            name="endpoint"
            rules={[{ required: true, message: t('notify.endpointRequired') }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            {t('notify.addChannelHint')}
          </Typography.Paragraph>
        </Form>
      </Modal>
    </div>
  );
}
