/**
 * File: ApprovalDetailPage.tsx
 * Purpose: Approval detail with decision-grade evidence. Renders the real
 * structured before/after fields (deltas computed from data), an expiry
 * countdown with the policy's timeout consequence, dual-approval progress,
 * and a confirm-step decision flow with an optional note. Self-contained and
 * readable at phone width for IM deep links.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - ApprovalDetailPage: route-level approval detail page.
 *
 * Major updates:
 * - 2026-07-22: WS-B — B3 real evidence (keyword heuristic deleted), B4 decision
 *   safeguards (confirm + note, countdown, dual-approval progress, task link),
 *   B7 mobile-readable layout + breadcrumb/back, B8 theme tokens.
 */
import { ArrowRightOutlined, CheckOutlined, ClockCircleOutlined, CloseOutlined, RobotOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Col, Row, Space, Steps, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { approvalsApi } from '../../api/approvals';
import { useI18n } from '../../app/i18n';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { DetailSection } from '../../components/detail/DetailSection';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { parseAllMallId } from '../../utils/id';
import {
  URGENCY_COLORS,
  computeEvidenceDelta,
  formatAge,
  formatRemaining,
  getApprovalUrgency,
  timeoutConsequenceKey
} from '../inbox/urgency';
import { ApprovalDecisionModal, type ApprovalDecision } from './ApprovalDecisionModal';

export function ApprovalDetailPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { approvalId } = useParams();
  const parsedApprovalId = parseAllMallId(approvalId);
  const queryClient = useQueryClient();
  const [pendingDecision, setPendingDecision] = useState<ApprovalDecision | null>(null);
  // Re-render every 30s so the expiry countdown stays fresh.
  const [clock, setClock] = useState(() => dayjs());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(dayjs()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: approval } = useQuery({
    queryKey: ['approval', parsedApprovalId],
    queryFn: () => approvalsApi.get(parsedApprovalId!),
    enabled: parsedApprovalId !== undefined
  });
  const decide = useMutation({
    mutationFn: ({ status, note }: { status: ApprovalDecision; note?: string }) =>
      approvalsApi.decide(parsedApprovalId!, status, note),
    onSuccess: (result) => {
      setPendingDecision(null);
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
      queryClient.invalidateQueries({ queryKey: ['approval', parsedApprovalId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  if (!approval) return <EmptyState description={t('approval.notFound')} />;

  const urgency = getApprovalUrgency(approval, clock);
  const isDual = urgency?.policy.action === 'dual_approval';
  const completedApprovals = approval.priorApprovals?.length ?? 0;
  const isPending = approval.status === 'pending';

  return (
    <div className="page-stack">
      <PageHeader
        title={approval.title}
        description={approval.reason}
        breadcrumb={[
          { title: t('inbox.title'), href: '/inbox' },
          { title: t('approvals.title'), href: '/agents/approvals' },
          { title: approval.title }
        ]}
        onBack={() => navigate(-1)}
        actions={
          isPending ? (
            <Space wrap>
              <Button icon={<CloseOutlined />} danger onClick={() => setPendingDecision('rejected')}>
                {t('approvals.reject')}
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => setPendingDecision('approved')}>
                {t('approvals.approve')}
              </Button>
            </Space>
          ) : null
        }
      />

      {/* B4: expiry countdown + timeout consequence */}
      {isPending && urgency && (
        <Alert
          showIcon
          icon={<ClockCircleOutlined />}
          type={urgency.tone === 'critical' ? 'error' : urgency.tone === 'warning' ? 'warning' : 'info'}
          message={
            <Space wrap size={8}>
              <Typography.Text strong style={{ color: URGENCY_COLORS[urgency.tone] }}>
                {formatRemaining(t, urgency.remainingMs)}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('approvalDetail.expiresAtLabel')}: {urgency.expiresAt.format('MM-DD HH:mm')} · {t(timeoutConsequenceKey(urgency.policy))}
              </Typography.Text>
            </Space>
          }
        />
      )}

      {/* B4: dual-approval progress */}
      {isDual && (
        <DetailSection title={t('approvalDetail.dualProgress')} spacing="bottom">
          <Steps
            size="small"
            current={isPending ? completedApprovals : 2}
            status={approval.status === 'rejected' ? 'error' : undefined}
            items={[
              {
                title: t('approvalDetail.firstApproval'),
                description: approval.priorApprovals?.[0]
                  ? `${approval.priorApprovals[0].approver} · ${dayjs(approval.priorApprovals[0].at).format('MM-DD HH:mm')}`
                  : undefined
              },
              {
                title: t('approvalDetail.secondApproval'),
                description:
                  isPending && completedApprovals >= 1
                    ? t('approvalDetail.waitingSecond')
                    : approval.decidedBy
                      ? `${approval.decidedBy} · ${dayjs(approval.decidedAt).format('MM-DD HH:mm')}`
                      : undefined
              }
            ]}
          />
          {approval.priorApprovals?.[0]?.note && (
            <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
              {t('approvalDetail.firstApproval')} · {t('approvalDetail.decisionNote')}: {approval.priorApprovals[0].note}
            </Typography.Paragraph>
          )}
        </DetailSection>
      )}

      <DescriptionPanel
        column={{ xs: 1, md: 2 }}
        size="default"
        items={[
          { label: t('approvals.agentHeader'), value: t(`agent.${approval.agentType}`) },
          { label: t('approvals.storeHeader'), value: approval.storeName },
          { label: t('approvals.riskHeader'), value: <StatusBadge value={approval.riskLevel} /> },
          { label: t('approvals.statusHeader'), value: <StatusBadge value={approval.status} /> },
          {
            label: t('approvals.requested'),
            value: `${dayjs(approval.requestedAt).format('YYYY-MM-DD HH:mm')}（${formatAge(t, approval.requestedAt, clock)}）`
          },
          {
            // B4: taskId links to the agent run/live console instead of plain text
            label: t('entity.task'),
            value: (
              <Link to={`/agents/${approval.agentType}`}>
                <RobotOutlined style={{ marginRight: 4 }} />
                #{approval.taskId} · {t('approvalDetail.viewRun')}
              </Link>
            )
          },
          {
            label: t('approvals.decided'),
            value: approval.decidedAt
              ? `${dayjs(approval.decidedAt).format('YYYY-MM-DD HH:mm')}${approval.decidedBy ? ` · ${approval.decidedBy}` : ''}`
              : t('approvals.waiting')
          },
          ...(approval.decisionNote
            ? [{ label: t('approvalDetail.decisionNote'), value: approval.decisionNote }]
            : [])
        ]}
      />

      <DetailSection title={t('approvals.detail')}>
        <Typography.Paragraph style={{ marginBottom: 0 }}>{approval.proposedAction}</Typography.Paragraph>
      </DetailSection>

      {/* B3: real structured before/after evidence with computed deltas */}
      <DetailSection
        title={
          <Space wrap>
            <span>{t('approvalDetail.evidence')}</span>
            {approval.evidence?.length ? (
              <Tag color="blue">{t('approvalDetail.changedFields', { count: approval.evidence.length })}</Tag>
            ) : null}
          </Space>
        }
      >
        {approval.evidence?.length ? (
          <div>
            <Row gutter={[8, 4]} style={{ paddingBottom: 8 }}>
              <Col md={6} xs={0}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('approvalDetail.field')}</Typography.Text></Col>
              <Col md={7} xs={0}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('approvals.before')}</Typography.Text></Col>
              <Col md={2} xs={0} />
              <Col md={6} xs={0}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('approvals.after')}</Typography.Text></Col>
              <Col md={3} xs={0}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('approvalDetail.delta')}</Typography.Text></Col>
            </Row>
            {approval.evidence.map((field) => {
              const delta = computeEvidenceDelta(field);
              return (
                <Row
                  key={field.label}
                  gutter={[8, 4]}
                  align="middle"
                  style={{ padding: '8px 0', borderTop: '1px solid var(--ark-border-soft)' }}
                >
                  <Col xs={24} md={6}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{field.label}</Typography.Text>
                  </Col>
                  <Col xs={10} md={7}>
                    <Typography.Text>{field.before}</Typography.Text>
                  </Col>
                  <Col xs={2} md={2} style={{ textAlign: 'center' }}>
                    <ArrowRightOutlined style={{ color: 'var(--ark-muted)', fontSize: 12 }} />
                  </Col>
                  <Col xs={12} md={6}>
                    <Typography.Text strong>{field.after}</Typography.Text>
                  </Col>
                  <Col xs={24} md={3}>
                    {delta ? (
                      <Tag color={delta.direction === 'up' ? 'blue' : 'orange'} style={{ margin: 0 }}>
                        {delta.text}
                      </Tag>
                    ) : (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
                    )}
                  </Col>
                </Row>
              );
            })}
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
              {t('approvalDetail.evidenceHint')}
            </Typography.Paragraph>
          </div>
        ) : (
          <div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              {t('approvalDetail.noEvidence')}
            </Typography.Paragraph>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <div style={{ background: 'var(--ark-panel-soft)', border: '1px solid var(--ark-border)', borderRadius: 8, padding: 12 }}>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {t('approvals.before')}
                  </Typography.Text>
                  <Typography.Text>{approval.beforeValue || '-'}</Typography.Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ background: 'var(--ark-panel-soft)', border: '1px solid var(--ark-border)', borderRadius: 8, padding: 12 }}>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {t('approvals.after')}
                  </Typography.Text>
                  <Typography.Text strong style={{ color: 'var(--ark-green)' }}>{approval.afterValue || '-'}</Typography.Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </DetailSection>

      {/* B4: confirm step with optional note — no single-click decisions */}
      <ApprovalDecisionModal
        approval={pendingDecision ? approval : null}
        decision={pendingDecision}
        submitting={decide.isPending}
        onCancel={() => setPendingDecision(null)}
        onConfirm={(note) => decide.mutate({ status: pendingDecision!, note: note || undefined })}
      />
    </div>
  );
}
