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
  HistoryOutlined,
  InboxOutlined,
  LoginOutlined,
  ThunderboltOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Checkbox, List, Modal, Popconfirm, Segmented, Select, Space, Tabs, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { approvalPolicyApi } from '../../api/approvalPolicies';
import { approvalsApi } from '../../api/approvals';
import { exceptionsApi } from '../../api/exceptions';
import type { ExceptionItem } from '../../api/exceptions';
import { fieldConflictsApi, mergeSuggestionsApi, newProductCandidatesApi, productListingsApi, productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { getExpiringInDays } from '../../utils/storeDisplay';
import { getSlaState, isOrderActionable } from '../../utils/orderSla';
import { EXCEPTION_ORDER_STATUSES } from '../../types/domain';
import { ApprovalDecisionModal, type ApprovalDecision } from '../approvals/ApprovalDecisionModal';
import { InboxHistoryTab } from './InboxHistoryTab';
import { InboxAutoHandledTab } from './InboxAutoHandledTab';
import { ASSIGNEE_OPTIONS } from '../operations/exceptionCenterMockData';
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
  Order,
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
  order?: Order;
  listing?: ProductListing;
  newProductCandidate?: NewProductCandidate;
  mergeSuggestion?: ProductMergeSuggestion;
  fieldConflict?: FieldConflict;
  /**
   * D7.3: set on proactive session-expiry warnings — the store is still connected, but
   * its authorization expires within the warning window. Distinguishes "act before it
   * breaks" from the reactive "already broken" re-login items.
   */
  expiresInDays?: number;
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

/** Approval-rule wording per policy action, shown on approval items (D9). */
const APPROVAL_ACTION_LABELS: Record<'auto_execute' | 'single_approval' | 'dual_approval', string> = {
  auto_execute: 'agent.autoExecute',
  single_approval: 'agent.singleApproval',
  dual_approval: 'agent.dualApproval'
};

const KIND_TAG_COLORS: Record<InboxItemKind, string> = {
  approval: 'blue',
  exception: 'orange',
  relogin: 'red',
  order_exception: 'volcano',
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
    value === 'all' || value === 'approval' || value === 'exception' || value === 'relogin' || value === 'order_exception' ||
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
  // D9: 待处理 / 自动处理 / 处理记录 — "what needs me → what the system did for me → what
  // I decided". Kept in `tab` so `?type=` keeps meaning "which kind of pending item";
  // the two params are independent and old links still work.
  const activeTab = searchParams.get('tab') === 'history' || searchParams.get('tab') === 'auto'
    ? (searchParams.get('tab') as 'history' | 'auto')
    : 'pending';
  const setActiveTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'pending') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };
  // Bulk actions cover exceptions only: exceptionsApi.batchResolve/batchIgnore are the
  // only batch endpoints, and approvals must stay one-by-one with their own confirm.
  const [selectedExceptionIds, setSelectedExceptionIds] = useState<string[]>([]);
  const [assignTarget, setAssignTarget] = useState<ExceptionItem | null>(null);
  const [assignee, setAssignee] = useState<string | undefined>();
  // Exception detail opened from the history tab.
  const [historyException, setHistoryException] = useState<ExceptionItem | null>(null);
  // Refresh countdowns periodically.
  const [clock, setClock] = useState(() => dayjs());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(dayjs()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });
  // D9: the approval policy table left the inbox — the question it answered ("why does
  // this need me?") is answered on the item itself instead.
  const { data: approvalPolicies = [] } = useQuery({ queryKey: ['approval-policies'], queryFn: approvalPolicyApi.list });
  const { data: exceptions = [] } = useQuery({ queryKey: ['exceptions'], queryFn: exceptionsApi.list });
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });
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
  const batchResolveMutation = useMutation({
    mutationFn: (ids: string[]) => exceptionsApi.batchResolve(ids),
    onSuccess: (_data, ids) => {
      message.success(t('inbox.batchResolveDone', { count: ids.length }));
      setSelectedExceptionIds([]);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
  const batchIgnoreMutation = useMutation({
    mutationFn: (ids: string[]) => exceptionsApi.batchIgnore(ids),
    onSuccess: (_data, ids) => {
      message.success(t('inbox.batchIgnoreDone', { count: ids.length }));
      setSelectedExceptionIds([]);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
  const assignMutation = useMutation({
    mutationFn: (input: { id: string; assignee: string }) => exceptionsApi.assign(input.id, input.assignee),
    onSuccess: () => {
      message.success(t('inbox.assignSuccess'));
      setAssignTarget(null);
      setAssignee(undefined);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
    }
  });
  const applyOrderRecMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.applyRecommendation(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderSync'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      message.success(t('inbox.orderRecommendationApplied'));
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
      if (store.status === 'login_required' || store.status === 'expired') {
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
        continue;
      }
      // D7.3: proactive expiry warning — a still-connected store whose authorization
      // runs out within the warning window becomes a "renew now" item before anything
      // breaks. Lower urgency than an already-expired session: nothing is paused yet.
      const expiringInDays = getExpiringInDays(store, clock);
      if (expiringInDays !== undefined) {
        list.push({
          key: `relogin-expiring-${store.id}`,
          kind: 'relogin',
          title: t('inbox.expiringTitle', { store: store.name }),
          summary: t('inbox.expiringSummary', {
            days: expiringInDays,
            date: dayjs(store.authExpiresAt).format('MM-DD HH:mm')
          }),
          storeName: store.name,
          urgencyRank: 2,
          createdAt: store.lastVerifiedAt,
          store,
          expiresInDays: expiringInDays,
          batchable: false
        });
      }
    }

    // D8/O4: orders that need a person — exceptions, plus orders about to miss (or that
    // have missed) the platform shipping deadline. Same "needs me" definition the orders
    // page and the sidebar badge use, so the three can never disagree.
    for (const order of orders) {
      if (!isOrderActionable(order, clock)) continue;
      const sla = getSlaState(order, clock);
      const storeName = stores.find((s) => s.id === order.storeId)?.name ?? '';
      const isException = EXCEPTION_ORDER_STATUSES.includes(order.status);
      const urgent = sla.tone === 'breached' || sla.tone === 'critical';
      // Tier 2 recommendations can be accepted in bulk; fraud release and cancel/refund
      // are Tier 3 and must stay one-by-one with a typed reason on the orders page.
      const tier2 = order.recommendation && order.recommendation.action !== 'release' && order.recommendation.action !== 'cancel_refund'
        ? order.recommendation
        : undefined;
      list.push({
        key: `order_exception-${order.id}`,
        kind: 'order_exception',
        title: isException
          ? t('inbox.orderExceptionTitle', { order: order.orderNo })
          : sla.tone === 'breached'
            ? t('inbox.orderSlaBreachedTitle', { order: order.orderNo })
            : t('inbox.orderSlaTitle', { order: order.orderNo }),
        // A Tier 3 exception (fraud, cancel/refund) has no one-click recommendation, so
        // fall back to why it was flagged rather than to deadline copy that may not apply.
        summary: tier2
          ? tier2.rationale
          : isException
            ? (order.exceptionReason?.split('\n')[0] ?? t('inbox.orderExceptionFallbackSummary'))
            : sla.tone === 'breached'
              ? t('inbox.orderSlaBreachedSummary')
              : t('inbox.orderSlaSummary'),
        storeName,
        urgencyRank: urgent ? 0 : 1,
        createdAt: order.createdAt,
        order,
        batchable: !!tier2?.batchable,
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
      approval: 0, exception: 0, relogin: 0, order_exception: 0, product_draft: 0, product_new: 0, product_merge: 0, product_conflict: 0
    };
    for (const entry of entries) byKind[entry.kind] += 1;
    return { ...byKind, all: entries.length };
  }, [entries]);

  const visibleEntries = filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter);
  // D7.3: ordered store ids for guided sequential re-login — already-expired stores
  // first (they block agents now), then the proactive expiry warnings.
  const reloginQueue = visibleEntries
    .filter((entry) => entry.kind === 'relogin' && entry.store)
    .map((entry) => entry.store!.id);
  const batchableEntries = visibleEntries.filter((entry) => entry.batchable);
  const batchAccepting = acceptNewProductMutation.isPending || mergeProductsMutation.isPending || resolveFieldConflictMutation.isPending || applyOrderRecMutation.isPending;

  const handleBatchAccept = async () => {
    const targets = [...batchableEntries];
    for (const entry of targets) {
      if (entry.kind === 'product_new' && entry.newProductCandidate) {
        await acceptNewProductMutation.mutateAsync(entry.newProductCandidate.id);
      } else if (entry.kind === 'product_merge' && entry.mergeSuggestion) {
        await mergeProductsMutation.mutateAsync(entry.mergeSuggestion.id);
      } else if (entry.kind === 'order_exception' && entry.order) {
        await applyOrderRecMutation.mutateAsync(entry.order.id);
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
          {/* D9: assignment moved here from the exception centre. */}
          <Button
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => { setAssignee(exception.assignee); setAssignTarget(exception); }}
          >
            {exception.assignee ? t('inbox.assignedTo', { name: exception.assignee }) : t('inbox.assign')}
          </Button>
          <Button size="small" type="link" style={{ padding: '0 4px' }} onClick={() => setHistoryException(exception)}>
            {t('inbox.viewDetail')}
          </Button>
        </Space>
      );
    }
    if (entry.kind === 'relogin' && entry.store) {
      const isProactive = entry.expiresInDays !== undefined;
      return (
        <Button
          size="small"
          type="primary"
          ghost={isProactive}
          icon={<LoginOutlined />}
          onClick={() => navigate(`/stores/${entry.store!.id}`)}
        >
          {isProactive ? t('inbox.renewNow') : t('inbox.goRelogin')}
        </Button>
      );
    }
    if (entry.kind === 'order_exception' && entry.order) {
      const order = entry.order;
      const tier2 = order.recommendation && order.recommendation.action !== 'release' && order.recommendation.action !== 'cancel_refund'
        ? order.recommendation
        : undefined;
      return (
        <Space size={4} wrap>
          {tier2 && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              loading={applyOrderRecMutation.isPending}
              onClick={() => applyOrderRecMutation.mutate(order.id)}
            >
              {t('inbox.acceptRecommended')}
            </Button>
          )}
          <Button
            size="small"
            type={tier2 ? 'default' : 'primary'}
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders?order=${order.id}`)}
          >
            {t('inbox.goHandle')}
          </Button>
        </Space>
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
        // The count lives on the 待处理 tab (and the nav item); repeating it in the title
        // said the same number three times on one screen.
        title={t('inbox.title')}
        description={t('inbox.description')}
        actions={activeTab !== 'pending' ? undefined : (
          <Space>
            {/* D7.3: guided sequential re-login — hands the whole set of stores to the
                store detail page as an ordered queue, so finishing one store offers the
                next instead of dropping the user back to a list. */}
            {filter === 'relogin' && reloginQueue.length > 1 && (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => navigate(`/stores/${reloginQueue[0]}?reloginQueue=${reloginQueue.join(',')}`)}
              >
                {t('inbox.batchReloginCta', { count: reloginQueue.length })}
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
        )}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: <span><InboxOutlined /> {t('inbox.tabPending')}{counts.all > 0 && <Badge count={counts.all} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}</span>,
            children: (
        <Card size="small">
          {/* D9: bulk resolve/ignore, migrated from the exception centre. Only exception
              items are selectable — they are the only kind with batch endpoints. */}
          {selectedExceptionIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {t('inbox.selectedCount', { count: selectedExceptionIds.length })}
              </Typography.Text>
              <Popconfirm
                title={t('inbox.batchResolve')}
                onConfirm={() => batchResolveMutation.mutate(selectedExceptionIds)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <Button size="small" type="primary" icon={<CheckOutlined />} loading={batchResolveMutation.isPending}>
                  {t('inbox.batchResolve')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('inbox.batchIgnore')}
                onConfirm={() => batchIgnoreMutation.mutate(selectedExceptionIds)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <Button size="small" icon={<CloseOutlined />} loading={batchIgnoreMutation.isPending}>
                  {t('inbox.batchIgnore')}
                </Button>
              </Popconfirm>
              <Button size="small" type="link" onClick={() => setSelectedExceptionIds([])}>
                {t('inbox.clearSelection')}
              </Button>
            </div>
          )}
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
              { value: 'order_exception', label: `${t('inbox.filterOrderException')} (${counts.order_exception})` },
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
                      <Checkbox
                        style={{ marginTop: 2 }}
                        disabled={entry.kind !== 'exception'}
                        title={entry.kind === 'exception' ? undefined : t('inbox.onlyExceptionsSelectable')}
                        checked={!!entry.exception && selectedExceptionIds.includes(entry.exception.id)}
                        onChange={(e) => {
                          if (!entry.exception) return;
                          const id = entry.exception.id;
                          setSelectedExceptionIds((prev) => e.target.checked ? [...prev, id] : prev.filter((x) => x !== id));
                        }}
                      />
                      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <Space size={6} wrap style={{ marginBottom: 4 }}>
                          <Tag color={KIND_TAG_COLORS[entry.kind]} style={{ margin: 0 }}>
                            {t(`inbox.kind_${entry.kind}`)}
                          </Tag>
                          {entry.approval && <StatusBadge value={entry.approval.riskLevel} />}
                        {entry.approval && (() => {
                          const policy = approvalPolicies.find((p) => p.riskLevel === entry.approval!.riskLevel);
                          // An item sitting in the approval queue while its policy says
                          // "no approval needed" would read as a contradiction, so the
                          // rule is only shown when it explains why this needs a person.
                          if (!policy || policy.action === 'auto_execute') return null;
                          return (
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {t(APPROVAL_ACTION_LABELS[policy.action])}
                            </Typography.Text>
                          );
                        })()}
                          {entry.exception && (
                            <Tag
                              color={entry.exception.level === 'critical' ? 'red' : entry.exception.level === 'warning' ? 'orange' : 'blue'}
                              style={{ margin: 0 }}
                            >
                              {t(`exc.${entry.exception.level}`)}
                            </Tag>
                          )}
                          {entry.kind === 'relogin' && (
                            entry.expiresInDays === undefined
                              ? <AlertOutlined style={{ color: 'var(--ark-red)' }} />
                              : <Tag color="orange" style={{ margin: 0 }}>{t('inbox.expiringTag', { days: entry.expiresInDays })}</Tag>
                          )}
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
            ),
          },
          {
            // Reads as a sequence with the other two: what needs me → what the system
            // did for me → what I decided.
            key: 'auto',
            label: <span><ThunderboltOutlined /> {t('inbox.tabAuto')}</span>,
            children: <InboxAutoHandledTab onShowPending={() => setActiveTab('pending')} />,
          },
          {
            key: 'history',
            label: <span><HistoryOutlined /> {t('inbox.tabHistory')}</span>,
            children: <InboxHistoryTab onOpenException={setHistoryException} />,
          },
        ]}
      />

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

      {/* D9: assign an owner — migrated from the exception centre. */}
      <Modal
        title={t('inbox.assignTitle')}
        open={!!assignTarget}
        onCancel={() => { setAssignTarget(null); setAssignee(undefined); }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !assignee, loading: assignMutation.isPending }}
        onOk={() => assignTarget && assignee && assignMutation.mutate({ id: assignTarget.id, assignee })}
        width={420}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>{assignTarget?.title}</Typography.Paragraph>
        <Select
          style={{ width: '100%' }}
          placeholder={t('inbox.assignTitle')}
          value={assignee}
          onChange={setAssignee}
          options={ASSIGNEE_OPTIONS.map((name) => ({ value: name, label: name }))}
        />
      </Modal>

      {/* Exception detail, shared by the pending queue and the history tab. */}
      <Modal
        title={historyException?.title}
        open={!!historyException}
        onCancel={() => setHistoryException(null)}
        footer={
          <Space wrap>
            <Button onClick={() => setHistoryException(null)}>{t('common.close')}</Button>
            {historyException?.linkTo && (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => { const target = historyException; setHistoryException(null); navigate(`${target.linkTo}?exc=${target.id}`); }}
              >
                {t('inbox.goHandle')}
              </Button>
            )}
          </Space>
        }
        width={560}
      >
        {historyException && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size={8} wrap>
              <Tag color={historyException.level === 'critical' ? 'red' : historyException.level === 'warning' ? 'orange' : 'blue'}>
                {t(`exc.${historyException.level}`)}
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {historyException.storeName} · {t(`agent.${historyException.agentType}`)}
              </Typography.Text>
            </Space>
            <Typography.Text>{historyException.summary}</Typography.Text>
            {historyException.detail && (
              <Card size="small" style={{ background: 'var(--ark-panel-soft)' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{historyException.detail}</pre>
              </Card>
            )}
            {historyException.suggestedAction && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('exc.suggestedAction')}: {historyException.suggestedAction}
              </Typography.Text>
            )}
            {historyException.assignee && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('inbox.assignedTo', { name: historyException.assignee })}
              </Typography.Text>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}
