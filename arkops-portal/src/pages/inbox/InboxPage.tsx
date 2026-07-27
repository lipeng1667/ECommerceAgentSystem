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
  LoginOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, List, Popconfirm, Segmented, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { approvalsApi } from '../../api/approvals';
import { exceptionsApi } from '../../api/exceptions';
import type { ExceptionItem } from '../../api/exceptions';
import { fieldConflictsApi, mergeSuggestionsApi, newProductCandidatesApi, productListingsApi, productsApi } from '../../api/products';
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
import type {
  Approval,
  FieldConflict,
  InboxItemKind,
  NewProductCandidate,
  Product,
  ProductListing,
  ProductMergeSuggestion,
  Store
} from '../../types/domain';

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
  newProductCandidate?: NewProductCandidate;
  mergeSuggestion?: ProductMergeSuggestion;
  fieldConflict?: FieldConflict;
  /** Whether this entry's recommended action is safe to include in "accept all recommended". */
  batchable: boolean;
}

/** Field-conflict labels use the short form (products.descriptionLabel), not the page subtitle (products.description). */
const FIELD_LABEL_KEYS: Record<FieldConflict['field'], string> = {
  name: 'products.name',
  category: 'products.category',
  cost: 'products.cost',
  description: 'products.descriptionLabel'
};

const KIND_TAG_COLORS: Record<InboxItemKind, string> = {
  approval: 'blue',
  exception: 'orange',
  relogin: 'red',
  product_draft: 'purple',
  product_new: 'cyan',
  product_merge: 'gold',
  product_conflict: 'volcano'
};

type TranslateFn = ReturnType<typeof useI18n>['t'];

/**
 * Field-conflict comparison (Node 7): platform value vs. your (locked) value, side by
 * side, with the recommended option highlighted — a basic version now; reconciling
 * several conflicting fields on one product into a single decision surface is deferred.
 */
