import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { Badge, Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { stores } from '../../../api/mockData';

interface SessionStatusModalProps {
  open: boolean;
  onClose: () => void;
}

type SessionState = 'healthy' | 'expired' | 'retrying' | 'manual_required';

const sessionStates: Record<string, SessionState> = {
  '1001': 'healthy',
  '1002': 'manual_required',
  '1003': 'expired',
};

export function SessionStatusModal({ open, onClose }: SessionStatusModalProps) {
  const { t } = useI18n();
  const [retrying, setRetrying] = useState<number[]>([]);
  const [sessionOverrides, setSessionOverrides] = useState<Record<number, SessionState>>({});

  const handleRetry = (storeId: number, storeName: string) => {
    setRetrying(prev => [...prev, storeId]);
    setTimeout(() => {
      setRetrying(prev => prev.filter(id => id !== storeId));
      setSessionOverrides(prev => ({ ...prev, [storeId]: 'healthy' }));
      message.success(t('agent.retrySuccess', { store: storeName }));
    }, 2000);
  };

  const getSessionState = (storeId: number): SessionState =>
    sessionOverrides[storeId] ?? sessionStates[String(storeId)] ?? 'healthy';

  const stateConfig: Record<SessionState, { color: string; icon: React.ReactNode; tag: string }> = {
    healthy: { color: 'success', icon: <CheckCircleOutlined />, tag: t('agent.sessionHealthy') },
    expired: { color: 'error', icon: <ExclamationCircleOutlined />, tag: t('agent.sessionExpired') },
    retrying: { color: 'processing', icon: <SyncOutlined spin />, tag: t('agent.sessionRetrying') },
    manual_required: { color: 'warning', icon: <WarningOutlined />, tag: t('agent.sessionManualRequired') },
  };

  const issueCount = stores.filter(s => getSessionState(s.id) !== 'healthy').length;

  const columns = [
    {
      title: t('agent.storeName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Typography.Text strong style={{ fontSize: 13 }}>{name}</Typography.Text>,
    },
    {
      title: t('agent.sessionStatus'),
      key: 'status',
      render: (_: unknown, record: typeof stores[0]) => {
        const state = retrying.includes(record.id) ? 'retrying' as SessionState : getSessionState(record.id);
        const config = stateConfig[state];
        return <Tag color={config.color} icon={config.icon} style={{ fontSize: 12 }}>{config.tag}</Tag>;
      },
    },
    {
      title: t('agent.lastCheck'),
      dataIndex: 'lastVerifiedAt',
      key: 'lastVerifiedAt',
      render: (val: string) => val ? new Date(val).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : t('agent.lastCheckNever'),
    },
    {
      key: 'action',
      width: 120,
      render: (_: unknown, record: typeof stores[0]) => {
        const state = getSessionState(record.id);
        if (state === 'healthy') return null;
        return (
          <Button
            size="small"
            type="link"
            icon={<ReloadOutlined />}
            loading={retrying.includes(record.id)}
            onClick={() => handleRetry(record.id, record.name)}
          >
            {t('agent.retryNow')}
          </Button>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <Space>
          <Badge status={issueCount > 0 ? 'error' : 'success'} />
          <Typography.Text strong>{t('agent.sessionStatusTitle')}</Typography.Text>
          {issueCount > 0 ? (
            <Tag color="error" style={{ fontSize: 11 }}>{t('agent.sessionIssuesFound', { count: issueCount })}</Tag>
          ) : (
            <Tag color="success" style={{ fontSize: 11 }}>{t('agent.sessionAllHealthy')}</Tag>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
        {t('agent.sessionStatusDesc')}
      </Typography.Paragraph>
      <Table
        dataSource={stores}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ marginTop: 8 }}
      />
    </Modal>
  );
}
