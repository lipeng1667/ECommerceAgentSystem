import type { AgentStatus, DailyReport, Decision, BusinessOperated } from '../types/domain';
import type { StoreInfo } from '../app/storeScope';

export const mockStores: StoreInfo[] = [
  { id: 's1', name: '小天才旗舰店', platform: '淘宝', platformIcon: '🛒', status: 'connected' },
  { id: 's2', name: '积木学习桌专营店', platform: '京东', platformIcon: '📦', status: 'connected' },
  { id: 's3', name: '户外露营装备店', platform: '拼多多', platformIcon: '🎯', status: 'connected' },
  { id: 's4', name: '童装优选', platform: '抖音', platformIcon: '🎵', status: 'disconnected' },
];

export const mockAgents: AgentStatus[] = [
  { id: 'review_manager', name: 'review_manager', nameZh: '评价Agent', icon: 'star', running: true, autonomyLevel: 'semi_auto', lastActivity: '3分钟前', todayCount: 127, description: '自动回复评价、差评预警、情感分析' },
  { id: 'customer_service', name: 'customer_service', nameZh: '客服Agent', icon: 'service', running: true, autonomyLevel: 'full_auto', lastActivity: '1分钟前', todayCount: 42, description: '智能客服回复、快捷话术、转人工判断' },
  { id: 'inventory_guardian', name: 'inventory_guardian', nameZh: '库存Agent', icon: 'box', running: true, autonomyLevel: 'semi_auto', lastActivity: '15分钟前', todayCount: 8, description: '补货建议、安全库存监控、跨仓调拨' },
  { id: 'order_processor', name: 'order_processor', nameZh: '订单Agent', icon: 'order', running: true, autonomyLevel: 'full_auto', lastActivity: '刚刚', todayCount: 58, description: '自动审单、异常标记、物流追踪' },
  { id: 'promotion_campaign', name: 'promotion_campaign', nameZh: '促销Agent', icon: 'gift', running: true, autonomyLevel: 'semi_auto', lastActivity: '25分钟前', todayCount: 12, description: '促销策划、竞品跟价、ROI预估' },
  { id: 'ad_optimizer', name: 'ad_optimizer', nameZh: '广告Agent', icon: 'thunderbolt', running: true, autonomyLevel: 'full_auto', lastActivity: '5分钟前', todayCount: 34, description: '预算优化、素材A/B测试、归因分析' },
  { id: 'live_assistant', name: 'live_assistant', nameZh: '直播Agent', icon: 'play', running: false, autonomyLevel: 'disabled', lastActivity: '--', todayCount: 0, description: '直播排期、弹幕互动、选品推荐' },
  { id: 'pricing_agent', name: 'pricing_agent', nameZh: '定价Agent', icon: 'dollar', running: true, autonomyLevel: 'full_auto', lastActivity: '12分钟前', todayCount: 47, description: '动态定价、竞品监控、利润优化' },
  { id: 'content_creator', name: 'content_creator', nameZh: '素材Agent', icon: 'picture', running: false, autonomyLevel: 'disabled', lastActivity: '--', todayCount: 0, description: '商品文案生成、图片优化、短视频制作' },
];

export const mockReport: DailyReport = {
  agentCount: 9, runningCount: 7, totalAutoActions: 247, hoursSaved: 8,
  autoRate: 94.7, agentCoverage: 7 / 9, decisionCount: 3,
  decisions: [
    { id: 'dec-001', agentId: 'review_manager', agentName: '评价Agent', storeId: 's1', level: 'critical', title: '负评：商品"积木桌"收到 1 星差评', summary: '用户反馈"质量太差了，孩子玩了两次就坏"', analysis: '该商品近 30 天退货率 12%，此差评为真。建议立即处理。', suggestions: [{ id: 'full', label: '批准全部', description: '退款 ¥89 + 补偿券 + 停发 + 通知供应商' }, { id: 'refund', label: '只退款', description: '自动退款 ¥89' }, { id: 'coupon', label: '只发券', description: '发送 ¥20 补偿券' }, { id: 'manual', label: '转人工处理', description: '人工跟进' }], createdAt: '10 分钟前', context: { product: '积木桌', rating: 1, orderAmount: 89 } },
    { id: 'dec-002', agentId: 'inventory_guardian', agentName: '库存Agent', storeId: 's1', level: 'medium', title: '仓库A"运动鞋"低于安全库存', summary: '当前 23 双，日均销量 8 双，缺口 33 双', analysis: '仓库B该款库存 120 双，调拨运费约 ¥45，预计 2 天到货。', suggestions: [{ id: 'transfer', label: '批准调拨', description: '从仓库B调拨 35 双' }, { id: 'edit', label: '修改数量', description: '自定义调拨数量' }, { id: 'supplier', label: '从供应商补货', description: '向供应商下单补货' }], createdAt: '2 小时前', context: { warehouse: '仓库A', sku: '运动鞋-白色-42码', currentStock: 23, dailySales: 8 } },
    { id: 'dec-003', agentId: 'promotion_campaign', agentName: '促销Agent', storeId: 's2', level: 'normal', title: '竞品降价，建议跟价优惠券', summary: '竞品"乐高积木桌"降价 15% 至 ¥129，转化率下降 8%', analysis: '创建 ¥20 限时优惠券，3 天有效期，预计 200+ 订单，ROI 4.2x。', suggestions: [{ id: 'create', label: '批准创建', description: '创建 ¥20 限时优惠券' }, { id: 'edit-amount', label: '修改面额', description: '自定义优惠券面额' }, { id: 'flash', label: '改为闪购', description: '限时闪购活动' }], createdAt: '5 小时前', context: { competitor: '乐高积木桌', priceDrop: '15%', ourProduct: '积木学习桌', ourPrice: 149 } },
  ],
  gmv: '¥12.8万', gmvChange: '↑8%', ratingScore: 4.7, inventoryTurnover: '14天', healthLabel: '健康',
  moduleCoverage: { total: 9, covered: 7 },
};

