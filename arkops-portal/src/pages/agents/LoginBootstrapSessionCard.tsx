/**
 * LoginBootstrapSessionCard — login_bootstrap Agent 专属店铺会话状态卡片。
 *
 * 从 AgentConfigPage 拆分而来，管理店铺会话状态的展示、重试和手动验证。
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import { KeyOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../app/i18n';
import type { Store } from '../../types/domain';

export interface LoginBootstrapSessionCardProps {
  stores: Store[];
}

type SessionState = 'healthy' | 'expired' | 'manual_required' | 'retrying';

const initialSessionStates: Record<string, SessionState> = {
  '1001': 'healthy',
  '1002': 'manual_required',
  '1003': 'expired',
};

const initialLogs: Record<number, { time: string; action: string; result: string }[]> = {
  1001: [
    { time: '08:00', action: '自动巡检', result: '会话活跃' },
    { time: '08:30', action: '自动巡检', result: '会话活跃' },
    { time: '09:00', action: '自动巡检', result: '会话活跃' },
    { time: '09:30', action: '自动巡检', result: '会话活跃' },
  ],
  1002: [
    { time: '08:00', action: '自动巡检', result: '会话活跃' },
    { time: '08:30', action: '自动巡检', result: '检测到验证码' },
    { time: '08:32', action: '自动重试', result: '重试失败' },
    { time: '08:35', action: '等待运营人员', result: '待处理' },
  ],
  1003: [
    { time: '07:00', action: '自动巡检', result: '会话活跃' },
    { time: '08:00', action: '自动巡检', result: 'Cookie 过期' },
    { time: '08:01', action: '自动重启', result: '重启失败' },
    { time: '08:05', action: '等待运营人员', result: '待处理' },
  ],
};

export function LoginBootstrapSessionCard({ stores }: LoginBootstrapSessionCardProps) {
  const { t } = useI18n();
  const [sessionOverrides, setSessionOverrides] = useState<Record<number, SessionState>>({});
  const [retryingStores, setRetryingStores] = useState<number[]>([]);
  const [verifyingStores, setVerifyingStores] = useState<number[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [sessionLogs, setSessionLogs] = useState(initialLogs);

  const getSessionState = (storeId: number): SessionState =>
    sessionOverrides[storeId] ?? initialSessionStates[String(storeId)] ?? 'healthy';

  const stateConfig: Record<SessionState, { color: string; tag: string }> = {
    healthy: { color: 'green', tag: t('agent.sessionHealthy') },
    expired: { color: 'red', tag: t('agent.sessionExpired') },
    manual_required: { color: 'orange', tag: t('agent.sessionManualRequired') },
    retrying: { color: 'blue', tag: t('agent.sessionRetrying') },
  };

  const handleInspect = () => {
    setInspectLoading(true);
    setTimeout(() => {
      setInspectLoading(false);
      message.success(t('agent.inspectionDone'));
    }, 2000);
  };

  const handleSessionRetryWithLog = (storeId: number, storeName: string) => {
    setRetryingStores((prev) => [...prev, storeId]);
    setSessionOverrides((prev) => ({ ...prev, [storeId]: 'retrying' }));
    setSessionLogs((prev) => ({
      ...prev,
      [storeId]: [
        ...(prev[storeId] ?? []),
        { time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), action: t('agent.logManualRetry'), result: t('agent.logRetrying') },
      ],
    }));
    setTimeout(() => {
      setRetryingStores((prev) => prev.filter((id) => id !== storeId));
      setSessionOverrides((prev) => ({ ...prev, [storeId]: 'healthy' }));
      setSessionLogs((prev) => ({
        ...prev,
        [storeId]: [
          ...(prev[storeId] ?? []),
          { time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), action: t('agent.logManualRetry'), result: t('agent.logRetrySuccess') },
        ],
      }));
      message.success(t('agent.retrySuccess', { store: storeName }));
    }, 2000);
  };

  const handleManualVerify = (storeId: number, storeName: string) => {
    setVerifyingStores((prev) => [...prev, storeId]);
    setTimeout(() => {
      setVerifyingStores((prev) => prev.filter((id) => id !== storeId));
      setSessionOverrides((prev) => ({ ...prev, [storeId]: 'healthy' }));
      setSessionLogs((prev) => ({
        ...prev,
        [storeId]: [
          ...(prev[storeId] ?? []),
          { time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), action: t('agent.logManualVerify'), result: t('agent.logVerifyPassed') },
        ],
      }));
      message.success(t('agent.manualVerifySuccess', { store: storeName }));
    }, 1500);
  };

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #2563eb' }}
      title={
        <Space>
          <SafetyOutlined style={{ color: '#2563eb' }} />
          {t('agent.storeSessionStatus')}
          <Tag
            color={stores.some((s) => getSessionState(s.id) !== 'healthy') ? 'orange' : 'green'}
            style={{ fontSize: 11 }}
          >
            {(() => {
              const total = stores.length;
              const healthy = stores.filter((s) => getSessionState(s.id) === 'healthy').length;
              const attention = total - healthy;
              return attention > 0
                ? `${healthy}/${total} · ${attention} ${t('agent.needAttention')}`
                : `${healthy}/${total} ${t('agent.allHealthy')}`;
            })()}
          </Tag>
        </Space>
      }
      extra={
        <Button size="small" icon={<ReloadOutlined />} loading={inspectLoading} onClick={handleInspect}>
          {t('agent.inspectNow')}
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={stores}
        pagination={false}
        size="small"
        columns={[
          {
            title: t('entity.storeName'), dataIndex: 'name', width: 140,
            render: (name: string) => <Typography.Text strong style={{ fontSize: 13 }}>{name}</Typography.Text>,
          },
          {
            title: t('agent.sessionStatus'), dataIndex: 'id', width: 110,
            render: (storeId: number) => {
              const state = getSessionState(storeId);
              const cfg = stateConfig[state];
              return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.tag}</Tag>;
            },
          },
          {
            title: t('agent.lastLog'),
            render: (_: unknown, record: Store) => {
              const logs = sessionLogs[record.id] ?? [];
              const last = logs[logs.length - 1];
              return last ? (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {last.time} {last.action} → {last.result}
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>-</Typography.Text>
              );
            },
          },
          {
            title: t('common.actions'), width: 180,
            render: (_: unknown, record: Store) => {
              const state = getSessionState(record.id);
              if (state === 'healthy') return null;
              const isRetrying = retryingStores.includes(record.id);
              const isVerifying = verifyingStores.includes(record.id);
              return (
                <Space size="small" direction="vertical">
                  <Button
                    size="small" type="primary" icon={<ReloadOutlined />}
                    loading={isRetrying}
                    onClick={() => handleSessionRetryWithLog(record.id, record.name)}
                  >
                    {t('agent.retryNow')}
                  </Button>
                  <Button
                    size="small" icon={<KeyOutlined />}
                    loading={isVerifying}
                    onClick={() => handleManualVerify(record.id, record.name)}
                  >
                    {t('agent.manualVerify')}
                  </Button>
                </Space>
              );
            },
          },
        ]}
      />
    </Card>
  );
}
