import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Input, InputNumber, Row, Select, Space, Switch, Tag, Typography, Upload, message } from 'antd';
import { agentsApi } from '../../../api/agents';
import { useI18n } from '../../../app/i18n';
import type { AgentConfig } from '../../../types/domain';

type AgentWithStrategyConfig = AgentConfig & { strategyConfig: NonNullable<AgentConfig['strategyConfig']> };

interface RiskControlSectionProps {
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

export function RiskControlSection({ agent }: RiskControlSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return (
    <>
          {agent.strategyConfig.riskControlConfig && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 12 }}>{t('agent.riskControlTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('agent.riskControlDesc')}</Typography.Paragraph>

              <Row gutter={[24, 16]}>
                {/* 法规合规 */}
                <Col span={8}>
                  <Card size="small" title={<Typography.Text strong style={{ fontSize: 13 }}>{t('agent.riskCompliance')}</Typography.Text>}
                    style={{ background: 'var(--ark-panel-soft)' }}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.compliance.adLawFilter}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              compliance: { ...rc.compliance, adLawFilter: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskAdLaw')}</Typography.Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.compliance.platformRuleCheck}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              compliance: { ...rc.compliance, platformRuleCheck: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskPlatformRule')}</Typography.Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.compliance.falseClaimDetection}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              compliance: { ...rc.compliance, falseClaimDetection: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskFalseClaim')}</Typography.Text>
                      </Space>
                    </Space>
                  </Card>
                </Col>

                {/* 行为监控 */}
                <Col span={8}>
                  <Card size="small" title={<Typography.Text strong style={{ fontSize: 13 }}>{t('agent.riskBehavior')}</Typography.Text>}
                    style={{ background: 'var(--ark-panel-soft)' }}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 12, width: 60 }}>{t('agent.riskRoiFloor')}:</Typography.Text>
                        <InputNumber
                          size="small" min={0} step={0.1}
                          style={{ width: 70 }}
                          value={agent.strategyConfig.riskControlConfig.behavior.roiFloorThreshold}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              behavior: { ...rc.behavior, roiFloorThreshold: v ?? 1.2 },
                            }));
                          }}
                        />
                      </Space>
                      <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 12, width: 60 }}>{t('agent.riskFreqLimit')}:</Typography.Text>
                        <InputNumber
                          size="small" min={1} max={100} step={1}
                          style={{ width: 70 }}
                          suffix="次/分"
                          value={agent.strategyConfig.riskControlConfig.behavior.actionFrequencyLimit}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              behavior: { ...rc.behavior, actionFrequencyLimit: v ?? 10 },
                            }));
                          }}
                        />
                      </Space>
                      <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 12, width: 60 }}>{t('agent.riskPriceDev')}:</Typography.Text>
                        <InputNumber
                          size="small" min={5} max={100} step={5}
                          style={{ width: 70 }}
                          suffix="%"
                          value={agent.strategyConfig.riskControlConfig.behavior.priceDeviationPercent}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              behavior: { ...rc.behavior, priceDeviationPercent: v ?? 30 },
                            }));
                          }}
                        />
                      </Space>
                    </Space>
                  </Card>
                </Col>

                {/* 业务保护 */}
                <Col span={8}>
                  <Card size="small" title={<Typography.Text strong style={{ fontSize: 13 }}>{t('agent.riskBusiness')}</Typography.Text>}
                    style={{ background: 'var(--ark-panel-soft)' }}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 12, width: 72 }}>{t('agent.riskMinPrice')}:</Typography.Text>
                        <InputNumber
                          size="small" min={0} max={2} step={0.05}
                          style={{ width: 70 }}
                          suffix="×成本"
                          value={agent.strategyConfig.riskControlConfig.business.minPriceRatio}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              business: { ...rc.business, minPriceRatio: v ?? 0.8 },
                            }));
                          }}
                        />
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.business.categoryMatchCheck}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              business: { ...rc.business, categoryMatchCheck: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskCategory')}</Typography.Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.business.imageComplianceCheck}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              business: { ...rc.business, imageComplianceCheck: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskImage')}</Typography.Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.business.inventorySafetyCheck}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              business: { ...rc.business, inventorySafetyCheck: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskInventory')}</Typography.Text>
                      </Space>
                      <Space>
                        <Switch
                          size="small"
                          checked={agent.strategyConfig.riskControlConfig.business.negativeReviewSurgeCheck}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'riskControlConfig', (rc) => ({
                              ...rc,
                              business: { ...rc.business, negativeReviewSurgeCheck: v },
                            }));
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>{t('agent.riskReviewSurge')}</Typography.Text>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
    </>
  );
}
