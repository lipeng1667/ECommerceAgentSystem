import { EditOutlined, ReloadOutlined, StarOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Rate, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockReviews } from '../agentConfigMockData';

export function ReviewMonitorCard() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [replying, setReplying] = useState(false);
  const [lastScan, setLastScan] = useState('1h ago');
  const [reviews, setReviews] = useState(
    mockReviews.map(r => ({ ...r, status: 'pending' as 'pending' | 'replied' })),
  );

  const handleReply = (id: number) => {
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, status: 'replied' as const } : r)));
    message.success(t('review.replied'));
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan('just now');
      message.success(t('review.scanDone'));
    }, 2000);
  };

  const handleBatchReply = () => {
    setReplying(true);
    setTimeout(() => {
      setReplying(false);
      message.success(t('review.replyDone'));
    }, 1500);
  };

  const severityConfig: Record<string, { color: string; label: string }> = {
    high: { color: 'red', label: t('review.severityHigh') },
    medium: { color: 'orange', label: t('review.severityMedium') },
    low: { color: 'gold', label: t('review.severityLow') },
  };

  const columns = [
    {
      title: t('review.product'),
      dataIndex: 'product',
      ellipsis: true,
      render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text>,
    },
    {
      title: t('review.rating'),
      dataIndex: 'rating',
      width: 110,
      render: (v: number) => <Rate disabled defaultValue={v} style={{ fontSize: 12 }} />,
    },
    {
      title: t('review.content'),
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: t('review.statusCol'),
      dataIndex: 'severity',
      width: 90,
      render: (v: string) => {
        const cfg = severityConfig[v] || { color: 'default', label: v };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: typeof reviews[0]) =>
        r.status === 'replied' ? (
          <Tag color="green" style={{ fontSize: 11 }}>{t('review.repliedTag')}</Tag>
        ) : (
          <Button size="small" type="link" style={{ fontSize: 12, padding: 0 }} onClick={() => handleReply(r.id)}>
            {t('review.reply')}
          </Button>
        ),
    },
  ];

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #f59e0b' }}
      title={
        <Space>
          <StarOutlined style={{ color: '#f59e0b' }} />
          {t('review.monitorTitle')}
          <Badge status="processing" />
          <Tag color="orange" style={{ fontSize: 11 }}>{t('review.lastScan')}: {lastScan}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan}>
            {t('review.scanNow')}
          </Button>
          <Button size="small" type="primary" icon={<EditOutlined />} loading={replying} onClick={handleBatchReply}>
            {t('review.batchReply')}
          </Button>
        </Space>
      }
    >
      <Table dataSource={reviews} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