// --- Business Line data with storeId ---

export interface ProductItem { id: string; name: string; image: string; price: number; stock: number; maxStock: number; status: 'auto' | 'manual' | 'warning' | 'critical'; storeId: string; }
export const mockProducts: ProductItem[] = [
  { id: 'p1', name: '积木学习桌', image: '🧱', price: 149, stock: 23, maxStock: 56, status: 'auto', storeId: 's1' },
  { id: 'p2', name: '运动跑鞋', image: '👟', price: 299, stock: 120, maxStock: 156, status: 'auto', storeId: 's1' },
  { id: 'p3', name: '露营灯', image: '💡', price: 89, stock: 5, maxStock: 20, status: 'warning', storeId: 's2' },
  { id: 'p4', name: '儿童书包', image: '🎒', price: 129, stock: 0, maxStock: 30, status: 'critical', storeId: 's3' },
  { id: 'p5', name: '保温杯', image: '☕', price: 69, stock: 45, maxStock: 60, status: 'auto', storeId: 's4' },
];

export interface OrderItem { id: string; buyer: string; product: string; amount: number; time: string; status: string; handledBy: 'auto' | 'manual'; storeId: string; }
export const mockOrders: OrderItem[] = [
  { id: 'O001', buyer: '张三', product: '运动跑鞋', amount: 299, time: '14:32', status: '已发货', handledBy: 'auto', storeId: 's1' },
  { id: 'O002', buyer: '李四', product: '积木学习桌', amount: 149, time: '13:15', status: '待发货', handledBy: 'auto', storeId: 's1' },
  { id: 'O003', buyer: '王五', product: '保温杯', amount: 138, time: '11:20', status: '已签收', handledBy: 'auto', storeId: 's2' },
  { id: 'O004', buyer: '赵六', product: '露营灯', amount: 89, time: '09:45', status: '退款中', handledBy: 'manual', storeId: 's2' },
  { id: 'O005', buyer: '孙七', product: '儿童书包', amount: 129, time: '08:30', status: '已完成', handledBy: 'auto', storeId: 's3' },
];

export interface ServiceItem { id: string; customer: string; message: string; time: string; handledBy: 'auto' | 'manual'; status: string; storeId: string; }
export const mockServices: ServiceItem[] = [
  { id: 'c1', customer: '张女士', message: '这款还有货吗？', time: '14:30', handledBy: 'auto', status: '已回复', storeId: 's1' },
  { id: 'c2', customer: '李先生', message: '发货到海南要几天', time: '13:10', handledBy: 'auto', status: '已回复', storeId: 's1' },
  { id: 'c3', customer: '王小姐', message: '我想退货，尺码不合适', time: '11:45', handledBy: 'manual', status: '处理中', storeId: 's2' },
  { id: 'c4', customer: '赵先生', message: '可以开发票吗', time: '10:20', handledBy: 'auto', status: '已回复', storeId: 's3' },
  { id: 'c5', customer: '刘女士', message: '上次买的坏了怎么保修', time: '09:00', handledBy: 'manual', status: '已转接', storeId: 's4' },
];

export interface ReviewItem { id: string; buyer: string; product: string; rating: number; content: string; sentiment: string; handledBy: 'auto' | 'manual'; time: string; storeId: string; }
export const mockReviews: ReviewItem[] = [
  { id: 'r1', buyer: '张三', product: '运动跑鞋', rating: 5, content: '质量很好，穿着舒服', sentiment: 'positive', handledBy: 'auto', time: '14:20', storeId: 's1' },
  { id: 'r2', buyer: '李四', product: '积木学习桌', rating: 1, content: '质量太差了，孩子玩了两次就坏', sentiment: 'negative', handledBy: 'manual', time: '13:00', storeId: 's1' },
  { id: 'r3', buyer: '王五', product: '保温杯', rating: 4, content: '保温效果不错，颜色也好看', sentiment: 'positive', handledBy: 'auto', time: '11:30', storeId: 's2' },
  { id: 'r4', buyer: '赵六', product: '露营灯', rating: 3, content: '还行，亮度一般', sentiment: 'neutral', handledBy: 'auto', time: '10:15', storeId: 's3' },
  { id: 'r5', buyer: '孙七', product: '儿童书包', rating: 5, content: '孩子很喜欢', sentiment: 'positive', handledBy: 'auto', time: '09:00', storeId: 's1' },
];

