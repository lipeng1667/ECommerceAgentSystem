import dayjs from 'dayjs';
import type { Order } from '../types/domain';

// Anchor timestamps to the real clock so "today" actually means today
// and shipping deadlines are dynamic.
const now = dayjs();

/** Platform SLA in hours (A1 assumption). */
const PLATFORM_SLA_HOURS: Record<string, number> = {
  pinduoduo: 48,
  taobao: 48,
  jd: 24,
};

function shipDeadline(paidAt: dayjs.Dayjs, platform: string): string {
  const hours = PLATFORM_SLA_HOURS[platform] ?? 48;
  return paidAt.add(hours, 'hour').toISOString();
}

export const orders: Order[] = [
  {
    id: 70001,
    orderNo: '#ORD-2406-0820',
    storeId: 1001,
    buyerName: '李女士',
    items: '蓝牙耳机 Pro ×1',
    amount: 39.99,
    status: 'auto_completed',
    trackingNo: '1Z999AA1234567890',
    logisticsStatus: '已签收',
    agentAction: '签收确认 → 自动完结 → 触发好评邀请',
    createdAt: now.subtract(1, 'day').toISOString(),
    paidAt: now.subtract(1, 'day').subtract(2, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(1, 'day').subtract(2, 'hour'), 'pinduoduo'),
    timeline: [
      { title: '付款确认', at: now.subtract(1, 'day').subtract(2, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '风控通过', at: now.subtract(1, 'day').subtract(2, 'hour').toISOString(), icon: 'shield', automated: true },
      { title: '自动发货', at: now.subtract(1, 'day').subtract(1, 'hour').toISOString(), icon: 'truck', automated: true },
      { title: '物流签收', at: now.subtract(3, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '自动完结', at: now.subtract(2.5, 'hour').toISOString(), icon: 'check', automated: true },
    ],
  },
  {
    id: 70002,
    orderNo: '#ORD-2406-0821',
    storeId: 1002,
    buyerName: '张先生',
    items: '折叠露营椅 ×2, LED 露营灯 ×1',
    amount: 115.97,
    status: 'auto_shipped',
    trackingNo: '1Z999AA0987654321',
    logisticsStatus: '运输中 · 预计明天送达',
    agentAction: '智能分仓 → 华东仓发货 → 已创建运单',
    createdAt: now.subtract(6, 'hour').toISOString(),
    paidAt: now.subtract(6, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(6, 'hour'), 'taobao'),
    timeline: [
      { title: '付款确认', at: now.subtract(6, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '风控通过', at: now.subtract(6, 'hour').toISOString(), icon: 'shield', automated: true },
      { title: '智能分仓 华东仓', at: now.subtract(5.75, 'hour').toISOString(), icon: 'sync', automated: true },
      { title: '创建运单', at: now.subtract(5.5, 'hour').toISOString(), icon: 'truck', automated: true },
      { title: '预计送达', at: now.add(2, 'day').toISOString(), icon: 'truck', estimated: now.add(2, 'day').format('YYYY-MM-DD 18:00') },
    ],
  },
  {
    id: 70003,
    orderNo: '#ORD-2406-0822',
    storeId: 1003,
    buyerName: '陈女士',
    items: '定制手机壳 ×3',
    amount: 38.97,
    status: 'awaiting_shipment',
    logisticsStatus: '待发货',
    agentAction: '付款确认，库存分配完成，等待创建运单发货',
    createdAt: now.subtract(4, 'hour').toISOString(),
    paidAt: now.subtract(4, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(4, 'hour'), 'jd'),
    timeline: [
      { title: '付款确认', at: now.subtract(4, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '风控通过', at: now.subtract(4, 'hour').toISOString(), icon: 'shield', automated: true },
      { title: '库存分配完成', at: now.subtract(3.92, 'hour').toISOString(), icon: 'sync', automated: true },
      { title: '待发货', at: now.hour(18).minute(0).toISOString(), icon: 'truck', estimated: now.format('YYYY-MM-DD 18:00') },
    ],
  },
  {
    id: 70004,
    orderNo: '#ORD-2406-0823',
    storeId: 1001,
    buyerName: '王先生',
    items: '65W GaN 充电器 ×2',
    amount: 39.98,
    status: 'exception',
    exceptionType: 'address_invalid',
    exceptionReason: '收货地址缺少门牌号，物流商暂无法配送。\n建议联系买家补充完整地址或取消订单。',
    agentAction: '自动拦截 → 推送到异常列表待运营处理',
    createdAt: now.subtract(3, 'hour').toISOString(),
    paidAt: now.subtract(3, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(3, 'hour'), 'pinduoduo'),
    timeline: [
      { title: '付款确认', at: now.subtract(3, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '地址校验失败', at: now.subtract(3, 'hour').toISOString(), icon: 'warning' },
      { title: '自动拦截', at: now.subtract(2.92, 'hour').toISOString(), icon: 'stop', automated: true },
    ],
    recommendation: {
      action: 'apply_address_fix',
      label: '用历史地址补全并发货',
      rationale: '已比对该买家 3 笔历史订单，最近一笔收货地址为完整地址（含门牌号）',
      confidence: 0.85,
      batchable: true,
    },
  },
  {
    id: 70005,
    orderNo: '#ORD-2406-0824',
    storeId: 1002,
    buyerName: '匿名买家',
    items: '户外登山包 40L ×3',
    amount: 137.97,
    status: 'fraud_blocked',
    exceptionType: 'fraud_suspected',
    exceptionReason: '高风险标记（3/5 规则命中）:\n• 新注册账号（注册不足 7 天）\n• 支付账号实名信息与收货人不一致\n• 单笔购买 3 件高单价商品',
    agentAction: '风控命中多项规则 → 自动阻断 → 等待人工审核',
    createdAt: now.subtract(5, 'hour').toISOString(),
    paidAt: now.subtract(5, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(5, 'hour'), 'taobao'),
    timeline: [
      { title: '付款确认', at: now.subtract(5, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '风控命中 3/5 规则', at: now.subtract(5, 'hour').toISOString(), icon: 'warning' },
      { title: '自动阻断', at: now.subtract(4.92, 'hour').toISOString(), icon: 'stop', automated: true },
    ],
    recommendation: {
      action: 'release',
      label: '审核并放行',
      rationale: '同类订单近 30 天放行 12 单，事后 0 纠纷。风险分 0.42（中等偏低）',
      confidence: 0.65,
      batchable: false, // A3: fraud never batchable
    },
  },
  {
    id: 70006,
    orderNo: '#ORD-2406-0825',
    storeId: 1001,
    buyerName: '刘先生',
    items: '运动挂脖耳机 ×1',
    amount: 24.99,
    status: 'cancelled',
    logisticsStatus: '—',
    agentAction: '买家主动取消（付款后 5 分钟内）→ 自动退款已发起',
    createdAt: now.subtract(2, 'hour').toISOString(),
    paidAt: now.subtract(2, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(2, 'hour'), 'pinduoduo'),
    timeline: [
      { title: '付款确认', at: now.subtract(2, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '买家取消订单', at: now.subtract(1.92, 'hour').toISOString(), icon: 'close' },
      { title: '自动退款', at: now.subtract(1.83, 'hour').toISOString(), icon: 'check', automated: true },
    ],
  },
  {
    id: 70007,
    orderNo: '#ORD-2406-0826',
    storeId: 1003,
    buyerName: '赵女士',
    items: 'LED 露营灯 ×2',
    amount: 31.98,
    status: 'auto_processing',
    logisticsStatus: '处理中',
    agentAction: '付款确认 → 风控校验中 → 智能分仓计算中',
    createdAt: now.subtract(1, 'hour').toISOString(),
    paidAt: now.subtract(1, 'hour').toISOString(),
    shipDeadlineAt: shipDeadline(now.subtract(1, 'hour'), 'jd'),
    timeline: [
      { title: '付款确认', at: now.subtract(1, 'hour').toISOString(), icon: 'check', automated: true },
      { title: '风控校验中', at: now.subtract(1, 'hour').toISOString(), icon: 'sync', automated: true },
    ],
  },
];