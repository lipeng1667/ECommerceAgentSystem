/**
 * Review Analysis Panel — V1.1
 * Categorizes negative/neutral reviews by problem type,
 * provides stats breakdown and AI improvement suggestions.
 */
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  BarChartOutlined, BulbOutlined, SendOutlined, RobotOutlined,
  ShopOutlined, CarOutlined, DollarOutlined, SmileOutlined,
  FileTextOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Collapse, Col, Empty, Input, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { reviewsApi } from '../../api/reviews';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import type { AllMallId, Review, Store } from '../../types/domain';

interface Props {
  selectedReview: Review | null;
  onSelectReview: (review: Review) => void;
  storeFilter?: AllMallId;
}

type ProblemCategory = 'quality' | 'logistics' | 'pricing' | 'service' | 'description' | 'other';

const CATEGORY_CONFIG: Record<ProblemCategory, { key: string; icon: React.ReactNode; color: string; keywords: string[] }> = {
  quality:      { key: 'reviews.catQuality', icon: <ShopOutlined />, color: '#ff4d4f', keywords: ['质量', '坏了', '散架', '瑕疵', '磨损', '脱线', '异味', '做工', '毛刺', '划痕', '翻新'] },
  logistics:    { key: 'reviews.catLogistics', icon: <CarOutlined />, color: '#faad14', keywords: ['物流', '快递', '发货', '配送', '揽收', '慢', '迟', '送达'] },
  pricing:      { key: 'reviews.catPricing', icon: <DollarOutlined />, color: '#722ed1', keywords: ['不值', '太贵', '价格', '降价', '性价比', '优惠', '贵了'] },
  service:      { key: 'reviews.catService', icon: <SmileOutlined />, color: '#1890ff', keywords: ['客服', '态度', '回复', '不理', '爱答不理', '投诉', '服务差'] },
  description:  { key: 'reviews.catDescription', icon: <FileTextOutlined />, color: '#eb2f96', keywords: ['色差', '不一样', '图片', '不符', '差距', '描述不符', '实拍'] },
  other:        { key: 'reviews.catOther', icon: <QuestionCircleOutlined />, color: '#8c8c8c', keywords: [] },
};

function categorizeReview(content: string): ProblemCategory {
  const lower = content.toLowerCase();
  for (const [cat, config] of Object.entries(CATEGORY_CONFIG)) {
    if (cat === 'other') continue;
    if (config.keywords.some((kw) => lower.includes(kw))) return cat as ProblemCategory;
  }
  return 'other';
}

/** AI-generated improvement suggestions per category. */
const IMPROVEMENT_SUGGESTIONS: Record<ProblemCategory, { short: string; detail: string[] }> = {
  quality: {
    short: '加强品控流程和出货前抽检',
    detail: [
      '建议增加出货前全检环节，重点关注五金件、缝线、色差',
      '建立供应商质量评分体系，低分供应商减少订单配额',
      '收集退换货原因做根因分析，针对高频问题改进工艺',
      '在详情页增加实拍对比图，降低期望差',
    ],
  },
  logistics: {
    short: '优化仓库布局和快递合作策略',
    detail: [
      '建议增加前置仓/区域仓覆盖，缩短平均配送时长',
      '与 2-3 家快递公司签署阶梯价格协议，降低单均成本',
      '对加急订单自动升级顺丰，提升紧急订单体验',
      '在商品详情页显示预计送达时间，管理买家预期',
    ],
  },
  pricing: {
    short: '建立竞品价格监控和动态调价机制',
    detail: [
      '建议启用竞品价格监控 Agent，自动跟踪 Top 竞品价格变动',
      '对爆款商品设置价格底线，低于底线自动触发促销预警',
      '增加\"买贵退差价\"承诺以提升转化率，预计 ROI 回报 >5x',
      '分时段/分人群发放定向优惠券，避免全局降价影响利润',
    ],
  },
  service: {
    short: '提升客服响应速度和首次解决率',
    detail: [
      '建议设置客服 SLA 指标：首次响应 <2 分钟，问题解决 <24 小时',
      '启用客服消息 Agent 自动处理高频问题（物流查询/退换指引）',
      '建立常见问题知识库和标准话术模板，降低人工客服压力',
      '定期进行客服满意度回访，差评客服需专项培训和考核',
    ],
  },
  description: {
    short: '优化商品图文描述和尺码指引',
    detail: [
      '建议增加多场景实拍图和视频，减少色差/版型纠纷',
      '为鞋服类目增加详细的尺码对照表和试穿建议',
      '在详情页顶部增加\"买家常问\"FAQ 模块，前置解决高频疑虑',
      '定期更新买家秀精选，用真实反馈替代过度美化',
    ],
  },
  other: {
    short: '关注用户体验细节，持续迭代优化',
    detail: [
      '建议定期导出中差评做人工质检，发现新的问题模式',
      '在商品详情页增加\"为什么不满意\"反馈入口，收集更多信号',
      '对中差评买家进行定向回访，了解真实诉求并尝试挽回',
    ],
  },
};

