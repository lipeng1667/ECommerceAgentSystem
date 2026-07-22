import {
  AlertOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  MinusCircleOutlined,
  SafetyOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TruckOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AgentLogEntry, ExceptionItem, ExceptionType } from './exceptionCenterMockData';
import { LEVEL_COLORS } from './exceptionCenterMockData';

type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface ExceptionColumnHandlers {
  navigate: (path: string) => void;
  /** WS-B (B6): resolve/ignore open a confirm-with-note modal instead of acting directly */
  onRequestResolve: (record: ExceptionItem) => void;
  onRequestIgnore: (record: ExceptionItem) => void;
  onUnignore: (id: string) => void;
  onView: (record: ExceptionItem) => void;
}

function typeIcon(type: ExceptionType) {
  const icons: Record<ExceptionType, JSX.Element> = {
    review_negative: <StarOutlined />,
    chat_escalation: <MessageOutlined />,
    ad_low_roi: <ThunderboltOutlined />,
    logistics_stuck: <TruckOutlined />,
    compliance_flag: <SafetyOutlined />,
  };
  return icons[type];
}

function typeLabel(t: TFunction, type: ExceptionType) {
  return t(`exc.type_${type}`);
}

export function createExceptionColumns(t: TFunction, handlers: ExceptionColumnHandlers): ColumnsType<ExceptionItem> {
  return [
    {
      title: t('exc.type'),
      dataIndex: 'type',
      width: 110,
      render: (type: ExceptionType, record: ExceptionItem) => {
        const icons: Record<string, JSX.Element> = {
          critical: <ExclamationCircleOutlined style={{ color: 'var(--ark-red, #dc2626)', fontSize: 14 }} />,
          warning: <AlertOutlined style={{ color: 'var(--ark-orange)', fontSize: 14 }} />,
          info: <BellOutlined style={{ color: 'var(--ark-blue)', fontSize: 14 }} />,
        };
        return (
          <Space size={4}>
            {icons[record.level]}
            {typeIcon(type)}
          </Space>
        );
      },
    },
    {
      title: t('exc.title'),
      dataIndex: 'title',
      width: 200,
      render: (title: string, record: ExceptionItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ fontSize: 12 }}>{title}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {record.storeName} · {t(`agent.${record.agentType}`)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('exc.level'),
      dataIndex: 'level',
      width: 70,
      render: (level: string) => <Tag color={LEVEL_COLORS[level]} style={{ fontSize: 10, margin: 0 }}>{t(`exc.${level}`)}</Tag>,
    },
    {
      title: t('exc.assignee'),
      dataIndex: 'assignee',
      width: 80,
      render: (assignee: string | undefined) =>
        assignee ? (
          <Tag icon={<UserOutlined />} style={{ fontSize: 10, margin: 0 }}>{assignee}</Tag>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>-</Typography.Text>
        ),
    },
    {
      title: t('exc.summary'),
      dataIndex: 'summary',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('exc.createdAt'),
      dataIndex: 'createdAt',
      width: 100,
      render: (at: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{at}</Typography.Text>,
    },
    {
      // WS-B (B6): "去处理" is the primary first action; resolve/ignore are demoted
      // behind a confirm-with-note step handled by the page.
      title: t('common.actions'),
      width: 250,
      render: (_: unknown, record: ExceptionItem) => (
        <Space size={4} wrap>
          {record.linkTo && !record.resolved && !record.ignored && (
            <Button
              size="small"
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handlers.navigate(`${record.linkTo}?exc=${record.id}`)}
            >
              {t('exc.goHandle')}
            </Button>
          )}
          <Button size="small" type="link" onClick={() => handlers.onView(record)} style={{ padding: '0 4px' }}>
            {t('common.view')}
          </Button>
          {!record.resolved && !record.ignored && (
            <>
              <Button size="small" type="link" icon={<CheckCircleOutlined />} onClick={() => handlers.onRequestResolve(record)} style={{ padding: '0 4px' }}>
                {t('exc.resolve')}
              </Button>
              <Button size="small" type="link" icon={<MinusCircleOutlined />} onClick={() => handlers.onRequestIgnore(record)} style={{ padding: '0 4px' }}>
                {t('exc.ignore')}
              </Button>
            </>
          )}
          {record.ignored && (
            <>
              <Button size="small" type="link" icon={<UndoOutlined />} onClick={() => handlers.onUnignore(record.id)} style={{ padding: '0 4px' }}>
                {t('exc.unignore')}
              </Button>
              <Tooltip
                title={record.ignoredBy && record.ignoredAt
                  ? t('inbox.excHandledBy', { actor: record.ignoredBy, at: record.ignoredAt.slice(0, 16).replace('T', ' '), action: t('exc.ignore') })
                  : undefined}
              >
                <Tag color="default" style={{ fontSize: 10, margin: 0 }}>{t('exc.ignoredStatus')}</Tag>
              </Tooltip>
            </>
          )}
          {record.resolved && (
            <Tooltip
              title={record.resolvedBy && record.resolvedAt
                ? t('inbox.excHandledBy', { actor: record.resolvedBy, at: record.resolvedAt.slice(0, 16).replace('T', ' '), action: t('exc.resolve') })
                : undefined}
            >
              <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{t('exc.resolvedStatus')}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
}

export function createAgentLogColumns(t: TFunction): ColumnsType<AgentLogEntry> {
  return [
    {
      title: t('exc.logTime'),
      dataIndex: 'at',
      width: 60,
      render: (at: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{at}</Typography.Text>,
    },
    {
      title: t('exc.logAgent'),
      dataIndex: 'agentType',
      width: 110,
      render: (agentType: string) => <Tag>{t(`agent.${agentType}`)}</Tag>,
    },
    {
      title: t('exc.logAction'),
      dataIndex: 'action',
      width: 100,
      render: (action: string) => <Typography.Text strong>{action}</Typography.Text>,
    },
    {
      title: t('exc.logTarget'),
      dataIndex: 'target',
      ellipsis: true,
    },
    {
      title: t('exc.logResult'),
      dataIndex: 'result',
      width: 110,
      render: (result: string) => {
        const colors: Record<string, string> = { success: 'green', auto_resolved: 'blue', escalated: 'orange', blocked: 'red', failed: 'red' };
        return <Tag color={colors[result]}>{t(`exc.result_${result}`)}</Tag>;
      },
    },
    {
      title: t('exc.logSummary'),
      dataIndex: 'summary',
      ellipsis: true,
    },
  ];
}