function FieldConflictComparison({ conflict, t }: { conflict: FieldConflict; t: TranslateFn }) {
  const highlightStyle = (isRecommended: boolean): CSSProperties => ({
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    background: isRecommended ? 'color-mix(in srgb, var(--ark-green) 12%, var(--ark-panel))' : 'var(--ark-panel-soft)',
    border: `1px solid ${isRecommended ? 'var(--ark-green)' : 'var(--ark-border-soft)'}`,
  });

  return (
    <div style={{ marginBottom: 4 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t(FIELD_LABEL_KEYS[conflict.field])}：</Typography.Text>
      <Space size={8} wrap style={{ marginTop: 2 }}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{t('inbox.yourValueLabel')}</Typography.Text>
          <span style={highlightStyle(conflict.recommendation === 'keep_yours')}>{conflict.yourValue}</span>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>vs</Typography.Text>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{t('inbox.platformValueLabel')}</Typography.Text>
          <span style={highlightStyle(conflict.recommendation === 'accept_platform')}>{conflict.platformValue}</span>
        </div>
      </Space>
    </div>
  );
}

function isValidFilter(value: string | null): value is InboxFilter {
  return (
    value === 'all' || value === 'approval' || value === 'exception' || value === 'relogin' ||
    value === 'product_draft' || value === 'product_new' || value === 'product_merge' || value === 'product_conflict'
  );
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
  const { data: newProductCandidates = [] } = useQuery({ queryKey: ['newProductCandidates'], queryFn: newProductCandidatesApi.list });
  const { data: mergeSuggestions = [] } = useQuery({ queryKey: ['productMergeSuggestions'], queryFn: mergeSuggestionsApi.list });
  const { data: fieldConflicts = [] } = useQuery({ queryKey: ['fieldConflicts'], queryFn: fieldConflictsApi.list });

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

  // Smart Sync Tier 2 decisions (Node 3): one-click accept/dismiss inline in the inbox,
  // reusing the same mutations the Products page's merge queue and detail page use.
  const acceptNewProductMutation = useMutation({
    mutationFn: (id: number) => newProductCandidatesApi.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newProductCandidates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productListings'] });
      message.success(t('inbox.newProductAccepted'));
    }
  });
  const dismissNewProductMutation = useMutation({
    mutationFn: (id: number) => newProductCandidatesApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newProductCandidates'] });
      message.success(t('inbox.dismissed'));
    }
  });
  const mergeProductsMutation = useMutation({
    mutationFn: (id: number) => mergeSuggestionsApi.merge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productMergeSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productListings'] });
      message.success(t('inbox.merged'));
    }
  });
  const dismissMergeMutation = useMutation({
    mutationFn: (id: number) => mergeSuggestionsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productMergeSuggestions'] });
      message.success(t('inbox.dismissed'));
    }
  });
  const resolveFieldConflictMutation = useMutation({
    mutationFn: (input: { id: number; decision: 'keep_yours' | 'accept_platform' }) => fieldConflictsApi.resolve(input.id, input.decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldConflicts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success(t('inbox.conflictResolved'));
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
        approval,
        batchable: false
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
        exception,
        batchable: false
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
        store,
        batchable: false
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
        listing,
        batchable: false
      });
    }

    // Smart Sync Tier 2 (Node 3): possibly-new products, merge suggestions, and locked-
    // field conflicts all surface here too, each with a one-click accept for the AI
    // recommendation. Only unambiguous recommendations are "batchable" — a candidate
    // the AI itself flagged as a likely duplicate needs a person to look, not a
    // silent default, so it's excluded from "accept all recommended".
    for (const candidate of newProductCandidates) {
      const storeName = stores.find((s) => s.id === candidate.storeId)?.name ?? '';
      const duplicateOf = candidate.possibleDuplicateOfProductId != null
        ? products.find((p) => p.id === candidate.possibleDuplicateOfProductId)
        : undefined;
      list.push({
        key: `product_new-${candidate.id}`,
        kind: 'product_new',
        title: candidate.name,
        summary: candidate.recommendation === 'create_new'
          ? t('inbox.newProductSummaryCreate')
          : t('inbox.newProductSummaryDuplicate', { product: duplicateOf?.name ?? '' }),
        storeName,
        urgencyRank: 2,
        createdAt: candidate.createdAt,
        newProductCandidate: candidate,
        batchable: candidate.recommendation === 'create_new'
      });
    }

    for (const suggestion of mergeSuggestions) {
      const productA = productById.get(suggestion.productAId);
      const productB = productById.get(suggestion.productBId);
      if (!productA || !productB) continue;
      list.push({
        key: `product_merge-${suggestion.id}`,
        kind: 'product_merge',
        title: t('inbox.mergeTitle', { a: productA.name, b: productB.name }),
        summary: t('inbox.mergeSummary', { value: suggestion.confidence }),
        storeName: '',
        urgencyRank: 2,
        createdAt: suggestion.createdAt,
        mergeSuggestion: suggestion,
        batchable: true
      });
    }

    for (const conflict of fieldConflicts) {
      const product = productById.get(conflict.productId);
      if (!product) continue;
      const storeName = stores.find((s) => s.id === conflict.storeId)?.name ?? '';
      list.push({
        key: `product_conflict-${conflict.id}`,
        kind: 'product_conflict',
        title: t('inbox.conflictTitle', { product: product.name }),
        summary: t('inbox.conflictSummary', { field: t(FIELD_LABEL_KEYS[conflict.field]), yours: conflict.yourValue, platform: conflict.platformValue }),
        storeName,
        urgencyRank: 1,
        createdAt: conflict.createdAt,
        fieldConflict: conflict,
        batchable: true
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
  }, [approvals, exceptions, stores, productListings, products, newProductCandidates, mergeSuggestions, fieldConflicts, clock, t]);

  const counts = useMemo(() => {
    const byKind: Record<InboxItemKind, number> = {
      approval: 0, exception: 0, relogin: 0, product_draft: 0, product_new: 0, product_merge: 0, product_conflict: 0
    };
    for (const entry of entries) byKind[entry.kind] += 1;
    return { ...byKind, all: entries.length };
  }, [entries]);

  const visibleEntries = filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter);
  const batchableEntries = visibleEntries.filter((entry) => entry.batchable);
  const batchAccepting = acceptNewProductMutation.isPending || mergeProductsMutation.isPending || resolveFieldConflictMutation.isPending;

  const handleBatchAccept = async () => {
    const targets = [...batchableEntries];
    for (const entry of targets) {
      if (entry.kind === 'product_new' && entry.newProductCandidate) {
        await acceptNewProductMutation.mutateAsync(entry.newProductCandidate.id);
      } else if (entry.kind === 'product_merge' && entry.mergeSuggestion) {
        await mergeProductsMutation.mutateAsync(entry.mergeSuggestion.id);
      } else if (entry.kind === 'product_conflict' && entry.fieldConflict) {
        // Apply each conflict's own recommendation, not a blanket keep_yours — otherwise
        // "accept all recommended" would silently reject platform values it recommended.
        await resolveFieldConflictMutation.mutateAsync({ id: entry.fieldConflict.id, decision: entry.fieldConflict.recommendation });
      }
    }
    message.success(t('inbox.batchAcceptDone', { count: targets.length }));
  };

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
    if (entry.kind === 'product_new' && entry.newProductCandidate) {
      const candidate = entry.newProductCandidate;
      return (
        <Space size={4} wrap>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={acceptNewProductMutation.isPending}
            onClick={() => acceptNewProductMutation.mutate(candidate.id)}
          >
            {candidate.recommendation === 'create_new' ? t('inbox.acceptRecommended') : t('inbox.createAnyway')}
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            loading={dismissNewProductMutation.isPending}
            onClick={() => dismissNewProductMutation.mutate(candidate.id)}
          >
            {t('inbox.dismiss')}
          </Button>
        </Space>
      );
    }
    if (entry.kind === 'product_merge' && entry.mergeSuggestion) {
      const suggestion = entry.mergeSuggestion;
      return (
        <Space size={4} wrap>
          <Popconfirm title={t('products.mergeConfirm')} onConfirm={() => mergeProductsMutation.mutate(suggestion.id)} okText={t('common.confirm')} cancelText={t('common.cancel')}>
            <Button size="small" type="primary" icon={<CheckOutlined />} loading={mergeProductsMutation.isPending}>
              {t('inbox.acceptRecommended')}
            </Button>
          </Popconfirm>
          <Button size="small" icon={<CloseOutlined />} loading={dismissMergeMutation.isPending} onClick={() => dismissMergeMutation.mutate(suggestion.id)}>
            {t('inbox.dismiss')}
          </Button>
        </Space>
      );
    }
    if (entry.kind === 'product_conflict' && entry.fieldConflict) {
      const conflict = entry.fieldConflict;
      return (
        <Space size={4} wrap>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={resolveFieldConflictMutation.isPending}
            onClick={() => resolveFieldConflictMutation.mutate({ id: conflict.id, decision: 'keep_yours' })}
          >
            {t('inbox.keepYours')}
          </Button>
          <Button
            size="small"
            loading={resolveFieldConflictMutation.isPending}
            onClick={() => resolveFieldConflictMutation.mutate({ id: conflict.id, decision: 'accept_platform' })}
          >
            {t('inbox.acceptPlatform')}
          </Button>
        </Space>
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
        actions={
          <Space>
            {/* D7.3: batch re-login entry — when the relogin filter is active and
                there are stores needing re-login, offer a "go handle one by one" CTA
                that opens the health-summary sidebar and guides sequential action. */}
            {filter === 'relogin' && visibleEntries.length > 0 && (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => {
                  // Jump to the first store that needs re-login; the health
                  // summary bar on the store list will show remaining count.
                  const first = visibleEntries[0]?.store;
                  if (first) navigate(`/stores/${first.id}`);
                }}
              >
                {t('inbox.batchReloginCta', { count: visibleEntries.length })}
              </Button>
            )}
            {batchableEntries.length > 0 ? (
              <Popconfirm title={t('inbox.batchAcceptConfirm', { count: batchableEntries.length })} onConfirm={handleBatchAccept} okText={t('common.confirm')} cancelText={t('common.cancel')}>
                <Button type="primary" icon={<ThunderboltOutlined />} loading={batchAccepting}>
                  {t('inbox.batchAccept', { count: batchableEntries.length })}
                </Button>
              </Popconfirm>
            ) : undefined}
          </Space>
        }
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
            { value: 'product_draft', label: `${t('inbox.filterProductDrafts')} (${counts.product_draft})` },
            { value: 'product_new', label: `${t('inbox.filterProductNew')} (${counts.product_new})` },
            { value: 'product_merge', label: `${t('inbox.filterProductMerge')} (${counts.product_merge})` },
            { value: 'product_conflict', label: `${t('inbox.filterProductConflict')} (${counts.product_conflict})` }
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
                      {entry.kind === 'product_conflict' && entry.fieldConflict ? (
                        <FieldConflictComparison conflict={entry.fieldConflict} t={t} />
                      ) : (
                        <Typography.Paragraph
                          type="secondary"
                          style={{ marginBottom: 4, fontSize: 12 }}
                          ellipsis={{ rows: 2 }}
                        >
                          {entry.summary}
                        </Typography.Paragraph>
                      )}
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
