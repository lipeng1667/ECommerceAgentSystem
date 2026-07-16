import {
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  ShoppingCartOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
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
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../app/i18n';
import { dashboardApi } from '../../api/dashboard';
import { exceptionsApi } from '../../api/exceptions';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ExceptionStatus>('pending');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<ExceptionItem | null>(null);
  const [assigneeModal, setAssigneeModal] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

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
    mutationFn: (id: string) => exceptionsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.resolved'));
      setDetailItem(null);
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: (id: string) => exceptionsApi.ignore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(t('exc.ignored'));
      setDetailItem(null);
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

  const columns = createExceptionColumns(t, {
    navigate,
    onIgnore: (id) => ignoreMutation.mutate(id),
    onResolve: (id) => resolveMutation.mutate(id),
    onUnignore: (id) => unignoreMutation.mutate(id),
    onView: (record) => {
      setDetailItem(record);
      setAssigneeModal(record.assignee);
    },
  });
  const logColumns = createAgentLogColumns(t);

  return (
    <div className="page-stack">
      <PageHeader
        title={t('exc.title')}
        description={t('exc.description')}
      />

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('exc.pending')}
              value={pendingCount}
              valueStyle={{ color: '#ea580c' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('exc.critical')}
              value={criticalCount}
              valueStyle={{ color: '#dc2626' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders')}
            style={{ cursor: 'pointer', borderLeft: '3px solid #7c3aed' }}
          >
            <Statistic
              title={t('exc.orderExceptions')}
              value={orderExceptions}
              valueStyle={{ color: '#7c3aed' }}
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
              valueStyle={{ color: '#16a34a' }}
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
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => batchResolveMutation.mutate(selectedRowKeys.map(String))}
                    >
                      {t('exc.batchResolve')} ({selectedRowKeys.length})
                    </Button>
                    <Button
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => batchIgnoreMutation.mutate(selectedRowKeys.map(String))}
                    >
                      {t('exc.batchIgnore')} ({selectedRowKeys.length})
                    </Button>
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
            <Space>
              <Button onClick={() => setDetailItem(null)}>{t('common.close')}</Button>
              {!detailItem.resolved && !detailItem.ignored && (
                <>
                  <Button icon={<MinusCircleOutlined />} onClick={() => ignoreMutation.mutate(detailItem.id)}>
                    {t('exc.ignore')}
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => resolveMutation.mutate(detailItem.id)}>
                    {t('exc.resolve')}
                  </Button>
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
              {detailItem.ignored && (
                <Descriptions.Item label={t('exc.ignoredStatus')}>
                  <Tag color="default">{t('exc.ignoredStatus')}</Tag>
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
            <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #dbeafe' }}>
              <Typography.Text>{detailItem.suggestedAction}</Typography.Text>
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
}
