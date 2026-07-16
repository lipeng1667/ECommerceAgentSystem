export interface ProductRecognitionResult {
  productName: string;
  category: string;
  attributes: string;
  seoTitle: string;
  description: string;
  sellingPoints: string;
  suggestedPrice: number;
}

export interface ProductDraft {
  productName: string;
  category: string;
  platform: string;
  skus: { spec: string; price: number; stock: number; skuCode: string }[];
  costPrice: number;
  sellingPrice: number;
  totalStock: number;
  weight: string;
  dimensions: string;
  shippingFrom: string;
  genericAttrs: { label: string; value: string }[];
  categoryAttrs: { label: string; value: string }[];
  mainImages: number;
  skuImages: number;
  detailImages: number;
  hasVideo: boolean;
  seoTitle: string;
  description: string;
  sellingPoints: string[];
}

export const mockSegments = {
  new: { count: 1240, pct: 28, label: '新客', color: '#2563eb', avgOrderValue: 32.5 },
  active: { count: 1865, pct: 42, label: '活跃', color: '#16a34a', avgOrderValue: 58.2 },
  dormant: { count: 780, pct: 18, label: '沉睡(30-90天未购)', color: '#ea580c', avgOrderValue: 24.8 },
  churned: { count: 520, pct: 12, label: '流失(>90天未购)', color: '#dc2626', avgOrderValue: 19.3 },
};

export const mockCoupons = [
  { id: 1, name: '新客首单85折', target: 'new', type: '折扣券', value: '15% off', minOrder: 0, expiryDays: 14, estimatedCost: 1240 },
  { id: 2, name: '活跃会员满$50减$8', target: 'active', type: '满减券', value: '$8 off $50+', minOrder: 50, expiryDays: 30, estimatedCost: 3200 },
  { id: 3, name: '沉睡唤醒 $5 无门槛', target: 'dormant', type: '现金券', value: '$5', minOrder: 0, expiryDays: 7, estimatedCost: 3900 },
  { id: 4, name: '流失挽回 20% off', target: 'churned', type: '折扣券', value: '20% off', minOrder: 0, expiryDays: 5, estimatedCost: 2600 },
];

export const mockChurnRisks = [
  { id: 1, name: 'Emily W.', segment: 'dormant', lastPurchase: '2024-04-12', totalSpent: 284.5, orders: 8, risk: 78, reason: '距上次购买已 79 天，浏览但未加购' },
  { id: 2, name: 'David L.', segment: 'active', lastPurchase: '2024-05-28', totalSpent: 142.0, orders: 3, risk: 62, reason: '最近3次浏览未下单，客单价下降40%' },
  { id: 3, name: 'Anna P.', segment: 'dormant', lastPurchase: '2024-03-20', totalSpent: 520.0, orders: 15, risk: 85, reason: '高价值客户已 100+ 天未购买，历史客单价$35' },
  { id: 4, name: 'Mike R.', segment: 'new', lastPurchase: '2024-05-15', totalSpent: 49.99, orders: 1, risk: 55, reason: '首单后未再次访问，典型一次性买家特征' },
  { id: 5, name: 'Lisa K.', segment: 'active', lastPurchase: '2024-06-10', totalSpent: 186.3, orders: 6, risk: 38, reason: '购买频率从月均2次降至月均1次' },
];

export const mockCreatives = [
  { id: 1, product: '65W GaN 充电器', size: '1:1', tone: '简洁卖点', copy: '65W 三口快充 | 笔记本也能充 | 小体积大能量', colors: ['#2563eb', '#1e40af', '#ffffff'], previewText: 'GaN FAST CHARGE 65W' },
  { id: 2, product: '夏季运动T恤', size: '16:9', tone: '年轻潮流', copy: '轻若无物，动若无界 | 5分钟速干 | UPF50+ 防晒 | 四色可选', colors: ['#16a34a', '#f97316', '#ffffff'], previewText: 'LIGHT AS AIR' },
  { id: 3, product: '蓝牙耳机 Pro', size: '9:16', tone: '高端品牌', copy: 'ANC主动降噪 · 35dB静谧 · 32小时续航 · IPX5防水', colors: ['#1e293b', '#6366f1', '#f8fafc'], previewText: 'SOUNDFLOW PRO' },
];

