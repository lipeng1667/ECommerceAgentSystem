/**
 * File: AgentLiveConsole.tsx
 * Purpose: Task-level simulated runtime console for Agent detail pages. It builds localized
 * execution events, streams them into the terminal UI, and supports replay, pause, and copy actions.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - AgentLiveConsole: renders a task-scoped live execution console.
 *
 * Major updates:
 * - 2026-07-03: Added ownership and function documentation for AI-assisted collaboration.
 */
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Button, Card, Space, Tag, Tooltip, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../app/i18n';
import type { Task } from '../types/domain';

type LiveEventLevel = 'info' | 'success' | 'warning' | 'error';

interface LiveEvent {
  id: string;
  at: string;
  level: LiveEventLevel;
  source: string;
  title: string;
  summary: string;
}

const levelIcon: Record<LiveEventLevel, JSX.Element> = {
  info: <ThunderboltOutlined />,
  success: <CheckCircleOutlined />,
  warning: <ExclamationCircleOutlined />,
  error: <ExclamationCircleOutlined />
};

/**
 * Builds visible runtime events for the task-level live console.
 *
 * @param task - Current task shown in the Agent detail page.
 * @param language - Active UI language.
 * @returns Ordered live-event list used by AgentLiveConsole.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
function buildLiveEvents(task: Task, language: 'en' | 'zh'): LiveEvent[] {
  const zh = language === 'zh';
  const base = dayjs(task.createdAt);
  const at = (seconds: number) => base.add(seconds, 'second').toISOString();
  const source = task.agentType === 'login_bootstrap' ? 'Login Bootstrap Agent' : 'Runtime Adapter';

  const commonStart: LiveEvent[] = [
    {
      id: `${task.id}-live-001`,
      at: at(2),
      level: 'info',
      source: 'Task Control Plane',
      title: zh ? '任务已进入执行队列' : 'Task entered execution queue',
      summary: zh
        ? `AllMall 已创建受控执行任务 ${task.id}，等待 runtime 接收。`
        : `AllMall created controlled task ${task.id} and is waiting for runtime pickup.`
    },
    {
      id: `${task.id}-live-002`,
      at: at(6),
      level: 'info',
      source,
      title: zh ? '正在解析任务目标与约束' : 'Parsing task goal and constraints',
      summary: zh
        ? `Agent 类型为 ${task.agentType}，风险级别为 ${task.riskLevel}。`
        : `Agent type is ${task.agentType}; risk level is ${task.riskLevel}.`
    }
  ];

  if (task.agentType === 'ads_optimizer') {
    return [
      ...commonStart,
      {
        id: `${task.id}-live-003`,
        at: at(12),
        level: 'info',
        source: 'MuleRun Runtime',
        title: zh ? '正在加载店铺浏览器会话' : 'Loading store browser session',
        summary: zh
          ? 'MuleRun 正在加载已绑定的 TikTok Shop browser profile。'
          : 'MuleRun is loading the bound TikTok Shop browser profile.'
      },
      {
        id: `${task.id}-live-004`,
        at: at(24),
        level: 'success',
        source: 'Browser Agent',
        title: zh ? '广告管理页面已打开' : 'Ads manager page opened',
        summary: zh
          ? '已进入广告管理页面，开始读取过去 7 天广告表现。'
          : 'Entered ads manager and started reading 7-day campaign performance.'
      },
      {
        id: `${task.id}-live-005`,
        at: at(38),
        level: 'info',
        source: 'Analysis Engine',
        title: zh ? '正在交叉检查广告与库存数据' : 'Cross-checking ads and inventory',
        summary: zh
          ? 'Agent 正在结合 ROI、消耗、库存和转化率筛选可调整广告计划。'
          : 'Agent is combining ROI, spend, inventory, and conversion rate to shortlist actions.'
      },
      {
        id: `${task.id}-live-006`,
        at: at(52),
        level: 'warning',
        source: 'Risk Policy',
        title: zh ? '发现高风险预算动作' : 'High-risk budget action detected',
        summary: zh
          ? '暂停广告计划 C-102 超过租户阈值，必须进入人工审批。'
          : 'Pausing campaign C-102 exceeds tenant threshold and requires human approval.'
      },
      {
        id: `${task.id}-live-007`,
        at: at(64),
        level: 'warning',
        source: 'Approval Service',
        title: zh ? '已创建审批请求' : 'Approval request created',
        summary: zh
          ? '任务已暂停，等待审批人审核预算调整建议。'
          : 'Task is paused until an approver reviews the budget adjustment proposal.'
      }
    ];
  }

  if (task.agentType === 'product_launch') {
    return [
      ...commonStart,
      {
        id: `${task.id}-live-003`,
        at: at(12),
        level: 'info',
        source: 'Knowledge Base',
        title: zh ? '正在检索平台规则与类目 SOP' : 'Retrieving platform rules and category SOP',
        summary: zh
          ? '已召回标题、属性、禁用词和详情页结构规则。'
          : 'Retrieved title, attribute, prohibited term, and detail page structure rules.'
      },
      {
        id: `${task.id}-live-004`,
        at: at(25),
        level: 'info',
        source: 'Content Agent',
        title: zh ? '正在生成商品草稿' : 'Generating product draft',
        summary: zh
          ? 'Agent 正在生成 SEO 标题、五点描述和属性建议。'
          : 'Agent is generating SEO title, bullet points, and attribute recommendations.'
      },
      {
        id: `${task.id}-live-005`,
        at: at(44),
        level: 'success',
        source: 'Compliance Guard',
        title: zh ? '合规检查通过' : 'Compliance check passed',
        summary: zh
          ? '未发现禁用词、侵权风险或夸大营销描述。'
          : 'No prohibited terms, infringement risk, or exaggerated claims detected.'
      },
      {
        id: `${task.id}-live-006`,
        at: at(58),
        level: 'success',
        source: 'Artifact Service',
        title: zh ? '商品草稿已归档' : 'Product draft archived',
        summary: zh
          ? '标题、属性和详情页结构已保存为可审计 artifact。'
          : 'Title, attributes, and detail page structure were saved as auditable artifacts.'
      }
    ];
  }

  if (task.agentType === 'login_bootstrap') {
    return [
      ...commonStart,
      {
        id: `${task.id}-live-003`,
        at: at(12),
        level: 'warning',
        source: 'Session Monitor',
        title: zh ? '检测到平台要求重新验证' : 'Platform re-authentication detected',
        summary: zh
          ? 'Amazon 卖家中心要求用户完成新的人机校验。'
          : 'Amazon Seller Central requires the user to complete a new human verification.'
      },
      {
        id: `${task.id}-live-004`,
        at: at(26),
        level: 'error',
        source: 'Runtime Adapter',
        title: zh ? '自动化已安全暂停' : 'Automation safely paused',
        summary: zh
          ? 'AllMall 已发送 login_required 事件，并等待运营人员刷新登录会话。'
          : 'AllMall emitted a login_required event and is waiting for an operator to refresh the session.'
      }
    ];
  }

  if (task.agentType === 'competitor_intel') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(10), level: 'info', source: 'Crawler Engine', title: zh ? '正在抓取竞品页面' : 'Crawling competitor pages', summary: zh ? '正在采集 Amazon 和 TikTok Shop 前 20 名竞品定价数据。' : 'Scraping top 20 competitor pricing data from Amazon and TikTok Shop.' },
      { id: `${task.id}-live-004`, at: at(28), level: 'success', source: 'Data Parser', title: zh ? '竞品数据解析完成' : 'Competitor data parsed', summary: zh ? '已提取 18 个 SKU 的价格、销量和评分信息。' : 'Extracted price, sales volume, and rating for 18 SKUs.' },
      { id: `${task.id}-live-005`, at: at(42), level: 'info', source: 'Analysis Engine', title: zh ? '正在生成市场情报报告' : 'Generating market intelligence report', summary: zh ? 'Agent 正在计算市场容量、均价区间和机会评分。' : 'Agent is calculating market capacity, price range, and opportunity scores.' },
      { id: `${task.id}-live-006`, at: at(58), level: 'success', source: 'Intel Service', title: zh ? '情报已推送至下游 Agent' : 'Intel pushed to downstream agents', summary: zh ? '定价策略、商品上架和广告投放 Agent 已收到最新竞品数据。' : 'Pricing, listing, and ads agents received updated competitor data.' },
    ];
  }

  if (task.agentType === 'pricing_strategy') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(10), level: 'info', source: 'Pricing Engine', title: zh ? '正在拉取竞品定价快照' : 'Fetching competitor pricing snapshot', summary: zh ? '从市场情报 Agent 获取最新竞品均价和最低价。' : 'Retrieving latest competitor avg/min prices from intel agent.' },
      { id: `${task.id}-live-004`, at: at(22), level: 'info', source: 'Margin Calculator', title: zh ? '正在计算各 SKU 毛利率' : 'Calculating margins for all SKUs', summary: zh ? '结合成本、运费和平台佣金计算实际毛利率。' : 'Computing real margins with cost, shipping, and platform commission.' },
      { id: `${task.id}-live-005`, at: at(36), level: 'warning', source: 'Risk Policy', title: zh ? '检测到 3 个 SKU 低于市场均价 15%' : '3 SKUs priced 15% below market average', summary: zh ? '建议上调价格以提升毛利，已生成调价建议。' : 'Recommendation to raise prices generated for margin improvement.' },
      { id: `${task.id}-live-006`, at: at(50), level: 'success', source: 'Approval Service', title: zh ? '调价建议已提交审批' : 'Price adjustment submitted for approval', summary: zh ? '5%以内变动自动通过，超出部分等待 Operator 审核。' : 'Changes within 5% auto-approved; larger changes pending Operator review.' },
    ];
  }

  if (task.agentType === 'crm_retention') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(12), level: 'info', source: 'CRM Engine', title: zh ? '正在刷新客户分层' : 'Refreshing customer segments', summary: zh ? '基于近 90 天购买行为重新计算新客/活跃/沉睡/流失分层。' : 'Recomputing new/active/dormant/churned segments from 90-day behavior.' },
      { id: `${task.id}-live-004`, at: at(30), level: 'warning', source: 'Churn Predictor', title: zh ? '识别到 23 个高流失风险客户' : '23 customers at high churn risk', summary: zh ? '预测模型显示这些客户 7 天内流失概率 > 70%。' : 'Predicted churn probability > 70% within 7 days for these customers.' },
      { id: `${task.id}-live-005`, at: at(44), level: 'info', source: 'Campaign Engine', title: zh ? '正在生成挽留券方案' : 'Generating retention coupon plan', summary: zh ? '为高流失风险客户匹配 15% 折扣券，预算控制在 $200 以内。' : 'Matching 15% discount coupons for at-risk customers within $200 budget.' },
      { id: `${task.id}-live-006`, at: at(60), level: 'success', source: 'Notification Service', title: zh ? '挽留券已自动发放' : 'Retention coupons auto-dispatched', summary: zh ? '已向 23 位客户发送个性化挽留券，预计挽回 8 单。' : 'Personalized coupons sent to 23 customers, est. 8 orders recovered.' },
    ];
  }

  if (task.agentType === 'review_manager') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(8), level: 'info', source: 'Review Scanner', title: zh ? '正在扫描新增评价' : 'Scanning new reviews', summary: zh ? '已拉取 Amazon 和 TikTok Shop 近 2 小时新增的 12 条评价。' : 'Fetched 12 new reviews from Amazon and TikTok Shop in the last 2h.' },
      { id: `${task.id}-live-004`, at: at(18), level: 'warning', source: 'NLP Engine', title: zh ? '检测到 2 条差评（1-2 星）' : '2 negative reviews detected (1-2 stars)', summary: zh ? '差评内容涉及产品质量和物流速度，已标记为优先处理。' : 'Negative sentiment on product quality and shipping speed flagged.' },
      { id: `${task.id}-live-005`, at: at(32), level: 'info', source: 'AI Reply Generator', title: zh ? '正在生成差评回复' : 'Generating review replies', summary: zh ? 'Agent 正在按"专业友好"语气生成个性化回复模板。' : 'Agent is generating personalized reply templates in professional-friendly tone.' },
      { id: `${task.id}-live-006`, at: at(46), level: 'success', source: 'Reply Service', title: zh ? '差评回复已自动发送' : 'Replies auto-sent', summary: zh ? '2 条差评已回复，同时向 5 位好评客户发送了感谢消息。' : 'Replied to 2 negative reviews; sent thank-you to 5 positive reviewers.' },
    ];
  }

  if (task.agentType === 'customer_service') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(6), level: 'info', source: 'Message Listener', title: zh ? '检测到买家新消息' : 'New buyer message detected', summary: zh ? '买家询问物流进度，意图分类为「订单查询」。' : 'Buyer asking about shipping status, intent: order inquiry.' },
      { id: `${task.id}-live-004`, at: at(14), level: 'info', source: 'Intent Router', title: zh ? '正在匹配回复策略' : 'Matching reply strategy', summary: zh ? '命中 FAQ 库「物流查询」分类，置信度 92%。' : 'Matched FAQ category "shipping tracking" with 92% confidence.' },
      { id: `${task.id}-live-005`, at: at(22), level: 'success', source: 'Auto Reply', title: zh ? '自动回复已发送' : 'Auto-reply sent', summary: zh ? '已向买家发送订单物流信息和预计送达时间。' : 'Sent order tracking info and estimated delivery date to buyer.' },
      { id: `${task.id}-live-006`, at: at(30), level: 'info', source: 'Learning Engine', title: zh ? 'FAQ 知识库已更新' : 'FAQ knowledge base updated', summary: zh ? '本次对话已归档，用于优化意图识别模型。' : 'Conversation archived for intent recognition model improvement.' },
    ];
  }

  if (task.agentType === 'after_sales') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(10), level: 'info', source: 'Event Listener', title: zh ? '检测到退货申请' : 'Return request detected', summary: zh ? '订单 AMZ-10245 申请退货，原因：商品缺陷，金额 $32.99。' : 'Order AMZ-10245 return request: defective product, $32.99.' },
      { id: `${task.id}-live-004`, at: at(20), level: 'info', source: 'Policy Engine', title: zh ? '正在评估自动处理条件' : 'Evaluating auto-process conditions', summary: zh ? '金额 $32.99 超过自动退款上限 $20，需 Operator 审批。' : 'Amount $32.99 exceeds auto-refund limit $20, requires Operator approval.' },
      { id: `${task.id}-live-005`, at: at(34), level: 'warning', source: 'Approval Service', title: zh ? '退货申请已转人工审批' : 'Return request sent for manual approval', summary: zh ? '已创建审批工单并通知 Operator，同时暂停自动处理流程。' : 'Approval ticket created, Operator notified, auto-processing paused.' },
      { id: `${task.id}-live-006`, at: at(48), level: 'info', source: 'Logistics Tracker', title: zh ? '已关联退货运单追踪' : 'Return shipment tracking linked', summary: zh ? '退货地址已发送给买家，系统将自动跟踪物流状态。' : 'Return address sent to buyer; system will auto-track return shipment.' },
    ];
  }

  if (task.agentType === 'promotion_campaign') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(12), level: 'info', source: 'Trigger Engine', title: zh ? '自动触发促销规则命中' : 'Auto-trigger rule matched', summary: zh ? '3 个 SKU 滞销超过 60 天，触发自动闪购规则（35% OFF）。' : '3 SKUs dead-stocked > 60 days, triggering auto flash sale (35% OFF).' },
      { id: `${task.id}-live-004`, at: at(24), level: 'info', source: 'Budget Planner', title: zh ? '正在计算活动预算' : 'Calculating campaign budget', summary: zh ? '预估活动预算 $450，低于 $500 自动审批额度。' : 'Estimated budget $450, within $500 auto-approval threshold.' },
      { id: `${task.id}-live-005`, at: at(38), level: 'success', source: 'Campaign Service', title: zh ? '闪购活动已自动创建' : 'Flash sale auto-created', summary: zh ? '已在 Amazon 和 TikTok Shop 同步上线，周期 7 天。' : 'Live on Amazon and TikTok Shop, 7-day duration.' },
      { id: `${task.id}-live-006`, at: at(52), level: 'info', source: 'Monitor', title: zh ? '活动效果监控已启动' : 'Campaign performance monitoring started', summary: zh ? '将每 4 小时检查一次 ROI，低于 1.5 时自动告警。' : 'ROI checked every 4h; alert if below 1.5.' },
    ];
  }

  if (task.agentType === 'inventory_alert') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(8), level: 'info', source: 'Inventory Scanner', title: zh ? '正在扫描库存快照' : 'Scanning inventory snapshot', summary: zh ? '已拉取 4 个店铺共 156 个 SKU 的实时库存数据。' : 'Fetched real-time inventory for 156 SKUs across 4 stores.' },
      { id: `${task.id}-live-004`, at: at(18), level: 'warning', source: 'Threshold Checker', title: zh ? '发现 4 个低库存 SKU' : '4 low-stock SKUs detected', summary: zh ? 'Wireless Earbuds Pro 2 仅剩 8 件，低于阈值 20。' : 'Wireless Earbuds Pro 2 down to 8 units, below threshold of 20.' },
      { id: `${task.id}-live-005`, at: at(30), level: 'info', source: 'Replenish Planner', title: zh ? '正在生成补货建议' : 'Generating replenishment suggestions', summary: zh ? '根据日均销量和到货周期计算建议补货量 200 件。' : 'Calculated suggested replenishment qty of 200 units based on daily sales and lead time.' },
      { id: `${task.id}-live-006`, at: at(44), level: 'success', source: 'Auto Replenish', title: zh ? '补货订单已自动创建' : 'Replenishment order auto-created', summary: zh ? '采购金额 $2,900 低于 $500 自动审批额度限制，已提交供应商。' : 'Order value within auto-approval limit, submitted to supplier.' },
    ];
  }

  if (task.agentType === 'creative_factory') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(12), level: 'info', source: 'Creative Engine', title: zh ? '正在生成广告素材' : 'Generating ad creatives', summary: zh ? '基于商品图片和市场情报生成 3 组广告图和文案。' : 'Generating 3 ad creative sets from product images and market intel.' },
      { id: `${task.id}-live-004`, at: at(28), level: 'info', source: 'Copy Generator', title: zh ? '正在生成广告文案' : 'Generating ad copy', summary: zh ? '按"促销感"语气生成 5 条标题和 3 组描述文案。' : 'Generating 5 headlines and 3 description sets in promotional tone.' },
      { id: `${task.id}-live-005`, at: at(44), level: 'success', source: 'Asset Service', title: zh ? '素材已归档' : 'Creatives archived', summary: zh ? '3 组素材（1:1 / 16:9 / 9:16）已保存，待 Operator 选用。' : '3 creative sets (1:1 / 16:9 / 9:16) saved, pending Operator selection.' },
      { id: `${task.id}-live-006`, at: at(56), level: 'info', source: 'Pipeline', title: zh ? '素材已推送至广告 Agent' : 'Creatives pushed to ads agent', summary: zh ? '广告投放 Agent 已收到新素材，将在下次巡检中测试效果。' : 'Ads agent received new creatives for next patrol A/B test.' },
    ];
  }

  if (task.agentType === 'risk_control') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(6), level: 'info', source: 'Risk Scanner', title: zh ? '正在扫描 11 个 Agent 行为日志' : 'Scanning 11 agents behavior logs', summary: zh ? '检查近 1 分钟内所有 Agent 操作是否违反风控规则。' : 'Checking all agent actions in the last minute against risk rules.' },
      { id: `${task.id}-live-004`, at: at(16), level: 'warning', source: 'Compliance Guard', title: zh ? '检测到 1 个合规风险' : '1 compliance risk detected', summary: zh ? '广告文案含"全网最低"违禁词，已标记需修改。' : 'Ad copy contains prohibited term "lowest全网", flagged for revision.' },
      { id: `${task.id}-live-005`, at: at(28), level: 'info', source: 'Circuit Breaker', title: zh ? '熔断器状态检查完成' : 'Circuit breaker status checked', summary: zh ? '所有 Agent 熔断器处于 closed 状态，无异常流量。' : 'All agent circuit breakers closed, no abnormal traffic detected.' },
      { id: `${task.id}-live-006`, at: at(40), level: 'success', source: 'Risk Report', title: zh ? '风控扫描完成' : 'Risk scan completed', summary: zh ? '发现 1 个中风险项已通知对应 Agent，0 个高风险项。' : '1 medium-risk item reported to agent, 0 high-risk items.' },
    ];
  }

  if (task.agentType === 'finance_audit') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(14), level: 'info', source: 'Reconciliation Engine', title: zh ? '正在拉取平台账单' : 'Fetching platform statements', summary: zh ? '从 Amazon 和 TikTok Shop API 拉取本月订单和结算数据。' : 'Fetching monthly orders and settlement data from Amazon and TikTok Shop APIs.' },
      { id: `${task.id}-live-004`, at: at(30), level: 'info', source: 'Bank Matcher', title: zh ? '正在匹配银行到账记录' : 'Matching bank deposits', summary: zh ? '已匹配 1,245 笔订单收款，匹配率 98.2%。' : 'Matched 1,245 order payments, match rate 98.2%.' },
      { id: `${task.id}-live-005`, at: at(46), level: 'warning', source: 'Discrepancy Detector', title: zh ? '发现 $250 账面差异' : '$250 discrepancy detected', summary: zh ? 'Amazon 平台收入 $32,100，银行到账 $31,850，差异已标记调查。' : 'Amazon revenue $32,100 vs bank received $31,850, discrepancy flagged.' },
      { id: `${task.id}-live-006`, at: at(60), level: 'success', source: 'Report Generator', title: zh ? '对账报告已自动生成' : 'Reconciliation report auto-generated', summary: zh ? '月度对账报告已归档，差异项已通知财务负责人。' : 'Monthly report archived; discrepancy items notified to finance lead.' },
    ];
  }

  if (task.agentType === 'live_stream_ops') {
    return [
      ...commonStart,
      { id: `${task.id}-live-003`, at: at(8), level: 'info', source: 'Stream Monitor', title: zh ? '直播已开始，进入监控' : 'Live stream started, monitoring engaged', summary: zh ? 'TikTok Shop 直播间已上线，当前观看 1,250 人。' : 'TikTok Shop live stream online, 1,250 current viewers.' },
      { id: `${task.id}-live-004`, at: at(20), level: 'info', source: 'Product Pinner', title: zh ? '已自动置顶热销商品' : 'Auto-pinned top-selling product', summary: zh ? 'Wireless Earbuds Pro 2 已置顶，点击率提升 15%。' : 'Wireless Earbuds Pro 2 pinned, CTR up 15%.' },
      { id: `${task.id}-live-005`, at: at(34), level: 'success', source: 'AI Reply', title: zh ? 'AI 已回复 8 条评论' : 'AI replied to 8 comments', summary: zh ? '自动回复商品价格和库存问题，转化率 3.2%。' : 'Auto-replied to price/stock questions, 3.2% conversion rate.' },
      { id: `${task.id}-live-006`, at: at(48), level: 'info', source: 'Metrics Dashboard', title: zh ? '实时数据已同步' : 'Real-time metrics synced', summary: zh ? 'GMV $1,240，点赞 3,200，评论 45，转化率 3.2%。' : 'GMV $1,240, 3,200 likes, 45 comments, 3.2% conversion.' },
    ];
  }

  return [
    ...commonStart,
    {
      id: `${task.id}-live-003`,
      at: at(14),
      level: 'info',
      source: 'Agent Planner',
      title: zh ? '正在生成执行计划' : 'Generating execution plan',
      summary: zh
        ? 'Agent 已拆解任务步骤，并准备调用 runtime 工具。'
        : 'Agent decomposed the task and is preparing runtime tool calls.'
    },
    {
      id: `${task.id}-live-004`,
      at: at(34),
      level: task.status === 'failed' ? 'error' : 'success',
      source: 'Task Control Plane',
      title: task.status === 'failed' ? (zh ? '任务执行失败' : 'Task execution failed') : zh ? '任务执行完成' : 'Task execution completed',
      summary:
        task.status === 'failed'
          ? zh
            ? '执行结果已写入审计日志，可查看失败原因和回放证据。'
            : 'Execution result was written to audit logs with failure reason and replay evidence.'
          : zh
            ? '最终结果已归档，等待业务结果回收。'
            : 'Final result was archived and is waiting for business outcome collection.'
    }
  ];
}

/**
 * Converts one live event into a plain text log line for clipboard export.
 *
 * @param event - Runtime event currently visible in the console.
 * @returns Human-readable log line with time, source, title, and summary.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
function formatLine(event: LiveEvent) {
  return `[${dayjs(event.at).format('HH:mm:ss')}] ${event.source} :: ${event.title} - ${event.summary}`;
}

/**
 * Renders a task-level live execution console with localized simulated runtime events.
 *
 * @param task - Agent task used to derive the event stream and runtime metadata.
 * @returns React element containing the live console card.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
export function AgentLiveConsole({ task }: { task: Task }) {
  const { language, t } = useI18n();
  const allEvents = useMemo(() => buildLiveEvents(task, language), [task, language]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [isStreaming, setIsStreaming] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleEvents = allEvents.slice(0, visibleCount);
  const isComplete = visibleCount >= allEvents.length;

  useEffect(() => {
    setVisibleCount(1);
    setIsStreaming(true);
  }, [task.id, allEvents]);

  useEffect(() => {
    if (!isStreaming || isComplete) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, allEvents.length));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [allEvents.length, isComplete, isStreaming, visibleCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleEvents.length]);

  /**
   * Copies the currently visible execution stream into the clipboard.
   *
   * @returns Promise that resolves after the browser clipboard write completes.
   *
   * Author: Michael Lee
   * Created: 2026-07-03
   */
  const copyLog = async () => {
    await navigator.clipboard?.writeText(visibleEvents.map(formatLine).join('\n'));
    message.success(t('liveConsole.copied'));
  };

  return (
    <Card
      className="agent-live-card"
      title={
        <Space>
          <span className="live-pulse" />
          <span>{t('liveConsole.title')}</span>
          <Tag className="live-state-tag">{isComplete ? t('liveConsole.synced') : t('liveConsole.streaming')}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title={isStreaming ? t('liveConsole.pause') : t('liveConsole.resume')}>
            <Button
              size="small"
              icon={isStreaming ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsStreaming((value) => !value)}
            />
          </Tooltip>
          <Tooltip title={t('liveConsole.replay')}>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setVisibleCount(1);
                setIsStreaming(true);
              }}
            />
          </Tooltip>
          <Tooltip title={t('liveConsole.copy')}>
            <Button size="small" icon={<CopyOutlined />} onClick={copyLog} />
          </Tooltip>
        </Space>
      }
    >
      <div className="agent-live-meta">
        <span>{t('liveConsole.runId')}: run_{task.id}</span>
        <span>{t('liveConsole.provider')}: MuleRun</span>
        <span>{t('liveConsole.events')}: {visibleEvents.length}/{allEvents.length}</span>
      </div>
      <div className="agent-live-terminal" ref={scrollRef}>
        {visibleEvents.map((event) => (
          <div className={`agent-live-line agent-live-line-${event.level}`} key={event.id}>
            <span className="agent-live-time">
              <ClockCircleOutlined /> {dayjs(event.at).format('HH:mm:ss')}
            </span>
            <span className="agent-live-icon">{levelIcon[event.level]}</span>
            <span className="agent-live-source">{event.source}</span>
            <span className="agent-live-copy">
              <Typography.Text strong>{event.title}</Typography.Text>
              <Typography.Text>{event.summary}</Typography.Text>
            </span>
          </div>
        ))}
        {!isComplete ? <span className="agent-live-cursor" /> : null}
      </div>
    </Card>
  );
}
