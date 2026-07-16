import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Col, Input, InputNumber, Row, Select, Space, Switch, Tag, Typography, message } from 'antd';
import { agentsApi } from '../../../api/agents';
import { useI18n } from '../../../app/i18n';
import { updateConfigSection, type AgentWithStrategyConfig } from './sharedUtils';

interface BasicStrategySectionsProps {
  agent: AgentWithStrategyConfig;
}

export function BasicStrategySections({ agent }: BasicStrategySectionsProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return (
    <>
          {agent.strategyConfig.adSpendBudget && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.adSpendBudget')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.adOptimizeDesc')}</Typography.Paragraph>
              <Space size="large" wrap>
                <Space>
                  <Typography.Text type="secondary">{t('agent.dailyCap')}:</Typography.Text>
                  <InputNumber
                    min={0} step={50}
                    style={{ width: 120 }}
                    prefix="$"
                    value={agent.strategyConfig.adSpendBudget.dailyCap}
                    onChange={(v) => {
                      const newVal = v ?? 0;
                      updateConfigSection(queryClient, agent, 'adSpendBudget', (s) => ({
                        ...s, dailyCap: newVal,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.monthlyCap')}:</Typography.Text>
                  <InputNumber
                    min={0} step={500}
                    style={{ width: 120 }}
                    prefix="$"
                    value={agent.strategyConfig.adSpendBudget.monthlyCap}
                    onChange={(v) => {
                      const newVal = v ?? 0;
                      updateConfigSection(queryClient, agent, 'adSpendBudget', (s) => ({
                        ...s, monthlyCap: newVal,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.targetROI')}:</Typography.Text>
                  <InputNumber
                    min={0} step={0.1}
                    style={{ width: 100 }}
                    value={agent.strategyConfig.adSpendBudget.targetROI}
                    onChange={(v) => {
                      const newVal = v ?? 2.0;
                      updateConfigSection(queryClient, agent, 'adSpendBudget', (s) => ({
                        ...s, targetROI: newVal,
                      }));
                    }}
                    suffix="×"
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.lookbackDays')}:</Typography.Text>
                  <InputNumber
                    min={1} max={90} step={1}
                    style={{ width: 80 }}
                    value={agent.strategyConfig.adSpendBudget.lookbackDays}
                    onChange={(v) => {
                      const newVal = v ?? 7;
                      updateConfigSection(queryClient, agent, 'adSpendBudget', (s) => ({
                        ...s, lookbackDays: newVal,
                      }));
                    }}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.seoKeywords && agent.strategyConfig.seoKeywords.keywords.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>{t('agent.seoKeywords')}</Typography.Title>
                <Button size="small" icon={<ReloadOutlined />} onClick={() => {
                  agentsApi.regenerateSeoKeywords(agent.agentType).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['agent', agent.agentType] });
                    message.success(t('agent.seoRegenerated'));
                  });
                }}>{t('agent.reResearch')}</Button>
              </div>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>{t('agent.seoKeywordsDesc')}</Typography.Paragraph>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {agent.strategyConfig.seoKeywords.keywords.map((kw) => (
                  <Tag key={kw} color="blue">{kw}</Tag>
                ))}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                {t('agent.generatedBy')} {t('agent.competitorAgent')} · {new Date(agent.strategyConfig.seoKeywords.lastGenerated).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography.Text>
            </div>
          )}

          {agent.strategyConfig.targetAudience && agent.strategyConfig.targetAudience.tags.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>{t('agent.targetAudience')}</Typography.Title>
                <Button size="small" icon={<ReloadOutlined />} onClick={() => {
                  agentsApi.regenerateAudience(agent.agentType).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['agent', agent.agentType] });
                    message.success(t('agent.audienceRegenerated'));
                  });
                }}>{t('agent.reResearch')}</Button>
              </div>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>{t('agent.targetAudienceDesc')}</Typography.Paragraph>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {agent.strategyConfig.targetAudience.tags.map((tag) => (
                  <Tag key={tag} color="purple">{tag}</Tag>
                ))}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                {t('agent.generatedBy')} {t('agent.competitorAgent')} · {new Date(agent.strategyConfig.targetAudience.lastGenerated).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography.Text>
            </div>
          )}

          {agent.strategyConfig.crmConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.crmDiscountCap')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.crmConfigDesc')}</Typography.Paragraph>
              <Space size="large">
                <Space>
                  <Typography.Text type="secondary">{t('agent.crmDiscountCap')}:</Typography.Text>
                  <InputNumber
                    min={0} max={100} step={5}
                    style={{ width: 80 }}
                    value={agent.strategyConfig.crmConfig.discountCap}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'crmConfig', (s) => ({
                        ...s, discountCap: v ?? 20,
                      }));
                    }}
                    suffix="%"
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.crmSegmentCount')}:</Typography.Text>
                  <InputNumber
                    min={1} max={10} step={1}
                    style={{ width: 80 }}
                    value={agent.strategyConfig.crmConfig.segmentCount}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'crmConfig', (s) => ({
                        ...s, segmentCount: v ?? 3,
                      }));
                    }}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.afterSalesConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.afterSalesRefundCap')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.afterSalesConfigDesc')}</Typography.Paragraph>
              <Space size="large">
                <Space>
                  <Typography.Text type="secondary">{t('agent.afterSalesRefundCap')}:</Typography.Text>
                  <InputNumber
                    min={0} step={5}
                    style={{ width: 100 }}
                    prefix="$"
                    value={agent.strategyConfig.afterSalesConfig.autoRefundCap}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'afterSalesConfig', (s) => ({
                        ...s, autoRefundCap: v ?? 20,
                      }));
                    }}
                  />
                  <Typography.Text type="secondary">{t('agent.afterSalesRefundCapUnit')}</Typography.Text>
                </Space>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary">{t('agent.afterSalesReturnAddr')}:</Typography.Text>
                <Input
                  style={{ width: 280, marginLeft: 8 }}
                  size="small"
                  placeholder={t('agent.afterSalesReturnAddrPlaceholder')}
                  value={agent.strategyConfig.afterSalesConfig.returnAddress}
                  onChange={(e) => {
                    updateConfigSection(queryClient, agent, 'afterSalesConfig', (s) => ({
                      ...s, returnAddress: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          )}

          {agent.strategyConfig.bootstrapConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.bootstrapConfigTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.bootstrapConfigDesc')}</Typography.Paragraph>
              <Space size="large" wrap>
                <Space>
                  <Typography.Text type="secondary">{t('agent.notifyChannels')}:</Typography.Text>
                  <Input
                    style={{ width: 200 }}
                    size="small"
                    placeholder={t('agent.notifyChannelsPlaceholder')}
                    value={agent.strategyConfig.bootstrapConfig.notifyChannels}
                    onChange={(e) => {
                      updateConfigSection(queryClient, agent, 'bootstrapConfig', (s) => ({
                        ...s, notifyChannels: e.target.value,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.checkInterval')}:</Typography.Text>
                  <InputNumber
                    min={5} max={240} step={5}
                    style={{ width: 100 }}
                    size="small"
                    suffix={t('agent.minutes')}
                    value={agent.strategyConfig.bootstrapConfig.checkIntervalMinutes}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'bootstrapConfig', (s) => ({
                        ...s, checkIntervalMinutes: v ?? 30,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.maxRetries')}:</Typography.Text>
                  <InputNumber
                    min={0} max={10} step={1}
                    style={{ width: 70 }}
                    size="small"
                    value={agent.strategyConfig.bootstrapConfig.maxRetries}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'bootstrapConfig', (s) => ({
                        ...s, maxRetries: v ?? 3,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.autoRelaunch')}:</Typography.Text>
                  <Switch
                    size="small"
                    checked={agent.strategyConfig.bootstrapConfig.autoRelaunchEnabled}
                    onChange={(checked) => {
                      updateConfigSection(queryClient, agent, 'bootstrapConfig', (s) => ({
                        ...s, autoRelaunchEnabled: checked,
                      }));
                    }}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.productLaunchConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.productLaunchConfigTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.productLaunchConfigDesc')}</Typography.Paragraph>
              <Space size="large" wrap>
                <Space>
                  <Typography.Text type="secondary">{t('agent.defaultCategory')}:</Typography.Text>
                  <Input
                    style={{ width: 200 }}
                    size="small"
                    placeholder={t('agent.defaultCategoryPlaceholder')}
                    value={agent.strategyConfig.productLaunchConfig.defaultCategory}
                    onChange={(e) => {
                      updateConfigSection(queryClient, agent, 'productLaunchConfig', (s) => ({
                        ...s, defaultCategory: e.target.value,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.targetMarket')}:</Typography.Text>
                  <Select
                    size="small"
                    style={{ width: 120 }}
                    value={agent.strategyConfig.productLaunchConfig.targetMarket}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'productLaunchConfig', (s) => ({
                        ...s, targetMarket: v,
                      }));
                    }}
                    options={[
                      { value: 'US', label: 'US' },
                      { value: 'EU', label: 'EU' },
                      { value: 'UK', label: 'UK' },
                      { value: 'JP', label: 'JP' },
                      { value: 'SEA', label: 'SEA' },
                      { value: 'Global', label: 'Global' }
                    ]}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.seoKeywords && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.seoKeywordsTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.seoKeywordsDesc')}</Typography.Paragraph>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.seoKeywords')}:</Typography.Text>
                    <Input
                      style={{ maxWidth: 400 }}
                      placeholder="fast charger, GaN charger, 65W"
                      value={agent.strategyConfig.seoKeywords.keywords.join(', ')}
                      onChange={(e) => {
                        updateConfigSection(queryClient, agent, 'seoKeywords', (s) => ({
                          ...s, keywords: e.target.value.split(/[,，]/).map((s2) => s2.trim()).filter(Boolean),
                        }));
                      }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.targetAudience')}:</Typography.Text>
                    <Input
                      style={{ maxWidth: 400 }}
                      placeholder="tech enthusiasts, travelers"
                      value={agent.strategyConfig.targetAudience?.tags.join(', ') ?? ''}
                      onChange={(e) => {
                        updateConfigSection(queryClient, agent, 'targetAudience', (s) => ({
                          ...s, tags: e.target.value.split(/[,，]/).map((s2) => s2.trim()).filter(Boolean),
                        }));
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {agent.strategyConfig.reviewConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.reviewConfigTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.reviewConfigDesc')}</Typography.Paragraph>
              <Space size="large" wrap>
                <Space>
                  <Typography.Text type="secondary">{t('agent.autoReplyThreshold')}:</Typography.Text>
                  <InputNumber
                    min={1} max={5} step={1}
                    style={{ width: 80 }}
                    value={agent.strategyConfig.reviewConfig.autoReplyThreshold}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'reviewConfig', (s) => ({
                        ...s, autoReplyThreshold: v ?? 2,
                      }));
                    }}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.autoReplyThresholdDesc')}</Typography.Text>
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.replyTone')}:</Typography.Text>
                  <Select
                    size="small"
                    style={{ width: 140 }}
                    value={agent.strategyConfig.reviewConfig.replyTone}
                    onChange={(v) => {
                      updateConfigSection(queryClient, agent, 'reviewConfig', (s) => ({
                        ...s, replyTone: v,
                      }));
                    }}
                    options={[
                      { value: '专业友好', label: '专业友好' },
                      { value: '热情诚恳', label: '热情诚恳' },
                      { value: '简洁高效', label: '简洁高效' },
                      { value: '官方正式', label: '官方正式' }
                    ]}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.csConfig && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.csConfigTitle')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{t('agent.csConfigDesc')}</Typography.Paragraph>
              <Space size="large" wrap>
                <Space>
                  <Typography.Text type="secondary">{t('agent.autoReplyEnabled')}:</Typography.Text>
                  <Switch
                    size="small"
                    checked={agent.strategyConfig.csConfig.autoReplyEnabled}
                    onChange={(checked) => {
                      updateConfigSection(queryClient, agent, 'csConfig', (s) => ({
                        ...s, autoReplyEnabled: checked,
                      }));
                    }}
                  />
                </Space>
                <Space>
                  <Typography.Text type="secondary">{t('agent.escalateKeywords')}:</Typography.Text>
                  <Input
                    style={{ width: 280 }}
                    size="small"
                    placeholder={t('agent.escalateKeywordsPlaceholder')}
                    value={agent.strategyConfig.csConfig.escalateKeywords.join(',')}
                    onChange={(e) => {
                      const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
                      updateConfigSection(queryClient, agent, 'csConfig', (s) => ({
                        ...s, escalateKeywords: keywords,
                      }));
                    }}
                  />
                </Space>
              </Space>
            </div>
          )}

          {agent.strategyConfig.creativeConfig && (
            <div style={{ marginBottom: 8 }}>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('agent.creativeSizes')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{t('agent.creativeConfigDesc')}</Typography.Paragraph>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.creativeSizes')}:</Typography.Text>
                    <Space>
                      <Input
                        style={{ width: 200 }}
                        size="small"
                        placeholder="1:1,16:9,9:16"
                        value={agent.strategyConfig.creativeConfig.outputSizes}
                        onChange={(e) => {
                          updateConfigSection(queryClient, agent, 'creativeConfig', (s) => ({
                            ...s, outputSizes: e.target.value,
                          }));
                        }}
                      />
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.creativeSizesDesc')}</Typography.Text>
                    </Space>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{t('agent.creativeTone')}:</Typography.Text>
                    <Select
                      size="small"
                      style={{ width: 160 }}
                      value={agent.strategyConfig.creativeConfig.copyTone}
                      onChange={(v) => {
                        updateConfigSection(queryClient, agent, 'creativeConfig', (s) => ({
                          ...s, copyTone: v,
                        }));
                      }}
                      options={[
                        { value: '简洁卖点', label: '简洁卖点' },
                        { value: '促销感', label: '促销感' },
                        { value: '高端品牌', label: '高端品牌' },
                        { value: '年轻潮流', label: '年轻潮流' }
                      ]}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}
    </>
  );
}