export const mockRiskScans = [
  { id: 1, product: '65W GaN 充电器', issue: '使用"最""极"等极限词', severity: 'high' as const, rule: '广告法第9条', suggestion: '修改为"高功率快充"替代"最强快充"', status: 'pending' as const },
  { id: 2, product: '夏季运动T恤', issue: '防晒宣称缺乏检测报告', severity: 'medium' as const, rule: '平台规则 4.2', suggestion: '补充 UPF 50+ 检测报告或移除防晒相关描述', status: 'pending' as const },
  { id: 3, product: '蓝牙耳机 Pro', issue: '价格异常 - 低于同类均值30%', severity: 'high' as const, rule: '定价保护策略', suggestion: '确认成本核算无误，建议底价设为 $36.00', status: 'pending' as const },
  { id: 4, product: '可折叠露营椅', issue: '图片中疑似出现竞品Logo', severity: 'low' as const, rule: '图片合规检查', suggestion: '重新拍摄或裁剪主图中带有竞品标识的区域', status: 'pending' as const },
];

export const mockBreakerLogs = [
  { id: 1, time: '2024-06-18 14:23', agent: '广告投放 Agent', reason: '单次操作预算调整超过上限 $200（实际 $350）', action: '暂停广告计划 CA-006，通知运营审核', recovered: true, recoveredAt: '2024-06-18 15:02' },
  { id: 2, time: '2024-06-15 09:47', agent: '商品上架 Agent', reason: '1分钟内尝试上架 15 个商品（超过频率限制 10次/分）', action: '冻结上架操作 5 分钟，自动解冻', recovered: true, recoveredAt: '2024-06-15 09:52' },
];

export const mockLiveMetrics = {
  title: '618大促专场 - 充电器/耳机/服饰',
  platform: 'TikTok Shop',
  viewers: 2340,
  peakViewers: 4520,
  likes: 12800,
  comments: 864,
  shares: 320,
  duration: '01:52:34',
  conversionRate: 3.8,
  gmv: 4280,
};

export const mockLiveProducts = [
  { id: 1, name: '65W GaN 充电器', price: 39.99, clicks: 420, orders: 38, pinned: true },
  { id: 2, name: '蓝牙耳机 Pro', price: 49.99, clicks: 315, orders: 22, pinned: false },
  { id: 3, name: '夏季运动T恤', price: 24.99, clicks: 280, orders: 45, pinned: false },
  { id: 4, name: '可折叠露营椅', price: 35.99, clicks: 156, orders: 12, pinned: false },
];

export const mockLiveComments = [
  { id: 1, user: 'ming_1988', text: '充电器能充MacBook吗？', replied: true, aiReply: '支持的！65W足够为MacBook Air全速充电~' },
  { id: 2, user: 'lisa_love', text: 'T恤尺码偏大还是偏小？', replied: true, aiReply: '建议选大一码哦，修身版型偏小~' },
  { id: 3, user: 'tech_guy99', text: '耳机降噪效果怎么样？', replied: false },
];

