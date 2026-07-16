import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Segmented, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditLogsApi } from '../../api/auditLogs';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
import { DataTableCard } from '../../components/table/DataTableCard';
import type { AuditCategory, AuditLog } from '../../types/domain';

const categoryColors: Record<AuditCategory, string> = {
  approval: 'orange',
  agent_action: 'blue',
  human_ops: 'green',
  system_event: 'purple',
  store_session: 'cyan',
  task: 'geekblue',
  agent: 'blue',
  exception: 'red',
  store: 'green',
};

export function AuditLogsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const { data = [] } = useQuery({ queryKey: ['audit-logs'], queryFn: auditLogsApi.list });

  const filtered = useMemo(() => {
    let items = data;
    if (category !== 'all') items = items.filter((i) => i.category === category);
    if (keyword) items = items.filter((i) =>
      `${i.actor} ${i.action} ${i.entity} ${i.summary}`.toLowerCase().includes(keyword.toLowerCase())
    );
    return items;
  }, [data, keyword, category]);

  const columns: ColumnsType<AuditLog> = [
    {
      title: t('audit.time'),
      dataIndex: 'at',
      width: 150,
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('audit.category'),
      dataIndex: 'category',
      width: 120,
      render: (cat: AuditCategory) => (
        <Tag color={categoryColors[cat]}>{t(`audit.cat_${cat}`)}</Tag>
      ),
    },
    { title: t('audit.actor'), dataIndex: 'actor', width: 130 },
    { title: t('audit.action'), dataIndex: 'action', width: 110 },
    { title: t('audit.entity'), dataIndex: 'entity', width: 80 },
    {
      title: t('audit.summary'),
      dataIndex: 'summary',
      ellipsis: true,
    },
    {
      title: t('common.actions'),
      width: 80,
      render: (_: unknown, record: AuditLog) =>
        record.linkTo ? (
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(record.linkTo!)}>
            {t('common.view')}
          </Button>
        ) : null,
    },
  ];

  const stats = {
    all: data.length,
    approval: data.filter((i) => i.category === 'approval').length,
    agent_action: data.filter((i) => i.category === 'agent_action').length,
    human_ops: data.filter((i) => i.category === 'human_ops').length,
    system_event: data.filter((i) => i.category === 'system_event' || i.category === 'store_session').length,
  };

  const handleExport = () => {
    const headers = [t('audit.time'), t('audit.category'), t('audit.actor'), t('audit.action'), t('audit.entity'), t('audit.summary')];
    const rows = filtered.map((log) => [
      dayjs(log.at).format('YYYY-MM-DD HH:mm'),
      t(`audit.cat_${log.category}`),
      log.actor,
      log.action,
      log.entity,
      `"${log.summary.replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={t('audit.title')}
        description={t('audit.description')}
        actions={
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            {t('common.export')}
          </Button>
        }
      />
      <DataTableCard<AuditLog>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, size: 'small' }}
        scroll={{ x: 900 }}
        toolbar={
          <PageFilterBar>
          <Input.Search
            placeholder={t('audit.search')}
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
          />
          <Segmented
            size="small"
            value={category}
            onChange={(v) => setCategory(v as AuditCategory | 'all')}
            options={[
              { label: `${t('audit.all')} (${stats.all})`, value: 'all' },
              { label: `${t('audit.cat_approval')} (${stats.approval})`, value: 'approval' },
              { label: `${t('audit.cat_agent_action')} (${stats.agent_action})`, value: 'agent_action' },
              { label: `${t('audit.cat_human_ops')} (${stats.human_ops})`, value: 'human_ops' },
              { label: `${t('audit.cat_system_event')} (${stats.system_event})`, value: 'system_event' },
            ]}
          />
          </PageFilterBar>
        }
      />
    </div>
  );
}
