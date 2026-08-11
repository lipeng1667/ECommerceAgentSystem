/**
 * Promotion Campaign Mock API (V1.1)
 */
import { mockDelay } from './client';
import type { AllMallId, PromotionCampaign, PromotionStats, PromotionType } from '../types/domain';

const now = Date.now();
const d = (days: number) => new Date(now + days * 86400000);
const iso = (days: number) => d(days).toISOString();

const campaigns: PromotionCampaign[] = [
  { id: 50001, storeId: 1001, name: '夏季清仓 — 冰丝衬衫5折', type: 'flash_sale', productIds: [4002], discount: 50, budget: 3000, spent: 1850, revenue: 12500, roi: 6.76, status: 'active', startDate: iso(-5), endDate: iso(2), autoCreated: true, createdAt: iso(-7) },
  { id: 50002, storeId: 1001, name: '新品首发 — 托特包立减30元', type: 'full_reduction', productIds: [4001], discount: 20, budget: 5000, spent: 420, revenue: 2800, roi: 6.67, status: 'active', startDate: iso(-3), endDate: iso(4), autoCreated: false, createdAt: iso(-5) },
  { id: 50003, storeId: 1002, name: '儿童节特惠 — 积木桌套装8折', type: 'coupon', productIds: [4004], discount: 20, budget: 2000, spent: 960, revenue: 6800, roi: 7.08, status: 'active', startDate: iso(-8), endDate: iso(-1), autoCreated: false, createdAt: iso(-10) },
  { id: 50004, storeId: 1002, name: '户外季 — 露营灯买二送一', type: 'bundle', productIds: [4005], discount: 33, budget: 1500, spent: 0, revenue: 0, roi: 0, status: 'scheduled', startDate: iso(2), endDate: iso(9), autoCreated: true, createdAt: iso(-1) },
  { id: 50005, storeId: 1003, name: '限时秒杀 — 运动鞋3折', type: 'seckill', productIds: [4006], discount: 70, budget: 4000, spent: 3100, revenue: 15000, roi: 4.84, status: 'active', startDate: iso(-2), endDate: iso(1), autoCreated: true, createdAt: iso(-4) },
  { id: 50006, storeId: 1003, name: '周末闪购 — 品牌鞋满200减50', type: 'full_reduction', productIds: [4006], discount: 25, budget: 2500, spent: 0, revenue: 0, roi: 0, status: 'scheduled', startDate: iso(5), endDate: iso(7), autoCreated: false, createdAt: iso(-2) },
  { id: 50007, storeId: 1001, name: '618大促 — 全店满300减50', type: 'coupon', productIds: [4001, 4002], discount: 17, budget: 8000, spent: 6800, revenue: 42000, roi: 6.18, status: 'ended', startDate: iso(-30), endDate: iso(-10), autoCreated: false, createdAt: iso(-35) },
  { id: 50008, storeId: 1002, name: '换季清仓 — 库存商品4折起', type: 'flash_sale', productIds: [4004], discount: 60, budget: 1000, spent: 920, revenue: 3500, roi: 3.80, status: 'ended', startDate: iso(-20), endDate: iso(-12), autoCreated: true, createdAt: iso(-22) },
  { id: 50009, storeId: 1003, name: '双11预售 — 定金膨胀3倍', type: 'seckill', productIds: [4005], discount: 50, budget: 6000, spent: 0, revenue: 0, roi: 0, status: 'scheduled', startDate: iso(12), endDate: iso(18), autoCreated: false, createdAt: iso(-5) },
  { id: 50010, storeId: 1001, name: '开学季 — 搭配套餐满减', type: 'bundle', productIds: [4001, 4002], discount: 15, budget: 3000, spent: 1200, revenue: 8900, roi: 7.42, status: 'active', startDate: iso(-10), endDate: iso(5), autoCreated: false, createdAt: iso(-12) },
];

export const promotionsApi = {
  list: (filters?: { storeId?: AllMallId; status?: string; type?: string; search?: string }) => {
    let result = [...campaigns];
    if (filters?.storeId) result = result.filter((c) => c.storeId === filters.storeId);
    if (filters?.status) result = result.filter((c) => c.status === filters.status);
    if (filters?.type) result = result.filter((c) => c.type === filters.type);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.type.includes(q));
    }
    result.sort((a, b) => {
      const priority: Record<string, number> = { active: 0, scheduled: 1, ended: 2 };
      if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    return mockDelay(result);
  },

  getStats: () => {
    const active = campaigns.filter((c) => c.status === 'active').length;
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
    const ended = campaigns.filter((c) => c.status === 'ended').length;
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const totalRoi = campaigns.filter((c) => c.roi > 0).length > 0
      ? +(campaigns.filter((c) => c.roi > 0).reduce((s, c) => s + c.revenue, 0) /
          campaigns.filter((c) => c.roi > 0).reduce((s, c) => s + c.spent, 0)).toFixed(2)
      : 0;
    return mockDelay({ active, scheduled, ended, totalRevenue, totalRoi } as PromotionStats);
  },

  create: async (data: Omit<PromotionCampaign, 'id' | 'spent' | 'revenue' | 'roi' | 'createdAt'>): Promise<PromotionCampaign> => {
    await mockDelay(null);
    const existingIds = campaigns.map((c) => c.id);
    const campaign: PromotionCampaign = {
      ...data,
      id: (Math.max(...existingIds) + 1) as AllMallId,
      spent: 0,
      revenue: 0,
      roi: 0,
      createdAt: new Date().toISOString(),
    };
    campaigns.push(campaign);
    return campaign;
  },
};