export const recognitionVariants: ProductRecognitionResult[] = [
  {
    productName: '65W GaN 氮化镓快充充电器',
    category: '消费电子 > 充电器 > GaN 快速充电器',
    attributes: '颜色: 黑色, 接口: USB-C ×2 + USB-A ×1, 功率: 65W, 协议: PD 3.0/QC 4.0/PPS, 重量: 128g',
    seoTitle: '65W GaN Fast Charger USB-C PD 3.0 Compatible iPhone Samsung MacBook Compact Travel Charger',
    description: '【65W 大功率三接口】支持同时为笔记本、平板和手机充电。氮化镓技术体积缩小 50%，折叠插脚便于携带。\n【广泛兼容】支持 PD 3.0 / QC 4.0 / PPS 协议，兼容 iPhone 15/14/13、Samsung Galaxy S24、MacBook Air、iPad Pro 等主流设备。\n【安全可靠】内置过压/过流/过热/短路多重保护，通过 CE/FCC/RoHS 认证。',
    sellingPoints: '65W 大功率，笔记本也能充\n氮化镓 GaN 技术，体积缩小50%\n三口同时输出，一个顶三个\n智能温控，充电不发烫\n全球通用电压 100-240V',
    suggestedPrice: 39.99
  },
  {
    productName: '夏季速干运动T恤 男女同款',
    category: '运动户外 > 运动服饰 > 运动T恤',
    attributes: '材质: 涤纶+氨纶, 版型: 修身, 颜色: 黑/白/灰, 尺码: S-3XL, 速干等级: 4级',
    seoTitle: 'Quick Dry Athletic T-Shirt Men Women Gym Workout Running Sports Tee Breathable Lightweight',
    description: '【4级速干科技】采用蜂窝导汗结构面料，出汗后 5 分钟速干，运动全程干爽不贴身。\n【四面弹力】高弹力氨纶混纺，深蹲、跑步、力量训练不受束缚。\n【轻量透气】单件仅 180g，背部激光透气孔设计，夏天穿着不闷热。',
    sellingPoints: '蜂窝导汗，5分钟速干\n四面弹力，运动无束缚\n仅 180g，穿着如无物\nS-3XL 全尺码覆盖\n机洗不变形，不掉色',
    suggestedPrice: 24.99
  },
  {
    productName: '可折叠露营椅 承重150kg',
    category: '运动户外 > 露营装备 > 折叠桌椅',
    attributes: '材质: 600D牛津布+铝合金骨架, 承重: 150kg, 重量: 1.2kg, 折叠尺寸: 35×12cm, 颜色: 军绿/卡其',
    seoTitle: 'Portable Folding Camping Chair 150kg Capacity Lightweight 1.2kg Oxford Fabric Compact Travel Outdoor',
    description: '【150kg 超强承重】加厚铝合金骨架 + 600D 加密牛津布，稳固耐用，大体重也安心。\n【一手掌握】折叠后仅 35×12cm，仅 1.2kg，单手可拎，背包侧袋也能塞。\n【3 秒快开】免安装，展开即坐，收起即走。露营、钓鱼、排队、户外演出通通适用。',
    sellingPoints: '承重 150kg，大体重也安心\n折叠后仅 35×12cm\n仅 1.2kg，一手掌握\n3秒快开，免安装\n600D牛津布，防泼水耐磨',
    suggestedPrice: 35.99
  }
];

export const mockReviews = [
  {
    id: 1, rating: 1, buyer: 'John D.', product: '65W GaN 氮化镓充电器',
    date: '2024-06-20', platform: 'Amazon', orderId: '#114-7382910-4657832',
    content: 'Used for 3 days and it completely stopped working. No LED, no output. Tried different cables and outlets — nothing. Very disappointed. I want a full refund.',
    aiReply: 'Hi John, thank you for letting us know. We\'re really sorry the charger failed so quickly — that is absolutely not the quality we stand for. We have issued a full refund to your original payment method (should appear in 3-5 business days). You do not need to return the defective unit. We\'re also shipping you a replacement from our latest QC batch at no cost — tracking: TRK#US-928341. If there is anything else, please reply here and I will personally follow up.',
    severity: 'high'
  },
  {
    id: 2, rating: 2, buyer: 'Sarah M.', product: '夏季速干运动T恤 男女同款',
    date: '2024-06-19', platform: 'TikTok Shop', orderId: '#TS-20240619-0842',
    content: 'Ordered size L but it fits like an M. The fabric feels nice and breathable though — just wish the sizing was accurate. I don\'t want to return it if I can exchange for XL.',
    aiReply: 'Hi Sarah, thank you for the kind words about the fabric! We are sorry about the sizing — we have heard similar feedback and updated our size chart. We have created exchange order #EX-2406-088 for XL at no extra charge. The replacement will ship today via USPS Priority (2-3 days). You are welcome to keep or donate the size L — no need to return it. Have a great day!',
    severity: 'medium'
  },
  {
    id: 3, rating: 1, buyer: 'Mike R.', product: 'SoundFlow 蓝牙耳机 Pro',
    date: '2024-06-18', platform: 'TikTok Shop', orderId: '#TS-20240618-1530',
    content: 'Left earbud won\'t charge at all. Right one works fine. I tried cleaning the contacts and resetting the case 5 times. For $49.99 I expected better quality control. Really frustrated.',
    aiReply: 'Hi Mike, I completely understand your frustration — a dead earbud out of the box is unacceptable. We\'ve identified a charging pin alignment issue in a small batch (0.3%) and yours appears to be from it. A replacement pair is already on the way via FedEx 2Day — tracking: TRK#US-482917. Keep the current pair as a spare (the right earbud and case still work). We\'ve also added a $10 store credit to your account. Sincere apologies.',
    severity: 'high'
  },
  {
    id: 4, rating: 2, buyer: 'Lisa K.', product: 'OutdoorPro 可折叠露营椅',
    date: '2024-06-17', platform: 'Amazon', orderId: '#112-8491023-2219467',
    content: 'The chair itself is actually great — super comfortable and easy to fold. But the included carrying bag tore at the seam the first time I used it. Not a dealbreaker since the chair is good, but disappointing for the price.',
    aiReply: 'Hi Lisa, thank you for the honest and fair review! We are happy you love the chair, and sorry about the carrying bag. We have been upgrading the bag stitching in our latest production run based on feedback like yours. A reinforced carrying bag is on its way to you at no cost — ETA June 25. We really appreciate you taking the time to share both the good and the bad. Happy camping!',
    severity: 'low'
  },
];

