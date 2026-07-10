import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Input, InputNumber, Row, Select, Space, Switch, Tag, Typography, Upload, message } from 'antd';
import { agentsApi } from '../../../api/agents';
import { useI18n } from '../../../app/i18n';
import type { AgentConfig } from '../../../types/domain';

type AgentWithStrategyConfig = AgentConfig & { strategyConfig: NonNullable<AgentConfig['strategyConfig']> };

interface PricingRuleSectionProps {
  agent: AgentWithStrategyConfig;
}

/** 安全更新 strategyConfig 子段，触发 React 重新渲染 */
function updateConfigSection(
  queryClient: ReturnType<typeof useQueryClient>,
  agent: AgentWithStrategyConfig,
  sectionKey: string,
  updater: (section: any) => any,
) {
  queryClient.setQueryData(['agent', agent.agentType], (prev: any) => {
    if (!prev?.strategyConfig) return prev;
    return {
      ...prev,
      strategyConfig: {
        ...prev.strategyConfig,
        [sectionKey]: updater(prev.strategyConfig[sectionKey]),
      },
    };
  });
}

export function PricingRuleSection({ agent }: PricingRuleSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return (
    <>
          {agent.strategyConfig.pricingRule && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.pricingRule')}</Typography.Title>

              {/* 模式选择 */}
              <div style={{ marginBottom: 16 }}>
                <Space size="large">
                  <Typography.Text strong>{t('agent.pricingMode')}:</Typography.Text>
                  <Select
                    value={agent.strategyConfig.pricingRule.mode}
                    style={{ width: 140 }}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'pricingRule', (pr) => {
                        const base = { ...pr, mode: v };
                        if (v === 'market') return { ...base, targetMargin: 30, competitorStrategy: 'match' };
                        if (v === 'cost') return { ...base, costMultiplier: 1.5, roundUp: true };
                        if (v === 'manual') return { ...base, floorPrice: 0, ceilingPrice: 0 };
                        return base;
                      });
                    }}
                    options={[
                      { value: 'market', label: t('agent.pricingMarket') },
                      { value: 'cost', label: t('agent.pricingCost') },
                      { value: 'manual', label: t('agent.pricingManual') },
                    ]}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t(`agent.pricingMode_${agent.strategyConfig.pricingRule.mode}`)}
                  </Typography.Text>
                </Space>
              </div>

              {/* 市场驱动模式 */}
              {agent.strategyConfig.pricingRule.mode === 'market' && (
                <div style={{ padding: '12px 16px', background: 'var(--ark-panel-soft)', borderRadius: 8 }}>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                    {t('agent.pricingMarketDesc')}
                  </Typography.Paragraph>
                  <Space size="large">
                    <Space>
                      <Typography.Text type="secondary">{t('agent.targetMargin')}:</Typography.Text>
                      <InputNumber
                        min={5} max={80} step={5}
                        style={{ width: 80 }}
                        suffix="%"
                        value={agent.strategyConfig.pricingRule.targetMargin}
                        onChange={(v) => {
                          updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                            ...pr, targetMargin: v ?? 30,
                          }));
                        }}
                      />
                    </Space>
                    <Space>
                      <Typography.Text type="secondary">{t('agent.competeStrategy')}:</Typography.Text>
                      <Select
                        size="small"
                        style={{ width: 120 }}
                        value={agent.strategyConfig.pricingRule.competitorStrategy}
                        onChange={(v) => {
                          updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                            ...pr, competitorStrategy: v,
                          }));
                        }}
                        options={[
                          { value: 'undercut', label: t('agent.competeUndercut') },
                          { value: 'match', label: t('agent.competeMatch') },
                          { value: 'premium', label: t('agent.competePremium') },
                        ]}
                      />
                    </Space>
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                    {t('agent.pricingMarketNote')}: {t('agent.competitorAgent')}
                  </Typography.Text>
                </div>
              )}

              {/* 成本驱动模式 */}
              {agent.strategyConfig.pricingRule.mode === 'cost' && (
                <div>
                  <div style={{ padding: '12px 16px', background: 'var(--ark-panel-soft)', borderRadius: 8, marginBottom: 12 }}>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                      {t('agent.pricingCostDesc')}
                    </Typography.Paragraph>
                    <Space size="large" wrap>
                      <Space>
                        <Typography.Text type="secondary">{t('agent.costMultiplier')}:</Typography.Text>
                        <InputNumber
                          min={1} max={5} step={0.1}
                          style={{ width: 70 }}
                          value={agent.strategyConfig.pricingRule.costMultiplier}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                              ...pr, costMultiplier: v ?? 1.5,
                            }));
                          }}
                        />
                        <Typography.Text type="secondary">× {t('agent.cost')}</Typography.Text>
                      </Space>
                      <Space>
                        <Typography.Text type="secondary">{t('agent.roundUp')}:</Typography.Text>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.pricingRule.roundUp}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                              ...pr, roundUp: v,
                            }));
                          }}
                        />
                      </Space>
                    </Space>
                  </div>
                  {/* 上传进货单 */}
                  <Upload
                    accept=".xlsx,.xls,.csv"
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={(info) => {
                      if (info.fileList.length > 0) {
                        updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                          ...pr, costFile: info.fileList[0].name,
                        }));
                      }
                    }}
                  >
                    <Button icon={<PlusOutlined />} size="small">
                      {agent.strategyConfig.pricingRule.costFile
                        ? t('agent.costFileUploaded') + ': ' + agent.strategyConfig.pricingRule.costFile
                        : t('agent.uploadCostFile')}
                    </Button>
                  </Upload>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    {t('agent.uploadCostFileHint')}
                  </Typography.Text>
                </div>
              )}

              {/* 自主定价模式 */}
              {agent.strategyConfig.pricingRule.mode === 'manual' && (
                <div style={{ padding: '12px 16px', background: 'var(--ark-panel-soft)', borderRadius: 8 }}>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                    {t('agent.pricingManualDesc')}
                  </Typography.Paragraph>
                  <Space size="large">
                    <Space>
                      <Typography.Text type="secondary">{t('agent.floorPrice')}:</Typography.Text>
                      <InputNumber
                        min={0} step={1}
                        style={{ width: 100 }}
                        prefix="$"
                        value={agent.strategyConfig.pricingRule.floorPrice}
                        onChange={(v) => {
                          updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                            ...pr, floorPrice: v ?? 0,
                          }));
                        }}
                      />
                    </Space>
                    <Space>
                      <Typography.Text type="secondary">{t('agent.ceilingPrice')}:</Typography.Text>
                      <InputNumber
                        min={0} step={1}
                        style={{ width: 100 }}
                        prefix="$"
                        value={agent.strategyConfig.pricingRule.ceilingPrice}
                        onChange={(v) => {
                          updateConfigSection(queryClient, agent, 'pricingRule', (pr) => ({
                            ...pr, ceilingPrice: v ?? 0,
                          }));
                        }}
                      />
                    </Space>
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                    {t('agent.pricingManualNote')}
                  </Typography.Text>
                </div>
              )}
            </div>
          )}
    </>
  );
}
