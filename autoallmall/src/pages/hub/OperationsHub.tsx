import React from 'react';
import {
  Card,
  Col,
  Row,
  Progress,
  Tag,
  Typography,
  Button,
  Space,
  message,
} from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  StarOutlined,
  MessageOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockAgents, mockReport, filterByStore } from '../../mock/data';

const { Text, Paragraph } = Typography;

const LEVEL_META: Record<string, { color: string; borderColor: string; bgColor: string }> = {
  critical: { color: '#EF4444', borderColor: '#EF4444', bgColor: '#FEF2F2' },
  medium: { color: '#F59E0B', borderColor: '#F59E0B', bgColor: '#FFFBEB' },
  normal: { color: '#10B981', borderColor: '#10B981', bgColor: '#ECFDF5' },
};

const LEVEL_TAG_COLOR: Record<string, string> = {
  critical: 'red',
  medium: 'orange',
  normal: 'green',
};

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
};

export function OperationsHub() {
  const { t } = useI18n();
  const { storeId, stores } = useStoreScope();

  const storeName = stores.find((s) => s.id === storeId)?.name;

  const runningAgents = mockAgents.filter((a) => a.running);
  const totalAutoActions = mockReport.totalAutoActions;
  const hoursSaved = mockReport.hoursSaved;
  const allDecisions = mockReport.decisions;
  const filteredDecisions = filterByStore(allDecisions, storeId);
  const autoRate = mockReport.autoRate;
  const coverage = mockReport.moduleCoverage;

  const LEVEL_TEXTS: Record<string, string> = {
    critical: t('decision.levelCritical'),
    medium: t('decision.levelMedium'),
    normal: t('decision.levelNormal'),
  };

  const handleApprove = (id: string) => {
    message.success(`已批准决策 ${id}`);
  };

  const handleIgnore = (id: string) => {
    message.info(`已忽略决策 ${id}`);
  };

  const agentMetrics = [
    { label: t('hub.reviewReply'), count: 127, icon: <StarOutlined style={{ color: '#F59E0B' }} /> },
    { label: t('hub.orderProcess'), count: 58, icon: <CheckCircleOutlined style={{ color: '#10B981' }} /> },
    { label: t('hub.serviceChat'), count: 42, icon: <MessageOutlined style={{ color: '#4F46E5' }} /> },
    { label: t('hub.priceSuggest'), count: 47, icon: <DollarOutlined style={{ color: '#8B5CF6' }} /> },
    { label: t('hub.restockOrder'), count: 8, icon: <ShoppingCartOutlined style={{ color: '#06B6D4' }} /> },
  ];

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1280, margin: '0 auto' }}>
      {/* ===== Section 1: Agent Status Bar ===== */}
      <Card
        style={{ ...CARD_STYLE, marginBottom: 16 }}
        styles={{ body: { padding: '14px 20px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RobotOutlined style={{ fontSize: 18, color: '#4F46E5' }} />
            <Text strong style={{ fontSize: 14, color: '#1E293B' }}>
              Agent 运营状态
            </Text>
            <Space size={[4, 4]} wrap>
              {runningAgents.map((agent) => (
                <Tag key={agent.id} color="purple" style={{ margin: 0, fontSize: 12 }}>
                  {agent.nameZh}
                </Tag>
              ))}
            </Space>
          </div>
          {storeName && (
            <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>
              <ShopOutlined style={{ marginRight: 4 }} />
              {storeName}
            </Tag>
          )}
        </div>
      </Card>

      {/* ===== Section 2: Summary Row ===== */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card style={CARD_STYLE} styles={{ body: { padding: '16px 18px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#F3F0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RobotOutlined style={{ fontSize: 18, color: '#4F46E5' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                运行中 Agent
              </Text>
            </div>
            <Text strong style={{ fontSize: 28, color: '#4F46E5', lineHeight: 1.2 }}>
              {runningAgents.length}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={CARD_STYLE} styles={{ body: { padding: '16px 18px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThunderboltOutlined style={{ fontSize: 18, color: '#3B82F6' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                今日自动操作
              </Text>
            </div>
            <Text strong style={{ fontSize: 28, color: '#3B82F6', lineHeight: 1.2 }}>
              {totalAutoActions}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={CARD_STYLE} styles={{ body: { padding: '16px 18px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 18, color: '#10B981' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                节省时间
              </Text>
            </div>
            <Text strong style={{ fontSize: 28, color: '#10B981', lineHeight: 1.2 }}>
              {hoursSaved}
            </Text>
            <Text type="secondary" style={{ fontSize: 13, marginLeft: 2 }}>
              {' '}小时
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={CARD_STYLE} styles={{ body: { padding: '16px 18px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#FDF2F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChartOutlined style={{ fontSize: 18, color: '#EC4899' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                自动处理率
              </Text>
            </div>
            <Text strong style={{ fontSize: 28, color: '#EC4899', lineHeight: 1.2 }}>
              {autoRate}%
            </Text>
            <Progress
              percent={autoRate}
              strokeColor="#EC4899"
              trailColor="#F1F5F9"
              showInfo={false}
              size="small"
              style={{ marginTop: 4, marginBottom: 0 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== Section 3: Decisions + Automation (two-column) ===== */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Left: Decisions */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space size={8}>
                <CheckCircleOutlined style={{ color: '#4F46E5' }} />
                <Text strong style={{ fontSize: 15, color: '#1E293B' }}>
                  待决策事项
                </Text>
                <Tag style={{ margin: 0 }}>{filteredDecisions.length}</Tag>
              </Space>
            }
            style={{ ...CARD_STYLE, height: '100%' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            {filteredDecisions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                <CheckCircleFilled style={{ fontSize: 40, color: '#10B981', marginBottom: 12 }} />
                <div style={{ fontSize: 14 }}>暂无待决策事项</div>
              </div>
            ) : (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {filteredDecisions.map((dec) => {
                  const meta = LEVEL_META[dec.level];
                  return (
                    <Card
                      key={dec.id}
                      size="small"
                      style={{
                        borderRadius: 6,
                        borderLeft: `4px solid ${meta.borderColor}`,
                        border: `1px solid #E2E8F0`,
                        borderLeftWidth: 4,
                        borderLeftColor: meta.borderColor,
                        boxShadow: 'none',
                      }}
                      styles={{ body: { padding: '12px 14px' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Tag
                          color={LEVEL_TAG_COLOR[dec.level]}
                          style={{ margin: 0, fontSize: 12, lineHeight: '18px' }}
                        >
                          {LEVEL_TEXTS[dec.level]}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dec.agentName} · {dec.createdAt}
                        </Text>
                      </div>
                      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                        {dec.title}
                      </Text>
                      <Paragraph
                        type="secondary"
                        style={{ margin: '0 0 10px', fontSize: 13, lineHeight: '20px' }}
                        ellipsis={{ rows: 1 }}
                      >
                        {dec.summary}
                      </Paragraph>
                      <Space size={8}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleApprove(dec.id)}
                          style={{ fontSize: 12 }}
                        >
                          批准
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleIgnore(dec.id)}
                          style={{ fontSize: 12 }}
                        >
                          忽略
                        </Button>
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>

        {/* Right: Today's Automation Results */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space size={8}>
                <BarChartOutlined style={{ color: '#4F46E5' }} />
                <Text strong style={{ fontSize: 15, color: '#1E293B' }}>
                  今日成果
                </Text>
              </Space>
            }
            style={{ ...CARD_STYLE, height: '100%' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agentMetrics.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    {item.icon}
                    {item.label}
                  </span>
                  <Text strong style={{ fontSize: 20, color: '#1E293B' }}>
                    {item.count}
                  </Text>
                </div>
              ))}

              <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  自动处理率
                </Text>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#10B981', lineHeight: 1.3 }}>
                  {autoRate}%
                </div>
                <Progress
                  percent={autoRate}
                  strokeColor={{ from: '#4F46E5', to: '#10B981' }}
                  trailColor="#F1F5F9"
                  showInfo={false}
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ===== Section 4: Store Health ===== */}
      <Card
        title={
          <Space size={8}>
            <ShopOutlined style={{ color: '#4F46E5' }} />
            <Text strong style={{ fontSize: 15, color: '#1E293B' }}>
              店铺健康
            </Text>
          </Space>
        }
        style={CARD_STYLE}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                borderRadius: 6,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                GMV
              </Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', margin: '4px 0' }}>
                {mockReport.gmv}
              </div>
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 500 }}>
                {mockReport.gmvChange}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                borderRadius: 6,
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                好评率
              </Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', margin: '4px 0' }}>
                <StarOutlined style={{ color: '#F59E0B', marginRight: 6, fontSize: 20 }} />
                {mockReport.ratingScore}
              </div>
              <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: 500 }}>
                优秀
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                borderRadius: 6,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                库存周转
              </Text>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', margin: '4px 0' }}>
                {mockReport.inventoryTurnover}
              </div>
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: 500 }}>
                {mockReport.healthLabel}
              </Text>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>自动处理率</Text>
            <Text strong style={{ fontSize: 13, color: '#10B981' }}>
              {autoRate}%
            </Text>
          </div>
          <Progress
            percent={autoRate}
            strokeColor="#10B981"
            trailColor="#F1F5F9"
            format={() => `${autoRate}%`}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>
              Agent 覆盖率
            </Text>
            <Text strong style={{ fontSize: 13, color: '#4F46E5' }}>
              {coverage.covered}/{coverage.total}
            </Text>
          </div>
          <Progress
            percent={Math.round((coverage.covered / coverage.total) * 100)}
            strokeColor="#4F46E5"
            trailColor="#F1F5F9"
            format={() => `${coverage.covered}/${coverage.total}`}
          />
        </div>
      </Card>
    </div>
  );
}