export const mockConversations = [
  { id: 0, name: 'Emily W.', product: '65W GaN 充电器', lastMsg: 'Does this support Samsung S24?', time: '2m ago', unread: true },
  { id: 1, name: 'David L.', product: '蓝牙耳机 Pro', lastMsg: 'How do I reset the earbuds?', time: '15m ago', unread: false },
  { id: 2, name: 'Anna P.', product: '夏季运动T恤', lastMsg: 'I want to return, wrong size', time: '1h ago', unread: true, escalate: true },
];

export const mockChats: Record<number, { from: 'buyer' | 'ai' | 'agent'; text: string; time: string }[]> = {
  0: [
    { from: 'buyer', text: 'Hi, does the 65W charger work with Samsung Galaxy S24?', time: '10:32' },
    { from: 'ai', text: 'Yes! The 65W GaN charger supports PD 3.0 and PPS protocols, which are fully compatible with Samsung Galaxy S24. It can charge your S24 from 0 to 60% in about 30 minutes.', time: '10:32' },
    { from: 'buyer', text: 'Great! And will it also charge my MacBook Air?', time: '10:33' },
    { from: 'ai', text: 'Absolutely! With 65W output, it can charge MacBook Air (which requires 30W-45W) at full speed. It has two USB-C ports and one USB-A port, so you can charge your phone and laptop simultaneously.', time: '10:33' },
  ],
  1: [
    { from: 'buyer', text: 'My left earbud is not working. How do I reset?', time: '09:15' },
    { from: 'ai', text: 'Sorry to hear that! Here\'s how to reset: 1) Put both earbuds in the case 2) Press and hold the button on the case for 10 seconds until the LED flashes red 3) Take them out and they should re-pair. If this doesn\'t work, we\'ll send a replacement.', time: '09:16' },
  ],
  2: [
    { from: 'buyer', text: 'I ordered size M but it\'s too tight. I want to return and get a size L.', time: '08:45' },
    { from: 'ai', text: 'I\'m sorry about the sizing issue! I\'ll help you with that. Let me transfer you to our after-sales team who can process the exchange for you right away.', time: '08:45' },
    { from: 'agent', text: 'Hi Anna, this is Linda from after-sales. I\'ve created exchange order #EX-2406-052 for your size L. It will ship today and arrive in 3-5 days. You can keep the size M or donate it — no need to return!', time: '09:02' },
    { from: 'buyer', text: 'Wow thank you so much! That\'s amazing service!', time: '09:05' },
  ],
};

export const mockCampaigns = [
  { id: 'CA-001', name: 'GaN Charger - US', budget: 500, spend: 487, roi: 2.1, impressions: 45200, clicks: 1280, status: 'active' as const },
  { id: 'CA-002', name: 'Sports Tee - US', budget: 300, spend: 294, roi: 0.8, impressions: 28100, clicks: 940, status: 'active' as const },
  { id: 'CA-003', name: 'Earbuds Pro - UK', budget: 400, spend: 310, roi: 1.55, impressions: 33400, clicks: 1120, status: 'active' as const },
];

