import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  RiseOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import { useI18n } from '../../../app/i18n';
import { mockABTests, type ABTestResult } from '../agentConfigMockData';

interface ABTestComparisonModalProps {
  open: boolean;
  onClose: () => void;
}

/** 计算对照组与实验组的指标差异百分比 */
function diffPercent(control: number, experiment: number): { value: number; isUp: boolean } {
  if (control === 0) return { value: 0, isUp: true };
  const diff = ((experiment - control) / control) * 100;
  return { value: Math.abs(diff), isUp: diff >= 0 };
}

/** 单个指标的对比行 */
function MetricCompareRow({
  label,
  controlValue,
  experimentValue,
  format,
  suffix,
  higherIsBetter = true
}: {
  label: string;
  controlValue: number;
  experimentValue: number;
  format?: (v: number) => string;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  const diff = diffPercent(controlValue, experimentValue);
  const experimentBetter = higherIsBetter ? diff.isUp : !diff.isUp;
  const neutral = diff.value < 0.5;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Typography.Text style={{ width: 100, flexShrink: 0, fontSize: 13 }}>{label}</Typography.Text>
      {/* 对照组 */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <Typography.Text style={{ fontSize: 14, fontWeight: 500 }}>
          {format ? format(controlValue) : controlValue}{suffix}
        </Typography.Text>
      </div>
      {/* 实验组 */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <Typography.Text
          strong
          style={{
            fontSize: 14,
            color: experimentBetter && !neutral ? '#16a34a' : !experimentBetter && !neutral ? '#dc2626' : undefined
          }}
        >
          {format ? format(experimentValue) : experimentValue}{suffix}
        </Typography.Text>
      </div>
      {/* 差异 */}
      <div style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
        {neutral ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>→ 持平</Typography.Text>
        ) : (
          <Typography.Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: experimentBetter ? '#16a34a' : '#dc2626'
            }}
          >
            <ArrowUpOutlined rotate={experimentBetter ? 0 : 180} style={{ fontSize: 10 }} />
            {diff.value.toFixed(1)}%
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

/** 单个 A/B 测试详情面板 */
function ABTestDetailCard({ test }: { test: ABTestResult }) {
  const { t } = useI18n();

  const winnerColor = test.winner === 'experiment' ? '#16a34a' : test.winner === 'control' ? '#dc2626' : '#64748b';
  const winnerLabel = test.winner === 'experiment'
    ? t('agent.abExperiment')
    : test.winner === 'control'
      ? t('agent.abControl')
      : t('agent.abInconclusive');

  const confidenceColor = (test.confidenceLevel ?? 0) >= 95
    ? '#16a34a'
    : (test.confidenceLevel ?? 0) >= 80
      ? '#ea580c'
      : '#64748b';

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <ExperimentOutlined style={{ color: '#2563eb' }} />
          <Typography.Text strong>{test.name}</Typography.Text>
          <Tag color={test.status === 'completed' ? 'green' : test.status === 'running' ? 'blue' : 'default'}>
            {test.status === 'completed' ? t('agent.abCompleted') : test.status === 'running' ? t('agent.abRunning') : t('agent.abDraft')}
          </Tag>
          {test.winner && test.winner !== 'inconclusive' && (
            <Tag icon={<TrophyOutlined />} color={test.winner === 'experiment' ? 'green' : 'red'}>
              {winnerLabel} {t('agent.abWinner')}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space size={4}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {test.campaignId} · {test.date} · {test.testDuration}
          </Typography.Text>
        </Space>
      }
    >
      {/* 假设 */}
      <div style={{
        padding: '8px 12px',
        background: '#f0f5ff',
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #d6e4ff'
      }}>
        <Typography.Text style={{ fontSize: 12 }}>
          <InfoCircleOutlined style={{ color: '#2563eb', marginRight: 4 }} />
          <Typography.Text strong>{t('agent.abHypothesis')}: </Typography.Text>
          {test.hypothesis}
        </Typography.Text>
      </div>

      {/* 指标对比表 - 表头 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '2px solid #d9d9d9', marginBottom: 4 }}>
        <Typography.Text strong style={{ width: 100, flexShrink: 0, fontSize: 12, color: '#64748b' }}>{t('agent.abMetric')}</Typography.Text>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Tag style={{ fontSize: 10 }}>{t('agent.abControl')}</Tag>
          <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
            {test.controlGroup.creativeDesc}
          </Typography.Text>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Tag color="blue" style={{ fontSize: 10 }}>{t('agent.abExperiment')}</Tag>
          <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
            {test.experimentGroup.creativeDesc}
          </Typography.Text>
        </div>
        <Typography.Text strong style={{ width: 80, textAlign: 'right', flexShrink: 0, fontSize: 12, color: '#64748b' }}>{t('agent.abChange')}</Typography.Text>
      </div>

      <MetricCompareRow label={t('agent.abImpressions')} controlValue={test.controlGroup.impressions} experimentValue={test.experimentGroup.impressions} format={(v) => (v / 1000).toFixed(1)} suffix="k" />
      <MetricCompareRow label={t('agent.abClicks')} controlValue={test.controlGroup.clicks} experimentValue={test.experimentGroup.clicks} />
      <MetricCompareRow label="CTR" controlValue={test.controlGroup.ctr} experimentValue={test.experimentGroup.ctr} format={(v) => v.toFixed(2)} suffix="%" />
      <MetricCompareRow label={t('agent.abConversions')} controlValue={test.controlGroup.conversions} experimentValue={test.experimentGroup.conversions} />
      <MetricCompareRow label="CVR" controlValue={test.controlGroup.conversionRate} experimentValue={test.experimentGroup.conversionRate} format={(v) => v.toFixed(2)} suffix="%" />
      <MetricCompareRow label="ROI" controlValue={test.controlGroup.roi} experimentValue={test.experimentGroup.roi} format={(v) => v.toFixed(2)} suffix="×" />
      <MetricCompareRow
        label={t('agent.abSpend')}
        controlValue={test.controlGroup.spend}
        experimentValue={test.experimentGroup.spend}
        format={(v) => `$${v.toFixed(0)}`}
        higherIsBetter={false}
      />

      {/* 结论区 */}
      {test.status === 'completed' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <Row gutter={16} align="middle">
            <Col flex="none">
              <TrophyOutlined style={{ fontSize: 24, color: winnerColor }} />
            </Col>
            <Col flex="auto">
              <Typography.Text strong style={{ fontSize: 14 }}>
                {winnerLabel} {t('agent.abWinner')}
              </Typography.Text>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4, marginTop: 4 }}>
                {test.recommendation}
              </Typography.Paragraph>
            </Col>
            <Col flex="120px">
              <Statistic
                title={t('agent.abConfidence')}
                value={test.confidenceLevel}
                suffix="%"
                valueStyle={{ fontSize: 18, color: confidenceColor }}
              />
            </Col>
          </Row>
          {test.confidenceLevel && (
            <Progress
              percent={test.confidenceLevel}
              size="small"
              status={test.confidenceLevel >= 95 ? 'success' : 'active'}
              style={{ marginTop: 8, marginBottom: 0 }}
            />
          )}
        </div>
      )}

      {test.status === 'running' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
          <Row gutter={16} align="middle">
            <Col flex="none">
              <RiseOutlined style={{ fontSize: 24, color: '#ea580c' }} />
            </Col>
            <Col flex="auto">
              <Typography.Text strong style={{ fontSize: 14 }}>{t('agent.abObserving')}</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0, marginTop: 4 }}>
                {test.recommendation}
              </Typography.Paragraph>
            </Col>
            <Col flex="120px">
              <Statistic
                title={t('agent.abConfidence')}
                value={test.confidenceLevel}
                suffix="%"
                valueStyle={{ fontSize: 18, color: '#64748b' }}
              />
            </Col>
          </Row>
          {test.confidenceLevel && (
            <Progress
              percent={test.confidenceLevel}
              size="small"
              status="active"
              style={{ marginTop: 8, marginBottom: 0 }}
            />
          )}
        </div>
      )}
    </Card>
  );
}

