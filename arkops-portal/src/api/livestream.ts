/**
 * Livestream Management Mock API (V1.3)
 */
import { mockDelay } from './client';
import type { AllMallId, LiveScript, LiveSession, ContentMaterial } from '../types/domain';

const sessions: LiveSession[] = [
  { id: 7001, storeId: 1001, title: '真皮托特包 — 新品首发直播', startTime: '2026-08-12T19:00:00', endTime: '2026-08-12T21:00:00', status: 'upcoming', viewers: 0, peakViewers: 0, duration: 120, products: 8, orders: 0, revenue: 0, avgWatchTime: 0 },
  { id: 7002, storeId: 1002, title: '夏季冰丝衬衫 — 穿搭专场', startTime: '2026-08-10T14:00:00', endTime: '2026-08-10T16:30:00', status: 'ended', viewers: 12400, peakViewers: 2300, duration: 150, products: 12, orders: 520, revenue: 38000, avgWatchTime: 7.5 },
  { id: 7003, storeId: 1003, title: '户外露营装备 — 实测直播', startTime: '2026-08-11T20:00:00', endTime: '2026-08-11T22:30:00', status: 'live', viewers: 8600, peakViewers: 1800, duration: 120, products: 15, orders: 320, revenue: 25000, avgWatchTime: 9.2 },
  { id: 7004, storeId: 1001, title: '周末闪购 — 全场8折限时3小时', startTime: '2026-08-15T18:00:00', endTime: '2026-08-15T21:00:00', status: 'upcoming', viewers: 0, peakViewers: 0, duration: 180, products: 20, orders: 0, revenue: 0, avgWatchTime: 0 },
];

const scripts: LiveScript[] = [
  { id: 7101, sessionId: 7003, phase: 'opening', title: '欢迎开场 + 福利预告', content: '欢迎各位新老朋友来到直播间~ 今晚为大家带来户外露营装备实测，先关注再抽免单福利！', duration: 5, notes: '语速快、节奏欢快、展示抽奖转盘' },
  { id: 7102, sessionId: 7003, phase: 'product_intro', title: '露营灯实测', content: '大家看我手里的这款露营灯，强光 300 流明，充电一次能用 48 小时。我直接关掉所有灯，现场给你们看效果...', duration: 15, notes: '准备三脚架 + 黑暗场景' },
  { id: 7103, sessionId: 7003, phase: 'promo_push', title: '限时优惠 + 催单', content: '直播间专属价格 ¥39.9，只有今晚！还剩最后 50 单，抢完立刻恢复原价 ¥69.9！右下角小黄车点击购买~', duration: 8, notes: '展示库存倒计时、表情带动互动' },
  { id: 7104, sessionId: 7003, phase: 'closing', title: '下期预告 + 抽奖公布', content: '感谢大家今晚的陪伴！中奖名单已在公屏公示。下周六同一时间，我们带来新款户外帐篷首发，不见不散~', duration: 5, notes: '举牌字幕、引导关注' },
];

const materials: ContentMaterial[] = [
  { id: 7201, type: 'image', name: '托特包 — 白底主图', url: '/materials/7201.jpg', tags: ['主图', '白底', '托特包'], uploadedAt: '2026-08-01' },
  { id: 7202, type: 'video', name: '托特包 — 15秒拆箱短视频', url: '/materials/7202.mp4', tags: ['短视频', '拆箱', '托特包'], uploadedAt: '2026-08-02' },
  { id: 7203, type: 'image', name: '冰丝衬衫 — 场景图合集', url: '/materials/7203.jpg', tags: ['场景图', '穿搭', '冰丝衬衫'], uploadedAt: '2026-08-03' },
  { id: 7204, type: 'video', name: '露营灯 — 户外实测长视频', url: '/materials/7204.mp4', tags: ['直播素材', '实测', '露营灯'], uploadedAt: '2026-08-05' },
  { id: 7205, type: 'script', name: '运动鞋 — 直播话术模板', url: '/materials/7205.txt', tags: ['话术', '直播', '运动鞋', '模板'], uploadedAt: '2026-08-06' },
];

export const livestreamApi = {
  list: () => mockDelay(sessions),
  getScripts: (sessionId: AllMallId) => mockDelay(scripts.filter((s) => s.sessionId === sessionId)),
  getMaterials: () => mockDelay(materials),
};
