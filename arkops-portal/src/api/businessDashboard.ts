/**
 * File: businessDashboard.ts
 * Purpose: Mock business metrics API for the merchant dashboard. Generates deterministic
 * daily operating data so that time-range and store-scope filters produce honest,
 * internally consistent numbers (current vs. previous period, per-store breakdowns).
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - businessDashboardApi.getMetrics(timeRange, storeName?): range- and store-scoped metrics.
 * - DashboardMetrics / StoreOperatingMetric / DashboardTimeRange types.
 *
 * Major updates:
 * - 2026-07-22 (WS-C): rewrote as deterministic period-scoped generator; removed hardcoded
 *   per-store order map; added per-store operating metrics and comparison labels (C3).
 */
import { mockDelay } from './client';
import type { BusinessMetrics } from '../types/domain';

export type DashboardTimeRange = 'today' | '7d' | '30d';

/** Per-store operating metrics for the dashboard store comparison table. */
export interface StoreOperatingMetric {
  storeName: string;
  platform: string;
  gmv: number;
  orders: number;
  roas: number;
  pendingNegativeReviews: number;
}

/** Range-scoped metrics returned to the dashboard on top of the legacy shape. */
export interface DashboardMetrics extends BusinessMetrics {
  range: DashboardTimeRange;
  /** i18n key describing the comparison basis of period deltas. */
  comparisonLabelKey: string;
  periodGmv: { current: number; previous: number };
  periodOrders: { current: number; previous: number };
  storeMetrics: StoreOperatingMetric[];
}

const AOV = 69.5;

/** Static per-store profile: GMV share and quality signals. */
const STORE_PROFILES = [
  { storeName: '拼多多旗舰店', platform: '拼多多', share: 0.545, roas: 8.2, pendingNegativeReviews: 1 },
  { storeName: '淘宝户外用品店', platform: '淘宝', share: 0.305, roas: 5.8, pendingNegativeReviews: 1 },
  { storeName: '京东自营店', platform: '京东', share: 0.15, roas: 6.3, pendingNegativeReviews: 0 },
];

function recentDay(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Deterministic daily GMV: a gentle upward trend plus weekly seasonality,
 * so any two consecutive periods produce sensible comparisons.
 */
function dailyGmv(daysAgo: number): number {
  const trend = 28640 - daysAgo * 180;
  const seasonal = Math.sin((daysAgo % 7) * (Math.PI / 3.5)) * 1400;
  return Math.max(9000, Math.round(trend + seasonal));
}

function dailyOrders(daysAgo: number): number {
  return Math.round(dailyGmv(daysAgo) / AOV);
}

function sumRange(from: number, to: number, fn: (d: number) => number): number {
  let total = 0;
  for (let d = from; d <= to; d += 1) total += fn(d);
  return total;
}

const RANGE_DAYS: Record<DashboardTimeRange, number> = { today: 1, '7d': 7, '30d': 30 };

const COMPARISON_KEY: Record<DashboardTimeRange, string> = {
  today: 'dashboardv2.vsYesterday',
  '7d': 'dashboardv2.vsPrev7d',
  '30d': 'dashboardv2.vsPrev30d',
};

/** Builds the trend series: daily points for short ranges, ~4-5 day buckets for 30d (7 columns max). */
function buildTrend(range: DashboardTimeRange, share: number) {
  if (range === '30d') {
    const bucketCount = 7;
    const days = 30;
    const points: { date: string; gmv: number; orders: number }[] = [];
    for (let b = bucketCount - 1; b >= 0; b -= 1) {
      const start = Math.round(((b + 1) * days) / bucketCount) - 1;
      const end = Math.round((b * days) / bucketCount);
      points.push({
        date: recentDay(start),
        gmv: Math.round(sumRange(end, start, dailyGmv) * share),
        orders: Math.round(sumRange(end, start, dailyOrders) * share),
      });
    }
    return points;
  }
  const points: { date: string; gmv: number; orders: number }[] = [];
  for (let d = 6; d >= 0; d -= 1) {
    points.push({
      date: recentDay(d),
      gmv: Math.round(dailyGmv(d) * share),
      orders: Math.round(dailyOrders(d) * share),
    });
  }
  return points;
}

export const businessDashboardApi = {
  /**
   * Returns dashboard metrics scoped to a time range and (optionally) one store.
   *
   * @param timeRange - 'today' | '7d' | '30d'; deltas compare against the previous period of equal length.
   * @param storeName - Optional store scope; omitted/'all' means every store.
   */
  getMetrics: (timeRange: DashboardTimeRange = 'today', storeName?: string): Promise<DashboardMetrics> => {
    const days = RANGE_DAYS[timeRange] ?? 1;
    const profile = STORE_PROFILES.find((p) => p.storeName === storeName);
    const share = profile?.share ?? 1;
    const scopedProfiles = profile ? [profile] : STORE_PROFILES;

    const currentGmv = Math.round(sumRange(0, days - 1, dailyGmv) * share);
    const previousGmv = Math.round(sumRange(days, days * 2 - 1, dailyGmv) * share);
    const currentOrders = Math.round(sumRange(0, days - 1, dailyOrders) * share);
    const previousOrders = Math.round(sumRange(days, days * 2 - 1, dailyOrders) * share);

    const storeMetrics: StoreOperatingMetric[] = scopedProfiles.map((p) => ({
      storeName: p.storeName,
      platform: p.platform,
      gmv: Math.round(sumRange(0, days - 1, dailyGmv) * p.share),
      orders: Math.round(sumRange(0, days - 1, dailyOrders) * p.share),
      roas: p.roas,
      pendingNegativeReviews: p.pendingNegativeReviews,
    }));

    return mockDelay({
      range: timeRange,
      comparisonLabelKey: COMPARISON_KEY[timeRange] ?? COMPARISON_KEY.today,
      periodGmv: { current: currentGmv, previous: previousGmv },
      periodOrders: { current: currentOrders, previous: previousOrders },
      storeMetrics,
      gmv: { today: Math.round(dailyGmv(0) * share), yesterday: Math.round(dailyGmv(1) * share), lastWeekSameDay: Math.round(dailyGmv(7) * share) },
      orders: { today: Math.round(dailyOrders(0) * share), yesterday: Math.round(dailyOrders(1) * share), lastWeekSameDay: Math.round(dailyOrders(7) * share) },
      aov: AOV,
      storeCount: { online: 3, total: 3 },
      gmvTrend: buildTrend(timeRange, share),
      storeGmvRank: storeMetrics.map((s) => ({ storeName: s.storeName, gmv: s.gmv, platform: s.platform })),
      adMetrics: {
        todaySpend: Math.round(3840 * share),
        roas: profile?.roas ?? 7.46,
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
    });
  }
};