export const mockCompetitorPrices = [
  { id: 1, competitor: 'TechNova Official', product: 'Wireless Earbuds Pro 2', theirPrice: 28.99, ourPrice: 32.99, lastChangePct: -5.2, lastUpdated: '2h ago' },
  { id: 2, competitor: 'GadgetHub Store', product: 'Wireless Earbuds Pro 2', theirPrice: 31.50, ourPrice: 32.99, lastChangePct: 0, lastUpdated: '5h ago' },
  { id: 3, competitor: 'SoundWave Direct', product: 'Bluetooth Speaker Mini', theirPrice: 19.99, ourPrice: 18.99, lastChangePct: 8.5, lastUpdated: '1h ago' },
  { id: 4, competitor: 'TechNova Official', product: 'USB-C Fast Charger 65W', theirPrice: 24.99, ourPrice: 24.99, lastChangePct: -3.1, lastUpdated: '3h ago' },
  { id: 5, competitor: 'PowerDeal Shop', product: 'USB-C Fast Charger 65W', theirPrice: 22.49, ourPrice: 24.99, lastChangePct: -12.0, lastUpdated: '6h ago' },
  { id: 6, competitor: 'GadgetHub Store', product: 'Smart Watch Lite', theirPrice: 45.00, ourPrice: 39.99, lastChangePct: 2.3, lastUpdated: '4h ago' },
];

export const mockBudgetSuggestions = [
  { campaignId: 'CA-001', current: 500, suggested: 550, reason: 'High ROI, increase to capture more demand' },
  { campaignId: 'CA-002', current: 300, suggested: 150, reason: 'ROI 0.8× below target, reduce and reallocate to CA-001' },
  { campaignId: 'CA-003', current: 400, suggested: 400, reason: 'Steady performance, maintain current budget' },
];

export const mockAfterSalesTickets = [
  { id: 'AS-1001', customer: 'John D.', type: 'return', status: 'pending_review', product: '蓝牙耳机 Pro', reason: '续航不达标', amount: 32.99 },
  { id: 'AS-1002', customer: 'Sarah K.', type: 'refund', status: 'auto_approved', product: '65W 充电器', reason: '商品损坏', amount: 39.99 },
  { id: 'AS-1003', customer: 'Mike L.', type: 'return', status: 'processed', product: '运动T恤', reason: '尺码不符', amount: 12.99 },
  { id: 'AS-1004', customer: 'Emma W.', type: 'consult', status: 'resolved', product: 'LED 灯带', reason: '安装咨询', amount: 0 },
  { id: 'AS-1005', customer: 'Tom H.', type: 'refund', status: 'pending_review', product: '露营椅', reason: '质量问题', amount: 24.99 },
];

export interface ABTestResult {
  id: string;
  name: string;
  campaignId: string;
  date: string;
  status: 'running' | 'completed' | 'draft';
  testDuration: string;
  hypothesis: string;
  controlGroup: {
    creativeDesc: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    roi: number;
    spend: number;
  };
  experimentGroup: {
    creativeDesc: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    roi: number;
    spend: number;
  };
  winner?: 'control' | 'experiment' | 'inconclusive';
  confidenceLevel?: number;
  recommendation?: string;
}

