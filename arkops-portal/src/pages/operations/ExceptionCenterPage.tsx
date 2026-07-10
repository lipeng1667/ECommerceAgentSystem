import {
  AlertOutlined,
  CheckCircleOutlined,
  DashOutlined,
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../../app/i18n';
import { dashboardApi } from '../../api/dashboard';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
import { createAgentLogColumns, createExceptionColumns } from './exceptionCenterColumns';
import {
  ALL_AGENT_TYPES,
  ASSIGNEE_OPTIONS,
  LEVEL_COLORS,
  agentLogData,
  exceptionItems,
} from './exceptionCenterMockData';
import type { ExceptionItem, ExceptionStatus, ExceptionType } from './exceptionCenterMockData';

export function ExceptionCenterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState<ExceptionItem[]>(exceptionItems);
  const [filter, setFilter] = useState<ExceptionStatus>('pending');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<ExceptionItem | null>(null);
  const [assigneeModal, setAssigneeModal] = useState<string | undefined>(undefined);

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

  const pendingCount = items.filter((i) => !i.resolved && !i.ignored).length;
  const criticalCount = items.filter((i) => !i.resolved && !i.ignored && i.level === 'critical').length;

  const resolveItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, resolved: true, ignored: false } : i)));
    message.success(t('exc.resolved'));
    setDetailItem(null);
  };

  const ignoreItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ignored: true } : i)));
    message.success(t('exc.ignored'));
    setDetailItem(null);
  };

  const unignoreItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ignored: false } : i)));
    message.success(t('exc.unignore'));
  };

  const assignItem = (id: string, assignee: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, assignee } : i)));
    message.success(t('exc.assign') + ': ' + assignee);
  };

  const typeLabel = (type: ExceptionType) => t(`exc.type_${type}`);

  const columns = createExceptionColumns(t, {
    navigate,
    onIgnore: ignoreItem,
    onResolve: resolveItem,
    onUnignore: unignoreItem,
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
                      ...ALL_AGENT_TYPES.map((at) => ({ label: at, value: at })),
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
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filtered}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                  scroll={{ x: 1360 }}
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
                  <Button icon={<MinusCircleOutlined />} onClick={() => ignoreItem(detailItem.id)}>
                    {t('exc.ignore')}
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => resolveItem(detailItem.id)}>
                    {t('exc.resolve')}
                  </Button>
                </>
              )}
              {detailItem.ignored && (
                <Button type="primary" icon={<UndoOutlined />} onClick={() => { unignoreItem(detailItem.id); setDetailItem(null); }}>
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
              <Descriptions.Item label={t('exc.agent')}>{detailItem.agentType}</Descriptions.Item>
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
                      assignItem(detailItem.id, assigneeModal);
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
