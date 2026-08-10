/**
 * Inventory Management Mock API (V1.1)
 */
import { mockDelay } from './client';
import type { AllMallId, InventoryItem, ReplenishSuggestion, SafetyStockConfig, TransferRecommendation } from '../types/domain';

const items: InventoryItem[] = [
  { id: 4701, productId: 4001, storeId: 1001, skuCode: 'BAG-001-BLK', skuName: '真皮托特包-黑色', currentStock: 23, safetyStock: 30, dailySales: 5.2, daysUntilStockout: 4, alertLevel: 'low', source: 'shared_pool', lastRestockedAt: '2026-07-28' },
  { id: 4702, productId: 4001, storeId: 1001, skuCode: 'BAG-001-BRN', skuName: '真皮托特包-棕色', currentStock: 85, safetyStock: 30, dailySales: 4.1, daysUntilStockout: 21, alertLevel: 'healthy', source: 'physical', lastRestockedAt: '2026-07-25' },
  { id: 4703, productId: 4002, storeId: 1002, skuCode: 'SHIRT-002-WHT', skuName: '冰丝衬衫-白色', currentStock: 5, safetyStock: 25, dailySales: 8.3, daysUntilStockout: 1, alertLevel: 'critical', source: 'shared_pool', lastRestockedAt: '2026-07-30' },
  { id: 4704, productId: 4002, storeId: 1002, skuCode: 'SHIRT-002-BLU', skuName: '冰丝衬衫-蓝色', currentStock: 42, safetyStock: 25, dailySales: 6.5, daysUntilStockout: 6, alertLevel: 'low', source: 'physical', lastRestockedAt: '2026-07-22' },
  { id: 4705, productId: 4004, storeId: 1003, skuCode: 'BLOCK-004-A', skuName: '积木桌套装-A款', currentStock: 2, safetyStock: 20, dailySales: 4.0, daysUntilStockout: 0, alertLevel: 'critical', source: 'virtual', lastRestockedAt: '2026-07-18' },
  { id: 4706, productId: 4004, storeId: 1003, skuCode: 'BLOCK-004-B', skuName: '积木桌套装-B款', currentStock: 18, safetyStock: 20, dailySales: 3.2, daysUntilStockout: 6, alertLevel: 'low', source: 'shared_pool', lastRestockedAt: '2026-07-20' },
  { id: 4707, productId: 4005, storeId: 1001, skuCode: 'LAMP-005-WHT', skuName: '露营灯-白色', currentStock: 56, safetyStock: 15, dailySales: 2.1, daysUntilStockout: 27, alertLevel: 'healthy', source: 'physical', lastRestockedAt: '2026-07-28' },
  { id: 4708, productId: 4005, storeId: 1002, skuCode: 'LAMP-005-WHT', skuName: '露营灯-白色', currentStock: 8, safetyStock: 15, dailySales: 4.5, daysUntilStockout: 2, alertLevel: 'critical', source: 'virtual', lastRestockedAt: '2026-07-30' },
  { id: 4709, productId: 4006, storeId: 1003, skuCode: 'SHOE-006-RED', skuName: '运动鞋-红色', currentStock: 67, safetyStock: 25, dailySales: 3.8, daysUntilStockout: 18, alertLevel: 'healthy', source: 'physical', lastRestockedAt: '2026-07-15' },
  { id: 4710, productId: 4006, storeId: 1001, skuCode: 'SHOE-006-BLK', skuName: '运动鞋-黑色', currentStock: 11, safetyStock: 25, dailySales: 7.2, daysUntilStockout: 2, alertLevel: 'critical', source: 'shared_pool', lastRestockedAt: '2026-07-26' },
];