export interface MarketingItem { id: string; name: string; type: string; status: string; roi: string; revenue: string; createdBy: 'auto' | 'manual'; time: string; storeId: string; }
export const mockMarketings: MarketingItem[] = [
  { id: 'm1', name: '开学季运动鞋满减', type: '满减', status: '进行中', roi: '6.8x', revenue: '¥23,400', createdBy: 'auto', time: '08-08', storeId: 's1' },
  { id: 'm2', name: '积木桌限时闪购', type: '闪购', status: '进行中', roi: '5.2x', revenue: '¥12,800', createdBy: 'auto', time: '08-09', storeId: 's1' },
  { id: 'm3', name: '露营灯优惠券', type: '优惠券', status: '待审批', roi: '4.5x', revenue: '--', createdBy: 'auto', time: '08-10', storeId: 's2' },
  { id: 'm4', name: '新品首发打折', type: '折扣', status: '已结束', roi: '3.1x', revenue: '¥8,900', createdBy: 'manual', time: '08-05', storeId: 's3' },
];

export interface InventoryItem { id: string; product: string; warehouse: string; currentStock: number; safeStock: number; status: string; suggestion: string; storeId: string; }
export const mockInventories: InventoryItem[] = [
  { id: 'i1', product: '积木学习桌', warehouse: '仓库A', currentStock: 23, safeStock: 30, status: '⚠️ 不足', suggestion: '建议调拨 20 件', storeId: 's1' },
  { id: 'i2', product: '运动跑鞋', warehouse: '仓库A', currentStock: 120, safeStock: 50, status: '✅ 充足', suggestion: '--', storeId: 's1' },
  { id: 'i3', product: '露营灯', warehouse: '仓库B', currentStock: 5, safeStock: 15, status: '🔴 告急', suggestion: '紧急补货 30 件', storeId: 's2' },
  { id: 'i4', product: '儿童书包', warehouse: '仓库A', currentStock: 0, safeStock: 20, status: '🔴 缺货', suggestion: '立即补货 40 件', storeId: 's3' },
  { id: 'i5', product: '保温杯', warehouse: '仓库B', currentStock: 45, safeStock: 25, status: '✅ 充足', suggestion: '--', storeId: 's4' },
];

export interface LiveItem { id: string; title: string; date: string; status: string; viewers: string; revenue: string; assisted: boolean; storeId: string; }
export const mockLives: LiveItem[] = [
  { id: 'l1', title: '开学季好物推荐专场', date: '08-12 18:00', status: '待开播', viewers: '--', revenue: '--', assisted: true, storeId: 's1' },
  { id: 'l2', title: '积木桌新品首发', date: '08-10 14:00', status: '回放', viewers: '3,200', revenue: '¥18,500', assisted: true, storeId: 's2' },
  { id: 'l3', title: '露营装备特卖', date: '08-08 20:00', status: '回放', viewers: '1,800', revenue: '¥12,300', assisted: false, storeId: 's3' },
];

export interface AgentLog { id: string; agentId: string; agentName: string; action: string; time: string; result: string; autonomyLevel: string; }
export const mockAgentLogs: AgentLog[] = [
  { id: 'log1', agentId: 'review_manager', agentName: '评价Agent', action: '自动回复 5★ 好评 12 条', time: '14:30', result: '成功', autonomyLevel: '全自动' },
  { id: 'log2', agentId: 'pricing_agent', agentName: '定价Agent', action: '调整"保温杯"价格 +¥5', time: '14:15', result: '成功', autonomyLevel: '全自动' },
  { id: 'log3', agentId: 'review_manager', agentName: '评价Agent', action: '检测到 1 条差评，已上报决策中心', time: '13:45', result: '待决策', autonomyLevel: '半自动' },
  { id: 'log4', agentId: 'inventory_guardian', agentName: '库存Agent', action: '仓库A"积木桌"低于安全库存，建议调拨', time: '12:30', result: '待决策', autonomyLevel: '半自动' },
  { id: 'log5', agentId: 'ad_optimizer', agentName: '广告Agent', action: '优化"运动鞋"广告出价 -10%', time: '11:00', result: '成功', autonomyLevel: '全自动' },
  { id: 'log6', agentId: 'promotion_campaign', agentName: '促销Agent', action: '竞品降价监测，建议跟价优惠券', time: '09:30', result: '待决策', autonomyLevel: '半自动' },
  { id: 'log7', agentId: 'order_processor', agentName: '订单Agent', action: '自动审单 58 笔，异常标记 2 笔', time: '全天', result: '58/60 成功', autonomyLevel: '全自动' },
  { id: 'log8', agentId: 'customer_service', agentName: '客服Agent', action: '自动回复客服咨询 42 次', time: '全天', result: '42/45 成功', autonomyLevel: '全自动' },
];

// helper: filter data array by storeId
export function filterByStore<T extends { storeId?: string }>(items: T[], storeId: string | null): T[] {
  if (!storeId) return items;
  return items.filter((item) => item.storeId === storeId);
}
