/**
 * File: InboxHistoryTab.tsx
 * Purpose: "处理记录" tab of the Action Inbox (D9) — one timeline of everything that has
 * already been decided, merging the exception centre's resolved/ignored records with the
 * approval centre's approved/rejected/expired ones. Answers "what did we do about it?",
 * which the pending queue deliberately does not.
 *
 * Author: TBD
 * Created: 2026-07-29
 *
 * Main exports:
 * - InboxHistoryTab: rendered inside InboxPage's tab layout.
 */
import { EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Select, Space, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalsApi } from '../../api/approvals';
import { exceptionsApi } from '../../api/exceptions';
import type { ExceptionItem } from '../../api/exceptions';
import { useI18n } from '../../app/i18n';
import { EmptyState } from '../../components/EmptyState';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { Approval } from '../../types/domain';

type HistoryKind = 'exception' | 'approval';
type HistoryResult = 'resolved' | 'ignored' | 'approved' | 'rejected' | 'expired';

interface HistoryRow {
  key: string;
  kind: HistoryKind;
  result: HistoryResult;
  title: string;
  storeName: string;
  /** ISO timestamp of the decision. */
  at: string;
  actor?: string;
  note?: string;
  approvalId?: number;
  exception?: ExceptionItem;
}

const RESULT_COLORS: Record<HistoryResult, string> = {
  resolved: 'green',
  ignored: 'default',
  approved: 'green',
  rejected: 'red',
  expired: 'orange',
};

/** Records with no decision timestamp sort last rather than to 1970. */
function decidedAtValue(row: HistoryRow): number {
  const value = dayjs(row.at).valueOf();
  return Number.isNaN(value) ? 0 : value;
}

export function InboxHistoryTab({ onOpenException }: { onOpenException: (item: ExceptionItem) => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [kindFilter, setKindFilter] = useState<HistoryKind | undefined>();
  const [resultFilter, setResultFilter] = useState<HistoryResult | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data: exceptions = [] } = useQuery({ queryKey: ['exceptions'], queryFn: exceptionsApi.list });
  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });

  const unignoreMutation = useMutation({
    mutationFn: (id: string) => exceptionsApi.unignore(id),
    onSuccess: () => {
      message.success(t('inbox.restored'));
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const rows = useMemo<HistoryRow[]>(() => {
    const list: HistoryRow[] = [];

    for (const item of exceptions) {
      if (!item.resolved && !item.ignored) continue;
      list.push({
        key: `exception-${item.id}`,
        kind: 'exception',
        result: item.resolved ? 'resolved' : 'ignored',
        title: item.title,
        storeName: item.storeName,
        at: (item.resolved ? item.resolvedAt : item.ignoredAt) ?? item.createdAt,
        actor: item.resolved ? item.resolvedBy : item.ignoredBy,
        note: item.resolved ? item.resolutionNote : item.ignoreNote,
        exception: item,
      });
    }

    for (const approval of approvals) {
      if (approval.status === 'pending') continue;
      list.push({
        key: `approval-${approval.id}`,
        kind: 'approval',
        result: approval.status as HistoryResult,
        title: approval.title,
        storeName: approval.storeName,
        at: approval.decidedAt ?? approval.requestedAt,
        actor: approval.decidedBy,
        note: approval.decisionNote,
        approvalId: approval.id as number,
      });
    }

    return list.sort((a, b) => decidedAtValue(b) - decidedAtValue(a));
  }, [exceptions, approvals]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (kindFilter && row.kind !== kindFilter) return false;
      if (resultFilter && row.result !== resultFilter) return false;
      if (dateRange) {
        const day = dayjs(row.at).format('YYYY-MM-DD');
        if (day < dateRange[0] || day > dateRange[1]) return false;
      }
      return true;
    });
  }, [rows, kindFilter, resultFilter, dateRange]);

  const filtersActive = !!(kindFilter || resultFilter || dateRange);
  const clearFilters = () => { setKindFilter(undefined); setResultFilter(undefined); setDateRange(null); };

  const columns: ColumnsType<HistoryRow> = [
    {
      title: t('inbox.historyTime'),
      dataIndex: 'at',
      width: 150,
      sorter: (a, b) => decidedAtValue(a) - decidedAtValue(b),
      defaultSortOrder: 'descend',
      render: (at: string) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {dayjs(at).isValid() ? dayjs(at).format('YYYY-MM-DD HH:mm') : at}
        </Typography.Text>
      ),
    },
    {
      title: t('inbox.historyKind'),
      dataIndex: 'kind',
      width: 90,
      render: (kind: HistoryKind) => (
        <Tag color={kind === 'approval' ? 'blue' : 'orange'} style={{ margin: 0 }}>
          {t(`inbox.kind_${kind}`)}
        </Tag>
      ),
    },
    { title: t('inbox.historyItem'), dataIndex: 'title', ellipsis: true },
    { title: t('exc.store'), dataIndex: 'storeName', width: 130, ellipsis: true },
    {
      title: t('inbox.historyResult'),
      dataIndex: 'result',
      width: 90,
      render: (result: HistoryResult) => (
        <Tag color={RESULT_COLORS[result]} style={{ margin: 0 }}>{t(`inbox.historyResult_${result}`)}</Tag>
      ),
    },
    {
      title: t('inbox.historyActor'),
      dataIndex: 'actor',
      width: 100,
      render: (actor?: string) => actor ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: t('inbox.historyNote'),
      dataIndex: 'note',
      ellipsis: true,
      render: (note?: string) => note
        ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>{note}</Typography.Text>
        : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: t('common.actions'),
      width: 150,
      render: (_: unknown, row: HistoryRow) => (
        <TableActionGroup>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              if (row.kind === 'approval' && row.approvalId != null) navigate(`/agents/approvals/${row.approvalId}`);
              else if (row.exception) onOpenException(row.exception);
            }}
          >
            {t('common.view')}
          </Button>
          {/* An ignored exception can come back into the queue — the exception centre's
              "恢复" action, kept alive here since that page is going away. */}
          {row.result === 'ignored' && row.exception && (
            <Button
              size="small"
              icon={<UndoOutlined />}
              loading={unignoreMutation.isPending}
              onClick={() => unignoreMutation.mutate(row.exception!.id)}
            >
              {t('inbox.restore')}
            </Button>
          )}
        </TableActionGroup>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageFilterBar>
        <Select
          allowClear
          placeholder={t('inbox.historyFilterKind')}
          value={kindFilter}
          onChange={setKindFilter}
          options={[
            { value: 'exception', label: t('inbox.kind_exception') },
            { value: 'approval', label: t('inbox.kind_approval') },
          ]}
        />
        <Select
          allowClear
          placeholder={t('inbox.historyFilterResult')}
          value={resultFilter}
          onChange={setResultFilter}
          options={(['resolved', 'ignored', 'approved', 'rejected', 'expired'] as HistoryResult[]).map((value) => ({
            value,
            label: t(`inbox.historyResult_${value}`),
          }))}
        />
        <DatePicker.RangePicker
          size="middle"
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            else setDateRange(null);
          }}
        />
      </PageFilterBar>

      <DataTableCard<HistoryRow>
        rowKey="key"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 15, size: 'small', showTotal: (total: number) => t('ordersv2.paginationTotal', { total }) }}
        locale={{
          emptyText: (
            <EmptyState
              description={filtersActive ? t('inbox.emptyFiltered') : t('inbox.historyEmpty')}
              actionText={filtersActive ? t('ordersv2.clearFilters') : undefined}
              onAction={filtersActive ? clearFilters : undefined}
            />
          ),
        }}
      />
    </Space>
  );
}
