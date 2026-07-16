import dayjs from 'dayjs';
import type { Approval, AuditLog, Member, Store, StoreConnection, Task } from '../types/domain';

const now = dayjs('2026-05-30T10:00:00+08:00');

export const stores: Store[] = [
  {
    id: 1001,
    name: 'TikTok Shop 美国旗舰店',
    platform: 'tiktok_shop',
    status: 'connected',
    authMethod: 'oauth',
    runtimeProvider: 'mulerun',
    runtimeSessionId: 'mr_session_tts_001',
    region: 'US',
    currency: 'USD',
    lastVerifiedAt: now.subtract(2, 'hour').toISOString(),
    createdAt: now.subtract(5, 'day').toISOString(),
    recentTaskIds: [3001, 3002],
    connections: [
      {
        id: 2001,
        serviceName: 'TikTok 广告管理平台',
        serviceType: 'advertising',
        authMethod: 'credentials',
        status: 'connected',
        account: 'seller@tiktokshop.com',
        runtimeProvider: 'mulerun',
        runtimeSessionId: 'mr_session_tts_001_ads',
        lastVerifiedAt: now.subtract(3, 'hour').toISOString(),
        createdAt: now.subtract(5, 'day').toISOString()
      }
    ]
  },
  {
    id: 1002,
    name: 'Amazon 户外用品店',
    platform: 'amazon',
    status: 'login_required',
    authMethod: 'oauth',
    runtimeProvider: 'mulerun',
    runtimeSessionId: 'mr_session_amz_002',
    account: 'seller@outdoor-gear.com',
    region: 'US',
    currency: 'USD',
    lastVerifiedAt: now.subtract(2, 'day').toISOString(),
    createdAt: now.subtract(9, 'day').toISOString(),
    recentTaskIds: [3003],
    connections: [
      {
        id: 2003,
        serviceName: 'Amazon 广告后台',
        serviceType: 'advertising',
        authMethod: 'credentials',
        status: 'connected',
        account: 'seller@outdoor-gear.com',
        runtimeProvider: 'mulerun',
        runtimeSessionId: 'mr_session_amz_002_ads',
        lastVerifiedAt: now.subtract(1, 'day').toISOString(),
        createdAt: now.subtract(9, 'day').toISOString()
      },
      {
        id: 2004,
        serviceName: 'Amazon 客服消息',
        serviceType: 'customer_service',
        authMethod: 'credentials',
        status: 'login_required',
        account: 'seller@outdoor-gear.com',
        runtimeProvider: 'mulerun',
        runtimeSessionId: 'mr_session_amz_002_cs',
        lastVerifiedAt: now.subtract(3, 'day').toISOString(),
        createdAt: now.subtract(8, 'day').toISOString()
      }
    ]
  },
  {
    id: 1003,
    name: 'Shopify 独立站',
    platform: 'shopify',
    status: 'pending_login',
    authMethod: 'api_key',
    runtimeProvider: 'mulerun',
    apiKey: 'shpat_xxxxxxxxxxxx',
    region: 'US',
    currency: 'USD',
    createdAt: now.subtract(1, 'day').toISOString(),
    recentTaskIds: [],
    connections: []
  }
];