export const mockABTests: ABTestResult[] = [
  {
    id: 'AB-001',
    name: 'GaN Charger 主图对比',
    campaignId: 'CA-001',
    date: '2026-07-01',
    status: 'completed',
    testDuration: '7 天',
    hypothesis: '生活方式场景图比纯白底产品图更能吸引点击',
    controlGroup: {
      creativeDesc: '纯白底产品图 + 参数列表',
      impressions: 22600,
      clicks: 542,
      ctr: 2.40,
      conversions: 43,
      conversionRate: 7.93,
      roi: 1.72,
      spend: 243
    },
    experimentGroup: {
      creativeDesc: '办公桌场景 lifestyle 图 + 痛点文案',
      impressions: 22600,
      clicks: 738,
      ctr: 3.27,
      conversions: 68,
      conversionRate: 9.21,
      roi: 2.48,
      spend: 245
    },
    winner: 'experiment',
    confidenceLevel: 97.5,
    recommendation: '实验组 CTR 高 36%，ROI 高 44%。建议全量切换为 lifestyle 风格素材，继续在 UK/DE 市场复测。'
  },
  {
    id: 'AB-002',
    name: 'Earbuds Pro 标题文案 A/B',
    campaignId: 'CA-003',
    date: '2026-07-04',
    status: 'completed',
    testDuration: '7 天',
    hypothesis: '含价格卖点的标题比纯功能标题转化率更高',
    controlGroup: {
      creativeDesc: '「ANC 主动降噪蓝牙耳机」',
      impressions: 16700,
      clicks: 498,
      ctr: 2.98,
      conversions: 31,
      conversionRate: 6.22,
      roi: 1.22,
      spend: 155
    },
    experimentGroup: {
      creativeDesc: '「$49.99 ANC降噪耳机 | 40h续航 | IPX5防水」',
      impressions: 16700,
      clicks: 622,
      ctr: 3.72,
      conversions: 45,
      conversionRate: 7.23,
      roi: 1.88,
      spend: 155
    },
    winner: 'experiment',
    confidenceLevel: 98.2,
    recommendation: '含价格+续航+防水关键词的标题效果显著优于纯功能标题。建议在所有产品标题中加入价格锚和 2-3 个核心卖点数据。'
  },
  {
    id: 'AB-003',
    name: 'Sports Tee 受众定向测试',
    campaignId: 'CA-002',
    date: '2026-07-02',
    status: 'running',
    testDuration: '进行中（第 5 天）',
    hypothesis: '18-25岁运动人群比全年龄段广撒网 ROI 更高',
    controlGroup: {
      creativeDesc: '全年龄段 18-55+ 兴趣定向',
      impressions: 14100,
      clicks: 423,
      ctr: 3.00,
      conversions: 28,
      conversionRate: 6.62,
      roi: 0.72,
      spend: 195
    },
    experimentGroup: {
      creativeDesc: '18-35岁运动/健身/户外兴趣定向',
      impressions: 14000,
      clicks: 517,
      ctr: 3.69,
      conversions: 44,
      conversionRate: 8.51,
      roi: 0.88,
      spend: 100
    },
    winner: undefined,
    confidenceLevel: 65.0,
    recommendation: '实验组 ROI 仍低于 1.0 目标，但 CTR 和转化率有明显提升。建议继续观察 2 天，同时考虑调整商品定价（当前 $24.99 或偏高）。'
  }
];

