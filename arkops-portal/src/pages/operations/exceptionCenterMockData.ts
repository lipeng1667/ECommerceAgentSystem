// ===== 异常类型 =====
export type ExceptionType = 'review_negative' | 'chat_escalation' | 'ad_low_roi' | 'logistics_stuck' | 'compliance_flag';

export type ExceptionStatus = 'pending' | 'resolved' | 'ignored' | 'all';

export interface ExceptionItem {
  id: string;
  type: ExceptionType;
  title: string;
  storeName: string;
  agentType: string;
  level: 'critical' | 'warning' | 'info';
  summary: string;
  detail: string;
  suggestedAction: string;
  createdAt: string;
  resolved: boolean;
  ignored: boolean;
  assignee?: string;
  linkTo?: string; // 深链接到专业处理页面
}

// ===== Agent 操作日志 =====
export interface AgentLogEntry {
  id: string;
  agentType: string;
  action: string;
  target: string;
  result: 'success' | 'auto_resolved' | 'escalated' | 'blocked' | 'failed';
  summary: string;
  at: string;
}

// ===== 预设负责人列表 =====
export const ASSIGNEE_OPTIONS = ['张伟', '李娜', '王强', '赵敏', '陈浩'];

export const exceptionItems: ExceptionItem[] = [
  {
    id: 'ex_002', type: 'review_negative', title: '恶意差评检测',
    storeName: 'Amazon 户外用品店', agentType: '评价管理',
    level: 'critical', summary: '折叠露营椅收到 1 星差评，AI 判定疑似同行攻击 (置信度 87%)。',
    detail: '评论内容: "质量极差，跟图片完全不符，千万别买"\n买家历史: 新账号、无购买历史、3 天内 5 条差评\nAI 判定: 同行恶意差评',
    suggestedAction: '提交平台申诉，附 AI 分析报告',
    createdAt: '2026-06-21 09:15', resolved: false, ignored: false,
    linkTo: '/agents/review_manager',
  },
  {
    id: 'ex_003', type: 'chat_escalation', title: '退款争议升级',
    storeName: 'Shopify 独立站', agentType: '客服消息',
    level: 'critical', summary: '买家投诉未收到商品，要求全额退款并威胁信用卡拒付。',
    detail: '运单号: 1Z999AA1234567890\n物流状态: 显示已签收但买家否认\n买家情绪: 愤怒，威胁发起 chargeback',
    suggestedAction: '提供签收证明截图，安抚买家情绪，必要时部分退款',
    createdAt: '2026-06-21 11:00', resolved: false, ignored: false,
    linkTo: '/agents/customer_service',
  },
  {
    id: 'ex_004', type: 'ad_low_roi', title: '广告计划 ROI 跌破红线',
    storeName: 'TikTok Shop 美国旗舰店', agentType: 'ads_optimizer',
    level: 'warning', summary: '广告计划 C-102 连续 3 天 ROI < 1.5，已自动暂停但预算仍消耗 $612。',
    detail: '计划: C-102 蓝牙耳机促销\n7 天花费: $612，GMV: $869，ROI: 1.42\n红线: 1.5\n建议: 更换素材或降低出价',
    suggestedAction: '审核广告素材，决定是否重启或永久关闭',
    createdAt: '2026-06-21 08:00', resolved: false, ignored: false,
    linkTo: '/agents/ads_optimizer',
  },
  {
    id: 'ex_006', type: 'logistics_stuck', title: '物流包裹滞留',
    storeName: 'TikTok Shop 美国旗舰店', agentType: '售后处理',
    level: 'warning', summary: '退货包裹 #RT-2406-0047 在 USPS 中转站滞留 5 天未更新。',
    detail: '退货单号: RT-2406-0047\n物流商: USPS\n最后更新: 2026-06-16 Chicago IL Distribution Center\n状态: In Transit (5 天无更新)',
    suggestedAction: '联系 USPS 查询包裹状态，或发起丢失索赔',
    createdAt: '2026-06-21 06:30', resolved: false, ignored: false,
    linkTo: '/agents/after_sales',
  },
  {
    id: 'ex_007', type: 'compliance_flag', title: '合规风险标记',
    storeName: 'TikTok Shop 美国旗舰店', agentType: 'risk_control',
    level: 'warning', summary: '蓝牙耳机商品描述含"最强降噪"，被标记为可能违反广告法。',
    detail: '商品: SKU BT-E01 蓝牙耳机 Pro\n问题: 描述含绝对化用语 "最强"\n法规: 广告法第 9 条禁止 "最" 字类绝对化用语',
    suggestedAction: '修改描述为 "高效降噪" 或 "顶级降噪体验"',
    createdAt: '2026-06-21 05:00', resolved: true, ignored: false,
    linkTo: '/agents/risk_control',
  },
];

