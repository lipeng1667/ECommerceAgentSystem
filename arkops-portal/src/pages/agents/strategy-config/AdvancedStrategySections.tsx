import { useQueryClient } from '@tanstack/react-query';
import { Card, Col, Input, InputNumber, Row, Space, Switch, Typography } from 'antd';
import { useI18n } from '../../../app/i18n';
import { updateConfigSection, type AgentWithStrategyConfig } from './sharedUtils';

interface AdvancedStrategySectionsProps {
  agent: AgentWithStrategyConfig;
}

export function AdvancedStrategySections({ agent }: AdvancedStrategySectionsProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return (
    <>
          {/* 库存预警配置 */}
          {agent.strategyConfig.inventoryConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.inventoryConfig')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.inventoryConfigDesc')}</Typography.Paragraph>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.lowStockThreshold')}:</Typography.Text>
                    <InputNumber
                      min={1} max={9999} step={10}
                      style={{ width: 100 }}
                      value={agent.strategyConfig.inventoryConfig.lowStockThreshold}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'inventoryConfig', (s) => ({
                          ...s, lowStockThreshold: v ?? 50,
                        }));
                      }}
                      suffix={t('common.items')}
                    />
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.deadStockDays')}:</Typography.Text>
                    <InputNumber
                      min={7} max={365} step={7}
                      style={{ width: 100 }}
                      value={agent.strategyConfig.inventoryConfig.deadStockDays}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'inventoryConfig', (s) => ({
                          ...s, deadStockDays: v ?? 30,
                        }));
                      }}
                      suffix={t('common.day')}
                    />
                  </Space>
                </Space>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.autoReplenish')}:</Typography.Text>
                    <Switch
                      checked={agent.strategyConfig.inventoryConfig.autoReplenishEnabled}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'inventoryConfig', (s) => ({
                          ...s, autoReplenishEnabled: v,
                        }));
                      }}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.autoReplenishDesc')}</Typography.Text>
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.replenishLeadTime')}:</Typography.Text>
                    <InputNumber
                      min={1} max={60} step={1}
                      style={{ width: 80 }}
                      value={agent.strategyConfig.inventoryConfig.replenishLeadTimeDays}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'inventoryConfig', (s) => ({
                          ...s, replenishLeadTimeDays: v ?? 7,
                        }));
                      }}
                      suffix={t('common.day')}
                    />
                  </Space>
                </Space>
              </Space>
            </div>
          )}

          {/* 市场情报配置 */}
          {agent.strategyConfig.intelConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.intelConfig')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('agent.intelConfigDesc')}</Typography.Paragraph>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('agent.monitorFrequency')}:</Typography.Text>
                    <InputNumber
                      min={1} max={168} step={1}
                      style={{ width: 100 }}
                      value={agent.strategyConfig.intelConfig.monitorFrequencyHours}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'intelConfig', (s) => ({
                          ...s, monitorFrequencyHours: v ?? 2,
                        }));
                      }}
                      suffix={t('agent.monitorFrequencyUnit')}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('agent.priceAlertThreshold')}:</Typography.Text>
                    <InputNumber
                      min={1} max={50} step={1}
                      style={{ width: 100 }}
                      value={agent.strategyConfig.intelConfig.priceAlertThresholdPct}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'intelConfig', (s) => ({
                          ...s, priceAlertThresholdPct: v ?? 5,
                        }));
                      }}
                      suffix="%"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('agent.autoPushDownstream')}:</Typography.Text>
                    <Switch
                      checked={agent.strategyConfig.intelConfig.autoPushDownstream}
                      onChange={(checked) => {
                        updateConfigSection(queryClient, agent, 'intelConfig', (s) => ({
                          ...s, autoPushDownstream: checked,
                        }));
                      }}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.monitoredCategories')}:</Typography.Text>
                    <Input
                      style={{ maxWidth: 300 }}
                      placeholder={t('agent.monitoredCategoriesDesc')}
                      value={agent.strategyConfig.intelConfig.monitoredCategories.join('，')}
                      onChange={(e) => {
                        updateConfigSection(queryClient, agent, 'intelConfig', (s) => ({
                          ...s, monitoredCategories: e.target.value.split(/[,，]/).map((s2) => s2.trim()).filter(Boolean),
                        }));
                      }}
                    />
                  </div>
                </Col>
                <Col xs={24} md={16}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.competitorUrls')}:</Typography.Text>
                    <Input.TextArea
                      style={{ maxWidth: 500 }}
                      rows={3}
                      placeholder={t('agent.competitorUrlsDesc')}
                      value={agent.strategyConfig.intelConfig.competitorUrls.join('\n')}
                      onChange={(e) => {
                        updateConfigSection(queryClient, agent, 'intelConfig', (s) => ({
                          ...s, competitorUrls: e.target.value.split('\n').filter(Boolean),
                        }));
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* 财务对账配置 */}
          {agent.strategyConfig.financeConfig && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.financeConfig')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.financeConfigDesc')}</Typography.Paragraph>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.autoReconcileDay')}:</Typography.Text>
                    <InputNumber
                      min={1} max={28} step={1}
                      style={{ width: 80 }}
                      value={agent.strategyConfig.financeConfig.autoReconcileDay}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'financeConfig', (s) => ({
                          ...s, autoReconcileDay: v ?? 5,
                        }));
                      }}
                      suffix={t('agent.autoReconcileDayUnit')}
                    />
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.discrepancyAlert')}:</Typography.Text>
                    <InputNumber
                      min={1} step={10}
                      style={{ width: 120 }}
                      prefix="$"
                      value={agent.strategyConfig.financeConfig.discrepancyAlertThreshold}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'financeConfig', (s) => ({
                          ...s, discrepancyAlertThreshold: v ?? 100,
                        }));
                      }}
                    />
                  </Space>
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.autoGenReport')}:</Typography.Text>
                  <Switch
                    checked={agent.strategyConfig.financeConfig.autoGenerateReport}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'financeConfig', (s) => ({
                        ...s, autoGenerateReport: v,
                      }));
                    }}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.autoGenReportDesc')}</Typography.Text>
                </Space>
              </Space>
            </div>
          )}

          {/* 促销活动配置 */}
          {agent.strategyConfig.promotionConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.promotionConfig')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.promotionConfigDesc')}</Typography.Paragraph>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.maxDiscount')}:</Typography.Text>
                    <InputNumber
                      min={1} max={90} step={5}
                      style={{ width: 80 }}
                      suffix="%"
                      value={agent.strategyConfig.promotionConfig.maxDiscountPercent}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                          ...s, maxDiscountPercent: v ?? 50,
                        }));
                      }}
                    />
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.campaignBudget')}:</Typography.Text>
                    <InputNumber
                      min={100} step={100}
                      style={{ width: 120 }}
                      prefix="$"
                      value={agent.strategyConfig.promotionConfig.campaignBudget}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                          ...s, campaignBudget: v ?? 2000,
                        }));
                      }}
                    />
                  </Space>
                </Space>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.autoSchedule')}:</Typography.Text>
                    <Switch
                      checked={agent.strategyConfig.promotionConfig.autoSchedule}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                          ...s, autoSchedule: v,
                        }));
                      }}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.autoScheduleDesc')}</Typography.Text>
                  </Space>
                </Space>
                <div>
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t('agent.targetPlatforms')}:</Typography.Text>
                  <Input
                    style={{ maxWidth: 400 }}
                    value={agent.strategyConfig.promotionConfig.targetPlatforms.join('，')}
                    onChange={(e) => {
                      updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                        ...s, targetPlatforms: e.target.value.split(/[,，]/).map((s2) => s2.trim()).filter(Boolean),
                      }));
                    }}
                  />
                </div>
                {agent.strategyConfig.promotionConfig.autoTriggerRules && (
                  <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('agent.autoTriggerRules')}</Typography.Title>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agent.deadStockDays')}:</Typography.Text>
                        <InputNumber
                          min={30} max={180} step={10}
                          style={{ width: 70 }} size="small"
                          suffix={t('agent.days')}
                          value={agent.strategyConfig.promotionConfig.autoTriggerRules.deadStockDays}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                              ...s, autoTriggerRules: { ...s.autoTriggerRules!, deadStockDays: v ?? 60 },
                            }));
                          }}
                        />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>→ {t('agent.autoDiscount')}:</Typography.Text>
                        <InputNumber
                          min={5} max={50} step={5}
                          style={{ width: 60 }} size="small"
                          suffix="%"
                          value={agent.strategyConfig.promotionConfig.autoTriggerRules.deadStockDiscount}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                              ...s, autoTriggerRules: { ...s.autoTriggerRules!, deadStockDiscount: v ?? 35 },
                            }));
                          }}
                        />
                      </Space>
                      <Space wrap>
                        <Space>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agent.lowStockClearance')}:</Typography.Text>
                          <Switch size="small"
                            checked={agent.strategyConfig.promotionConfig.autoTriggerRules.lowStockClearance}
                            onChange={(v) => {
                              updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                                ...s, autoTriggerRules: { ...s.autoTriggerRules!, lowStockClearance: v },
                              }));
                            }}
                          />
                        </Space>
                        <Space>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agent.seasonalAutoPromo')}:</Typography.Text>
                          <Switch size="small"
                            checked={agent.strategyConfig.promotionConfig.autoTriggerRules.seasonalAutoPromo}
                            onChange={(v) => {
                              updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                                ...s, autoTriggerRules: { ...s.autoTriggerRules!, seasonalAutoPromo: v },
                              }));
                            }}
                          />
                        </Space>
                      </Space>
                      <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('agent.competitorPriceDropThreshold')}:</Typography.Text>
                        <InputNumber
                          min={5} max={50} step={5}
                          style={{ width: 60 }} size="small"
                          suffix="%"
                          value={agent.strategyConfig.promotionConfig.autoTriggerRules.competitorPriceDropThreshold}
                          onChange={(v) => {
                            updateConfigSection(queryClient, agent, 'promotionConfig', (s) => ({
                              ...s, autoTriggerRules: { ...s.autoTriggerRules!, competitorPriceDropThreshold: v ?? 15 },
                            }));
                          }}
                        />
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.competitorPriceDropDesc')}</Typography.Text>
                      </Space>
                    </Space>
                  </Card>
                )}
              </Space>
            </div>
          )}

          {/* 直播运营配置 */}
          {agent.strategyConfig.liveStreamConfig && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.liveStreamConfig')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.liveStreamConfigDesc')}</Typography.Paragraph>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="large" wrap>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.autoPinProducts')}:</Typography.Text>
                    <Switch
                      checked={agent.strategyConfig.liveStreamConfig.autoPinProducts}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'liveStreamConfig', (s) => ({
                          ...s, autoPinProducts: v,
                        }));
                      }}
                    />
                  </Space>
                  <Space>
                    <Typography.Text type="secondary">{t('agent.peakHourBoost')}:</Typography.Text>
                    <Switch
                      checked={agent.strategyConfig.liveStreamConfig.peakHourBoost}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'liveStreamConfig', (s) => ({
                          ...s, peakHourBoost: v,
                        }));
                      }}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.peakHourBoostDesc')}</Typography.Text>
                  </Space>
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.performanceAlert')}:</Typography.Text>
                  <InputNumber
                    min={50} max={10000} step={50}
                    style={{ width: 120 }}
                    suffix={t('agent.performanceAlertUnit')}
                    value={agent.strategyConfig.liveStreamConfig.performanceAlertThreshold}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'liveStreamConfig', (s) => ({
                        ...s, performanceAlertThreshold: v ?? 500,
                      }));
                    }}
                  />
                </Space>
                <div>
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t('agent.replyTemplate')}:</Typography.Text>
                  <Input.TextArea
                    style={{ maxWidth: 400 }}
                    rows={2}
                    placeholder={t('agent.replyTemplateDesc')}
                    value={agent.strategyConfig.liveStreamConfig.replyTemplate}
                    onChange={(e) => {
                      updateConfigSection(queryClient, agent, 'liveStreamConfig', (s) => ({
                        ...s, replyTemplate: e.target.value,
                      }));
                    }}
                  />
                </div>
              </Space>
            </div>
          )}
    </>
  );
}