export const productDrafts: Record<string, ProductDraft> = {
  3009: {
    productName: '65W GaN 氮化镓快充充电器',
    category: '消费电子 > 充电器 > GaN 快速充电器', platform: 'TikTok Shop',
    skus: [
      { spec: '黑色/USB-C ×2+USB-A', price: 39.99, stock: 520, skuCode: 'GN65-BK-001' },
      { spec: '白色/USB-C ×2+USB-A', price: 39.99, stock: 380, skuCode: 'GN65-WH-001' },
    ],
    costPrice: 18.50, sellingPrice: 39.99,
    totalStock: 900, weight: '128g/件（含包装 180g）', dimensions: '5.5×5.2×3.0 cm', shippingFrom: '深圳仓（CN）',
    genericAttrs: [
      { label: '品牌', value: 'GaNPower' }, { label: '型号', value: 'GN65-Pro' },
      { label: '接口类型', value: 'USB-C ×2, USB-A ×1' }, { label: '最大功率', value: '65W' },
      { label: '输入电压', value: 'AC 100-240V 50/60Hz' }, { label: '材质', value: 'PC 阻燃外壳' },
    ],
    categoryAttrs: [
      { label: '快充协议', value: 'PD 3.0 / QC 4.0 / PPS / AFC / FCP' },
      { label: '氮化镓', value: '是（GaN 第三代）' }, { label: '折叠插脚', value: '是' },
    ],
    mainImages: 6, skuImages: 2, detailImages: 8, hasVideo: true,
    seoTitle: '65W GaN Fast Charger USB-C PD 3.0 Compatible iPhone Samsung MacBook Compact Travel Charger',
    description: '【65W 大功率三接口】支持同时为笔记本、平板和手机充电。氮化镓技术体积缩小 50%，折叠插脚便于携带。',
    sellingPoints: ['65W 大功率，笔记本也能充', '氮化镓 GaN 技术，体积缩小50%', '三口同时输出，一个顶三个', '智能温控，充电不发烫', '全球通用电压 100-240V'],
  },
  3010: {
    productName: '夏季速干运动T恤 男女同款',
    category: '运动户外 > 运动服饰 > 运动T恤', platform: 'Amazon',
    skus: [
      { spec: '黑色/S', price: 24.99, stock: 200, skuCode: 'SDT-BK-S' },
      { spec: '黑色/M', price: 24.99, stock: 350, skuCode: 'SDT-BK-M' },
      { spec: '黑色/L', price: 24.99, stock: 300, skuCode: 'SDT-BK-L' },
      { spec: '白色/M', price: 24.99, stock: 280, skuCode: 'SDT-WH-M' },
    ],
    costPrice: 8.20, sellingPrice: 24.99,
    totalStock: 1130, weight: '180g/件', dimensions: '包装：30×22×2 cm', shippingFrom: '广州仓（CN）→ Amazon FBA US',
    genericAttrs: [
      { label: '材质', value: '88%涤纶 + 12%氨纶' }, { label: '版型', value: '修身' },
      { label: '领型', value: '圆领' }, { label: '袖长', value: '短袖' },
      { label: '适用季节', value: '春夏秋三季' },
    ],
    categoryAttrs: [
      { label: '速干等级', value: '4级（5分钟内速干）' }, { label: '透气性', value: '背部激光透气孔' },
      { label: '防晒指数', value: 'UPF 50+' }, { label: '弹性', value: '四面弹力' },
    ],
    mainImages: 8, skuImages: 4, detailImages: 10, hasVideo: true,
    seoTitle: 'Quick Dry Athletic T-Shirt Men Women Gym Workout Running Sports Tee Breathable Lightweight',
    description: '【4级速干科技】采用蜂窝导汗结构面料，出汗后 5 分钟速干，运动全程干爽不贴身。',
    sellingPoints: ['蜂窝导汗，5分钟速干', '四面弹力，运动无束缚', '仅 180g，穿着如无物', 'S-3XL 全尺码覆盖', '机洗不变形，不掉色'],
  },
  3011: {
    productName: '蓝牙耳机 Pro 第二代',
    category: '消费电子 > 音频 > 真无线耳机', platform: 'TikTok Shop',
    skus: [
      { spec: '曜石黑', price: 49.99, stock: 600, skuCode: 'BTP2-BK' },
      { spec: '珍珠白', price: 49.99, stock: 450, skuCode: 'BTP2-WH' },
      { spec: '星辰蓝', price: 54.99, stock: 300, skuCode: 'BTP2-BL' },
    ],
    costPrice: 22.00, sellingPrice: 49.99,
    totalStock: 1350, weight: '52g/对（含充电仓 58g）', dimensions: '充电仓：6.0×4.5×2.8 cm', shippingFrom: '深圳仓（CN）',
    genericAttrs: [
      { label: '品牌', value: 'SoundFlow' }, { label: '型号', value: 'Pro 2nd Gen' },
      { label: '蓝牙版本', value: '5.3' }, { label: '续航', value: '8h（+充电仓 32h）' },
      { label: '防水等级', value: 'IPX5' },
    ],
    categoryAttrs: [
      { label: '降噪', value: 'ANC 主动降噪（-35dB）' }, { label: '驱动单元', value: '13mm 动圈' },
      { label: '延迟', value: '游戏模式 45ms' }, { label: '编解码', value: 'AAC/SBC' },
    ],
    mainImages: 7, skuImages: 3, detailImages: 9, hasVideo: true,
    seoTitle: 'Bluetooth 5.3 Wireless Earbuds ANC Active Noise Cancelling 8H Playtime IPX5 Sports Earphones',
    description: '【ANC 主动降噪】-35dB 深度降噪，通勤/学习/办公一键静享。通透模式无需摘下耳机即可感知环境音。',
    sellingPoints: ['ANC主动降噪 -35dB', '蓝牙5.3，开盖即连', '8h续航+32h充电仓', 'IPX5防水防汗', '游戏模式45ms低延迟'],
  },
};
