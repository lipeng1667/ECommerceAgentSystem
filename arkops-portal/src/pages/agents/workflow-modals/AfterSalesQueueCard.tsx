import { CheckCircleOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockAfterSalesTickets } from '../agentConfigMockData';

export function AfterSalesQueueCard() {
  const { t } = useI18n();
  const [auditing, setAuditing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcess, setLastProcess] = useState('30m ago');

  const handleAudit = () => {
    setAuditing(true);
    setTimeout(() => {
      setAuditing(false);
      setLastProcess('just now');
      message.success(t('aftersales.auditDone'));
    }, 2000);
  };

  const handleBatchProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      message.success(t('aftersales.processDone'));
    }, 1500);
  };

  const [tickets, setTickets] = useState(() => mockAfterSalesTickets.map(t => ({ ...t })));

  const handleProcess = (id: string) => {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, status: 'processed' } : t)));
    message.success(t('aftersales.processed'));
  };

  const typeConfig: Record<string, { color: string; label: string }> = {
    return: { color: 'red', label: t('aftersales.typeReturn') },
    refund: { color: 'blue', label: t('aftersales.typeRefund') },
    consult: { color: 'purple', label: t('aftersales.typeConsult') },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending_review: { color: 'orange', label: t('aftersales.pendingReview') },
    auto_approved: { color: 'green', label: t('aftersales.autoApproved') },
    processed: { color: 'blue', label: t('aftersales.processed') },
    resolved: { color: 'default', label: t('aftersales.statusResolved') },
  };

  const columns = [
    {
      title: t('aftersales.ticketNo'),
      dataIndex: 'id',
      width: 110,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('aftersales.buyer'),
      dataIndex: 'customer',
      width: 110,
      render: (v: string) => <Typography.Text style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('aftersales.type'),
      dataIndex: 'type',
      width: 100,
      render: (v: string) => {
        const cfg = typeConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('aftersales.status'),
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof tickets[0]) =>
        r.status === 'processed' || r.status === 'resolved' ? (
          <Tag color="blue" style={{ fontSize: 11 }}>{t('aftersales.processed')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleProcess(r.id)}>
            {t('aftersales.process')}
          </Button>
        ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #ea580c' }}
      title={
        <Space>
          <ToolOutlined style={{ color: '#ea580c' }} />
          {t('aftersales.queueTitle')}
          <Badge status="processing" />
          <Tag color="orange" style={{ fontSize: 11 }}>{t('aftersales.lastProcess')}: {lastProcess}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={auditing} onClick={handleAudit}>
            {t('aftersales.auditNow')}
          </Button>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={processing} onClick={handleBatchProcess}>
            {t('aftersales.batchProcess')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={tickets} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