export const agentLogData: AgentLogEntry[] = [
  { id: 'log_001', agentType: 'ads_optimizer', action: '暂停广告计划', target: 'C-102 蓝牙耳机促销', result: 'auto_resolved', summary: 'ROI 连续 3 天低于 1.5 红线，自动暂停并通知运营', at: '08:00' },
  { id: 'log_002', agentType: 'pricing_strategy', action: '动态调价', target: 'SKU BT-E01 蓝牙耳机 Pro', result: 'success', summary: '竞品平均降价 8%，自动调低售价 $39.99 → $36.99', at: '07:30' },
  { id: 'log_003', agentType: 'crm_retention', action: '发放优惠券', target: '沉默客户群 (3 个月未购)', result: 'success', summary: '发放 15% OFF 优惠券共 167 张，预算 $250', at: '07:00' },
  { id: 'log_004', agentType: 'review_manager', action: '自动回复好评', target: '露营椅 5 星好评 ×3', result: 'success', summary: '自动感谢回复 3 条 4-5 星好评', at: '06:45' },
  { id: 'log_005', agentType: 'inventory_alert', action: '低库存预警', target: 'SKU CK-C01 65W GaN 充电器', result: 'escalated', summary: '库存仅剩 35 件，低于安全阈值 50，建议补货 200 件', at: '06:30' },
  { id: 'log_006', agentType: 'customer_service', action: '智能应答', target: '买家咨询退换货政策', result: 'success', summary: '自动回复退换货政策，买家表示满意', at: '06:15' },
  { id: 'log_007', agentType: 'after_sales', action: '自动退款', target: '退货单 RT-2406-0042', result: 'success', summary: '退货签收确认，自动退款 $19.99 已发起', at: '06:00' },
  { id: 'log_008', agentType: 'finance_audit', action: '账单比对', target: 'TikTok Shop 6 月账单', result: 'success', summary: '平台账单与内部记录差异 $0.00，完全匹配', at: '05:30' },
  { id: 'log_009', agentType: 'creative_factory', action: '生成广告素材', target: '蓝牙耳机 16:9 横版视频', result: 'success', summary: '生成 3 个版式素材（1:1/16:9/9:16），待广告 Agent 调用', at: '05:00' },
  { id: 'log_010', agentType: 'risk_control', action: '阻断操作', target: 'TikTok Shop 蓝牙耳机描述', result: 'escalated', summary: '检测到 "最强" 绝对化用语，已阻断发布并通知运营修改', at: '04:45' },
  { id: 'log_011', agentType: 'competitor_intel', action: '竞品监控完成', target: '消费电子类目 5 个竞品', result: 'success', summary: '发现 2 个竞品降价 5-10%，数据已写入缓存', at: '04:30' },
  { id: 'log_012', agentType: 'login_bootstrap', action: '店铺会话保活', target: '全部 3 个店铺', result: 'success', summary: 'TikTok Shop/Amazon/Shopify 登录会话均正常', at: '04:00' },
];

// ===== 所有可能的 Agent 类型（用于筛选） =====
export const ALL_AGENT_TYPES = ['review_manager', 'customer_service', 'ads_optimizer', 'after_sales', 'risk_control'];


export const LEVEL_COLORS: Record<string, string> = { critical: 'red', warning: 'orange', info: 'blue' };