export function ReviewAnalysis({ selectedReview, onSelectReview, storeFilter }: Props) {
  const { t } = useI18n();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', storeFilter],
    queryFn: () => reviewsApi.list({ storeId: storeFilter }),
  });

  const storeById = new Map(stores.map((s) => [s.id, s]));

  // Only analyze negative + neutral reviews
  const problemReviews = useMemo(() =>
    reviews.filter((r) => r.sentiment !== 'positive'),
  [reviews]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; avgRating: number; reviews: Review[] }> = {};
    for (const r of problemReviews) {
      const cat = categorizeReview(r.content);
      if (!stats[cat]) stats[cat] = { count: 0, avgRating: 0, reviews: [] };
      stats[cat].count++;
      stats[cat].reviews.push(r);
    }
    for (const cat of Object.keys(stats)) {
      const catReviews = stats[cat].reviews;
      stats[cat].avgRating = +(catReviews.reduce((s, r) => s + r.rating, 0) / catReviews.length).toFixed(1);
    }
    return stats;
  }, [problemReviews]);

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count);

  // Consultation chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    // Simulated AI consultation based on current context
    await new Promise((r) => setTimeout(r, 1000));

    let aiResponse: string;
    if (selectedReview) {
      const cat = categorizeReview(selectedReview.content);
      const suggestion = IMPROVEMENT_SUGGESTIONS[cat];
      aiResponse = `${t('reviews.consultBasedOn', { name: selectedReview.buyerName, product: selectedReview.productName })}

${suggestion.detail.map((d, i) => `${i + 1}. ${d}`).join('\n')}

${t('reviews.consultAction')}`;
    } else if (userMsg.includes('差评') || userMsg.includes('问题')) {
      const topCat = sortedCategories[0];
      if (topCat) {
        const suggestion = IMPROVEMENT_SUGGESTIONS[topCat[0] as ProblemCategory];
        aiResponse = `${t('reviews.consultTopIssue', { category: t(CATEGORY_CONFIG[topCat[0] as ProblemCategory].key), count: topCat[1].count })}

${suggestion.short}

${suggestion.detail.slice(0, 2).map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
      } else {
        aiResponse = t('reviews.consultGeneral');
      }
    } else {
      aiResponse = t('reviews.consultGeneral');
    }

    setChatMessages((prev) => [...prev, { role: 'ai', text: aiResponse }]);
    setChatLoading(false);
  };

  return (
    <Row gutter={[16, 16]} style={{ height: '100%' }}>
      {/* Left: Analysis */}
      <Col xs={24} lg={14} style={{ height: '100%', overflow: 'auto' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {/* Summary card */}
          <Card size="small">
            <Row gutter={16}>
              <Col span={8}><Statistic title={t('reviews.analysisProblemTotal')} value={problemReviews.length} suffix={t('reviews.analysisReviews')} /></Col>
              <Col span={8}><Statistic title={t('reviews.analysisAvgRating')} value={problemReviews.length > 0 ? +(problemReviews.reduce((s, r) => s + r.rating, 0) / problemReviews.length).toFixed(1) : 0} suffix="/ 5" /></Col>
              <Col span={8}><Statistic title={t('reviews.analysisCategories')} value={Object.keys(categoryStats).length} suffix={t('reviews.analysisTypes')} /></Col>
            </Row>
          </Card>

          {/* Category breakdown */}
          {sortedCategories.length === 0 ? (
            <Empty description={t('reviews.analysisNoProblems')} />
          ) : (
            sortedCategories.map(([catKey, stats]) => {
              const config = CATEGORY_CONFIG[catKey as ProblemCategory];
              const pct = problemReviews.length > 0 ? +(stats.count / problemReviews.length * 100).toFixed(0) : 0;
              const suggestion = IMPROVEMENT_SUGGESTIONS[catKey as ProblemCategory];
              return (
                <Card
                  key={catKey}
                  size="small"
                  title={
                    <Space>
                      <span style={{ color: config.color }}>{config.icon}</span>
                      <Typography.Text strong>{t(config.key)}</Typography.Text>
                      <Tag color={config.color}>{stats.count}{t('reviews.analysisReviews')}（{pct}%）</Tag>
                      <Tag>{t('reviews.analysisAvgRating')}: {stats.avgRating}⭐</Tag>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <Progress percent={pct} strokeColor={config.color} size="small" />
                  </div>

                  {/* Sample reviews */}
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('reviews.analysisSamples')}：</Typography.Text>
                  {stats.reviews.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => onSelectReview(r)}
                      style={{
                        padding: '4px 8px', margin: '4px 0', borderRadius: 4, cursor: 'pointer',
                        background: selectedReview?.id === r.id ? 'var(--ark-purple-soft)' : 'var(--ark-bg-sink)',
                        fontSize: 12, lineHeight: '18px',
                      }}
                    >
                      <Typography.Text style={{ fontSize: 12 }}>"{r.content.slice(0, 80)}..."</Typography.Text>
                      <Tag style={{ marginLeft: 4 }}>{r.buyerName}</Tag>
                      <Tag color="orange">{r.rating}⭐</Tag>
                    </div>
                  ))}

                  {/* Improvement suggestion */}
                  <Collapse
                    ghost
                    size="small"
                    items={[{
                      key: 'suggestion',
                      label: <span style={{ fontSize: 12 }}><BulbOutlined style={{ color: 'var(--ark-purple)', marginRight: 4 }} />{t('reviews.analysisImprovement')}</span>,
                      children: (
                        <div>
                          <Typography.Text strong style={{ fontSize: 12, color: 'var(--ark-purple)' }}>{suggestion.short}</Typography.Text>
                          {suggestion.detail.map((d, i) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--ark-text-secondary)', marginTop: 4, paddingLeft: 12 }}>
                              • {d}
                            </div>
                          ))}
                        </div>
                      ),
                    }]}
                  />
                </Card>
              );
            })
          )}
        </Space>
      </Col>

      {/* Right: Consultation Panel */}
      <Col xs={24} lg={10} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Card
          size="small"
          title={<><RobotOutlined style={{ color: 'var(--ark-purple)', marginRight: 6 }} />{t('reviews.consultTitle')}</>}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px' }}
        >
          {/* Context: selected review */}
          {selectedReview ? (
            <div style={{ marginBottom: 10, padding: 8, background: 'var(--ark-bg-sink)', borderRadius: 6, fontSize: 12 }}>
              <Typography.Text type="secondary">{t('reviews.consultContext')}：</Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Tag>{selectedReview.buyerName}</Tag>
                <Tag color="orange">{selectedReview.rating}⭐</Tag>
                <Tag>{selectedReview.productName}</Tag>
                <Tag>{storeById.get(selectedReview.storeId)?.name ?? '-'}</Tag>
              </div>
              <Typography.Paragraph style={{ marginTop: 6, fontSize: 12, marginBottom: 0 }} ellipsis={{ rows: 2 }}>
                {selectedReview.content}
              </Typography.Paragraph>
            </div>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 11, marginBottom: 10, display: 'block' }}>
              {t('reviews.consultHint')}
            </Typography.Text>
          )}

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <RobotOutlined style={{ fontSize: 32, color: 'var(--ark-text-tertiary)' }} />
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                  {t('reviews.consultWelcome')}
                </Typography.Paragraph>
                <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
                  {[t('reviews.consultQ1'), t('reviews.consultQ2'), t('reviews.consultQ3')].map((q) => (
                    <Button
                      key={q}
                      size="small"
                      type="dashed"
                      onClick={() => { setChatInput(q); }}
                      style={{ fontSize: 11 }}
                    >
                      {q}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 8, display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%', padding: '6px 10px', borderRadius: 8, fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-line',
                  background: msg.role === 'user' ? 'var(--ark-purple-soft)' : 'var(--ark-bg-sink)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--ark-purple)' : 'var(--ark-border-soft)'}`,
                }}>
                  {msg.role === 'ai' && <RobotOutlined style={{ marginRight: 4, color: 'var(--ark-purple)', fontSize: 10 }} />}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <Input.Search
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t('reviews.consultPlaceholder')}
            enterButton={<Button type="primary" icon={<SendOutlined />} loading={chatLoading} />}
            onSearch={handleSendChat}
            size="small"
          />
        </Card>
      </Col>
    </Row>
  );
}