export function ABTestComparisonModal({ open, onClose }: ABTestComparisonModalProps) {
  const { t } = useI18n();

  const completedTests = mockABTests.filter((t) => t.status === 'completed');
  const runningTests = mockABTests.filter((t) => t.status === 'running');

  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={mockABTests.length} size="small" offset={[6, -2]}>
          <span>{t('agent.abAll')}</span>
        </Badge>
      ),
      children: (
        <>
          {mockABTests.map((test) => (
            <ABTestDetailCard key={test.id} test={test} />
          ))}
        </>
      )
    },
    {
      key: 'completed',
      label: (
        <Badge count={completedTests.length} size="small" overflowCount={99} offset={[6, -2]}>
          <span>{t('agent.abCompleted')}</span>
        </Badge>
      ),
      children: (
        <>
          {completedTests.map((test) => (
            <ABTestDetailCard key={test.id} test={test} />
          ))}
        </>
      )
    },
    {
      key: 'running',
      label: (
        <Badge count={runningTests.length} size="small" overflowCount={99} offset={[6, -2]}>
          <span>{t('agent.abRunning')}</span>
        </Badge>
      ),
      children: (
        <>
          {runningTests.map((test) => (
            <ABTestDetailCard key={test.id} test={test} />
          ))}
        </>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <ExperimentOutlined style={{ color: '#2563eb' }} />
          {t('agent.abTestDashboard')}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.close')}</Button>
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={() => {
              message.success(t('agent.abTestCreated'));
              onClose();
            }}
          >
            {t('agent.abNewTest')}
          </Button>
        </Space>
      }
      width={860}
    >
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
        {t('agent.abTestDashboardDesc')}
      </Typography.Text>

      <Tabs items={tabItems} defaultActiveKey="all" />
    </Modal>
  );
}