export const tasks: Task[] = [
  {
    id: 3001,
    title: '降低低效广告消耗',
    storeId: 1001,
    agentType: 'ads_optimizer',
    goal: '识别低 ROI 广告计划，并提出预算调整建议。',
    status: 'waiting_approval',
    riskLevel: 'high',
    createdAt: now.subtract(90, 'minute').toISOString(),
    updatedAt: now.subtract(12, 'minute').toISOString(),
    timeline: [
      {
        id: 4001,
        type: 'run_started',
        title: '任务开始执行',
        summary: 'MuleRun 已加载绑定的 TikTok Shop 浏览器 Profile。',
        at: now.subtract(90, 'minute').toISOString()
      },
      {
        id: 4002,
        type: 'step_completed',
        title: '广告 ROI 分析完成',
        summary: '近 7 天内发现 3 个广告计划低于目标 ROI。',
        at: now.subtract(40, 'minute').toISOString(),
        artifactUrl: 's3://allmall-artifacts/3001/roi-dashboard.png'
      },
      {
        id: 4003,
        type: 'approval_required',
        title: '需要人工审批',
        summary: '暂停广告计划 C-102 超过租户风险阈值，需要审批确认。',
        at: now.subtract(12, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3002,
    title: '上架新品露营装备',
    storeId: 1001,
    agentType: 'product_launch',
    goal: '生成 SEO 标题，并准备商品上架草稿。',
    status: 'succeeded',
    riskLevel: 'medium',
    createdAt: now.subtract(1, 'day').toISOString(),
    updatedAt: now.subtract(23, 'hour').toISOString(),
    timeline: [
      {
        id: 4004,
        type: 'run_started',
        title: '新品上架 SOP 开始',
        summary: 'Agent 已开始执行新品上架流程。',
        at: now.subtract(1, 'day').toISOString()
      },
      {
        id: 4005,
        type: 'run_succeeded',
        title: '商品草稿已完成',
        summary: '已生成标题、属性和详情页结构。',
        at: now.subtract(23, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3003,
    title: '重新认证 Amazon 店铺',
    storeId: 1002,
    agentType: 'login_bootstrap',
    goal: '提醒运营人员刷新平台登录会话。',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(6, 'hour').toISOString(),
    updatedAt: now.subtract(5, 'hour').toISOString(),
    timeline: [
      {
        id: 4006,
        type: 'login_required',
        title: '需要重新登录',
        summary: 'Amazon 卖家中心要求重新进行人机校验。',
        at: now.subtract(5, 'hour').toISOString()
      },
      {
        id: 4007,
        type: 'run_failed',
        title: '任务已停止',
        summary: '自动化已暂停，等待运营人员刷新登录会话。',
        at: now.subtract(5, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3004,
    title: 'TikTok Shop 店铺会话检测',
    storeId: 1001,
    agentType: 'login_bootstrap',
    goal: '定时检测店铺登录态，如果掉线则自动拉起登录流程。',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(1, 'hour').toISOString(),
    updatedAt: now.subtract(30, 'minute').toISOString(),
    timeline: [
      {
        id: 4101,
        type: 'run_started',
        title: '开始会话检测',
        summary: '对 TikTok Shop 美国旗舰店发起登录态检测。',
        at: now.subtract(1, 'hour').toISOString()
      },
      {
        id: 4102,
        type: 'step_completed',
        title: '会话状态正常',
        summary: 'TikTok Shop 店铺登录态有效，无需重新登录。',
        at: now.subtract(30, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3005,
    title: '竞品被动监控',
    storeId: 1001,
    agentType: 'competitor_intel',
    goal: '监控 TikTok Shop 同类蓝牙耳机竞品价格和 SEO 关键词变化。',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(3, 'hour').toISOString(),
    updatedAt: now.subtract(2, 'hour').toISOString(),
    timeline: [
      {
        id: 4103,
        type: 'run_started',
        title: '竞品数据采集开始',
        summary: '对 5 个竞品店铺发起价格和 SEO 关键词抓取。',
        at: now.subtract(3, 'hour').toISOString()
      },
      {
        id: 4104,
        type: 'step_completed',
        title: '竞品数据采集完成',
        summary: '发现 2 个竞品降价，3 个竞品更新了 SEO 关键词。',
        at: now.subtract(2.5, 'hour').toISOString()
      },
      {
        id: 4105,
        type: 'run_succeeded',
        title: '监控完成',
        summary: '部分数据已写入市场情报缓存，供其他 Agent 调度。',
        at: now.subtract(2, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3006,
    title: '行业趋势监控',
    storeId: 1001,
    agentType: 'competitor_intel',
    goal: '扫描消费电子类目热词和季节性趋势。',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(30, 'minute').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      {
        id: 4106,
        type: 'run_started',
        title: '趋势分析开始',
        summary: '对消费电子类目发起热词扫描和消费者画像更新。',
        at: now.subtract(30, 'minute').toISOString()
      },
      {
        id: 4107,
        type: 'step_completed',
        title: '类目热词分析完成',
        summary: '提取 Top 20 热搜词，发现 3 个上升趋势词。',
        at: now.subtract(10, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3007,
    title: '商品调研 - 智能手表',
    storeId: 1001,
    agentType: 'competitor_intel',
    goal: '调研智能手表类目市场容量、竞品定价区间、消费者画像。',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(1, 'day').toISOString(),
    updatedAt: now.subtract(23, 'hour').toISOString(),
    timeline: [
      {
        id: 4108,
        type: 'run_started',
        title: '商品调研开始',
        summary: '对智能手表类目发起市场容量和竞品定价调研。',
        at: now.subtract(1, 'day').toISOString()
      },
      {
        id: 4109,
        type: 'run_succeeded',
        title: '调研完成',
        summary: '市场容量约 2.3 亿美元/年，竞品定价区间 $25-$80，推荐定价 $45-$55。',
        at: now.subtract(23, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3008,
    title: '竞品被动监控',
    storeId: 1002,
    agentType: 'competitor_intel',
    goal: '监控 Amazon 户外用品竞品促销活动。',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(4, 'hour').toISOString(),
    updatedAt: now.subtract(3.5, 'hour').toISOString(),
    timeline: [
      {
        id: 4110,
        type: 'run_started',
        title: '竞品促销监控开始',
        summary: '对 Amazon 户外用品类目 Top 10 竞品发起促销监控。',
        at: now.subtract(4, 'hour').toISOString()
      },
      {
        id: 4111,
        type: 'run_failed',
        title: '部分数据抓取失败',
        summary: '2 个竞品页面返回 403，疑似反爬限制。已自动重试仍失败。',
        at: now.subtract(3.5, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3009,
    title: '65W GaN 氮化镓快充充电器 — 待审核草稿',
    storeId: 1001,
    agentType: 'product_launch',
    goal: '上架商品「65W GaN 氮化镓快充充电器」到 TikTok Shop 美国旗舰店',
    status: 'waiting_approval',
    riskLevel: 'medium',
    createdAt: now.subtract(20, 'minute').toISOString(),
    updatedAt: now.subtract(15, 'minute').toISOString(),
    timeline: [
      {
        id: 4201,
        type: 'run_started',
        title: 'AI 图片识别完成',
        summary: '已从 3 张商品图片中识别出：充电器、GaN、USB-C 接口等关键信息。生成 SEO 标题和详情草稿。',
        at: now.subtract(20, 'minute').toISOString()
      },
      {
        id: 4202,
        type: 'approval_required',
        title: '等待运营审核',
        summary: '商品草稿已生成，需运营确认 SEO 标题和卖点文案后再发布。',
        at: now.subtract(15, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3010,
    title: '夏季运动T恤 — 图片识别中',
    storeId: 1002,
    agentType: 'product_launch',
    goal: '上架商品「夏季速干运动T恤」到 Amazon 户外用品店',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(10, 'minute').toISOString(),
    updatedAt: now.subtract(5, 'minute').toISOString(),
    timeline: [
      {
        id: 4203,
        type: 'run_started',
        title: '开始图片分析',
        summary: '正在分析上传的 5 张商品图片，识别材质、版型、颜色等属性。',
        at: now.subtract(10, 'minute').toISOString()
      },
      {
        id: 4204,
        type: 'step_completed',
        title: '属性识别完成',
        summary: '已识别：材质=速干涤纶、版型=修身、颜色=黑/白/灰。正在生成 SEO 标题…',
        at: now.subtract(5, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3011,
    title: '蓝牙耳机 Pro 第二代 — 排队中',
    storeId: 1001,
    agentType: 'product_launch',
    goal: '上架商品「蓝牙耳机 Pro 第二代」到 TikTok Shop 美国旗舰店',
    status: 'queued',
    riskLevel: 'low',
    createdAt: now.subtract(5, 'minute').toISOString(),
    updatedAt: now.subtract(5, 'minute').toISOString(),
    timeline: [
      {
        id: 4205,
        type: 'run_started',
        title: '任务已排队',
        summary: '商品上架任务已进入执行队列，等待前置任务完成。预计 3 分钟后开始处理。',
        at: now.subtract(5, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3012,
    title: '65W GaN 充电器 — 素材生成',
    storeId: 1001,
    agentType: 'creative_factory',
    goal: '为商品「65W GaN 氮化镓快充充电器」生成 1:1 / 16:9 / 9:16 三组广告素材',
    status: 'succeeded',
    riskLevel: 'medium',
    createdAt: now.subtract(2, 'hour').toISOString(),
    updatedAt: now.subtract(1, 'hour').toISOString(),
    timeline: [
      {
        id: 4301,
        type: 'run_started',
        title: '素材生成任务启动',
        summary: '接收到 product_published 事件，开始为 65W GaN 充电器生成广告素材。',
        at: now.subtract(2, 'hour').toISOString()
      },
      {
        id: 4302,
        type: 'step_completed',
        title: '主图裁剪完成',
        summary: '已生成 1:1 方形主图 3 张，16:9 横版 2 张，9:16 竖版 2 张。',
        at: now.subtract(1.5, 'hour').toISOString()
      },
      {
        id: 4303,
        type: 'step_completed',
        title: '广告文案生成完成',
        summary: '已生成 3 组文案（简洁卖点 / 促销感 / 高端品牌），均通过合规检查。',
        at: now.subtract(1, 'hour').toISOString()
      },
      {
        id: 4304,
        type: 'run_succeeded',
        title: '素材生成完成',
        summary: '共生成 7 张图片 + 3 组文案，已推送至广告投放 Agent。',
        at: now.subtract(1, 'hour').toISOString()
      }
    ]
  },
  {
    id: 3013,
    title: '夏季运动T恤 — 素材生成',
    storeId: 1002,
    agentType: 'creative_factory',
    goal: '为商品「夏季速干运动T恤」生成短视频和投放图',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(30, 'minute').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      {
        id: 4305,
        type: 'run_started',
        title: '素材生成任务启动',
        summary: '接收到 product_published 事件，开始为夏季运动T恤生成广告素材。',
        at: now.subtract(30, 'minute').toISOString()
      },
      {
        id: 4306,
        type: 'step_completed',
        title: '主图裁剪完成',
        summary: '已生成 1:1 方形主图 4 张，16:9 横版 3 张。',
        at: now.subtract(20, 'minute').toISOString()
      },
      {
        id: 4307,
        type: 'step_started',
        title: '短视频生成中',
        summary: '正在生成 9:16 竖版短视频，预计 5 分钟后完成。',
        at: now.subtract(10, 'minute').toISOString()
      }
    ]
  },
  {
    id: 3014,
    title: '蓝牙耳机 Pro — 素材生成',
    storeId: 1001,
    agentType: 'creative_factory',
    goal: '为商品「蓝牙耳机 Pro 第二代」生成广告素材',
    status: 'failed',
    riskLevel: 'medium',
    createdAt: now.subtract(5, 'hour').toISOString(),
    updatedAt: now.subtract(4, 'hour').toISOString(),
    timeline: [
      {
        id: 4308,
        type: 'run_started',
        title: '素材生成任务启动',
        summary: '接收到 product_published 事件，开始为蓝牙耳机 Pro 生成广告素材。',
        at: now.subtract(5, 'hour').toISOString()
      },
      {
        id: 4309,
        type: 'step_completed',
        title: '主图裁剪完成',
        summary: '已生成 1:1 / 16:9 图片 5 张。',
        at: now.subtract(4.5, 'hour').toISOString()
      },
      {
        id: 4310,
        type: 'run_failed',
        title: '文案生成失败',
        summary: 'AI 模型超时未响应，已重试 2 次仍失败。需运营手动重试或调整文案语气配置。',
        at: now.subtract(4, 'hour').toISOString()
      }
    ]
  },
  // ===== pricing_strategy =====
  {
    id: 3015,
    title: '竞品价格扫描 — 蓝牙耳机类目',
    storeId: 1001,
    agentType: 'pricing_strategy',
    goal: '扫描蓝牙耳机 Pro 竞品价格并调整定价策略',
    status: 'succeeded',
    riskLevel: 'medium',
    createdAt: now.subtract(6, 'hour').toISOString(),
    updatedAt: now.subtract(5, 'hour').toISOString(),
    timeline: [
      { id: 5001, type: 'run_started', title: '价格扫描启动', summary: '拉取 5 个竞品的实时价格数据。', at: now.subtract(6, 'hour').toISOString() },
      { id: 5002, type: 'step_completed', title: '竞品价格分析完成', summary: '2 个竞品降价 5%-8%，1 个竞品涨价 3%。建议下调 $1.00。', at: now.subtract(5.5, 'hour').toISOString() },
      { id: 5003, type: 'run_succeeded', title: '定价调整完成', summary: '蓝牙耳机 Pro 价格从 $32.99 调整为 $31.99，毛利率维持 42%。', at: now.subtract(5, 'hour').toISOString() }
    ]
  },
  {
    id: 3016,
    title: '动态定价 — 65W 充电器',
    storeId: 1001,
    agentType: 'pricing_strategy',
    goal: '根据竞品价格变动自动调整 65W 充电器定价',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(20, 'minute').toISOString(),
    updatedAt: now.subtract(5, 'minute').toISOString(),
    timeline: [
      { id: 5004, type: 'run_started', title: '动态定价启动', summary: '检测到竞品 PowerDeal Shop 降价 12%，触发自动定价流程。', at: now.subtract(20, 'minute').toISOString() },
      { id: 5005, type: 'step_started', title: '毛利率计算中', summary: '当前成本 $18.50，竞品价格 $22.49，计算最优定价方案...', at: now.subtract(5, 'minute').toISOString() }
    ]
  },
  {
    id: 3017,
    title: '底价保护检查 — 运动T恤',
    storeId: 1002,
    agentType: 'pricing_strategy',
    goal: '检查运动T恤定价是否低于底价保护线',
    status: 'failed',
    riskLevel: 'high',
    createdAt: now.subtract(8, 'hour').toISOString(),
    updatedAt: now.subtract(7, 'hour').toISOString(),
    timeline: [
      { id: 5006, type: 'run_started', title: '底价保护检查启动', summary: '检查运动T恤当前价格 $12.99 是否低于底价 $14.00。', at: now.subtract(8, 'hour').toISOString() },
      { id: 5007, type: 'run_failed', title: '底价保护触发', summary: '当前价格低于底价保护线，已自动冻结价格调整并通知运营。', at: now.subtract(7, 'hour').toISOString() }
    ]
  },
  // ===== crm_retention =====
  {
    id: 3018,
    title: '客户分层刷新 — 6月',
    storeId: 1001,
    agentType: 'crm_retention',
    goal: '刷新全店客户分层（高价值/活跃/沉睡/流失）',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(12, 'hour').toISOString(),
    updatedAt: now.subtract(11, 'hour').toISOString(),
    timeline: [
      { id: 5101, type: 'run_started', title: '分层刷新启动', summary: '拉取最近 90 天订单数据，共 2,847 名客户。', at: now.subtract(12, 'hour').toISOString() },
      { id: 5102, type: 'step_completed', title: '分层计算完成', summary: '高价值 234 人、活跃 1,102 人、沉睡 891 人、流失 620 人。', at: now.subtract(11.5, 'hour').toISOString() },
      { id: 5103, type: 'run_succeeded', title: '分层刷新完成', summary: '已识别 620 名流失风险客户，自动生成挽留券方案。', at: now.subtract(11, 'hour').toISOString() }
    ]
  },
  {
    id: 3019,
    title: '流失客户挽留券发放',
    storeId: 1001,
    agentType: 'crm_retention',
    goal: '向 620 名流失风险客户自动发放挽留券',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(2, 'hour').toISOString(),
    updatedAt: now.subtract(30, 'minute').toISOString(),
    timeline: [
      { id: 5104, type: 'run_started', title: '挽留券发放启动', summary: '向 620 名流失风险客户发放 15% 折扣券，预算上限 $1,200。', at: now.subtract(2, 'hour').toISOString() },
      { id: 5105, type: 'step_started', title: '批量发放中', summary: '已发放 420/620，当前消耗 $820。', at: now.subtract(30, 'minute').toISOString() }
    ]
  },
  {
    id: 3020,
    title: 'VIP 客户关怀 — 618大促',
    storeId: 1002,
    agentType: 'crm_retention',
    goal: '向 VIP 客户发送 618 大促专属关怀邮件',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(24, 'hour').toISOString(),
    updatedAt: now.subtract(23, 'hour').toISOString(),
    timeline: [
      { id: 5106, type: 'run_started', title: 'VIP 关怀启动', summary: '向 89 名 VIP 客户发送 618 专属优惠券。', at: now.subtract(24, 'hour').toISOString() },
      { id: 5107, type: 'run_failed', title: '邮件发送失败', summary: 'SMTP 服务超时，已重试 2 次仍失败。需检查邮件服务配置。', at: now.subtract(23, 'hour').toISOString() }
    ]
  },
  // ===== review_manager =====
  {
    id: 3021,
    title: '差评监控 — 蓝牙耳机 Pro',
    storeId: 1001,
    agentType: 'review_manager',
    goal: '监控蓝牙耳机 Pro 的差评并自动回复',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(4, 'hour').toISOString(),
    updatedAt: now.subtract(3, 'hour').toISOString(),
    timeline: [
      { id: 5201, type: 'run_started', title: '差评扫描启动', summary: '扫描最近 24 小时的新评价。', at: now.subtract(4, 'hour').toISOString() },
      { id: 5202, type: 'step_completed', title: '发现 3 条差评', summary: '2 条关于续航问题，1 条关于连接稳定性。已生成回复草稿。', at: now.subtract(3.5, 'hour').toISOString() },
      { id: 5203, type: 'run_succeeded', title: '自动回复完成', summary: '3 条差评已自动回复，回复率 100%。', at: now.subtract(3, 'hour').toISOString() }
    ]
  },
  {
    id: 3022,
    title: '好评邀请 — 65W 充电器',
    storeId: 1001,
    agentType: 'review_manager',
    goal: '向近期购买 65W 充电器的客户发送好评邀请',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(1, 'hour').toISOString(),
    updatedAt: now.subtract(20, 'minute').toISOString(),
    timeline: [
      { id: 5204, type: 'run_started', title: '好评邀请启动', summary: '向 156 名近期购买客户发送好评邀请。', at: now.subtract(1, 'hour').toISOString() },
      { id: 5205, type: 'step_started', title: '邀请发送中', summary: '已发送 89/156，已有 12 人留下好评。', at: now.subtract(20, 'minute').toISOString() }
    ]
  },
  {
    id: 3023,
    title: '差评监控 — 运动T恤',
    storeId: 1002,
    agentType: 'review_manager',
    goal: '监控运动T恤差评并自动回复',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(10, 'hour').toISOString(),
    updatedAt: now.subtract(9, 'hour').toISOString(),
    timeline: [
      { id: 5206, type: 'run_started', title: '差评扫描启动', summary: '扫描运动T恤最近 48 小时评价。', at: now.subtract(10, 'hour').toISOString() },
      { id: 5207, type: 'run_failed', title: 'API 限流', summary: '评价 API 请求被限流，已重试 2 次仍失败。', at: now.subtract(9, 'hour').toISOString() }
    ]
  },
  // ===== customer_service =====
  {
    id: 3024,
    title: '智能回复 — 充电器咨询',
    storeId: 1001,
    agentType: 'customer_service',
    goal: '自动回复 65W 充电器相关咨询',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(3, 'hour').toISOString(),
    updatedAt: now.subtract(2, 'hour').toISOString(),
    timeline: [
      { id: 5301, type: 'run_started', title: '智能回复启动', summary: '检测到 12 条新咨询消息。', at: now.subtract(3, 'hour').toISOString() },
      { id: 5302, type: 'step_completed', title: '意图分类完成', summary: '7 条产品咨询、3 条物流查询、2 条退款咨询。', at: now.subtract(2.5, 'hour').toISOString() },
      { id: 5303, type: 'run_succeeded', title: '回复完成', summary: '10 条已自动回复，2 条退款咨询升级至人工。', at: now.subtract(2, 'hour').toISOString() }
    ]
  },
  {
    id: 3025,
    title: '智能回复 — 耳机咨询',
    storeId: 1001,
    agentType: 'customer_service',
    goal: '自动回复蓝牙耳机相关咨询',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(15, 'minute').toISOString(),
    updatedAt: now.subtract(5, 'minute').toISOString(),
    timeline: [
      { id: 5304, type: 'run_started', title: '智能回复启动', summary: '检测到 8 条新咨询消息。', at: now.subtract(15, 'minute').toISOString() },
      { id: 5305, type: 'step_started', title: '意图分类中', summary: '正在对 8 条消息进行意图分类...', at: now.subtract(5, 'minute').toISOString() }
    ]
  },
  {
    id: 3026,
    title: 'FAQ 学习 — 618大促',
    storeId: 1002,
    agentType: 'customer_service',
    goal: '从历史对话中学习 618 大促相关 FAQ',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(15, 'hour').toISOString(),
    updatedAt: now.subtract(14, 'hour').toISOString(),
    timeline: [
      { id: 5306, type: 'run_started', title: 'FAQ 学习启动', summary: '分析 500 条 618 大促相关历史对话。', at: now.subtract(15, 'hour').toISOString() },
      { id: 5307, type: 'run_failed', title: '模型超时', summary: 'AI 模型处理超时，需减少批量大小后重试。', at: now.subtract(14, 'hour').toISOString() }
    ]
  },
  // ===== after_sales =====
  {
    id: 3027,
    title: '退货审核 — 运动T恤',
    storeId: 1002,
    agentType: 'after_sales',
    goal: '审核 3 笔运动T恤退货申请',
    status: 'succeeded',
    riskLevel: 'medium',
    createdAt: now.subtract(5, 'hour').toISOString(),
    updatedAt: now.subtract(4, 'hour').toISOString(),
    timeline: [
      { id: 5401, type: 'run_started', title: '退货审核启动', summary: '3 笔退货申请待审核，退货原因：尺码不符 ×2、色差 ×1。', at: now.subtract(5, 'hour').toISOString() },
      { id: 5402, type: 'step_completed', title: '审核完成', summary: '2 笔符合退货条件已批准，1 笔色差证据不足需人工复核。', at: now.subtract(4.5, 'hour').toISOString() },
      { id: 5403, type: 'run_succeeded', title: '退货流程完成', summary: '已生成退货物流单并通知买家。', at: now.subtract(4, 'hour').toISOString() }
    ]
  },
  {
    id: 3028,
    title: '退款处理 — 充电器',
    storeId: 1001,
    agentType: 'after_sales',
    goal: '处理 65W 充电器退款申请',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(30, 'minute').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      { id: 5404, type: 'run_started', title: '退款处理启动', summary: '1 笔退款申请，金额 $39.99，低于自动退款上限 $50。', at: now.subtract(30, 'minute').toISOString() },
      { id: 5405, type: 'step_started', title: '退款审核中', summary: '验证订单状态和退款条件...', at: now.subtract(10, 'minute').toISOString() }
    ]
  },
  {
    id: 3029,
    title: '物流追踪 — 耳机批量发货',
    storeId: 1001,
    agentType: 'after_sales',
    goal: '追踪蓝牙耳机批量发货物流状态',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(20, 'hour').toISOString(),
    updatedAt: now.subtract(19, 'hour').toISOString(),
    timeline: [
      { id: 5406, type: 'run_started', title: '物流追踪启动', summary: '追踪 45 笔订单的物流状态。', at: now.subtract(20, 'hour').toISOString() },
      { id: 5407, type: 'run_failed', title: '物流 API 异常', summary: '物流商 API 返回 500 错误，无法获取追踪信息。', at: now.subtract(19, 'hour').toISOString() }
    ]
  },
  // ===== promotion_campaign =====
  {
    id: 3030,
    title: '滞销品促销 — LED 灯带',
    storeId: 1001,
    agentType: 'promotion_campaign',
    goal: '为滞销 60 天的 LED 灯带自动创建促销活动',
    status: 'succeeded',
    riskLevel: 'medium',
    createdAt: now.subtract(8, 'hour').toISOString(),
    updatedAt: now.subtract(7, 'hour').toISOString(),
    timeline: [
      { id: 5501, type: 'run_started', title: '促销规则触发', summary: 'LED 灯带滞销 62 天，触发自动促销规则（折扣 35%）。', at: now.subtract(8, 'hour').toISOString() },
      { id: 5502, type: 'step_completed', title: '促销活动创建', summary: '已创建限时闪购活动，原价 $12.49 → 促销价 $8.12，预算 $200。', at: now.subtract(7.5, 'hour').toISOString() },
      { id: 5503, type: 'run_succeeded', title: '促销已上线', summary: '活动已在 TikTok Shop 上线，预计持续 7 天。', at: now.subtract(7, 'hour').toISOString() }
    ]
  },
  {
    id: 3031,
    title: '竞品降价触发 — 充电器',
    storeId: 1001,
    agentType: 'promotion_campaign',
    goal: '竞品充电器降价 12%，触发促销应对',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(25, 'minute').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      { id: 5504, type: 'run_started', title: '竞品降价触发', summary: '检测到 PowerDeal Shop 充电器降价 12%，触发促销规则。', at: now.subtract(25, 'minute').toISOString() },
      { id: 5505, type: 'step_started', title: '促销方案计算中', summary: '正在计算最优促销方案（满减 vs 折扣 vs 赠品）...', at: now.subtract(10, 'minute').toISOString() }
    ]
  },
  {
    id: 3032,
    title: '优惠券活动 — 618大促',
    storeId: 1002,
    agentType: 'promotion_campaign',
    goal: '创建 618 大促优惠券活动',
    status: 'failed',
    riskLevel: 'medium',
    createdAt: now.subtract(30, 'hour').toISOString(),
    updatedAt: now.subtract(29, 'hour').toISOString(),
    timeline: [
      { id: 5506, type: 'run_started', title: '优惠券活动创建', summary: '创建 618 满减券：满 $50 减 $8，预算 $2,000。', at: now.subtract(30, 'hour').toISOString() },
      { id: 5507, type: 'run_failed', title: '预算超限', summary: '活动预算 $2,000 超过月度促销预算上限 $1,500。需运营调整预算。', at: now.subtract(29, 'hour').toISOString() }
    ]
  },
  // ===== inventory_alert =====
  {
    id: 3033,
    title: '低库存巡检 — 全店',
    storeId: 1001,
    agentType: 'inventory_alert',
    goal: '扫描全店 SKU 库存，标记低库存商品',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(3, 'hour').toISOString(),
    updatedAt: now.subtract(2, 'hour').toISOString(),
    timeline: [
      { id: 5601, type: 'run_started', title: '库存巡检启动', summary: '扫描 47 个 SKU 的库存数据。', at: now.subtract(3, 'hour').toISOString() },
      { id: 5602, type: 'step_completed', title: '巡检完成', summary: '发现 3 个 SKU 低于安全库存阈值（50 件），2 个 SKU 滞销超 30 天。', at: now.subtract(2.5, 'hour').toISOString() },
      { id: 5603, type: 'run_succeeded', title: '补货建议生成', summary: '已生成 3 条自动补货建议，总金额 $850（低于 $500/单自动审批额度）。', at: now.subtract(2, 'hour').toISOString() }
    ]
  },
  {
    id: 3034,
    title: '自动补货 — 蓝牙耳机',
    storeId: 1001,
    agentType: 'inventory_alert',
    goal: '蓝牙耳机库存 32 件，自动生成补货订单',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(40, 'minute').toISOString(),
    updatedAt: now.subtract(15, 'minute').toISOString(),
    timeline: [
      { id: 5604, type: 'run_started', title: '补货流程启动', summary: '蓝牙耳机库存 32 件 < 阈值 50 件，触发自动补货。', at: now.subtract(40, 'minute').toISOString() },
      { id: 5605, type: 'step_started', title: '补货订单生成中', summary: '计算补货数量：建议补货 200 件，预计成本 $3,400...', at: now.subtract(15, 'minute').toISOString() }
    ]
  },
  {
    id: 3035,
    title: '滞销品标记 — 露营椅',
    storeId: 1002,
    agentType: 'inventory_alert',
    goal: '标记可折叠露营椅为滞销品',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(14, 'hour').toISOString(),
    updatedAt: now.subtract(13, 'hour').toISOString(),
    timeline: [
      { id: 5606, type: 'run_started', title: '滞销分析启动', summary: '分析可折叠露营椅近 30 天销量。', at: now.subtract(14, 'hour').toISOString() },
      { id: 5607, type: 'run_failed', title: '数据缺失', summary: 'SKU 露营椅的销售数据不完整，无法计算滞销天数。需检查数据管道。', at: now.subtract(13, 'hour').toISOString() }
    ]
  },
  // ===== risk_control =====
  {
    id: 3036,
    title: '合规扫描 — 全店商品',
    storeId: 1001,
    agentType: 'risk_control',
    goal: '扫描全店商品文案和图片的合规性',
    status: 'succeeded',
    riskLevel: 'high',
    createdAt: now.subtract(6, 'hour').toISOString(),
    updatedAt: now.subtract(5, 'hour').toISOString(),
    timeline: [
      { id: 5701, type: 'run_started', title: '合规扫描启动', summary: '扫描 47 个 SKU 的标题、详情、图片。', at: now.subtract(6, 'hour').toISOString() },
      { id: 5702, type: 'step_completed', title: '发现 4 个风险', summary: '2 个极限词违规、1 个防晒宣称缺报告、1 个图片疑似竞品 Logo。', at: now.subtract(5.5, 'hour').toISOString() },
      { id: 5703, type: 'run_succeeded', title: '合规报告生成', summary: '已生成合规风险报告，4 条建议已推送至对应 Agent。', at: now.subtract(5, 'hour').toISOString() }
    ]
  },
  {
    id: 3037,
    title: '行为监控 — 广告投放频率',
    storeId: 1001,
    agentType: 'risk_control',
    goal: '监控广告投放 Agent 的操作频率',
    status: 'running',
    riskLevel: 'high',
    createdAt: now.subtract(1, 'hour').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      { id: 5704, type: 'run_started', title: '行为监控启动', summary: '检查广告投放 Agent 最近 1 小时的操作频率。', at: now.subtract(1, 'hour').toISOString() },
      { id: 5705, type: 'step_started', title: '频率分析中', summary: '检测到 8 次预算调整操作（阈值 10 次/小时），接近限频...', at: now.subtract(10, 'minute').toISOString() }
    ]
  },
  {
    id: 3038,
    title: '熔断器检查 — 定价异常',
    storeId: 1002,
    agentType: 'risk_control',
    goal: '检查定价 Agent 是否触发熔断',
    status: 'failed',
    riskLevel: 'high',
    createdAt: now.subtract(12, 'hour').toISOString(),
    updatedAt: now.subtract(11, 'hour').toISOString(),
    timeline: [
      { id: 5706, type: 'run_started', title: '熔断器检查启动', summary: '定价 Agent 尝试将运动T恤价格设为 $12.99（底价 $14.00）。', at: now.subtract(12, 'hour').toISOString() },
      { id: 5707, type: 'run_failed', title: '熔断器触发', summary: '价格偏离度 30% 超过阈值，已冻结定价操作并通知运营。', at: now.subtract(11, 'hour').toISOString() }
    ]
  },
  // ===== finance_audit =====
  {
    id: 3039,
    title: '6月对账 — TikTok Shop',
    storeId: 1001,
    agentType: 'finance_audit',
    goal: '6 月 TikTok Shop 账单自动对账',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(2, 'day').toISOString(),
    updatedAt: now.subtract(1, 'day').toISOString(),
    timeline: [
      { id: 5801, type: 'run_started', title: '对账启动', summary: '拉取 6 月 TikTok Shop 账单和银行流水。', at: now.subtract(2, 'day').toISOString() },
      { id: 5802, type: 'step_completed', title: '账单匹配完成', summary: '平台账单 $48,230 vs 银行到账 $47,890，差异 $340。', at: now.subtract(1.5, 'day').toISOString() },
      { id: 5803, type: 'run_succeeded', title: '对账完成', summary: '差异 $340 低于预警阈值 $500，已自动标记为汇率波动并归档。', at: now.subtract(1, 'day').toISOString() }
    ]
  },
  {
    id: 3040,
    title: '差异标记 — Amazon 5月',
    storeId: 1002,
    agentType: 'finance_audit',
    goal: 'Amazon 5 月账单差异标记',
    status: 'running',
    riskLevel: 'medium',
    createdAt: now.subtract(3, 'hour').toISOString(),
    updatedAt: now.subtract(1, 'hour').toISOString(),
    timeline: [
      { id: 5804, type: 'run_started', title: '差异分析启动', summary: 'Amazon 5 月账单 $32,100 vs 银行到账 $31,200，差异 $900。', at: now.subtract(3, 'hour').toISOString() },
      { id: 5805, type: 'step_started', title: '差异分类中', summary: '差异 $900 超过阈值 $500，正在分类原因（平台手续费/退款/汇率）...', at: now.subtract(1, 'hour').toISOString() }
    ]
  },
  {
    id: 3041,
    title: '财务报告生成 — Q2',
    storeId: 1001,
    agentType: 'finance_audit',
    goal: '生成 Q2 季度财务报告',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(5, 'day').toISOString(),
    updatedAt: now.subtract(4, 'day').toISOString(),
    timeline: [
      { id: 5806, type: 'run_started', title: '报告生成启动', summary: '汇总 Q2（4-6月）所有店铺的财务数据。', at: now.subtract(5, 'day').toISOString() },
      { id: 5807, type: 'run_failed', title: '数据不完整', summary: 'Amazon 5 月账单未完成对账，无法生成完整 Q2 报告。', at: now.subtract(4, 'day').toISOString() }
    ]
  },
  // ===== live_stream_ops =====
  {
    id: 3042,
    title: '直播监控 — 618大促专场',
    storeId: 1001,
    agentType: 'live_stream_ops',
    goal: '监控 618 大促直播间的实时数据',
    status: 'succeeded',
    riskLevel: 'low',
    createdAt: now.subtract(5, 'hour').toISOString(),
    updatedAt: now.subtract(4, 'hour').toISOString(),
    timeline: [
      { id: 5901, type: 'run_started', title: '直播监控启动', summary: '开始监控 618 大促专场直播，在线观众 1,240 人。', at: now.subtract(5, 'hour').toISOString() },
      { id: 5902, type: 'step_completed', title: '自动置顶 3 个商品', summary: '根据观众互动热度，自动置顶充电器、耳机、运动T恤。', at: now.subtract(4.5, 'hour').toISOString() },
      { id: 5903, type: 'run_succeeded', title: '直播监控完成', summary: '直播结束，峰值观众 2,830 人，成交 156 单，GMV $6,230。', at: now.subtract(4, 'hour').toISOString() }
    ]
  },
  {
    id: 3043,
    title: '直播排期 — 618大促次日',
    storeId: 1001,
    agentType: 'live_stream_ops',
    goal: '安排 618 大促次日的直播排期',
    status: 'running',
    riskLevel: 'low',
    createdAt: now.subtract(30, 'minute').toISOString(),
    updatedAt: now.subtract(10, 'minute').toISOString(),
    timeline: [
      { id: 5904, type: 'run_started', title: '排期生成启动', summary: '根据昨日直播数据，生成今日直播排期。', at: now.subtract(30, 'minute').toISOString() },
      { id: 5905, type: 'step_started', title: '排期优化中', summary: '正在根据峰值时段和商品热度优化排期...', at: now.subtract(10, 'minute').toISOString() }
    ]
  },
  {
    id: 3044,
    title: '直播数据同步 — Amazon直播',
    storeId: 1002,
    agentType: 'live_stream_ops',
    goal: '同步 Amazon 直播间的实时数据',
    status: 'failed',
    riskLevel: 'low',
    createdAt: now.subtract(15, 'hour').toISOString(),
    updatedAt: now.subtract(14, 'hour').toISOString(),
    timeline: [
      { id: 5906, type: 'run_started', title: '数据同步启动', summary: '同步 Amazon 直播间实时观看数据和商品点击。', at: now.subtract(15, 'hour').toISOString() },
      { id: 5907, type: 'run_failed', title: 'API 未授权', summary: 'Amazon Live API 返回 401 未授权，需重新刷新 API Token。', at: now.subtract(14, 'hour').toISOString() }
    ]
  }
];

export const approvals: Approval[] = [
  {
    id: 5001,
    taskId: 3001,
    storeId: 1001,
    storeName: 'TikTok Shop 美国旗舰店',
    agentType: 'ads_optimizer',
    title: '暂停低 ROI TikTok 广告计划',
    reason: '广告计划 C-102 已消耗 612 美元，ROI 低于目标值 42%。',
    proposedAction: '暂停广告计划 C-102，并将 15% 预算转移到广告计划 C-088。',
    beforeValue: '广告计划 C-102 日预算：420 美元',
    afterValue: '广告计划 C-102 暂停；C-088 日预算增加 63 美元',
    riskLevel: 'high',
    status: 'pending',
    requestedAt: now.subtract(12, 'minute').toISOString()
  },
  {
    id: 5002,
    taskId: 3002,
    storeId: 1001,
    storeName: 'TikTok Shop 美国旗舰店',
    agentType: 'product_launch',
    title: '审核新品卖点文案',
    reason: 'Agent 为新品详情页生成了卖点描述。',
    proposedAction: '合规审核通过后，将商品草稿标记为可发布。',
    beforeValue: '商品状态：草稿',
    afterValue: '商品状态：待发布',
    riskLevel: 'medium',
    status: 'approved',
    requestedAt: now.subtract(1, 'day').toISOString(),
    decidedAt: now.subtract(23, 'hour').toISOString()
  },
  {
    id: 5003,
    taskId: 3003,
    storeId: 1002,
    storeName: 'Amazon 户外用品店',
    agentType: 'pricing_strategy',
    title: '蓝牙耳机 Pro 调价审批',
    reason: '竞品均价下跌 8%，建议同步调价以保持竞争力。',
    proposedAction: '将 SKU BT-E01 售价从 $32.99 调整为 $29.99（降幅 9.1%）。',
    beforeValue: '售价 $32.99，毛利率 42%',
    afterValue: '售价 $29.99，毛利率 37%',
    riskLevel: 'medium',
    status: 'pending',
    requestedAt: now.subtract(1, 'hour').toISOString()
  },
  {
    id: 5004,
    taskId: 3004,
    storeId: 1001,
    storeName: 'TikTok Shop 美国旗舰店',
    agentType: 'promotion_campaign',
    title: '滞销 SKU 闪购活动审批',
    reason: '3 个 SKU 库存周转超过 60 天，建议创建 30% 闪购活动清理库存。',
    proposedAction: '为 3 个滞销 SKU 创建 30% OFF 闪购活动，预算 $500，持续 7 天。',
    beforeValue: '无促销活动',
    afterValue: '闪购 30% OFF，预算 $500/7天',
    riskLevel: 'high',
    status: 'pending',
    requestedAt: now.subtract(2, 'hour').toISOString()
  },
  {
    id: 5005,
    taskId: 3005,
    storeId: 1001,
    storeName: 'TikTok Shop 美国旗舰店',
    agentType: 'ads_optimizer',
    title: '高 ROI 广告追加预算',
    reason: '广告计划 A-201 ROI=3.2，建议追加 $50/日预算扩大收益。',
    proposedAction: '将广告计划 A-201 日预算从 $100 增加到 $150。',
    beforeValue: '日预算 $100',
    afterValue: '日预算 $150',
    riskLevel: 'low',
    status: 'pending',
    requestedAt: now.subtract(12, 'minute').toISOString()
  }
];

export const auditLogs: AuditLog[] = [
  // ===== 审批事件 =====
  {
    id: 6001,
    actor: 'MuleRun Agent', action: '需要审批', entity: '任务', entityId: 3001,
    summary: '广告计划 C-102 预算调整超过租户风险阈值，暂停等待审批。',
    at: now.subtract(12, 'minute').toISOString(), category: 'approval', linkTo: '/approvals/5001'
  },
  {
    id: 6002,
    actor: '李鹏', action: '审批通过', entity: '审批', entityId: 5003,
    summary: '批准 TikTok Shop 蓝牙耳机 Pro 价格下调 8%。',
    at: now.subtract(1, 'hour').toISOString(), category: 'approval', linkTo: '/approvals/5003'
  },
  {
    id: 6003,
    actor: '风控审批人', action: '审批通过', entity: '审批', entityId: 5002,
    summary: '双人审批：批准 Amazon 户外店广告预算上调 15%。',
    at: now.subtract(3, 'hour').toISOString(), category: 'approval', linkTo: '/approvals/5002'
  },
  {
    id: 6004,
    actor: 'AllMall 系统', action: '超时自动拒绝', entity: '审批', entityId: 5005,
    summary: 'Shopify 独立站满减促销审批超时 24 小时，自动拒绝。',
    at: now.subtract(1, 'day').toISOString(), category: 'approval'
  },
  {
    id: 6005,
    actor: '李鹏', action: '审批拒绝', entity: '审批', entityId: 5001,
    summary: '拒绝 TikTok Shop 广告预算增加 200%，认为 ROI 不支撑。',
    at: now.subtract(2, 'day').toISOString(), category: 'approval', linkTo: '/approvals/5001'
  },
  // ===== Agent 自动操作 =====
  {
    id: 6006,
    actor: '广告投放 Agent', action: '暂停广告计划', entity: '广告计划', entityId: 'campaign_c102',
    summary: 'ROI 连续 3 天低于 1.5 红线，自动暂停广告计划 C-102。',
    at: now.subtract(8, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/ads_optimizer'
  },
  {
    id: 6007,
    actor: '定价策略 Agent', action: '动态调价', entity: '商品', entityId: 'prod_001',
    summary: 'SKU BT-E01 蓝牙耳机 Pro 竞品均价下跌 8%，自动调价 $39.99 → $36.99。',
    at: now.subtract(7, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/pricing_strategy'
  },
  {
    id: 6008,
    actor: 'CRM 复购 Agent', action: '发放优惠券', entity: '客户群', entityId: 'segment_lapsed',
    summary: '向沉默客户群发放 15% OFF 优惠券 167 张，预算 $250。',
    at: now.subtract(6, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/crm_retention'
  },
  {
    id: 6009,
    actor: '评价管理 Agent', action: '自动回复', entity: '评价', entityId: 'rev_003',
    summary: '自动回复 5 星好评 3 条，生成回复草稿 2 条。',
    at: now.subtract(5, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/review_manager'
  },
  {
    id: 6010,
    actor: '风险控制 Agent', action: '阻断操作', entity: '商品描述', entityId: 'prod_001',
    summary: '检测到 "最强降噪" 绝对化用语，已阻断发布。',
    at: now.subtract(4, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/risk_control'
  },
  {
    id: 6011,
    actor: '库存预警 Agent', action: '低库存告警', entity: '商品', entityId: 'prod_003',
    summary: 'SKU CK-C01 65W GaN 充电器库存 35 件低于安全阈值 50，建议补货 200 件。',
    at: now.subtract(6, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/inventory_alert'
  },
  {
    id: 6012,
    actor: '财务对账 Agent', action: '账单比对', entity: '对账', entityId: 'bill_202606',
    summary: 'TikTok Shop 6 月账单与内部记录差异 $0.00，完全匹配。',
    at: now.subtract(5, 'hour').toISOString(), category: 'agent_action', linkTo: '/agents/finance_audit'
  },
  // ===== 人工操作 =====
  {
    id: 6013,
    actor: '李鹏', action: '店铺已连接', entity: '店铺', entityId: 1001,
    summary: 'TikTok Shop 美国旗舰店通过 connectToken 完成会话绑定。',
    at: now.subtract(5, 'day').toISOString(), category: 'human_ops', linkTo: '/stores/1001'
  },
  {
    id: 6014,
    actor: '李鹏', action: '启用 Agent', entity: 'Agent', entityId: 'login_bootstrap',
    summary: '启用店铺保活 Agent，开始监控 3 个店铺登录态。',
    at: now.subtract(4, 'day').toISOString(), category: 'human_ops', linkTo: '/agents/login_bootstrap'
  },
  {
    id: 6015,
    actor: '运营负责人', action: '添加成本项', entity: '成本', entityId: 'cost_009',
    summary: '添加 TikTok Shop 美国旗舰店 7 月广告预算 $5000。',
    at: now.subtract(2, 'day').toISOString(), category: 'human_ops', linkTo: '/operations'
  },
  {
    id: 6016,
    actor: '李鹏', action: '通过商品草稿', entity: '商品', entityId: 'prod_008',
    summary: '批准 便携式野营炉 上架草稿，自动发布到 Amazon。',
    at: now.subtract(1, 'day').toISOString(), category: 'human_ops', linkTo: '/operations'
  },
  {
    id: 6017,
    actor: '运营负责人', action: '添加成员', entity: '成员', entityId: 7003,
    summary: '邀请 风控审批人 (risk@example.com) 加入团队，角色 Approver。',
    at: now.subtract(6, 'day').toISOString(), category: 'human_ops', linkTo: '/settings/members'
  },
  {
    id: 6018,
    actor: '李鹏', action: '修改设置', entity: '通知', entityId: 'notif_001',
    summary: '将差评告警通知方式从 邮件 改为 企业微信 + 邮件。',
    at: now.subtract(3, 'day').toISOString(), category: 'human_ops', linkTo: '/settings/notifications'
  },
  // ===== 系统事件 =====
  {
    id: 6019,
    actor: 'AllMall 系统', action: '需要重新登录', entity: '店铺', entityId: 1002,
    summary: 'Amazon 户外用品店登录会话已失效，保活 Agent 正在尝试重新认证。',
    at: now.subtract(5, 'hour').toISOString(), category: 'store_session', linkTo: '/stores/1002'
  },
  {
    id: 6020,
    actor: 'AllMall 系统', action: '会话刷新成功', entity: '店铺', entityId: 1003,
    summary: 'Shopify 独立站登录会话过期，保活 Agent 自动重新登录成功。',
    at: now.subtract(1, 'day').toISOString(), category: 'store_session', linkTo: '/stores/1003'
  },
  {
    id: 6021,
    actor: 'AllMall 系统', action: 'Token 额度预警', entity: '模型', entityId: 'model_deepseek',
    summary: 'DeepSeek-chat 模型本月 Token 用量已达 85%，建议关注。',
    at: now.subtract(2, 'day').toISOString(), category: 'system_event', linkTo: '/billing'
  },
  {
    id: 6022,
    actor: 'AllMall 系统', action: '定时任务触发', entity: 'Agent', entityId: 'competitor_intel',
    summary: '市场情报 Agent 按照 cron 0 0 */2 * * 自动启动竞品数据采集。',
    at: now.subtract(4, 'hour').toISOString(), category: 'system_event', linkTo: '/agents/competitor_intel'
  },
  {
    id: 6023,
    actor: 'AllMall 系统', action: '备份完成', entity: '系统', entityId: 'system',
    summary: '每日数据备份完成，快照大小 2.3 GB，耗时 18 秒。',
    at: now.subtract(12, 'hour').toISOString(), category: 'system_event'
  },
  {
    id: 6024,
    actor: 'AllMall 系统', action: '熔断触发', entity: '广告计划', entityId: 'campaign_d021',
    summary: 'Amazon 户外店广告计划 D-021 花费超预算 130%，自动熔断暂停。',
    at: now.subtract(3, 'day').toISOString(), category: 'system_event', linkTo: '/agents/risk_control'
  },
];

export const members: Member[] = [
  { id: 7001, name: '李鹏', email: 'lipeng@example.com', role: 'Owner', status: 'active' },
  { id: 7002, name: '运营负责人', email: 'ops@example.com', role: 'Admin', status: 'active' },
  { id: 7003, name: '风控审批人', email: 'risk@example.com', role: 'Approver', status: 'invited' }
];

// Initialize the centralized audit logger with the shared auditLogs array.
// This ensures all API mutation operations generate consistent audit trail entries.
import { initAuditLogger } from './auditLogger';
initAuditLogger(auditLogs);
