import { CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Alert, Card, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '../../app/i18n';
import type { AgentConfig } from '../../types/domain';

type AgentWithStrategyConfig = AgentConfig & { strategyConfig: NonNullable<AgentConfig['strategyConfig']> };
import { AdvancedStrategySections } from './strategy-config/AdvancedStrategySections';
import { BasicStrategySections } from './strategy-config/BasicStrategySections';
import { PricingRuleSection } from './strategy-config/PricingRuleSection';
import { RiskControlSection } from './strategy-config/RiskControlSection';
import { subscribeStrategySaved } from './strategy-config/sharedUtils';

interface AgentStrategyConfigSectionProps {
  agent: AgentConfig;
}

export function AgentStrategyConfigSection({ agent }: AgentStrategyConfigSectionProps) {
  const { t } = useI18n();
  // WS-D (D5): visible saved feedback — replaces the previous silent auto-save.
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => subscribeStrategySaved((at) => setSavedAt(at)), []);

  if (!agent.strategyConfig) return null;

  const strategyAgent = agent as AgentWithStrategyConfig;

  return (
    <Card
      title={<><SettingOutlined /> {t('agent.strategyConfig')}</>}
      style={{ marginBottom: 16 }}
      extra={
        savedAt ? (
          <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
            {t('agenttrust.savedAt', { time: new Date(savedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}
          </Tag>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('agenttrust.autoSaveNote')}
          </Typography.Text>
        )
      }
    >
      {/* WS-D (D2): this page is the "per-agent advanced" layer of the config hierarchy */}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('scenario.advancedLayerNote')}
      />
      <PricingRuleSection agent={strategyAgent} />
      <BasicStrategySections agent={strategyAgent} />
      <RiskControlSection agent={strategyAgent} />
      <AdvancedStrategySections agent={strategyAgent} />
    </Card>
  );
}
