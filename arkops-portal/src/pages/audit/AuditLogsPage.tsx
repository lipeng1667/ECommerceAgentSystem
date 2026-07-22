import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Input, Segmented, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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

// WS-F F5: segment → category-set map. Counts and filtering use the SAME sets,
// so the numbers on the control always match the rows shown.
type SegmentKey = 'all' | 'approval' | 'agent' | 'human' | 'system';
const SEGMENT_CATEGORIES: Record<Exclude<SegmentKey, 'all'>, AuditCategory[]> = {
  approval: ['approval'],
  agent: ['agent_action', 'agent'],
  human: ['human_ops', 'task', 'exception', 'store'],
  system: ['system_event', 'store_session'],
};

const ALL_CATEGORIES: AuditCategory[] = [
  'approval', 'agent_action', 'agent', 'human_ops', 'task', 'exception', 'store', 'system_event', 'store_session',
];

export function AuditLogsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [segment, setSegment] = useState<SegmentKey>('all');
  const [rawCategory, setRawCategory] = useState<AuditCategory | undefined>(undefined);
  const [actor, setActor] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const { data = [] } = useQuery({ queryKey: ['audit-logs'], queryFn: auditLogsApi.list });

  const actors = useMemo(() => Array.from(new Set(data.map((i) => i.actor))).sort(), [data]);

  // Everything except the segment/category axis — segment counts derive from this,
  // so the numbers stay truthful under keyword/actor/date filtering.
  const baseFiltered = useMemo(() => {
    let items = data;
    if (actor) items = items.filter((i) => i.actor === actor);
    if (range?.[0]) items = items.filter((i) => !dayjs(i.at).isBefore(range[0]!, 'day'));
    if (range?.[1]) items = items.filter((i) => !dayjs(i.at).isAfter(range[1]!, 'day'));
    if (keyword) items = items.filter((i) =>
      `${i.actor} ${i.action} ${i.entity} ${i.summary}`.toLowerCase().includes(keyword.toLowerCase())
    );
    return items;
  }, [data, keyword, actor, range]);

  const filtered = useMemo(() => {
    let items = baseFiltered;
    if (segment !== 'all') items = items.filter((i) => SEGMENT_CATEGORIES[segment].includes(i.category));
    if (rawCategory) items = items.filter((i) => i.category === rawCategory);
    return items;
  }, [baseFiltered, segment, rawCategory]);

  const segmentCount = (key: SegmentKey) =>
    key === 'all' ? baseFiltered.length : baseFiltered.filter((i) => SEGMENT_CATEGORIES[key].includes(i.category)).length;

  const visibleCategories = segment === 'all' ? ALL_CATEGORIES : SEGMENT_CATEGORIES[segment];

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
              value={segment}
              onChange={(v) => {
                const next = v as SegmentKey;
                setSegment(next);
                // Drop a sub-category selection that the new segment does not contain.
                if (rawCategory && next !== 'all' && !SEGMENT_CATEGORIES[next].includes(rawCategory)) {
                  setRawCategory(undefined);
                }
              }}
              options={[
                { label: `${t('audit.all')} (${segmentCount('all')})`, value: 'all' },
                { label: `${t('audit.cat_approval')} (${segmentCount('approval')})`, value: 'approval' },
                { label: `${t('auditv2.groupAgent')} (${segmentCount('agent')})`, value: 'agent' },
                { label: `${t('auditv2.groupHuman')} (${segmentCount('human')})`, value: 'human' },
                { label: `${t('auditv2.groupSystem')} (${segmentCount('system')})`, value: 'system' },
              ]}
            />
            <Select
              size="small"
              style={{ minWidth: 140 }}
              allowClear
              placeholder={t('auditv2.subCategory')}
              value={rawCategory}
              onChange={(v) => setRawCategory(v as AuditCategory | undefined)}
              options={visibleCategories.map((cat) => ({
                value: cat,
                label: `${t(`audit.cat_${cat}`)} (${baseFiltered.filter((i) => i.category === cat).length})`,
              }))}
            />
            <Select
              size="small"
              style={{ minWidth: 140 }}
              allowClear
              showSearch
              placeholder={t('auditv2.actorFilter')}
              value={actor}
              onChange={(v) => setActor(v as string | undefined)}
              options={actors.map((name) => ({ value: name, label: name }))}
            />
            <DatePicker.RangePicker
              size="small"
              value={range}
              onChange={(v) => setRange(v)}
              allowEmpty={[true, true]}
            />
          </PageFilterBar>
        }
      />
    </div>
  );
}
