import { CustomerServiceOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockConversations } from '../agentConfigMockData';

export function CsQueueCard() {
  const { t } = useI18n();
  const [processing, setProcessing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [lastProcess, setLastProcess] = useState('5m ago');
  const [conversations, setConversations] = useState(
    mockConversations.map(c => ({ ...c, status: '' as string })),
  );

  const handleReply = (id: number) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, status: 'replied' } : c)));
    message.success(t('cs.messageSent'));
  };

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setLastProcess('just now');
      message.success(t('cs.processDone'));
    }, 2000);
  };

  const handleBatchReply = () => {
    setReplying(true);
    setTimeout(() => {
      setReplying(false);
      message.success(t('cs.replyDone'));
    }, 1500);
  };

  const getIntent = (lastMsg: string): { label: string; color: string } => {
    const msg = lastMsg.toLowerCase();
    if (msg.includes('return') || msg.includes('wrong size') || msg.includes('exchange')) {
      return { label: t('cs.intentReturn'), color: 'red' };
    }
    return { label: t('cs.intentInquiry'), color: 'blue' };
  };

  const getStatus = (conv: typeof conversations[0]): { label: string; color: string } => {
    if (conv.status === 'replied') return { label: t('review.repliedTag'), color: 'green' };
    if (conv.escalate) return { label: t('cs.escalate'), color: 'red' };
    if (conv.unread) return { label: t('cs.statusPending'), color: 'orange' };
    return { label: t('cs.statusHandled'), color: 'green' };
  };

  const columns = [
    {
      title: t('cs.customer'),
      dataIndex: 'name',
      width: 120,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('cs.message'),
      dataIndex: 'lastMsg',
      ellipsis: true,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('cs.intent'),
      width: 90,
      render: (_: unknown, r: typeof conversations[0]) => {
        const intent = getIntent(r.lastMsg);
        return <Tag color={intent.color} style={{ fontSize: 11 }}>{intent.label}</Tag>;
      },
    },
    {
      title: t('cs.statusCol'),
      width: 100,
      render: (_: unknown, r: typeof conversations[0]) => {
        const status = getStatus(r);
        return <Tag color={status.color} style={{ fontSize: 11 }}>{status.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof conversations[0]) =>
        r.status === 'replied' ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('review.repliedTag')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleReply(r.id)}>
            {t('cs.reply')}
          </Button>
        ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #16a34a' }}
      title={
        <Space>
          <CustomerServiceOutlined style={{ color: '#16a34a' }} />
          {t('cs.queueTitle')}
          <Badge status="processing" />
          <Tag color="green" style={{ fontSize: 11 }}>{t('cs.lastProcess')}: {lastProcess}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={processing} onClick={handleProcess}>
            {t('cs.processNow')}
          </Button>
          <Button size="small" type="primary" icon={<SendOutlined />} loading={replying} onClick={handleBatchReply}>
            {t('cs.batchReply')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={conversations} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
