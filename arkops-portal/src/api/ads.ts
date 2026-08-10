/**
 * Ad Campaign Mock API (V1.1)
 */
import { mockDelay } from './client';
import type { AdCampaign, AdCreative, AllMallId } from '../types/domain';

const campaigns: AdCampaign[] = [
  { id: 6001, name: '托特包 — 千川短视频投放', platform: 'douyin', storeId: 1001, productIds: [4001], budget: 5000, spent: 3200, impressions: 180000, clicks: 5400, ctr: 3.0, cpc: 0.59, conversions: 210, revenue: 12400, roi: 3.88, status: 'active', startDate: '2026-08-01', endDate: '2026-08-14', autoOptimized: true },
  { id: 6002, name: '冰丝衬衫 — 多多搜索推广', platform: 'pinduoduo', storeId: 1002, productIds: [4002], budget: 3000, spent: 2800, impressions: 150000, clicks: 4200, ctr: 2.8, cpc: 0.67, conversions: 160, revenue: 8900, roi: 3.18, status: 'active', startDate: '2026-08-03', endDate: '2026-08-17', autoOptimized: false },
  { id: 6003, name: '积木桌 — 京东快车推广', platform: 'jd', storeId: 1003, productIds: [4004], budget: 4000, spent: 1800, impressions: 80000, clicks: 1800, ctr: 2.25, cpc: 1.0, conversions: 72, revenue: 5200, roi: 2.89, status: 'active', startDate: '2026-08-05', endDate: '2026-08-19', autoOptimized: true },
  { id: 6004, name: '露营灯 — 抖音直播引流', platform: 'douyin', storeId: 1001, productIds: [4005], budget: 8000, spent: 6200, impressions: 320000, clicks: 11200, ctr: 3.5, cpc: 0.55, conversions: 380, revenue: 22000, roi: 3.55, status: 'active', startDate: '2026-07-28', endDate: '2026-08-11', autoOptimized: false },
  { id: 6005, name: '运动鞋 — 淘宝直通车', platform: 'taobao', storeId: 1002, productIds: [4006], budget: 6000, spent: 3500, impressions: 210000, clicks: 6300, ctr: 3.0, cpc: 0.56, conversions: 240, revenue: 15000, roi: 4.29, status: 'active', startDate: '2026-08-02', endDate: '2026-08-16', autoOptimized: true },
  { id: 6006, name: '618 托特包大促投放', platform: 'douyin', storeId: 1001, productIds: [4001], budget: 12000, spent: 12000, impressions: 500000, clicks: 18000, ctr: 3.6, cpc: 0.67, conversions: 650, revenue: 42000, roi: 3.50, status: 'ended', startDate: '2026-06-01', endDate: '2026-06-18', autoOptimized: false },
  { id: 6007, name: '开学季 — 文具套装预热', platform: 'pinduoduo', storeId: 1003, productIds: [4004, 4005], budget: 3000, spent: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, revenue: 0, roi: 0, status: 'paused', startDate: '2026-08-15', endDate: '2026-08-30', autoOptimized: false },
];

const creatives: AdCreative[] = [
  { id: 6101, campaignId: 6001, type: 'video', title: '真皮托特包 — 通勤穿搭展示', url: 'https://example.com/creatives/c6101.mp4', status: 'approved', performance: { impressions: 120000, clicks: 3600, ctr: 3.0 } },
  { id: 6102, campaignId: 6001, type: 'image', title: '托特包 — 三色对比图', url: 'https://example.com/creatives/c6102.jpg', status: 'approved', performance: { impressions: 60000, clicks: 1800, ctr: 3.0 } },
  { id: 6103, campaignId: 6002, type: 'carousel', title: '冰丝衬衫 — 多场景穿搭', url: 'https://example.com/creatives/c6103.jpg', status: 'approved', performance: { impressions: 150000, clicks: 4200, ctr: 2.8 } },
  { id: 6104, campaignId: 6004, type: 'video', title: '露营灯 — 户外实测展示', url: 'https://example.com/creatives/c6104.mp4', status: 'approved', performance: { impressions: 280000, clicks: 9800, ctr: 3.5 } },
  { id: 6105, campaignId: 6004, type: 'image', title: '露营灯 — 亮度对比', url: 'https://example.com/creatives/c6105.jpg', status: 'pending', performance: { impressions: 0, clicks: 0, ctr: 0 } },
  { id: 6106, campaignId: 6005, type: 'video', title: '运动鞋 — 跑姿分析', url: 'https://example.com/creatives/c6106.mp4', status: 'approved', performance: { impressions: 180000, clicks: 5400, ctr: 3.0 } },
];

const dailyTrend = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 7, 1 + i).toISOString(),
  spend: 300 + Math.random() * 200,
  revenue: 800 + Math.random() * 800,
}));

export const adsApi = {
  list: (filters?: { storeId?: AllMallId; status?: string; platform?: string }) => {
    let result = [...campaigns];
    if (filters?.storeId) result = result.filter((c) => c.storeId === filters.storeId);
    if (filters?.status) result = result.filter((c) => c.status === filters.status);
    if (filters?.platform) result = result.filter((c) => c.platform === filters.platform);
    result.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.spent - a.spent;
    });
    return mockDelay(result);
  },
  getCreatives: (campaignId: AllMallId) =>
    mockDelay(creatives.filter((c) => c.campaignId === campaignId)),
  getTrend: () => mockDelay(dailyTrend),
  getOverview: () => {
    const active = campaigns.filter((c) => c.status === 'active');
    const totalSpend = active.reduce((s, c) => s + c.spent, 0);
    const totalRevenue = active.reduce((s, c) => s + c.revenue, 0);
    const totalImpressions = active.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = active.reduce((s, c) => s + c.clicks, 0);
    const avgCtr = totalImpressions > 0 ? +(totalClicks / totalImpressions * 100).toFixed(1) : 0;
    const avgRoi = totalSpend > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0;
    return mockDelay({ active: active.length, totalSpend, totalRevenue, totalImpressions, totalClicks, avgCtr, avgRoi });
  },
};
