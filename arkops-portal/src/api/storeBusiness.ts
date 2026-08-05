import { mockDelay } from './client';
import type { AllMallId, StoreBusinessDetail } from '../types/domain';

const details: Record<AllMallId, StoreBusinessDetail> = {
  1001: {
    storeId: 1001,
    storeName: '拼多多旗舰店',
    gmv: {
      today: 15620, yesterday: 14800,
      trend: [
        { date: '6/9', value: 12800 }, { date: '6/10', value: 13500 }, { date: '6/11', value: 14200 },
        { date: '6/12', value: 13900 }, { date: '6/13', value: 15100 }, { date: '6/14', value: 14800 }, { date: '6/15', value: 15620 }
      ]
    },
    orders: {
      today: 224, yesterday: 212,
      trend: [
        { date: '6/9', value: 185 }, { date: '6/10', value: 195 }, { date: '6/11', value: 205 },
        { date: '6/12', value: 198 }, { date: '6/13', value: 218 }, { date: '6/14', value: 212 }, { date: '6/15', value: 224 }
      ]
    },
    aov: 69.7,
    adMetrics: {
      todaySpend: 2240, roas: 6.97, cpm: 11.8, cpc: 0.78, ctr: 3.5, cvr: 5.2, budgetLimit: 3000,
      trend: [
        { date: '6/9', spend: 1800, gmv: 11700 }, { date: '6/10', spend: 2000, gmv: 13500 },
        { date: '6/11', spend: 2100, gmv: 14910 }, { date: '6/12', spend: 1950, gmv: 13650 },
        { date: '6/13', spend: 2200, gmv: 15840 }, { date: '6/14', spend: 2150, gmv: 14800 }, { date: '6/15', spend: 2240, gmv: 15620 }
      ],
      campaigns: [
        { name: '拼多多 爆款视频-1', spend: 890, roi: 8.2, status: 'active' },
        { name: '拼多多 直播推广-A', spend: 620, roi: 6.5, status: 'active' },
        { name: '广告计划 C-102', spend: 450, roi: 2.8, status: 'warning' },
        { name: '广告计划 B-045', spend: 280, roi: 1.8, status: 'paused' }
      ]
    },
    afterSales: { returnRate: 2.8, returnAmount: 437, negativeReviews: 2, unresolvedReviews: 1, storeRating: 4.7, disputes: { pending: 1, processing: 0 } },
    inventory: {
      totalSkus: 520, lowStockCount: 8, slowMovingCount: 45, outOfStockCount: 3,
      lowStockItems: [
        { sku: 'PDD-00128', name: '夏季户外帐篷', stock: 5, safetyStock: 20 },
        { sku: 'PDD-00342', name: '露营折叠椅', stock: 3, safetyStock: 15 },
        { sku: 'PDD-00195', name: '防晒运动帽', stock: 8, safetyStock: 25 }
      ]
    },
    topProducts: [
      { name: '夏季户外帐篷 3-4人', gmv: 3200, orders: 38, sku: 'PDD-00128' },
      { name: '便携露营灯 LED', gmv: 2450, orders: 86, sku: 'PDD-00567' },
      { name: '防晒速干T恤', gmv: 1980, orders: 52, sku: 'PDD-00234' },
      { name: '折叠水壶 1L', gmv: 1560, orders: 44, sku: 'PDD-00891' },
      { name: '户外防潮垫', gmv: 1320, orders: 35, sku: 'PDD-00456' }
    ],
    aiActivity: { priceAdjustments: 12, csReplies: 34, riskIntercepts: 2, hoursSaved: 3.2 }
  },
  1002: {
    storeId: 1002,
    storeName: '淘宝户外用品店',
    gmv: {
      today: 8740, yesterday: 8200,
      trend: [
        { date: '6/9', value: 7200 }, { date: '6/10', value: 7600 }, { date: '6/11', value: 7900 },
        { date: '6/12', value: 7700 }, { date: '6/13', value: 8400 }, { date: '6/14', value: 8200 }, { date: '6/15', value: 8740 }
      ]
    },
    orders: {
      today: 118, yesterday: 110,
      trend: [
        { date: '6/9', value: 95 }, { date: '6/10', value: 102 }, { date: '6/11', value: 108 },
        { date: '6/12', value: 105 }, { date: '6/13', value: 115 }, { date: '6/14', value: 110 }, { date: '6/15', value: 118 }
      ]
    },
    aov: 74.1,
    adMetrics: {
      todaySpend: 1080, roas: 8.09, cpm: 13.2, cpc: 0.92, ctr: 2.8, cvr: 4.5, budgetLimit: 1500,
      trend: [
        { date: '6/9', spend: 900, gmv: 6885 }, { date: '6/10', spend: 950, gmv: 7600 },
        { date: '6/11', spend: 1000, gmv: 8100 }, { date: '6/12', spend: 980, gmv: 7640 },
        { date: '6/13', spend: 1050, gmv: 8820 }, { date: '6/14', spend: 1020, gmv: 8200 }, { date: '6/15', spend: 1080, gmv: 8740 }
      ],
      campaigns: [
        { name: '淘宝 自动广告-Hike', spend: 380, roi: 9.2, status: 'active' },
        { name: '淘宝 手动精准', spend: 420, roi: 7.8, status: 'active' },
        { name: '广告计划 A-017', spend: 280, roi: 4.5, status: 'warning' }
      ]
    },
    afterSales: { returnRate: 3.8, returnAmount: 332, negativeReviews: 3, unresolvedReviews: 2, storeRating: 4.3, disputes: { pending: 1, processing: 1 } },
    inventory: {
      totalSkus: 420, lowStockCount: 10, slowMovingCount: 68, outOfStockCount: 4,
      lowStockItems: [
        { sku: 'TB-00215', name: '登山杖碳纤维', stock: 4, safetyStock: 20 },
        { sku: 'TB-00378', name: '防水冲锋衣', stock: 6, safetyStock: 25 }
      ]
    },
    topProducts: [
      { name: '登山杖碳纤维 2支装', gmv: 1850, orders: 28, sku: 'TB-00215' },
      { name: '防水冲锋衣 男款', gmv: 1600, orders: 18, sku: 'TB-00378' },
      { name: '户外头灯 USB充电', gmv: 1280, orders: 45, sku: 'TB-00123' },
      { name: '急救包 户外便携', gmv: 920, orders: 32, sku: 'TB-00456' },
      { name: '多功能工兵铲', gmv: 780, orders: 15, sku: 'TB-00789' }
    ],
    aiActivity: { priceAdjustments: 8, csReplies: 21, riskIntercepts: 1, hoursSaved: 2.1 }
  },
  1003: {
    storeId: 1003,
    storeName: '京东自营店',
    gmv: {
      today: 4280, yesterday: 4100,
      trend: [
        { date: '6/9', value: 3500 }, { date: '6/10', value: 3800 }, { date: '6/11', value: 4000 },
        { date: '6/12', value: 3900 }, { date: '6/13', value: 4200 }, { date: '6/14', value: 4100 }, { date: '6/15', value: 4280 }
      ]
    },
    orders: {
      today: 70, yesterday: 66,
      trend: [
        { date: '6/9', value: 62 }, { date: '6/10', value: 65 }, { date: '6/11', value: 68 },
        { date: '6/12', value: 64 }, { date: '6/13', value: 69 }, { date: '6/14', value: 66 }, { date: '6/15', value: 70 }
      ]
    },
    aov: 61.1,
    adMetrics: {
      todaySpend: 520, roas: 8.23, cpm: 10.5, cpc: 0.65, ctr: 4.1, cvr: 5.8, budgetLimit: 800,
      trend: [
        { date: '6/9', spend: 400, gmv: 3080 }, { date: '6/10', spend: 450, gmv: 3600 },
        { date: '6/11', spend: 480, gmv: 3936 }, { date: '6/12', spend: 470, gmv: 3800 },
        { date: '6/13', spend: 500, gmv: 4200 }, { date: '6/14', spend: 510, gmv: 4100 }, { date: '6/15', spend: 520, gmv: 4280 }
      ],
      campaigns: [
        { name: '京准通搜索广告', spend: 200, roi: 10.5, status: 'active' },
        { name: '京东快车再营销', spend: 180, roi: 7.2, status: 'active' },
        { name: '京东内容种草', spend: 140, roi: 5.8, status: 'active' }
      ]
    },
    afterSales: { returnRate: 2.5, returnAmount: 107, negativeReviews: 0, unresolvedReviews: 0, storeRating: 5.0, disputes: { pending: 0, processing: 0 } },
    inventory: {
      totalSkus: 340, lowStockCount: 5, slowMovingCount: 43, outOfStockCount: 1,
      lowStockItems: [
        { sku: 'JD-00045', name: '手工陶瓷杯', stock: 3, safetyStock: 10 }
      ]
    },
    topProducts: [
      { name: '手工陶瓷杯 套装', gmv: 980, orders: 22, sku: 'JD-00045' },
      { name: '有机棉T恤', gmv: 860, orders: 28, sku: 'JD-00012' },
      { name: '竹制厨房用具套', gmv: 720, orders: 18, sku: 'JD-00078' },
      { name: '帆布袋 环保款', gmv: 580, orders: 25, sku: 'JD-00033' },
      { name: '大豆蜡烛 香薰', gmv: 450, orders: 20, sku: 'JD-00056' }
    ],
    aiActivity: { priceAdjustments: 0, csReplies: 0, riskIntercepts: 0, hoursSaved: 0 }
  }
};

export const storeBusinessApi = {
  /** All known store business records, used to key list-page metrics by store id (item 3). */
  list: (): Promise<StoreBusinessDetail[]> => mockDelay(Object.values(details)),

  getDetail: (storeId: AllMallId): Promise<StoreBusinessDetail | undefined> =>
    mockDelay(details[storeId] ?? {
      storeId,
      storeName: '未知店铺',
      gmv: { today: 0, yesterday: 0, trend: [] },
      orders: { today: 0, yesterday: 0, trend: [] },
      aov: 0,
      adMetrics: { todaySpend: 0, roas: 0, cpm: 0, cpc: 0, ctr: 0, cvr: 0, budgetLimit: 0, trend: [], campaigns: [] },
      afterSales: { returnRate: 0, returnAmount: 0, negativeReviews: 0, unresolvedReviews: 0, storeRating: 0, disputes: { pending: 0, processing: 0 } },
      inventory: { totalSkus: 0, lowStockCount: 0, slowMovingCount: 0, outOfStockCount: 0, lowStockItems: [] },
      topProducts: [],
      aiActivity: { priceAdjustments: 0, csReplies: 0, riskIntercepts: 0, hoursSaved: 0 }
    })
};
