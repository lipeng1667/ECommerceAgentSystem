/**
 * Livestream Management Page — V1.3
 * Live session overview, script library, content material center.
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  PlayCircleOutlined, ClockCircleOutlined, CheckCircleOutlined,
  FileTextOutlined, PictureOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Collapse, Empty, Modal, Row, Segmented, Space, Statistic, Table, Tag, Tabs, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { livestreamApi } from '../../api/livestream';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import type { ContentMaterial, LiveScript, LiveSession } from '../../types/domain';

const STATUS_TAG: Record<string, { color: string; labelKey: string; icon: React.ReactNode }> = {
  live: { color: 'red', labelKey: 'live.live', icon: <PlayCircleOutlined /> },
  upcoming: { color: 'blue', labelKey: 'live.upcoming', icon: <ClockCircleOutlined /> },
  ended: { color: 'default', labelKey: 'live.ended', icon: <CheckCircleOutlined /> },
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function LiveManagementPage() {
  const { t } = useI18n();
  const [scriptModal, setScriptModal] = useState<LiveSession | null>(null);

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: sessions = [] } = useQuery({ queryKey: ['liveSessions'], queryFn: livestreamApi.list });
  const { data: materials = [] } = useQuery({ queryKey: ['liveMaterials'], queryFn: livestreamApi.getMaterials });

  if (stores.length === 0) return <StoreConnectionEmptyState description={t('live.emptyNoStore')} />;

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const live = sessions.find((s) => s.status === 'live');
  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const totalRevenue = sessions.reduce((s, r) => s + r.revenue, 0);

  const sessionColumns: ColumnsType<LiveSession> = [
    { title: t('live.title'), dataIndex: 'title', width: 200, ellipsis: true },
    { title: t('live.store'), key: 'store', width: 100, render: (_: unknown, r: LiveSession) => storeById.get(r.storeId)?.name ?? '-' },
    {
      title: t('live.status'), key: 'status', width: 80,
      render: (_: unknown, r: LiveSession) => { const cfg = STATUS_TAG[r.status]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{t(cfg.labelKey)}</Tag> : null; },
    },
    { title: t('live.time'), key: 'time', width: 160, render: (_: unknown, r: LiveSession) => <Typography.Text style={{ fontSize: 12 }}>{dayjs(r.startTime).format('MM/DD HH:mm')} ({formatDuration(r.duration)})</Typography.Text> },
    { title: t('live.viewers'), key: 'viewers', width: 90, align: 'right', render: (_: unknown, r: LiveSession) => r.viewers > 0 ? r.viewers.toLocaleString() : '-' },
    { title: t('live.peak'), key: 'peak', width: 80, align: 'right', render: (_: unknown, r: LiveSession) => r.peakViewers > 0 ? r.peakViewers.toLocaleString() : '-' },
    { title: t('live.orders'), key: 'orders', width: 70, align: 'right', render: (_: unknown, r: LiveSession) => r.orders > 0 ? r.orders.toLocaleString() : '-' },
    { title: t('live.revenue'), key: 'revenue', width: 90, align: 'right', render: (_: unknown, r: LiveSession) => r.revenue > 0 ? `¥${r.revenue.toLocaleString()}` : '-' },
    {
      title: t('live.actions'), key: 'actions', width: 100,
      render: (_: unknown, r: LiveSession) => <Button size="small" type="link" icon={<FileTextOutlined />} onClick={() => setScriptModal(r)}>{t('live.scripts')}</Button>,
    },
  ];

  const materialList = [
    { key: 'image', icon: <PictureOutlined />, name: t('live.matImage') },
    { key: 'video', icon: <PlayCircleOutlined />, name: t('live.matVideo') },
    { key: 'script', icon: <FileTextOutlined />, name: t('live.matScript') },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title={t('nav.live')} description={t('live.subtitle')} />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ padding: '0 24px', marginBottom: 12 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('live.liveCount')} value={live ? 1 : 0} valueStyle={{ color: 'var(--ark-red)', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('live.upcomingCount')} value={upcoming.length} valueStyle={{ color: '#1890ff', fontSize: 20 }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('live.endedCount')} value={sessions.filter((s) => s.status === 'ended').length} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title={t('live.totalRevenue')} value={`¥${(totalRevenue / 10000).toFixed(1)}万`} valueStyle={{ color: 'var(--ark-purple)', fontSize: 20 }} /></Card></Col>
      </Row>

      {/* Live now alert */}
      {live && (
        <Card size="small" style={{ margin: '0 24px 12px', borderLeft: '3px solid var(--ark-red)' }}>
          <Space><PlayCircleOutlined style={{ color: 'var(--ark-red)', fontSize: 16 }} /><Typography.Text strong style={{ color: 'var(--ark-red)' }}>{t('live.liveNow')}: {live.title}</Typography.Text>
            <Tag color="red">LIVE</Tag>
            <Typography.Text type="secondary">{t('live.viewers')}: {live.viewers.toLocaleString()} | {t('live.orders')}: {live.orders}</Typography.Text>
          </Space>
        </Card>
      )}

      <Tabs defaultActiveKey="sessions" style={{ flex: 1, padding: '0 24px', overflow: 'auto' }} tabBarStyle={{ marginBottom: 12 }}
        items={[
          {
            key: 'sessions', label: <><PlayCircleOutlined />{t('live.sessionsTab')}</>,
            children: <Table<LiveSession> rowKey="id" columns={sessionColumns} dataSource={sessions} pagination={{ pageSize: 15 }} size="middle" locale={{ emptyText: <Empty description={t('live.noSessions')} /> }} />,
          },
          {
            key: 'materials', label: <><DatabaseOutlined />{t('live.materialsTab')}</>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {materialList.map((cat) => {
                  const items = materials.filter((m) => m.type === cat.key);
                  return (
                    <Card key={cat.key} size="small" title={<Space>{cat.icon}{cat.name} <Tag>{items.length}</Tag></Space>}>
                      <Space wrap size={[8, 8]}>
                        {items.map((m) => (
                          <Card key={m.id} size="small" style={{ width: 200 }} hoverable>
                            <Space direction="vertical" size={0}>
                              <Typography.Text strong style={{ fontSize: 12 }}>{m.name}</Typography.Text>
                              <Space size={4} wrap>{m.tags.map((tg) => <Tag key={tg} style={{ fontSize: 10 }}>{tg}</Tag>)}</Space>
                              <Typography.Text type="secondary" style={{ fontSize: 10 }}>{dayjs(m.uploadedAt).format('YYYY-MM-DD')}</Typography.Text>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            ),
          },
      ]} />

      {/* Script modal */}
      <ScriptModal session={scriptModal} onClose={() => setScriptModal(null)} />
    </div>
  );
}

function ScriptModal({ session, onClose }: { session: LiveSession | null; onClose: () => void }) {
  const { t } = useI18n();
  const { data: scripts = [] } = useQuery({
    queryKey: ['liveScripts', session?.id],
    queryFn: () => livestreamApi.getScripts(session!.id),
    enabled: !!session,
  });
  if (!session) return null;

  const phaseColors: Record<string, string> = { opening: 'blue', product_intro: 'green', promo_push: 'red', closing: 'purple' };
  return (
    <Modal title={`${t('live.scripts')} — ${session.title}`} open={!!session} onCancel={onClose} footer={null} width={700}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {scripts.map((s) => (
          <Card key={s.id} size="small" title={<Space><Tag color={phaseColors[s.phase]}>{t(`live.phase_${s.phase}`)}</Tag>{s.title} — {s.duration}{t('live.min')}</Space>}>
            <Typography.Paragraph style={{ fontSize: 13, marginBottom: 4 }}>{s.content}</Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('live.notes')}: {s.notes}</Typography.Text>
          </Card>
        ))}
      </Space>
    </Modal>
  );
}
