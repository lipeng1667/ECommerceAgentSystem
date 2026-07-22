import {
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  MinusCircleOutlined,
  ShoppingCartOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Input,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState, type Key } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../app/i18n';
import { useAuth } from '../../app/auth';
import { dashboardApi } from '../../api/dashboard';
import { exceptionsApi } from '../../api/exceptions';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { createAgentLogColumns, createExceptionColumns } from './exceptionCenterColumns';
import {
  ALL_AGENT_TYPES,
  ASSIGNEE_OPTIONS,
  LEVEL_COLORS,
  agentLogData,
} from './exceptionCenterMockData';
import type { ExceptionItem, ExceptionStatus, ExceptionType } from './exceptionCenterMockData';

export function ExceptionCenterPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ExceptionStatus>('pending');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<ExceptionItem | null>(null);
  const [assigneeModal, setAssigneeModal] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  // WS-B (B6): resolve/ignore go through a confirm step with an optional note
  const [excDecision, setExcDecision] = useState<{ item: ExceptionItem; action: 'resolve' | 'ignore' } | null>(null);
  const [excNote, setExcNote] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['exceptions'],
    queryFn: exceptionsApi.list,
  });
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
  });
  const orderExceptions = dashboard?.orderExceptions ?? 0;

  const filtered = items.filter((i) => {
    // 状态筛选
    if (filter === 'pending') {
      if (i.resolved || i.ignored) return false;
    } else if (filter === 'resolved') {
      if (!i.resolved) return false;
    } else if (filter === 'ignored') {
      if (!i.ignored) return false;
    }
    // Agent 类型筛选
    if (agentFilter !== 'all' && i.agentType !== agentFilter) return false;
    return true;
  });

  // 优先级排序：critical 优先，同级别按时间倒序（新的在前）
  const sortedFiltered = [...filtered].sort((a, b) => {
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const pendingCount = items.filter((i) => !i.resolved && !i.ignored).length;
  const criticalCount = items.filter((i) => !i.resolved && !i.ignored && i.level === 'critical').length;

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => exceptionsApi.resolve(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.resolved'));
      setDetailItem(null);
      setExcDecision(null);
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => exceptionsApi.ignore(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.ignored'));
      setDetailItem(null);
      setExcDecision(null);
    },
  });

  const unignoreMutation = useMutation({
    mutationFn: (id: string) => exceptionsApi.unignore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.unignore'));
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string }) => exceptionsApi.assign(id, assignee),
    onSuccess: (_data, { assignee }) => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.assign') + ': ' + assignee);
    },
  });

  const batchResolveMutation = useMutation({
    mutationFn: (ids: string[]) => exceptionsApi.batchResolve(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.resolved'));
      setSelectedRowKeys([]);
    },
  });

  const batchIgnoreMutation = useMutation({
    mutationFn: (ids: string[]) => exceptionsApi.batchIgnore(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.ignored'));
      setSelectedRowKeys([]);
    },
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => setSelectedRowKeys(keys),
  };

  const typeLabel = (type: ExceptionType) => t(`exc.type_${type}`);

  const openDecision = (item: ExceptionItem, action: 'resolve' | 'ignore') => {
    setExcNote('');
    setExcDecision({ item, action });
  };

  const columns = createExceptionColumns(t, {
    navigate,
    onRequestResolve: (record) => openDecision(record, 'resolve'),
    onRequestIgnore: (record) => openDecision(record, 'ignore'),
    onUnignore: (id) => unignoreMutation.mutate(id),
    onView: (record) => {
      setDetailItem(record);
      setAssigneeModal(record.assignee);
    },
  });
  const logColumns = createAgentLogColumns(t);

  if (user?.experience === 'onboarding') {
    return (
      <div className="page-stack">
        <PageHeader title={t('exc.title')} description={t('exc.description')} />
        <StoreConnectionEmptyState description="当前没有运营异常。连接店铺后，订单、库存和 Agent 执行异常会集中显示在这里。" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* WS-B (B2): this page is a filtered view of the Action Inbox */}
      <PageHeader
        title={t('exc.title')}
        description={t('exc.description')}
        actions={
          <Link to="/inbox?type=exception">
            <Button icon={<InboxOutlined />}>{t('inbox.viewInInbox')}</Button>
          </Link>
        }
      />

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('exc.pending')}
              value={pendingCount}
              valueStyle={{ color: 'var(--ark-orange)' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('exc.critical')}
              value={criticalCount}
              valueStyle={{ color: 'var(--ark-red, #dc2626)' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders')}
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--ark-purple)' }}
          >
            <Statistic
              title={t('exc.orderExceptions')}
              value={orderExceptions}
              valueStyle={{ color: 'var(--ark-purple)' }}
              prefix={<ShoppingCartOutlined />}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 11 }}>→</Typography.Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('exc.autoProcessed')}
              value={agentLogData.filter((l) => l.result === 'success' || l.result === 'auto_resolved').length}
              valueStyle={{ color: 'var(--ark-green)' }}
              prefix={<CheckCircleOutlined />}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 12 }}>/ {agentLogData.length}</Typography.Text>}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="exceptions"
        items={[
          {
            key: 'exceptions',
            label: (
              <span>
                <AlertOutlined /> {t('exc.exceptionsTab')}
                {pendingCount > 0 && <Badge count={pendingCount} size="small" offset={[6, -4]} style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: (
              <>
                <PageFilterBar className="page-filter-bar-spaced">
                  <Segmented
                    size="small"
                    value={agentFilter}
                    onChange={(v) => setAgentFilter(v as string)}
                    options={[
                      { label: t('exc.allAgents'), value: 'all' },
                      ...ALL_AGENT_TYPES.map((at) => ({ label: t(`agent.${at}`), value: at })),
                    ]}
                  />
                  <Segmented
                    size="small"
                    value={filter}
                    onChange={(v) => setFilter(v as ExceptionStatus)}
                    options={[
                      { label: `${t('exc.pending')} (${pendingCount})`, value: 'pending' },
                      { label: t('exc.resolvedFilter'), value: 'resolved' },
                      { label: t('exc.ignoredFilter'), value: 'ignored' },
                      { label: t('exc.all'), value: 'all' },
                    ]}
                  />
                </PageFilterBar>
                {selectedRowKeys.length > 0 && (
                  <Space style={{ marginBottom: 8 }}>
                    {/* WS-B (B6): batch operations require confirmation */}
                    <Popconfirm
                      title={t('inbox.excBatchResolveConfirm', { count: selectedRowKeys.length })}
                      description={t('inbox.excResolveHint')}
                      okText={t('common.confirm')}
                      cancelText={t('common.cancel')}
                      onConfirm={() => batchResolveMutation.mutate(selectedRowKeys.map(String))}
                    >
                      <Button size="small" icon={<CheckCircleOutlined />}>
                        {t('exc.batchResolve')} ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title={t('inbox.excBatchIgnoreConfirm', { count: selectedRowKeys.length })}
                      description={t('inbox.excIgnoreHint')}
                      okText={t('common.confirm')}
                      cancelText={t('common.cancel')}
                      onConfirm={() => batchIgnoreMutation.mutate(selectedRowKeys.map(String))}
                    >
                      <Button size="small" icon={<MinusCircleOutlined />}>
                        {t('exc.batchIgnore')} ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  </Space>
                )}
                <Table
                  rowKey="id"
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={sortedFiltered}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                  scroll={{ x: 980 }}
                />
              </>
            ),
          },
          {
            key: 'log',
            label: <span><EyeOutlined /> {t('exc.agentLogTab')}</span>,
            children: (
              <Card>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  {t('exc.agentLogDesc')}
                </Typography.Paragraph>
                <Table
                  rowKey="id"
                  columns={logColumns}
                  dataSource={agentLogData}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                  scroll={{ x: 960 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* 异常详情弹窗 */}
      <Modal
        title={detailItem ? `${typeLabel(detailItem.type)} · ${detailItem.title}` : ''}
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        width={560}
        footer={
          detailItem ? (
            <Space wrap>
              <Button onClick={() => setDetailItem(null)}>{t('common.close')}</Button>
              {!detailItem.resolved && !detailItem.ignored && (
                <>
                  {/* WS-B (B6): resolve/ignore demoted behind confirm + note; 去处理 is primary */}
                  <Button icon={<MinusCircleOutlined />} onClick={() => openDecision(detailItem, 'ignore')}>
                    {t('exc.ignore')}
                  </Button>
                  <Button icon={<CheckCircleOutlined />} onClick={() => openDecision(detailItem, 'resolve')}>
                    {t('exc.resolve')}
                  </Button>
                  {detailItem.linkTo && (
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => { setDetailItem(null); navigate(`${detailItem.linkTo}?exc=${detailItem.id}`); }}
                    >
                      {t('exc.goHandle')}
                    </Button>
                  )}
                </>
              )}
              {detailItem.ignored && (
                <Button type="primary" icon={<UndoOutlined />} onClick={() => { unignoreMutation.mutate(detailItem.id); setDetailItem(null); }}>
                  {t('exc.unignore')}
                </Button>
              )}
            </Space>
          ) : (
            <Button onClick={() => setDetailItem(null)}>{t('common.close')}</Button>
          )
        }
      >
        {detailItem && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('exc.level')}>
                <Tag color={LEVEL_COLORS[detailItem.level]}>{t(`exc.${detailItem.level}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('exc.store')}>{detailItem.storeName}</Descriptions.Item>
              <Descriptions.Item label={t('exc.agent')}>{t(`agent.${detailItem.agentType}`)}</Descriptions.Item>
              <Descriptions.Item label={t('exc.createdAt')}>{detailItem.createdAt}</Descriptions.Item>
              {/* WS-B (B6): ignore/resolve show actor + timestamp + note */}
              {detailItem.ignored && (
                <Descriptions.Item label={t('exc.ignoredStatus')} span={2}>
                  <Space direction="vertical" size={0}>
                    <Tag color="default">{t('exc.ignoredStatus')}</Tag>
                    {detailItem.ignoredBy && detailItem.ignoredAt && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {t('inbox.excHandledBy', {
                          actor: detailItem.ignoredBy,
                          at: detailItem.ignoredAt.slice(0, 16).replace('T', ' '),
                          action: t('exc.ignore')
                        })}
                        {detailItem.ignoreNote ? ` · ${detailItem.ignoreNote}` : ''}
                      </Typography.Text>
                    )}
                  </Space>
                </Descriptions.Item>
              )}
              {detailItem.resolved && (
                <Descriptions.Item label={t('exc.resolvedStatus')} span={2}>
                  <Space direction="vertical" size={0}>
                    <Tag color="green">{t('exc.resolvedStatus')}</Tag>
                    {detailItem.resolvedBy && detailItem.resolvedAt && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {t('inbox.excHandledBy', {
                          actor: detailItem.resolvedBy,
                          at: detailItem.resolvedAt.slice(0, 16).replace('T', ' '),
                          action: t('exc.resolve')
                        })}
                        {detailItem.resolutionNote ? ` · ${detailItem.resolutionNote}` : ''}
                      </Typography.Text>
                    )}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 负责人分配 */}
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>{t('exc.assignee')}</Typography.Text>
              <Space>
                <Select
                  style={{ width: 160 }}
                  placeholder={t('exc.assignee')}
                  value={assigneeModal}
                  onChange={(v) => setAssigneeModal(v)}
                  allowClear
                  options={ASSIGNEE_OPTIONS.map((name) => ({ label: name, value: name }))}
                />
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    if (assigneeModal) {
                      assignMutation.mutate({ id: detailItem.id, assignee: assigneeModal });
                    }
                  }}
                >
                  {t('exc.assign')}
                </Button>
              </Space>
            </div>

            <Divider />
            <Typography.Title level={5}>{t('exc.detail')}</Typography.Title>
            <Typography.Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{detailItem.detail}</pre>
            </Typography.Paragraph>
            <Divider />
            <Typography.Title level={5}>{t('exc.suggestedAction')}</Typography.Title>
            {/* WS-B (B6/B8): suggestedAction wired to its target; tokens instead of hex */}
            <Card size="small" style={{ background: 'var(--ark-panel-soft)', border: '1px solid var(--ark-border)' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text>{detailItem.suggestedAction}</Typography.Text>
                {detailItem.linkTo && !detailItem.resolved && !detailItem.ignored && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    onClick={() => { setDetailItem(null); navigate(`${detailItem.linkTo}?exc=${detailItem.id}`); }}
                  >
                    {t('inbox.excSuggestedActionCta')}
                  </Button>
                )}
              </Space>
            </Card>
          </>
        )}
      </Modal>

      {/* WS-B (B6): confirm-with-note step for resolve/ignore */}
      <Modal
        open={!!excDecision}
        title={excDecision?.action === 'resolve' ? t('inbox.excResolveTitle') : t('inbox.excIgnoreTitle')}
        okText={excDecision?.action === 'resolve' ? t('exc.resolve') : t('exc.ignore')}
        cancelText={t('common.cancel')}
        okButtonProps={{
          danger: excDecision?.action === 'ignore',
          loading: resolveMutation.isPending || ignoreMutation.isPending
        }}
        onCancel={() => setExcDecision(null)}
        onOk={() => {
          if (!excDecision) return;
          const payload = { id: excDecision.item.id, note: excNote.trim() || undefined };
          if (excDecision.action === 'resolve') resolveMutation.mutate(payload);
          else ignoreMutation.mutate(payload);
        }}
        destroyOnClose
      >
        {excDecision && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={excDecision.action === 'resolve' ? 'info' : 'warning'}
              showIcon
              message={excDecision.action === 'resolve' ? t('inbox.excResolveHint') : t('inbox.excIgnoreHint')}
            />
            <Typography.Text strong>{excDecision.item.title}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {excDecision.item.storeName} · {t(`agent.${excDecision.item.agentType}`)} · {excDecision.item.summary}
            </Typography.Text>
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                {t('inbox.excNoteLabel')}
              </Typography.Text>
              <Input.TextArea
                rows={2}
                maxLength={200}
                value={excNote}
                onChange={(event) => setExcNote(event.target.value)}
                placeholder={t('inbox.excNotePlaceholder')}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
