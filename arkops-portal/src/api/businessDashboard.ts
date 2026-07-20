import { mockDelay } from './client';
import type { BusinessMetrics } from '../types/domain';

function recentDay(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export const businessDashboardApi = {
  getMetrics: (_timeRange?: string): Promise<BusinessMetrics> =>
    mockDelay({
      gmv: { today: 28640, yesterday: 27350, lastWeekSameDay: 24900 },
      orders: { today: 412, yesterday: 388, lastWeekSameDay: 356 },
      aov: 69.5,
      storeCount: { online: 3, total: 3 },
      gmvTrend: [
        { date: recentDay(6), gmv: 23500, orders: 342 },
        { date: recentDay(5), gmv: 24900, orders: 356 },
        { date: recentDay(4), gmv: 26100, orders: 370 },
        { date: recentDay(3), gmv: 25800, orders: 365 },
        { date: recentDay(2), gmv: 27900, orders: 398 },
        { date: recentDay(1), gmv: 27350, orders: 388 },
        { date: recentDay(0), gmv: 28640, orders: 412 }
      ],
      storeGmvRank: [
        { storeName: '拼多多旗舰店', gmv: 15620, platform: '拼多多' },
        { storeName: '淘宝户外用品店', gmv: 8740, platform: '淘宝' },
        { storeName: '京东自营店', gmv: 4280, platform: '京东' }
      ],
      adMetrics: {
        todaySpend: 3840,
        roas: 7.46,
        cpm: 12.4,
        cpc: 0.82,
        ctr: 3.2,
        cvr: 4.8,
        budgetLimit: 5000,
        targetRoas: 5.0,
        trend: [
          { date: recentDay(6), spend: 3200, gmv: 21120 },
          { date: recentDay(5), spend: 3580, gmv: 24900 },
          { date: recentDay(4), spend: 3700, gmv: 27520 },
          { date: recentDay(3), spend: 3450, gmv: 25360 },
          { date: recentDay(2), spend: 3900, gmv: 29250 },
          { date: recentDay(1), spend: 3750, gmv: 27350 },
          { date: recentDay(0), spend: 3840, gmv: 28640 }
        ],
        lowPerformingPlans: [
          { name: '广告计划 C-102', spend: 612, roi: 1.42 },
          { name: '广告计划 B-045', spend: 428, roi: 2.18 },
          { name: '广告计划 A-017', spend: 356, roi: 2.85 }
        ]
      },
      afterSales: {
        returnRate: 3.2,
        returnAmount: 916,
        negativeReviews: 5,
        respondedReviews: 3,
        reviewResponseRate: 60,
        storeRating: 4.5,
        disputes: { pending: 2, processing: 1 },
        avgResponseMinutes: 120,
        reviewTrend: [
          { date: recentDay(6), returnRate: 2.9, negativeCount: 4 },
          { date: recentDay(5), returnRate: 3.1, negativeCount: 6 },
          { date: recentDay(4), returnRate: 2.8, negativeCount: 3 },
          { date: recentDay(3), returnRate: 3.5, negativeCount: 7 },
          { date: recentDay(2), returnRate: 3.3, negativeCount: 5 },
          { date: recentDay(1), returnRate: 3.0, negativeCount: 4 },
          { date: recentDay(0), returnRate: 3.2, negativeCount: 5 }
        ]
      },
      inventory: {
        totalSkus: 1280,
        lowStockCount: 23,
        slowMovingCount: 156,
        outOfStockCount: 8
      }
    })
};
