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
import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { AgentLogEntry, ExceptionItem, ExceptionType } from './exceptionCenterMockData';
import { LEVEL_COLORS } from './exceptionCenterMockData';

type TFunction = (key: string) => string;

interface ExceptionColumnHandlers {
  navigate: (path: string) => void;
  onIgnore: (id: string) => void;
  onResolve: (id: string) => void;
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
          critical: <ExclamationCircleOutlined style={{ color: '#dc2626', fontSize: 14 }} />,
          warning: <AlertOutlined style={{ color: '#ea580c', fontSize: 14 }} />,
          info: <BellOutlined style={{ color: '#2563eb', fontSize: 14 }} />,
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
      title: t('common.actions'),
      width: 240,
      render: (_: unknown, record: ExceptionItem) => (
        <Space size={0} wrap>
          <Button size="small" type="link" onClick={() => handlers.onView(record)} style={{ padding: '0 4px' }}>
            {t('common.view')}
          </Button>
          {!record.resolved && !record.ignored && (
            <>
              <Button size="small" type="link" icon={<CheckCircleOutlined />} onClick={() => handlers.onResolve(record.id)} style={{ padding: '0 4px' }}>
                {t('exc.resolve')}
              </Button>
              <Button size="small" type="link" icon={<MinusCircleOutlined />} onClick={() => handlers.onIgnore(record.id)} style={{ padding: '0 4px' }}>
                {t('exc.ignore')}
              </Button>
            </>
          )}
          {record.ignored && (
            <>
              <Button size="small" type="link" icon={<UndoOutlined />} onClick={() => handlers.onUnignore(record.id)} style={{ padding: '0 4px' }}>
                {t('exc.unignore')}
              </Button>
              <Tag color="default" style={{ fontSize: 10, margin: 0 }}>{t('exc.ignoredStatus')}</Tag>
            </>
          )}
          {record.linkTo && !record.resolved && !record.ignored && (
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handlers.navigate(`${record.linkTo}?exc=${record.id}`)} style={{ padding: '0 4px' }}>
              {t('exc.goHandle')}
            </Button>
          )}
          {record.resolved && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{t('exc.resolvedStatus')}</Tag>}
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
