/**
 * Review Management Page — V1.0
 * Full-page review list with filtering, reply, and templates.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StarFilled, StarOutlined, CheckCircleOutlined, WarningOutlined,
  ThunderboltOutlined, MehOutlined, FrownOutlined, SmileOutlined,
  BarChartOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Alert, Avatar, Button, Card, Col, Empty, Input, Modal, Progress, Popconfirm,
  Row, Segmented, Select, Space, Spin, Switch, Table, Tag, Typography, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { reviewsApi } from '../../api/reviews';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { ReviewAnalysis } from './ReviewAnalysis';
import type { AllMallId, Review, ReviewRating, ReviewTemplate } from '../../types/domain';

function StarRating({ rating }: { rating: ReviewRating }) {
  return (
    <span style={{ color: 'var(--ark-orange)' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        s <= rating ? <StarFilled key={s} style={{ fontSize: 12 }} /> : <StarOutlined key={s} style={{ fontSize: 12 }} />
      ))}
    </span>
  );
}

function SentimentTag({ sentiment }: { sentiment: Review['sentiment'] }) {
  const map = {
    positive: { color: 'green', icon: <SmileOutlined />, labelKey: 'reviews.sentiment_positive' },
    neutral: { color: 'blue', icon: <MehOutlined />, labelKey: 'reviews.sentiment_neutral' },
    negative: { color: 'red', icon: <FrownOutlined />, labelKey: 'reviews.sentiment_negative' },
  };
  const { t } = useI18n();
  const item = map[sentiment];
  return item ? <Tag color={item.color} icon={item.icon}>{t(item.labelKey)}</Tag> : <Tag>{sentiment}</Tag>;
}

export function ReviewManagementPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [storeFilter, setStoreFilter] = useState<AllMallId | undefined>();
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string | undefined>();
  const [repliedFilter, setRepliedFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  // Agent automation
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentScanning, setAgentScanning] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [selectedAnalysisReview, setSelectedAnalysisReview] = useState<Review | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);

  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', storeFilter, ratingFilter, sentimentFilter, repliedFilter, search],
    queryFn: () => reviewsApi.list({
      storeId: storeFilter,
      rating: ratingFilter === 'all' ? undefined : (Number(ratingFilter) as ReviewRating),
      sentiment: sentimentFilter,
      replied: repliedFilter === 'all' ? undefined : repliedFilter === 'replied',
      search: search || undefined,
    }),
  });
  const { data: stats } = useQuery({
    queryKey: ['reviewStats', storeFilter],
    queryFn: () => reviewsApi.getStats(storeFilter),
  });
  const { data: templates = [] } = useQuery({
    queryKey: ['reviewTemplates'],
    queryFn: reviewsApi.getTemplates,
  });

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    await reviewsApi.replyToReview(replyTarget.id, replyText.trim());
    message.success(t('reviews.replySuccess'));
    setReplyModalOpen(false);
    setReplyTarget(null);
    setReplyText('');
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['reviewStats'] });
  };

  const openReply = (review: Review) => {
    setReplyTarget(review);
    setReplyText('');
    setShowTemplates(false);
    setReplyModalOpen(true);
  };

  const selectTemplate = (tmpl: ReviewTemplate) => {
    setReplyText(tmpl.text);
  };

  // Agent: scan all unreplied reviews
  const handleAgentScan = async () => {
    setAgentScanning(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAgentScanning(false);
    setSentimentFilter('negative');
    setRepliedFilter('unreplied');
    message.info(t('reviews.agentScanned', { count: negativeCount + unrepliedCount }));
  };

  // Agent: AI generate reply suggestion for current review
  const handleAiSuggest = async () => {
    if (!replyTarget) return;
    setAiSuggesting(true);
    await new Promise((r) => setTimeout(r, 800));
    const suggestions: Record<string, string> = {
      positive: '感谢亲的五星好评！您的满意是我们最大的动力，新品即将上线，期待您的再次光临~',
      neutral: '感谢亲的反馈！我们会认真考虑您的建议，持续改进产品和服务。如有任何问题请随时联系我们。',
      negative: '亲，非常抱歉给您带来不好的体验！我们已注意到您的问题，客服会第一时间联系您处理。同时为您申请了补偿，请您留意消息通知。',
    };
    setReplyText(suggestions[replyTarget.sentiment] ?? suggestions.neutral);
    setAiSuggesting(false);
    message.success(t('reviews.aiSuggested'));
  };

  // Agent: batch auto-reply to positive unreplied reviews
  const handleAutoReply = async () => {
    const positiveUnreplied = reviews.filter((r) => r.sentiment === 'positive' && !r.replied);
    if (positiveUnreplied.length === 0) {
      message.info(t('reviews.noAutoReplyTarget'));
      return;
    }
    for (const r of positiveUnreplied) {
      await reviewsApi.replyToReview(r.id, t('reviews.autoReplyText'));
    }
    message.success(t('reviews.autoReplyDone', { count: positiveUnreplied.length }));
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['reviewStats'] });
  };

  const negativeCount = stats?.negative ?? 0;
  const avgRating = stats?.avgRating ?? 0;
  const unrepliedCount = stats?.unreplied ?? 0;

  const columns: ColumnsType<Review> = [
    { title: t('reviews.buyer'), key: 'buyer', width: 100, render: (_: unknown, r: Review) => (
      <Space>
        <Avatar size={28} style={{ background: 'var(--ark-purple-soft)', color: 'var(--ark-purple)' }}>
          {r.buyerName[0]}
        </Avatar>
        <Typography.Text strong>{r.buyerName}</Typography.Text>
      </Space>
    ) },
    { title: t('reviews.rating'), key: 'rating', width: 110, render: (_: unknown, r: Review) => <StarRating rating={r.rating} /> },
    { title: t('reviews.product'), dataIndex: 'productName', width: 160, ellipsis: true },
    {
      title: t('reviews.content'), dataIndex: 'content', ellipsis: true,
      render: (text: string, r: Review) => (
        <div>
          <Typography.Text style={{ fontSize: 13 }}>{text}</Typography.Text>
          {r.reply && (
            <div style={{ marginTop: 6, padding: '6px 8px', background: 'var(--ark-bg-sink)', borderRadius: 4, borderLeft: '3px solid var(--ark-purple)' }}>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('reviews.merchantReply')}：</Typography.Text>
              <Typography.Text style={{ fontSize: 12 }}>{r.reply.content}</Typography.Text>
            </div>
          )}
        </div>
      ),
    },
    { title: t('reviews.sentiment'), key: 'sentiment', width: 100, render: (_: unknown, r: Review) => <SentimentTag sentiment={r.sentiment} /> },
    { title: t('reviews.date'), key: 'date', width: 100, render: (_: unknown, r: Review) => (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.createdAt).format('MM-DD HH:mm')}</Typography.Text>
    ) },
    {
      title: t('reviews.status'), key: 'status', width: 90,
      render: (_: unknown, r: Review) => r.replied
        ? <Tag icon={<CheckCircleOutlined />} color="green">{t('reviews.replied')}</Tag>
        : <Tag color="orange">{t('reviews.unreplied')}</Tag>,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: unknown, r: Review) => (
        <Button size="small" type={r.replied ? 'default' : 'primary'} onClick={() => openReply(r)}>
          {r.replied ? t('reviews.editReply') : t('reviews.reply')}
        </Button>
      ),
    },
  ];

  if (stores.length === 0) {
    return <StoreConnectionEmptyState description={t('reviews.emptyNoStore')} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={t('nav.reviews')}
        description={t('reviews.subtitle', { total: stats?.total ?? 0, negative: negativeCount })}
      />

      {/* Agent card: review_manager */}
      <Card
        size="small"
        style={{ margin: '0 24px 12px', borderLeft: '3px solid var(--ark-purple)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <ThunderboltOutlined style={{ color: 'var(--ark-purple)', fontSize: 16 }} />
            <Typography.Text strong>{t('reviews.agentTitle')}</Typography.Text>
            <Tag color="purple">{t('agent.review_manager')}</Tag>
            <Tag color={agentEnabled ? 'green' : 'default'}>{agentEnabled ? t('reviews.agentActive') : t('reviews.agentPaused')}</Tag>
          </Space>
          <Space>
            <Switch
              checked={agentEnabled}
              onChange={setAgentEnabled}
              checkedChildren="ON"
              unCheckedChildren="OFF"
              size="small"
            />
            <Popconfirm
              title={t('reviews.autoReplyConfirm')}
              onConfirm={handleAutoReply}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button size="small" icon={<ThunderboltOutlined />} type="primary" ghost disabled={!agentEnabled}>
                {t('reviews.autoReplyPositive')}
              </Button>
            </Popconfirm>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={handleAgentScan} loading={agentScanning}>
              {t('reviews.agentScan')}
            </Button>
          </Space>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
          {t('reviews.agentDescription')}
        </Typography.Text>
      </Card>

      {/* Stats cards */}
      <Row gutter={[12, 12]} style={{ padding: '0 24px', marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><StatCard
            title={t('reviews.avgRating')} value={avgRating} suffix=" / 5"
            color={avgRating >= 4 ? '#52c41a' : avgRating >= 3 ? '#faad14' : '#ff4d4f'}
          /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><StatCard
            title={t('reviews.totalReviews')} value={stats?.total ?? 0}
            color={'var(--ark-purple)'}
          /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><StatCard
            title={t('reviews.negativeCount')} value={negativeCount} suffix={t('reviews.needAttention')}
            color={negativeCount > 0 ? '#ff4d4f' : '#52c41a'}
          /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><StatCard
            title={t('reviews.unrepliedCount')} value={unrepliedCount} suffix={t('reviews.pending')}
            color={unrepliedCount > 0 ? '#faad14' : '#52c41a'}
          /></Card>
        </Col>
      </Row>

      {/* Negative review alert */}
      {negativeCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={t('reviews.negativeAlert', { count: negativeCount })}
          style={{ margin: '0 24px 12px' }}
          action={<Button size="small" onClick={() => setSentimentFilter('negative')}>{t('reviews.viewAll')}</Button>}
        />
      )}

      {/* Filters */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder={t('reviews.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={storeFilter}
          onChange={setStoreFilter}
          allowClear
          placeholder={t('cs.filterByStore')}
          style={{ width: 140 }}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Segmented
          size="small"
          value={ratingFilter}
          onChange={(val) => setRatingFilter(val as string)}
          options={[
            { value: 'all', label: t('reviews.filterAllRatings') },
            { value: '1', label: '⭐1' },
            { value: '2', label: '⭐2' },
            { value: '3', label: '⭐3' },
            { value: '4', label: '⭐4' },
            { value: '5', label: '⭐5' },
          ]}
        />
        <Segmented
          size="small"
          value={sentimentFilter ?? 'all'}
          onChange={(val) => setSentimentFilter(val === 'all' ? undefined : val as string)}
          options={[
            { value: 'all', label: t('reviews.filterAllSentiment') },
            { value: 'negative', label: t('reviews.negativeOnly') },
            { value: 'neutral', label: t('reviews.neutralOnly') },
            { value: 'positive', label: t('reviews.positiveOnly') },
          ]}
        />
        <Segmented
          size="small"
          value={repliedFilter}
          onChange={(val) => setRepliedFilter(val as 'all' | 'replied' | 'unreplied')}
          options={[
            { value: 'all', label: t('reviews.filterAllReply') },
            { value: 'unreplied', label: t('reviews.unrepliedOnly') },
            { value: 'replied', label: t('reviews.repliedOnly') },
          ]}
        />
        <Segmented
          size="small"
          value={viewMode}
          onChange={(val) => { setViewMode(val as 'list' | 'analysis'); setSelectedAnalysisReview(null); }}
          options={[
            { value: 'list', icon: <UnorderedListOutlined />, label: t('reviews.listView') },
            { value: 'analysis', icon: <BarChartOutlined />, label: t('reviews.analysisView') },
          ]}
        />
      </div>

      {/* Review content: list or analysis */}
      <div style={{ flex: 1, padding: '0 24px', overflow: 'auto' }}>
        {viewMode === 'analysis' ? (
          <ReviewAnalysis
            selectedReview={selectedAnalysisReview}
            onSelectReview={setSelectedAnalysisReview}
            storeFilter={storeFilter}
          />
        ) : (
        <Table<Review>
          rowKey="id"
          columns={columns}
          dataSource={reviews}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => t('cs.totalSessions', { count: total }) }}
          size="middle"
          locale={{ emptyText: <Empty description={t('reviews.noReviews')} /> }}
        />
        )}
      </div>

      {/* Reply modal */}
      <Modal
        title={replyTarget?.replied ? t('reviews.editReply') : t('reviews.reply')}
        open={replyModalOpen}
        onOk={handleReply}
        onCancel={() => { setReplyModalOpen(false); setReplyTarget(null); }}
        okText={t('reviews.submitReply')}
        cancelText={t('common.cancel')}
        width={600}
        confirmLoading={false}
      >
        {replyTarget && (
          <>
            <div style={{ marginBottom: 12, padding: 10, background: 'var(--ark-bg-sink)', borderRadius: 6 }}>
              <Space><Avatar size={24}>{replyTarget.buyerName[0]}</Avatar>
                <Typography.Text strong>{replyTarget.buyerName}</Typography.Text>
                <StarRating rating={replyTarget.rating} />
              </Space>
              <Typography.Paragraph style={{ marginTop: 6, fontSize: 13, marginBottom: 0 }}>
                {replyTarget.content}
              </Typography.Paragraph>
            </div>
            <Space style={{ marginBottom: 8 }}>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                type={showTemplates ? 'primary' : 'default'}
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {t('reviews.useTemplate')}
              </Button>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                type="primary"
                ghost
                onClick={handleAiSuggest}
                loading={aiSuggesting}
              >
                {t('reviews.aiSuggest')}
              </Button>
              {replyTarget && (
                <Tag color={replyTarget.sentiment === 'negative' ? 'red' : replyTarget.sentiment === 'neutral' ? 'blue' : 'green'}>
                  {t(`reviews.sentiment_${replyTarget.sentiment}`)}
                </Tag>
              )}
            </Space>
            {showTemplates && (
              <div style={{ marginBottom: 10, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--ark-border-soft)', borderRadius: 6, padding: 6 }}>
                {(['thanks', 'apology', 'explain', 'invite'] as const).map((cat) => {
                  const items = templates.filter((tmpl) => tmpl.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} style={{ marginBottom: 8 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t(`reviews.tpl_${cat}`)}</Typography.Text>
                      {items.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          onClick={() => selectTemplate(tmpl)}
                          style={{
                            padding: '5px 8px', marginTop: 3, borderRadius: 4, cursor: 'pointer',
                            fontSize: 12, border: '1px solid var(--ark-border-soft)',
                            background: replyText === tmpl.text ? 'var(--ark-purple-soft)' : 'var(--ark-bg-surface)',
                          }}
                        >
                          {tmpl.text}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            <Input.TextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder={t('reviews.replyPlaceholder')}
            />
          </>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, suffix, color }: { title: string; value: number | string; suffix?: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{title}</Typography.Text>
      <div>
        <Typography.Text strong style={{ fontSize: 24, color }}>{value}{suffix ? <span style={{ fontSize: 13 }}>{suffix}</span> : null}</Typography.Text>
      </div>
    </div>
  );
}