const replenishSuggestions: ReplenishSuggestion[] = [
  { productName: '冰丝衬衫-白色', skuCode: 'SHIRT-002-WHT', currentStock: 5, safetyStock: 25, dailySales: 8.3, suggestedQuantity: 120, suggestedDate: '2026-08-12', supplier: '嘉兴服饰供应链', leadTimeDays: 3, priority: 'urgent', reason: '库存仅剩 1 天，日均销量 8.3 件，建议紧急补货 120 件（约 14 天用量 + 安全库存）' },
  { productName: '积木桌套装-A款', skuCode: 'BLOCK-004-A', currentStock: 2, safetyStock: 20, dailySales: 4.0, suggestedQuantity: 80, suggestedDate: '2026-08-12', supplier: '汕头玩具工厂', leadTimeDays: 5, priority: 'urgent', reason: '已断货，日均销量 4 件，建议紧急补货 80 件（20 天用量 + 安全库存）' },
  { productName: '运动鞋-黑色', skuCode: 'SHOE-006-BLK', currentStock: 11, safetyStock: 25, dailySales: 7.2, suggestedQuantity: 100, suggestedDate: '2026-08-13', supplier: '晋江鞋业供应链', leadTimeDays: 4, priority: 'urgent', reason: '库存仅剩 2 天，日均销量 7.2 件，建议补货 100 件（约 14 天用量 + 缓冲）' },
  { productName: '真皮托特包-黑色', skuCode: 'BAG-001-BLK', currentStock: 23, safetyStock: 30, dailySales: 5.2, suggestedQuantity: 60, suggestedDate: '2026-08-15', supplier: '广州皮具供应链', leadTimeDays: 5, priority: 'normal', reason: '低于安全库存线（30 件），日均 5.2 件，建议补货 60 件以恢复安全水位' },
  { productName: '露营灯-白色', skuCode: 'LAMP-005-WHT', currentStock: 8, safetyStock: 15, dailySales: 4.5, suggestedQuantity: 40, suggestedDate: '2026-08-13', supplier: '深圳户外用品供应链', leadTimeDays: 3, priority: 'urgent', reason: '库存低于安全线，露营旺季日均 4.5 件，建议紧急补货 40 件' },
];

const transferRecs: TransferRecommendation[] = [
  { fromStoreId: 1001, toStoreId: 1002, productName: '露营灯-白色', skuCode: 'LAMP-005-WHT', quantity: 20, fromStock: 56, toStock: 8, reason: '拼多多旗舰店库存充足（56件），淘宝旗舰店告急（8件），建议调拨 20 件以平衡库存', urgency: 'urgent' },
  { fromStoreId: 1001, toStoreId: 1003, productName: '运动鞋-黑色', skuCode: 'SHOE-006-BLK', quantity: 15, fromStock: 11, toStock: 0, reason: '京东自营店断货，拼多多有少量库存，建议调拨 15 件暂渡', urgency: 'urgent' },
];

const safetyStockConfigs: SafetyStockConfig[] = [
  { storeId: 1001, productId: 4001, currentSafetyStock: 30, suggestedSafetyStock: 35, recommendation: '真皮托特包旺季销量增长 20%，建议提高安全库存至 35 件' },
  { storeId: 1002, productId: 4002, currentSafetyStock: 25, suggestedSafetyStock: 30, recommendation: '冰丝衬衫夏季爆款日销 8+ 件，安全库存建议从 25 调整至 30' },
  { storeId: 1003, productId: 4004, currentSafetyStock: 20, suggestedSafetyStock: 25, recommendation: '积木桌儿童节后仍保持热度，建议提高至 25 件覆盖补货周期' },
];

export const inventoryApi = {
  list: (filters?: { storeId?: AllMallId; alertLevel?: string }) => {
    let result = [...items];
    if (filters?.storeId) result = result.filter((i) => i.storeId === filters.storeId);
    if (filters?.alertLevel) result = result.filter((i) => i.alertLevel === filters.alertLevel);
    result.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
    return mockDelay(result);
  },
  getReplenishSuggestions: () => mockDelay(replenishSuggestions),
  getTransferRecommendations: () => mockDelay(transferRecs),
  getSafetyStockConfigs: () => mockDelay(safetyStockConfigs),
  getOverview: () => {
    const critical = items.filter((i) => i.alertLevel === 'critical').length;
    const low = items.filter((i) => i.alertLevel === 'low').length;
    const healthy = items.filter((i) => i.alertLevel === 'healthy').length;
    const totalStock = items.reduce((s, i) => s + i.currentStock, 0);
    const totalValue = items.reduce((s, i) => s + i.currentStock * 50, 0); // avg 50 CNY
    return mockDelay({ critical, low, healthy, totalStock, totalValue });
  },
};
