/**
 * File: InboxPage.tsx
 * Purpose: WS-B (B1) unified Action Inbox — the single "what needs me" queue.
 * Aggregates pending approvals, unresolved exceptions, and store re-login
 * requests into one urgency/expiry-ordered list with type filters, inline
 * quick actions (decisions still go through the confirm step), and deep links
 * to detail surfaces. `/agents/approvals` and `/agents/exceptions` remain as
 * filtered views of this queue (product decision D2).
 *
 * Author: Michael Lee
 * Created: 2026-07-22
 *
 * Main exports:
 * - InboxPage: route-level page mounted at /inbox.
 *
 * Major updates:
 * - 2026-07-22: WS-B — created per D2 / plan items B1–B2.
 */
import {
  AlertOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, List, Segmented, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { approvalsApi } from '../../api/approvals';
import { exceptionsApi } from '../../api/exceptions';
import type { ExceptionItem } from '../../api/exceptions';
import { productListingsApi, productsApi } from '../../api/products';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { ApprovalDecisionModal, type ApprovalDecision } from '../approvals/ApprovalDecisionModal';
import {
  URGENCY_COLORS,
  formatAge,
  formatRemaining,
  getApprovalUrgency,
  timeoutConsequenceKey
} from './urgency';
import type { Approval, InboxItemKind, ProductListing, Store } from '../../types/domain';

type InboxFilter = 'all' | InboxItemKind;

interface InboxEntry {
  key: string;
  kind: InboxItemKind;
  title: string;
  summary: string;
  storeName: string;
  /** 0 = most urgent */
  urgencyRank: number;
  createdAt?: string;
  approval?: Approval;
  exception?: ExceptionItem;
  store?: Store;
  listing?: ProductListing;
}

const KIND_TAG_COLORS: Record<InboxItemKind, string> = {
  approval: 'blue',
  exception: 'orange',
  relogin: 'red',
  product_draft: 'purple'
};

function isValidFilter(value: string | null): value is InboxFilter {
  return value === 'all' || value === 'approval' || value === 'exception' || value === 'relogin' || value === 'product_draft';
}

export function InboxPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: InboxFilter = isValidFilter(searchParams.get('type')) ? (searchParams.get('type') as InboxFilter) : 'all';
  const [decisionTarget, setDecisionTarget] = useState<{ approval: Approval; decision: ApprovalDecision } | null>(null);
  // Refresh countdowns periodically.
  const [clock, setClock] = useState(() => dayjs());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(dayjs()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });
  const { data: exceptions = [] } = useQuery({ queryKey: ['exceptions'], queryFn: exceptionsApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: productListings = [] } = useQuery({ queryKey: ['productListings'], queryFn: productListingsApi.list });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });

  const decide = useMutation({
    mutationFn: ({ approvalId, status, note }: { approvalId: number; status: ApprovalDecision; note?: string }) =>
      approvalsApi.decide(approvalId, status, note),
    onSuccess: (result) => {
      setDecisionTarget(null);
      if (result && !result.finalized) {
        message.info(
          t('approvalDetail.dualFirstRecorded', {
            completed: result.approvalsCompleted,
            required: result.approvalsRequired
          })
        );
      } else {
        message.success(t('approvals.updated'));
      }
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const entries = useMemo<InboxEntry[]>(() => {
    const list: InboxEntry[] = [];

    for (const approval of approvals) {
      if (approval.status !== 'pending') continue;
      const urgency = getApprovalUrgency(approval, clock);
      list.push({
        key: `approval-${approval.id}`,
        kind: 'approval',
        title: approval.title,
        summary: approval.proposedAction,
        storeName: approval.storeName,
        urgencyRank: urgency ? (urgency.tone === 'critical' ? 0 : urgency.tone === 'warning' ? 1 : 2) : 2,
        createdAt: approval.requestedAt,
        approval
      });
    }

    for (const exception of exceptions) {
      if (exception.resolved || exception.ignored) continue;
      list.push({
        key: `exception-${exception.id}`,
        kind: 'exception',
        title: exception.title,
        summary: exception.summary,
        storeName: exception.storeName,
        urgencyRank: exception.level === 'critical' ? 0 : exception.level === 'warning' ? 1 : 2,
        createdAt: exception.createdAt,
        exception
      });
    }

    for (const store of stores) {
      if (store.status !== 'login_required' && store.status !== 'expired') continue;
      list.push({
        key: `relogin-${store.id}`,
        kind: 'relogin',
        title: t('inbox.reloginTitle', { store: store.name }),
        summary: t('inbox.reloginSummary'),
        storeName: store.name,
        urgencyRank: 0,
        createdAt: store.lastVerifiedAt,
        store
      });
    }

    // D6/§3.14.9: draft/pending_review product listings fold into the inbox — informational,
    // low urgency (they don't block anything), sorted with everything else by recency.
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const listing of productListings) {
      if (listing.status !== 'draft' && listing.status !== 'pending_review') continue;
      const product = productById.get(listing.productId);
      if (!product) continue;
      const storeName = stores.find((s) => s.id === listing.storeId)?.name ?? '';
      list.push({
        key: `product_draft-${listing.id}`,
        kind: 'product_draft',
        title: product.name,
        summary: t(`inbox.productDraftSummary_${listing.status}`, { store: storeName }),
        storeName,
        urgencyRank: 3,
        createdAt: listing.lastSyncedAt,
        listing
      });
    }

    return list.sort((a, b) => {
      if (a.urgencyRank !== b.urgencyRank) return a.urgencyRank - b.urgencyRank;
      const remainingA = a.approval ? getApprovalUrgency(a.approval, clock)?.remainingMs : undefined;
      const remainingB = b.approval ? getApprovalUrgency(b.approval, clock)?.remainingMs : undefined;
      if (remainingA !== undefined && remainingB !== undefined) return remainingA - remainingB;
      if (remainingA !== undefined) return -1;
      if (remainingB !== undefined) return 1;
      return dayjs(b.createdAt ?? 0).valueOf() - dayjs(a.createdAt ?? 0).valueOf();
    });
  }, [approvals, exceptions, stores, productListings, products, clock, t]);

  const counts = useMemo(() => {
    const byKind: Record<InboxItemKind, number> = { approval: 0, exception: 0, relogin: 0, product_draft: 0 };
    for (const entry of entries) byKind[entry.kind] += 1;
    return { ...byKind, all: entries.length };
  }, [entries]);

  const visibleEntries = filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter);

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('inbox.title')} description={t('inbox.description')} />
        <StoreConnectionEmptyState description={t('inbox.emptyOnboarding')} />
      </div>
    );
  }

  const renderQuickActions = (entry: InboxEntry) => {
    if (entry.kind === 'approval' && entry.approval) {
      const approval = entry.approval;
      return (
        <Space size={4} wrap>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => setDecisionTarget({ approval, decision: 'approved' })}
          >
            {t('inbox.approve')}
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => setDecisionTarget({ approval, decision: 'rejected' })}
          >
            {t('inbox.reject')}
          </Button>
          <Link to={`/approvals/${approval.id}`}>
            <Button size="small" type="link" style={{ padding: '0 4px' }}>{t('inbox.viewDetail')}</Button>
          </Link>
        </Space>
      );
    }
    if (entry.kind === 'exception' && entry.exception) {
      const exception = entry.exception;
      return (
        <Space size={4} wrap>
          {exception.linkTo && (
            <Button
              size="small"
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`${exception.linkTo}?exc=${exception.id}`)}
            >
              {t('inbox.goHandle')}
            </Button>
          )}
          <Link to="/agents/exceptions">
            <Button size="small" type="link" style={{ padding: '0 4px' }}>{t('inbox.viewDetail')}</Button>
          </Link>
        </Space>
      );
    }
    if (entry.kind === 'relogin' && entry.store) {
      return (
        <Button
          size="small"
          type="primary"
          icon={<LoginOutlined />}
          onClick={() => navigate(`/stores/${entry.store!.id}`)}
        >
          {t('inbox.goRelogin')}
        </Button>
      );
    }
    if (entry.kind === 'product_draft' && entry.listing) {
      return (
        <Button
          size="small"
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/products/${entry.listing!.productId}`)}
        >
          {t('inbox.goToListing')}
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={
          <Space size={8}>
            <span>{t('inbox.title')}</span>
            {counts.all > 0 && <Badge count={counts.all} />}
          </Space>
        }
        description={t('inbox.description')}
      />

      <Card size="small">
        <Segmented
          size="small"
          value={filter}
          onChange={(value) => {
            const next = value as InboxFilter;
            setSearchParams(next === 'all' ? {} : { type: next }, { replace: true });
          }}
          options={[
            { value: 'all', label: `${t('inbox.filterAll')} (${counts.all})` },
            { value: 'approval', label: `${t('inbox.filterApprovals')} (${counts.approval})` },
            { value: 'exception', label: `${t('inbox.filterExceptions')} (${counts.exception})` },
            { value: 'relogin', label: `${t('inbox.filterRelogin')} (${counts.relogin})` },
            { value: 'product_draft', label: `${t('inbox.filterProductDrafts')} (${counts.product_draft})` }
          ]}
        />
        {visibleEntries.length === 0 ? (
          <div style={{ padding: '32px 0' }}>
            <EmptyState description={filter === 'all' ? t('inbox.empty') : t('inbox.emptyFiltered')} />
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={visibleEntries}
            rowKey={(entry) => entry.key}
            renderItem={(entry) => {
              const urgency = entry.approval ? getApprovalUrgency(entry.approval, clock) : undefined;
              return (
                <List.Item style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <Space size={6} wrap style={{ marginBottom: 4 }}>
                        <Tag color={KIND_TAG_COLORS[entry.kind]} style={{ margin: 0 }}>
                          {t(`inbox.kind_${entry.kind}`)}
                        </Tag>
                        {entry.approval && <StatusBadge value={entry.approval.riskLevel} />}
                        {entry.exception && (
                          <Tag
                            color={entry.exception.level === 'critical' ? 'red' : entry.exception.level === 'warning' ? 'orange' : 'blue'}
                            style={{ margin: 0 }}
                          >
                            {t(`exc.${entry.exception.level}`)}
                          </Tag>
                        )}
                        {entry.kind === 'relogin' && <AlertOutlined style={{ color: 'var(--ark-red, #dc2626)' }} />}
                      </Space>
                      <div>
                        {entry.kind === 'approval' && entry.approval ? (
                          <Link to={`/approvals/${entry.approval.id}`}>
                            <Typography.Text strong>{entry.title}</Typography.Text>
                          </Link>
                        ) : (
                          <Typography.Text strong>{entry.title}</Typography.Text>
                        )}
                      </div>
                      <Typography.Paragraph
                        type="secondary"
                        style={{ marginBottom: 4, fontSize: 12 }}
                        ellipsis={{ rows: 2 }}
                      >
                        {entry.summary}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {entry.storeName}
                        {entry.approval ? ` · ${t(`agent.${entry.approval.agentType}`)}` : ''}
                        {entry.exception ? ` · ${t(`agent.${entry.exception.agentType}`)}` : ''}
                        {entry.createdAt ? ` · ${formatAge(t, entry.createdAt, clock)}` : ''}
                      </Typography.Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {urgency && (
                        <Typography.Text
                          strong
                          style={{ fontSize: 12, color: URGENCY_COLORS[urgency.tone] }}
                          title={`${t('approvalDetail.expiresAtLabel')}: ${urgency.expiresAt.format('MM-DD HH:mm')} · ${t(timeoutConsequenceKey(urgency.policy))}`}
                        >
                          {formatRemaining(t, urgency.remainingMs)}
                        </Typography.Text>
                      )}
                      {renderQuickActions(entry)}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
        {counts.all > 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircleOutlined /> {t('inbox.pendingCount', { count: counts.all })}
          </Typography.Text>
        )}
      </Card>

      {/* Quick decisions still require the confirm step (B4) */}
      <ApprovalDecisionModal
        approval={decisionTarget?.approval ?? null}
        decision={decisionTarget?.decision ?? null}
        submitting={decide.isPending}
        onCancel={() => setDecisionTarget(null)}
        onConfirm={(note) =>
          decisionTarget &&
          decide.mutate({
            approvalId: decisionTarget.approval.id,
            status: decisionTarget.decision,
            note: note || undefined
          })
        }
      />
    </div>
  );
}
