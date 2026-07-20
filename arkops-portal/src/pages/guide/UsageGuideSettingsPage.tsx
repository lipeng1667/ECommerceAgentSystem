import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  QuestionCircleOutlined,
  RiseOutlined,
  RobotOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Card, Col, Divider, Row, Space, Steps, Tag, Timeline, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';

export function UsageGuideSettingsPage() {
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <PageHeader
        title={t('settings.guideTitle')}
        description={t('settings.guideDescription')}
      />

      {/* ===== 产品简介 ===== */}
      <Card style={{ marginBottom: 24 }}>
        <Typography.Title level={4}>
          <RobotOutlined style={{ marginRight: 8, color: '#2563eb' }} />
          {t('guide.whatIsArkops')}
        </Typography.Title>
        <Typography.Paragraph style={{ fontSize: 13, lineHeight: 1.8 }}>
          {t('guide.whatIsArkopsDesc')}
        </Typography.Paragraph>
      </Card>

      {/* ===== 快速开始 ===== */}
      <Card
        title={<><ThunderboltOutlined style={{ marginRight: 8 }} />{t('guide.quickstart')}</>}
        style={{ marginBottom: 24 }}
      >
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={[
            {
              title: <Typography.Text strong>{t('guide.step1Title')}</Typography.Text>,
              description: t('guide.step1Desc'),
              icon: <ShopOutlined />
            },
            {
              title: <Typography.Text strong>{t('guide.step2Title')}</Typography.Text>,
              description: t('guide.step2Desc'),
              icon: <ExperimentOutlined />
            },
            {
              title: <Typography.Text strong>{t('guide.step3Title')}</Typography.Text>,
              description: t('guide.step3Desc'),
            },
            {
              title: <Typography.Text strong>{t('guide.step4Title')}</Typography.Text>,
              description: t('guide.step4Desc'),
            }
          ]}
        />
      </Card>

      {/* ===== Agent 运行流程 ===== */}
      <Card title={<><ScheduleOutlined style={{ marginRight: 8 }} />{t('guide.agentFlow')}</>} style={{ marginBottom: 24 }}>
        <Row gutter={[12, 8]} style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #bfdbfe' }}>
              <Typography.Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
                共 <Typography.Text strong style={{ color: '#2563eb', fontSize: 18 }}>15</Typography.Text> 个 Agent，按 5 层分布：基础管道 <Tag color="red" style={{ margin: '0 2px' }}>2</Tag> + 支撑服务 <Tag color="purple" style={{ margin: '0 2px' }}>3</Tag> + 流量引擎 <Tag color="blue" style={{ margin: '0 2px' }}>3</Tag> + 增值运营 <Tag color="green" style={{ margin: '0 2px' }}>5</Tag> + 独立服务 <Tag color="orange" style={{ margin: '0 2px' }}>2</Tag>
              </Typography.Text>
            </Card>
          </Col>
        </Row>

        {/* 第 1 层：基础管道 */}
        <Card size="small" style={{ marginBottom: 12, borderLeft: '3px solid #dc2626' }}>
          <Typography.Text strong>
            <Tag color="red">2</Tag> {t('agent.layer_foundation')} — {t('guide.flowLayer1Title')}
          </Typography.Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag color="red" style={{ fontSize: 13, padding: '2px 10px' }}>店铺保活 Agent</Tag>
            <Tag color="red" style={{ fontSize: 13, padding: '2px 10px' }}>商品上架 Agent</Tag>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
            {t('guide.flowLayer1Desc')}
          </Typography.Paragraph>
        </Card>

        {/* 第 2 层：支撑服务 */}
        <Card size="small" style={{ marginBottom: 12, borderLeft: '3px solid #7c3aed' }}>
          <Typography.Text strong>
            <Tag color="purple">3</Tag> {t('agent.layer_support')} — {t('guide.flowLayer2Title')}
          </Typography.Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px' }}>市场情报 Agent</Tag>
            <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px' }}>素材工厂 Agent</Tag>
            <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px' }}>库存预警 Agent</Tag>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
            {t('guide.flowLayer2Desc')}
          </Typography.Paragraph>
        </Card>

        {/* 第 3 层：流量引擎 */}
        <Card size="small" style={{ marginBottom: 12, borderLeft: '3px solid #2563eb' }}>
          <Typography.Text strong>
            <Tag color="blue">3</Tag> {t('agent.layer_traffic')} — {t('guide.flowLayer3Title')}
          </Typography.Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>广告投放 Agent</Tag>
            <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>定价策略 Agent</Tag>
            <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>直播运营 Agent</Tag>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
            {t('guide.flowLayer3Desc')}
          </Typography.Paragraph>
        </Card>

        {/* 第 4 层：增值运营 */}
        <Card size="small" style={{ marginBottom: 12, borderLeft: '3px solid #16a34a' }}>
          <Typography.Text strong>
            <Tag color="green">5</Tag> {t('agent.layer_growth')} — {t('guide.flowLayer4Title')}
          </Typography.Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>CRM 复购 Agent</Tag>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>评价管理 Agent</Tag>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>客服消息 Agent</Tag>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>售后处理 Agent</Tag>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>促销活动 Agent</Tag>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
            {t('guide.flowLayer4Desc')}
          </Typography.Paragraph>
        </Card>

        {/* 第 5 层：独立服务 */}
        <Card size="small" style={{ marginBottom: 8, borderLeft: '3px solid #ea580c' }}>
          <Typography.Text strong>
            <Tag color="orange">2</Tag> {t('agent.layer_standalone')} — {t('guide.flowLayer5Title')}
          </Typography.Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag color="orange" style={{ fontSize: 13, padding: '2px 10px' }}>风险控制 Agent</Tag>
            <Tag color="orange" style={{ fontSize: 13, padding: '2px 10px' }}>财务对账 Agent</Tag>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
            {t('guide.flowLayer5Desc')}
          </Typography.Paragraph>
        </Card>

        <Divider />

        {/* 依赖链路 */}
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          <RiseOutlined style={{ marginRight: 6 }} />{t('guide.depChain')}
        </Typography.Title>
        <Card size="small" style={{ background: 'var(--ark-panel-soft)', marginBottom: 8 }}>
          <Typography.Paragraph style={{ margin: 0, fontSize: 13, lineHeight: 1.8, fontFamily: 'monospace' }}>
            {t('guide.depChainDesc')}
          </Typography.Paragraph>
        </Card>
      </Card>

      {/* ===== 触发模式 ===== */}
      <Card title={<><ClockCircleOutlined style={{ marginRight: 8 }} />{t('guide.triggerModes')}</>} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f0f5ff', borderLeft: '3px solid #7c3aed', height: '100%' }}>
              <Typography.Text strong style={{ color: '#7c3aed' }}>
                <Tag color="purple" style={{ marginRight: 6 }}>{t('guide.triggerModeScheduled')}</Tag>
              </Typography.Text>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                {t('guide.triggerModeScheduledDesc')}
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f0fdf4', borderLeft: '3px solid #16a34a', height: '100%' }}>
              <Typography.Text strong style={{ color: '#16a34a' }}>
                <Tag color="green" style={{ marginRight: 6 }}>{t('guide.triggerModeEvent')}</Tag>
              </Typography.Text>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                {t('guide.triggerModeEventDesc')}
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#fff7ed', borderLeft: '3px solid #ea580c', height: '100%' }}>
              <Typography.Text strong style={{ color: '#ea580c' }}>
                <Tag color="orange" style={{ marginRight: 6 }}>{t('guide.triggerModeManual')}</Tag>
              </Typography.Text>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                {t('guide.triggerModeManualDesc')}
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ===== 任务标签说明 ===== */}
      <Card title={<><UnorderedListOutlined style={{ marginRight: 8 }} />{t('guide.taskLabels')}</>} style={{ marginBottom: 24 }}>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
          {t('guide.taskLabelsDesc')}
        </Typography.Paragraph>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}>
            <Space>
              <Tag color="blue">{t('guide.labelSystemAuto')}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('guide.labelSystemAutoDesc')}</Typography.Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space>
              <Tag color="orange">{t('guide.labelManualTrigger')}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('guide.labelManualTriggerDesc')}</Typography.Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space>
              <Tag color="green">{t('guide.labelAutoExecute')}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('guide.labelAutoExecuteDesc')}</Typography.Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space>
              <Tag color="purple">{t('guide.labelScheduledPatrol')}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('guide.labelScheduledPatrolDesc')}</Typography.Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ===== 核心概念 ===== */}
      <Card
        title={<><QuestionCircleOutlined style={{ marginRight: 8 }} />核心概念</>}
        style={{ marginBottom: 24 }}
      >
        <Typography.Paragraph style={{ marginBottom: 12 }}>
          <Typography.Text strong><SafetyOutlined style={{ color: '#dc2626', marginRight: 4 }} />{t('guide.conceptRequired')}：</Typography.Text>
          {t('guide.conceptRequiredDesc')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 12 }}>
          <Typography.Text strong><RiseOutlined style={{ color: '#2563eb', marginRight: 4 }} />{t('guide.conceptDependency')}：</Typography.Text>
          {t('guide.conceptDependencyDesc')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 12 }}>
          <Typography.Text strong><SafetyOutlined style={{ color: '#16a34a', marginRight: 4 }} />{t('guide.conceptRiskControl')}：</Typography.Text>
          {t('guide.conceptRiskControlDesc')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 12 }}>
          <Typography.Text strong><Tag color="blue" style={{ marginRight: 4 }}>¥</Tag>{t('guide.conceptPricing')}：</Typography.Text>
          {t('guide.conceptPricingDesc')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 12 }}>
          <Typography.Text strong><CheckCircleOutlined style={{ color: '#ea580c', marginRight: 4 }} />{t('guide.conceptApproval')}：</Typography.Text>
          {t('guide.conceptApprovalDesc')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          <Typography.Text strong><RobotOutlined style={{ color: '#7c3aed', marginRight: 4 }} />{t('guide.conceptLivePromo')}：</Typography.Text>
          {t('guide.conceptLivePromoDesc')}
        </Typography.Paragraph>
      </Card>

      {/* ===== 运营日常 Checklist ===== */}
      <Card
        title={<><DashboardOutlined style={{ marginRight: 8 }} />{t('guide.dailyChecklist')}</>}
        style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #f0f5ff 100%)' }}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
          {t('guide.dailyChecklistDesc')}
        </Typography.Paragraph>
        <Timeline
          items={[
            { dot: <Tag color="blue">1</Tag>, children: <Typography.Text>{t('guide.checklist1')}</Typography.Text> },
            { dot: <Tag color="purple">2</Tag>, children: <Typography.Text>{t('guide.checklist2')}</Typography.Text> },
            { dot: <Tag color="orange">3</Tag>, children: <Typography.Text>{t('guide.checklist3')}</Typography.Text> },
            { dot: <Tag color="red">4</Tag>, children: <Typography.Text>{t('guide.checklist4')}</Typography.Text> },
            { dot: <Tag color="green">5</Tag>, children: <Typography.Text>{t('guide.checklist5')}</Typography.Text> },
            { dot: <Tag color="cyan">6</Tag>, children: <Typography.Text>{t('guide.checklist6')}</Typography.Text> },
          ]}
        />
      </Card>
    </div>
  );
}
