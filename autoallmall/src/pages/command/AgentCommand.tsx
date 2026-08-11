import React, { useState } from 'react';
import {
  Card,
  Col,
  Row,
  Tag,
  Typography,
  Table,
  Modal,
  message,
  Space,
} from 'antd';
import {
  StarOutlined,
  CustomerServiceOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  PlaySquareOutlined,
  DollarOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../app/i18n';
import { mockAgents, mockAgentLogs } from '../../mock/data';
import type { AgentStatus } from '../../types/domain';

const { Title, Text } = Typography;

const iconMap: Record<string, React.ReactNode> = {
  star: <StarOutlined />,
  service: <CustomerServiceOutlined />,
  box: <InboxOutlined />,
  order: <ShoppingCartOutlined />,
  gift: <GiftOutlined />,
  thunderbolt: <ThunderboltOutlined />,
  play: <PlaySquareOutlined />,
  dollar: <DollarOutlined />,
  picture: <PictureOutlined />,
};

const autonomyColorMap: Record<string, string> = {
  full_auto: 'green',
  semi_auto: 'orange',
  manual: 'blue',
  disabled: 'default',
};

const levelOptions = [
  { labelKey: 'command.fullAuto', value: 'full_auto', color: '#10B981' },
  { labelKey: 'command.semiAuto', value: 'semi_auto', color: '#F59E0B' },
  { labelKey: 'command.manual', value: 'manual', color: '#EF4444' },
  { labelKey: 'command.disabled', value: 'disabled', color: '#94A3B8' },
];

export function AgentCommand() {
  const { t } = useI18n();
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const autonomyLabelMap: Record<string, string> = {
    full_auto: t('command.fullAuto'),
    semi_auto: t('command.semiAuto'),
    manual: t('command.manual'),
    disabled: t('command.disabled'),
  };

  const handleAgentClick = (agent: AgentStatus) => {
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  const handleLevelChange = (level: string) => {
    if (!selectedAgent) return;
    const levelLabel = autonomyLabelMap[level] || level;
    message.info(
      t('command.levelChanged', { agent: selectedAgent.nameZh, level: levelLabel }),
    );
    setModalVisible(false);
    setSelectedAgent(null);
  };

  const columns = [
    {
      title: t('command.agentCol'),
      dataIndex: 'agentName',
      key: 'agentName',
    },
    {
      title: t('command.actionCol'),
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: t('command.timeCol'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('command.resultCol'),
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const isSuccess = result.includes('成功');
        return (
          <Tag
            color={isSuccess ? 'green' : 'orange'}
            style={{
              color: isSuccess ? '#10B981' : '#F59E0B',
              background: isSuccess ? '#ECFDF5' : '#FFFBEB',
              border: `1px solid ${isSuccess ? '#A7F3D0' : '#FDE68A'}`,
              borderRadius: 4,
            }}
          >
            {result}
          </Tag>
        );
      },
    },
    {
      title: t('command.levelCol'),
      dataIndex: 'autonomyLevel',
      key: 'autonomyLevel',
    },
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      <Title level={4} style={{ marginBottom: 20, color: '#1E293B' }}>
        {t('command.title')}
      </Title>

      {/* Section 1: Agent Status */}
      <Card
        title={
          <Text strong style={{ fontSize: 15 }}>
            {t('command.title')}
          </Text>
        }
        style={{ marginBottom: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[16, 16]}>
          {mockAgents.map((agent) => (
            <Col key={agent.id} sm={12} md={8} lg={6}>
              <Card
                size="small"
                hoverable
                onClick={() => handleAgentClick(agent)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
                styles={{ body: { padding: '14px 16px' } }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Icon + name + status dot */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Space size={8}>
                      <span style={{ color: '#4F46E5', fontSize: 16 }}>
                        {iconMap[agent.icon] || <StarOutlined />}
                      </span>
                      <Text strong style={{ fontSize: 13 }}>
                        {agent.nameZh}
                      </Text>
                    </Space>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: agent.running ? '#10B981' : '#D1D5DB',
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  {/* Autonomy tag */}
                  <div>
                    <Tag
                      color={autonomyColorMap[agent.autonomyLevel] || 'default'}
                      style={{ borderRadius: 4 }}
                    >
                      {autonomyLabelMap[agent.autonomyLevel] || agent.autonomyLevel}
                    </Tag>
                  </div>

                  {/* Today count */}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('command.actionsCount', { count: agent.todayCount })}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Section 2: Work Logs */}
      <Card
        title={
          <Text strong style={{ fontSize: 15 }}>
            {t('command.logs')}
          </Text>
        }
        style={{ marginBottom: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Table
          dataSource={mockAgentLogs}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ fontSize: 13 }}
        />
      </Card>

      {/* Section 3: Topology */}
      <Card
        title={
          <Text strong style={{ fontSize: 15 }}>
            {t('command.topologyTitle')}
          </Text>
        }
        style={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '20px' } }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '8px 0',
            gap: 0,
          }}
        >
          {mockAgents.map((agent, idx) => (
            <React.Fragment key={agent.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: '#CBD5E1',
                    flexShrink: 0,
                    margin: '0 2px',
                  }}
                />
              )}
              {/* Agent card */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#FAFBFC',
                  flexShrink: 0,
                  minWidth: 100,
                }}
              >
                <span style={{ color: '#4F46E5', fontSize: 18, marginBottom: 4 }}>
                  {iconMap[agent.icon] || <StarOutlined />}
                </span>
                <Text style={{ fontSize: 12, color: '#475569' }}>{agent.nameZh}</Text>
                <Tag
                  color={autonomyColorMap[agent.autonomyLevel] || 'default'}
                  style={{ fontSize: 10, borderRadius: 4, marginTop: 4, lineHeight: '16px' }}
                >
                  {autonomyLabelMap[agent.autonomyLevel] || agent.autonomyLevel}
                </Tag>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Autonomy Level Modal */}
      <Modal
        title={`${t('command.changeLevel')} - ${selectedAgent?.nameZh || ''}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedAgent(null);
        }}
        footer={null}
        width={420}
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {levelOptions.map((level) => {
            const isCurrent = selectedAgent?.autonomyLevel === level.value;
            return (
              <Card
                key={level.value}
                size="small"
                hoverable
                onClick={() => handleLevelChange(level.value)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 8,
                  border: `1px solid ${isCurrent ? level.color : '#E2E8F0'}`,
                  background: isCurrent ? `${level.color}08` : '#FFFFFF',
                }}
                styles={{ body: { padding: '14px 16px' } }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Space size={10}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: level.color,
                        flexShrink: 0,
                      }}
                    />
                    <Text strong style={{ fontSize: 14 }}>
                      {t(level.labelKey)}
                    </Text>
                  </Space>
                  {isCurrent && (
                    <Tag
                      color="processing"
                      style={{ borderRadius: 4, margin: 0 }}
                    >
                      {t('command.currentLevel')}
                    </Tag>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      </Modal>
    </div>
  );
}
