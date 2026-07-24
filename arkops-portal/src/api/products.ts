/**
 * File: products.ts
 * Purpose: Mock API for the product catalog under the D6 two-layer model
 * (product-design.md §3.14): a master product (SPU, `Product`) is merchant-owned and
 * unique across stores; a `ProductListing` is that product's presence on one store.
 * "Not listed on store X" is derived by the caller (merchant's stores minus stores with
 * a listing) — never stored redundantly. Also serves the merge-suggestion queue for
 * near-duplicate masters detected across stores (60–95% confidence band), and the Smart
 * Sync engine: a one-way (platform → AllMall, read-only pull) simulated sync pass that
 * auto-applies low-risk changes and leaves everything else as a reviewable decision.
 *
 * Author: Michael Lee
 * Created: 2026-07-23
 *
 * Main exports:
 * - productsApi: list/get/create/update/setPrimaryStore for master products.
 * - productListingsApi: list/listForProduct/create/update/updateStatus/remove for listings.
 * - mergeSuggestionsApi: list/merge/dismiss for the possible-duplicate review queue.
 * - syncApi: runSync/getLastResult/getAutoChangeLog for the Smart Sync digest.
 * - newProductCandidatesApi: list/accept/dismiss for AI-detected possibly-new products.
 * - fieldConflictsApi: list/resolve for manually-locked fields the platform tried to change.
 */
import { stores } from './mockData';
import { mockDelay } from './client';
import { appendItem, removeWhere, replaceItem } from './mockRepository';
import { nextId } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type {
  AllMallId,
  AttributeProvenance,
  AutoSyncChange,
  FieldConflict,
  InventoryMode,
  ListingStatus,
  NewProductCandidate,
  Product,
  ProductListing,
  ProductMergeSuggestion,
  ProductProvenance,
  StoreSyncHealth,
  SyncResult,
} from '../types/domain';

const AI_FROM = (storeId: AllMallId): AttributeProvenance => ({ source: 'ai', storeId });
const MANUAL: AttributeProvenance = { source: 'manual' };

const products: Product[] = [
  {
    id: 4001, spuCode: 'BT-E01', name: '蓝牙耳机 Pro', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bluetooth%20earbuds%20product%20photo&image_size=square'],
    category: '数码配件', cost: 18.5, description: '蓝牙5.3，主动降噪，续航8小时，Type-C快充。',
    totalStock: 600, primaryStoreId: 1001, createdBy: 'ai',
    provenance: { name: AI_FROM(1001), images: AI_FROM(1001), category: AI_FROM(1001), cost: AI_FROM(1001), description: AI_FROM(1001) },
    createdAt: '2026-05-10 09:00',
  },
  {
    id: 4002, spuCode: 'BT-E02', name: '运动挂脖耳机', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neckband%20sports%20earphones&image_size=square'],
    category: '数码配件', cost: 12.0, description: '挂脖设计，IPX5防水，适合跑步骑行等运动场景。',
    totalStock: 180, primaryStoreId: 1001, createdBy: 'ai',
    // cost is manually locked (merchant corrected the AI-seeded value) — sets up the
    // field-conflict demo: sync later finds the platform reporting a different cost.
    provenance: { name: AI_FROM(1001), images: AI_FROM(1001), category: AI_FROM(1001), cost: MANUAL, description: AI_FROM(1001) },
    createdAt: '2026-05-12 10:30',
  },
  {
    id: 4003, spuCode: 'CK-C01', name: '65W GaN 充电器', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=65w%20gan%20fast%20charger&image_size=square'],
    category: '数码配件', cost: 8.2, description: '氮化镓材质，体积小巧，支持三口同时快充。',
    totalStock: 90, primaryStoreId: 1001, createdBy: 'ai',
    provenance: { name: AI_FROM(1001), images: AI_FROM(1001), category: AI_FROM(1001), cost: AI_FROM(1001), description: AI_FROM(1001) },
    createdAt: '2026-05-15 14:00',
  },
  {
    id: 4004, spuCode: 'OG-T01', name: '折叠露营椅', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folding%20camping%20chair%20outdoor&image_size=square'],
    category: '户外装备', cost: 22.0, description: '铝合金支架，承重120kg，收纳后仅38cm，附收纳袋。',
    totalStock: 210, primaryStoreId: 1002, createdBy: 'ai',
    provenance: { name: AI_FROM(1002), images: AI_FROM(1002), category: AI_FROM(1002), cost: AI_FROM(1002), description: AI_FROM(1002) },
    createdAt: '2026-05-18 11:00',
  },
  {
    id: 4005, spuCode: 'OG-L01', name: 'LED 露营灯', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=led%20camping%20lantern&image_size=square'],
    category: '户外装备', cost: 6.5, description: '磁吸底座，三档调光，USB-C充电，续航12小时。',
    totalStock: 95, primaryStoreId: 1002, createdBy: 'ai',
    provenance: { name: AI_FROM(1002), images: AI_FROM(1002), category: AI_FROM(1002), cost: AI_FROM(1002), description: AI_FROM(1002) },
    createdAt: '2026-05-20 16:20',
  },
  {
    id: 4006, spuCode: 'OG-B01', name: '户外登山包 40L', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=40l%20hiking%20backpack%20outdoor&image_size=square'],
    category: '户外装备', cost: 18.0, description: '防泼水面料，多隔层设计，附腰带减压系统。',
    totalStock: 0, primaryStoreId: 1002, createdBy: 'ai',
    provenance: { name: AI_FROM(1002), images: AI_FROM(1002), category: AI_FROM(1002), cost: AI_FROM(1002), description: AI_FROM(1002) },
    createdAt: '2026-05-22 08:40',
  },
  {
    id: 4007, spuCode: 'SF-C01', name: '定制手机壳', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20phone%20case%20product%20photo&image_size=square'],
    category: '数码配件', cost: 3.5, description: '支持个性化定制图案，液态硅胶材质，防摔耐磨。',
    totalStock: 520, primaryStoreId: 1003, createdBy: 'ai',
    provenance: { name: AI_FROM(1003), images: AI_FROM(1003), category: AI_FROM(1003), cost: AI_FROM(1003), description: AI_FROM(1003) },
    createdAt: '2026-05-25 13:10',
  },
  {
    // D6 sub-decision 4: merchant-created master with zero listings — list later, the code
    // entered here becomes the clean merge key for future store-sync imports.
    id: 4008, spuCode: 'BT-N01', name: '便携式野营炉', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20camping%20stove%20outdoor%20cooking%20equipment&image_size=square'],
    category: '户外装备', cost: 14.2, description: '不锈钢材质，折叠设计，支持多种燃料类型，适合露营野餐。',
    totalStock: 100, primaryStoreId: 1001, createdBy: 'manual',
    provenance: { name: MANUAL, images: MANUAL, category: MANUAL, cost: MANUAL, description: MANUAL },
    createdAt: '2026-06-21 07:45',
  },
  {
    id: 4009, spuCode: 'OG-N01', name: '超轻登山杖一对', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=carbon%20fiber%20hiking%20trekking%20poles%20outdoor&image_size=square'],
    category: '户外装备', cost: 8.5, description: '碳纤维材质超轻登山杖，仅重180g，可伸缩调节长度，适合徒步旅行和登山运动。',
    totalStock: 80, primaryStoreId: 1002, createdBy: 'ai',
    provenance: { name: AI_FROM(1002), images: AI_FROM(1002), category: AI_FROM(1002), cost: AI_FROM(1002), description: AI_FROM(1002) },
    createdAt: '2026-06-21 06:30',
  },
  {
    id: 4010, spuCode: 'BT-N02', name: '骨传导运动耳机', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bone%20conduction%20sports%20headphones%20wireless&image_size=square'],
    category: '数码配件', cost: 22.0, description: '骨传导技术，无需入耳，安全舒适。IPX6防水等级，适合跑步、骑行等运动场景。蓝牙5.3，续航8小时。',
    totalStock: 140, primaryStoreId: 1001, createdBy: 'ai',
    provenance: { name: AI_FROM(1001), images: AI_FROM(1001), category: AI_FROM(1001), cost: AI_FROM(1001), description: AI_FROM(1001) },
    createdAt: '2026-06-20 15:00',
  },
  // The next two exist only to demonstrate the "possible duplicate" merge queue (P2):
  // synced from a different store under a different SPU code, similar enough to flag
  // for review but not similar enough (< 95%) to auto-merge (D6 sub-decision 1).
  {
    id: 4011, spuCode: 'TB-EAR-09', name: '无线蓝牙运动耳机', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20sports%20earphones%20neckband&image_size=square'],
    category: '数码配件', cost: 13.0, description: '运动防水挂脖式蓝牙耳机，长续航，磁吸开关机。',
    totalStock: 60, primaryStoreId: 1002, createdBy: 'ai',
    provenance: { name: AI_FROM(1002), images: AI_FROM(1002), category: AI_FROM(1002), cost: AI_FROM(1002), description: AI_FROM(1002) },
    createdAt: '2026-07-01 09:15',
  },
  {
    id: 4012, spuCode: 'JD-CHAIR-02', name: '户外折叠椅 加厚款', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=thick%20padded%20folding%20outdoor%20chair&image_size=square'],
    category: '户外装备', cost: 24.5, description: '加厚牛津布，铝合金骨架，最大承重150kg。',
    totalStock: 40, primaryStoreId: 1003, createdBy: 'ai',
    provenance: { name: AI_FROM(1003), images: AI_FROM(1003), category: AI_FROM(1003), cost: AI_FROM(1003), description: AI_FROM(1003) },
    createdAt: '2026-07-02 10:00',
  },
];

const productListings: ProductListing[] = [
  { id: 4501, productId: 4001, storeId: 1001, platformSkuRef: 'PDD-BTE01', sellingPrice: 39.99, status: 'listed', inventoryMode: 'shared', safetyStock: 20, lastSyncedAt: '2026-07-23 14:00' },
  { id: 4502, productId: 4001, storeId: 1002, platformSkuRef: 'TB-BTE01', sellingPrice: 42.99, status: 'listed', inventoryMode: 'independent', allocation: 150, lastSyncedAt: '2026-07-23 09:30' },

  { id: 4503, productId: 4002, storeId: 1001, platformSkuRef: 'PDD-BTE02', sellingPrice: 24.99, status: 'listed', inventoryMode: 'shared', safetyStock: 10, lastSyncedAt: '2026-07-23 14:00' },

  { id: 4504, productId: 4003, storeId: 1001, platformSkuRef: 'PDD-CKC01', sellingPrice: 19.99, status: 'listed', inventoryMode: 'shared', safetyStock: 60, lastSyncedAt: '2026-07-23 14:00' },
  { id: 4505, productId: 4003, storeId: 1002, platformSkuRef: 'TB-CKC01', sellingPrice: 21.99, status: 'draft', inventoryMode: 'independent', allocation: 20, lastSyncedAt: '2026-07-20 11:00' },

  { id: 4506, productId: 4004, storeId: 1002, platformSkuRef: 'TB-OGT01', sellingPrice: 49.99, status: 'listed', inventoryMode: 'shared', safetyStock: 15, lastSyncedAt: '2026-07-23 09:30' },

  { id: 4507, productId: 4005, storeId: 1002, platformSkuRef: 'TB-OGL01', sellingPrice: 15.99, status: 'listed', inventoryMode: 'shared', safetyStock: 5, lastSyncedAt: '2026-07-23 09:30' },
  { id: 4508, productId: 4005, storeId: 1001, platformSkuRef: 'PDD-OGL01', sellingPrice: 16.99, status: 'delisted', inventoryMode: 'independent', allocation: 0, lastSyncedAt: '2026-06-30 10:00' },

  { id: 4509, productId: 4006, storeId: 1002, platformSkuRef: 'TB-OGB01', sellingPrice: 45.99, status: 'listed', inventoryMode: 'shared', safetyStock: 0, lastSyncedAt: '2026-07-23 09:30' },

  { id: 4510, productId: 4007, storeId: 1003, platformSkuRef: 'JD-SFC01', sellingPrice: 12.99, status: 'listed', inventoryMode: 'shared', safetyStock: 20, lastSyncedAt: '2026-07-23 16:10' },

  // 4008 (便携式野营炉) intentionally has zero listings — demonstrates "先建后铺".

  { id: 4511, productId: 4009, storeId: 1002, platformSkuRef: 'TB-OGN01', sellingPrice: 29.99, status: 'pending_review', inventoryMode: 'shared', safetyStock: 10, lastSyncedAt: '2026-07-23 06:30' },
  { id: 4512, productId: 4010, storeId: 1001, platformSkuRef: 'PDD-BTN02', sellingPrice: 49.99, status: 'draft', inventoryMode: 'independent', allocation: 50, lastSyncedAt: '2026-07-20 15:00' },

  { id: 4513, productId: 4011, storeId: 1002, platformSkuRef: 'TB-EAR09', sellingPrice: 26.5, status: 'listed', inventoryMode: 'shared', safetyStock: 5, lastSyncedAt: '2026-07-23 09:30' },
  { id: 4514, productId: 4012, storeId: 1003, platformSkuRef: 'JD-CHAIR02', sellingPrice: 52.0, status: 'listed', inventoryMode: 'shared', safetyStock: 8, lastSyncedAt: '2026-07-23 16:10' },
];

const mergeSuggestions: ProductMergeSuggestion[] = [
  {
    id: 4901, productAId: 4002, productBId: 4011, confidence: 78,
    matchFactors: ['标题相似度 81%', '主图相似度 74%', '价格接近（¥24.99 vs ¥26.50）'],
    createdAt: '2026-07-22 10:00',
  },
  {
    id: 4902, productAId: 4004, productBId: 4012, confidence: 68,
    matchFactors: ['货号不同', '标题相似度 65%', '价格接近（¥49.99 vs ¥52.00）'],
    createdAt: '2026-07-22 10:05',
  },
];

function logProductAction(entityId: AllMallId, action: string, summary: string): void {
  recordAuditLog({ actor: '当前用户', action, entity: '商品', entityId, summary, category: 'human_ops' });
}

export const productsApi = {
  list: (): Promise<Product[]> => mockDelay([...products]),

  get: (id: AllMallId): Promise<Product | undefined> => mockDelay(products.find((p) => p.id === id)),

  /** Manual creation (D6 sub-decision 4): a master with zero listings, listed later. */
  create: (input: { spuCode: string; name: string; images: string[]; category: string; cost: number; description: string; totalStock: number; primaryStoreId: AllMallId }): Promise<Product> => {
    const product: Product = {
      id: nextId('products', products.length),
      ...input,
      createdBy: 'manual',
      provenance: { name: MANUAL, images: MANUAL, category: MANUAL, cost: MANUAL, description: MANUAL },
      createdAt: new Date().toISOString(),
    };
    appendItem(products, product);
    logProductAction(product.id, '创建商品', `创建商品主体: ${product.name}`);
    return mockDelay(product);
  },

  /** Editing a master attribute locks its provenance to manual — sync will not overwrite it (D6 sub-decision 2). */
  update: (id: AllMallId, patch: Partial<Pick<Product, 'name' | 'images' | 'category' | 'cost' | 'description' | 'totalStock'>>): Promise<Product | undefined> => {
    const updated = replaceItem(products, (p) => p.id === id, (current) => {
      const provenance: ProductProvenance = { ...current.provenance };
      (Object.keys(patch) as (keyof typeof patch)[]).forEach((key) => {
        if (key in provenance) provenance[key as keyof ProductProvenance] = MANUAL;
      });
      return { ...current, ...patch, provenance };
    });
    if (updated) logProductAction(id, '编辑商品', `更新商品资料: ${updated.name}`);
    return mockDelay(updated);
  },

  setPrimaryStore: (id: AllMallId, storeId: AllMallId): Promise<Product | undefined> => {
    const updated = replaceItem(products, (p) => p.id === id, (current) => ({ ...current, primaryStoreId: storeId }));
    if (updated) logProductAction(id, '切换主店铺', `切换主店铺: ${updated.name}`);
    return mockDelay(updated);
  },
};

export const productListingsApi = {
  list: (): Promise<ProductListing[]> => mockDelay([...productListings]),

  listForProduct: (productId: AllMallId): Promise<ProductListing[]> =>
    mockDelay(productListings.filter((l) => l.productId === productId)),

  /** "List to store" (§3.14.7): always lands as a draft listing pending review/publish. */
  create: (input: {
    productId: AllMallId;
    storeId: AllMallId;
    platformSkuRef: string;
    sellingPrice: number;
    inventoryMode: InventoryMode;
    allocation?: number;
    safetyStock?: number;
  }): Promise<ProductListing> => {
    const listing: ProductListing = {
      id: nextId('productListings', productListings.length),
      ...input,
      status: 'draft',
      lastSyncedAt: new Date().toISOString(),
    };
    appendItem(productListings, listing);
    logProductAction(listing.id, '铺货到店铺', `新增店铺铺货草稿 (店铺 ${input.storeId})`);
    return mockDelay(listing);
  },

  update: (id: AllMallId, patch: Partial<Pick<ProductListing, 'sellingPrice' | 'inventoryMode' | 'allocation' | 'safetyStock'>>): Promise<ProductListing | undefined> => {
    const updated = replaceItem(productListings, (l) => l.id === id, (current) => ({ ...current, ...patch }));
    if (updated) logProductAction(id, '编辑铺货', `更新铺货信息 (店铺 ${updated.storeId})`);
    return mockDelay(updated);
  },

  updateStatus: (id: AllMallId, status: ListingStatus): Promise<ProductListing | undefined> => {
    const updated = replaceItem(productListings, (l) => l.id === id, (current) => ({ ...current, status }));
    if (updated) logProductAction(id, '更新铺货状态', `铺货状态更新为 ${status} (店铺 ${updated.storeId})`);
    return mockDelay(updated);
  },

  remove: (id: AllMallId): Promise<void> => {
    const target = productListings.find((l) => l.id === id);
    removeWhere(productListings, (l) => l.id === id);
    if (target) logProductAction(id, '移除铺货', `移除铺货记录 (店铺 ${target.storeId})`);
    return mockDelay(undefined);
  },

  /** Sync strip "立即同步" (§3.14.5): refreshes every listing's lastSyncedAt to now. */
  syncAll: (): Promise<void> => {
    const now = new Date().toISOString();
    productListings.forEach((listing, i) => {
      productListings.splice(i, 1, { ...listing, lastSyncedAt: now });
    });
    recordAuditLog({ actor: '当前用户', action: '同步商品', entity: '商品', entityId: 'all', summary: '手动触发商品铺货同步', category: 'human_ops' });
    return mockDelay(undefined);
  },
};

export const mergeSuggestionsApi = {
  list: (): Promise<ProductMergeSuggestion[]> => mockDelay([...mergeSuggestions]),

  /** Merges B into A: reassigns B's listings to A, drops B. A survives as the master. */
  merge: (id: AllMallId): Promise<void> => {
    const suggestion = mergeSuggestions.find((s) => s.id === id);
    if (suggestion) {
      productListings.forEach((listing, i) => {
        if (listing.productId === suggestion.productBId) {
          productListings.splice(i, 1, { ...listing, productId: suggestion.productAId });
        }
      });
      removeWhere(products, (p) => p.id === suggestion.productBId);
      removeWhere(mergeSuggestions, (s) => s.id === id);
      logProductAction(suggestion.productAId, '合并商品', `合并商品 #${suggestion.productBId} 到 #${suggestion.productAId}`);
    }
    return mockDelay(undefined);
  },

  dismiss: (id: AllMallId): Promise<void> => {
    const suggestion = mergeSuggestions.find((s) => s.id === id);
    removeWhere(mergeSuggestions, (s) => s.id === id);
    if (suggestion) logProductAction(suggestion.productAId, '忽略合并建议', `忽略合并建议 #${suggestion.productAId} / #${suggestion.productBId}`);
    return mockDelay(undefined);
  },
};

// ===== Smart Sync engine =====
// One-way (platform → AllMall, read-only pull) simulated sync pass. Tier 0/1 changes
// (price/stock updates, delists, same-SPU auto-matches) are applied automatically.
// Tier 2 changes (possibly-new products, locked-field conflicts) are seeded once and
// left for the merchant to review — via the Action Inbox and the merge-review queue.

const newProductCandidates: NewProductCandidate[] = [];
const fieldConflicts: FieldConflict[] = [];
let lastSyncResult: SyncResult | null = null;

/** Connected but hasn't synced in this long counts as stale (perStore health). */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function storeName(storeId: AllMallId): string {
  return stores.find((s) => s.id === storeId)?.name ?? '';
}

function computeStoreHealth(): StoreSyncHealth[] {
  return stores.map((store) => {
    const storeListings = productListings.filter((l) => l.storeId === store.id);
    const lastSyncedAt = storeListings.reduce<string | null>(
      (latest, l) => (!latest || l.lastSyncedAt > latest ? l.lastSyncedAt : latest),
      null
    );
    const needsRelogin = store.status === 'login_required' || store.status === 'expired';
    const stale = !needsRelogin && (!lastSyncedAt || Date.now() - new Date(lastSyncedAt).getTime() > STALE_THRESHOLD_MS);
    return { storeId: store.id, lastSyncedAt, needsRelogin, stale };
  });
}

function countPendingDecisions(): number {
  const storesNeedingRelogin = stores.filter((s) => s.status === 'login_required' || s.status === 'expired').length;
  return mergeSuggestions.length + newProductCandidates.length + fieldConflicts.length + storesNeedingRelogin;
}

export const syncApi = {
  getLastResult: (): Promise<SyncResult | null> => mockDelay(lastSyncResult, 60),

  /**
   * Simulates one sync pass. Every rule checks before applying, so a pass that finds
   * nothing new correctly reports "up to date" rather than re-firing the same change —
   * the same feedback loop a merchant would see once everything settles against a real
   * platform API.
   */
  runSync: (): Promise<SyncResult> => {
    const startedAt = new Date().toISOString();
    const autoApplied: AutoSyncChange[] = [];

    const logAuto = (change: Omit<AutoSyncChange, 'id' | 'at'>) => {
      autoApplied.push({ ...change, id: nextId('autoSyncChanges', autoApplied.length), at: startedAt });
      logProductAction(change.productId, '自动同步', change.summary);
    };

    // Tier 0/1a: price update — platform now shows a different price for a listed SKU.
    const priceTarget = productListings.find((l) => l.id === 4503 && l.sellingPrice === 24.99);
    if (priceTarget) {
      const product = products.find((p) => p.id === priceTarget.productId);
      replaceItem(productListings, (l) => l.id === priceTarget.id, (cur) => ({ ...cur, sellingPrice: 23.99, lastSyncedAt: startedAt }));
      logAuto({
        type: 'price_update', productId: priceTarget.productId, storeId: priceTarget.storeId,
        summary: `${product?.name ?? ''}：售价 ¥24.99 → ¥23.99（${storeName(priceTarget.storeId)}）`,
      });
    }

    // Tier 0/1b: stock update — platform reports a restock on a pool that was empty.
    const restockTarget = products.find((p) => p.id === 4006 && p.totalStock === 0);
    if (restockTarget) {
      replaceItem(products, (p) => p.id === restockTarget.id, (cur) => ({ ...cur, totalStock: 25 }));
      logAuto({ type: 'stock_update', productId: restockTarget.id, summary: `${restockTarget.name}：补货，总库存 0 → 25` });
    }

    // Tier 0/1c: delist — platform pulled a listing down.
    const delistTarget = productListings.find((l) => l.id === 4510 && l.status === 'listed');
    if (delistTarget) {
      const product = products.find((p) => p.id === delistTarget.productId);
      replaceItem(productListings, (l) => l.id === delistTarget.id, (cur) => ({ ...cur, status: 'delisted' as const, lastSyncedAt: startedAt }));
      logAuto({
        type: 'delist', productId: delistTarget.productId, storeId: delistTarget.storeId,
        summary: `${product?.name ?? ''}：平台已下架（${storeName(delistTarget.storeId)}），建议核实原因`,
      });
    }

    // Tier 0/1d: same-SPU auto-match — a listing surfaces under a code that's already a
    // master, so it's linked straight to the existing product instead of creating (then
    // merging away) a duplicate. This is the D6 "≥95%/same-SPU auto-merge" case in
    // practice: sync never creates the duplicate master in the first place.
    const sfc01 = products.find((p) => p.id === 4007);
    const alreadyLinked = productListings.some((l) => l.productId === 4007 && l.storeId === 1002);
    if (sfc01 && !alreadyLinked) {
      const listing: ProductListing = {
        id: nextId('productListings', productListings.length),
        productId: 4007, storeId: 1002, platformSkuRef: 'TB-SFC01', sellingPrice: 13.99,
        status: 'listed', inventoryMode: 'shared', safetyStock: 5, lastSyncedAt: startedAt,
      };
      appendItem(productListings, listing);
      logAuto({
        type: 'auto_merge', productId: 4007, storeId: 1002,
        summary: `识别到相同货号 ${sfc01.spuCode}（${storeName(1002)}新发现），已自动关联到现有商品「${sfc01.name}」`,
      });
    }

    // Tier 2a: possibly-new products the sync pass can't confidently place (seeded once).
    if (newProductCandidates.length === 0) {
      appendItem(newProductCandidates, {
        id: nextId('newProductCandidates', newProductCandidates.length),
        storeId: 1001, platformSkuRef: 'PDD-PWR20K', name: '20000mAh 快充移动电源',
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=20000mah%20power%20bank%20fast%20charging&image_size=square'],
        category: '数码配件', cost: 25, sellingPrice: 59.9, recommendation: 'create_new', createdAt: startedAt,
      });
      appendItem(newProductCandidates, {
        id: nextId('newProductCandidates', newProductCandidates.length),
        storeId: 1003, platformSkuRef: 'JD-TABLE01', name: '户外折叠桌',
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folding%20outdoor%20table&image_size=square'],
        category: '户外装备', cost: 30, sellingPrice: 79, recommendation: 'likely_duplicate', possibleDuplicateOfProductId: 4004, createdAt: startedAt,
      });
    }

    // Tier 2b: a manually-locked field the platform tried to overwrite (seeded once).
    // The lock already protects the value (D6 sub-decision 2) — this is transparency
    // into what sync saw, not an at-risk change.
    const lockedCostProduct = products.find((p) => p.id === 4002 && p.provenance.cost.source === 'manual');
    if (lockedCostProduct && fieldConflicts.length === 0) {
      appendItem(fieldConflicts, {
        id: nextId('fieldConflicts', fieldConflicts.length),
        productId: 4002, storeId: 1001, field: 'cost',
        yourValue: `¥${lockedCostProduct.cost.toFixed(2)}`, platformValue: '¥11.00',
        recommendation: 'keep_yours', createdAt: startedAt,
      });
    }

    const result: SyncResult = {
      startedAt,
      lastSyncedAt: startedAt,
      status: 'success',
      autoApplied,
      pendingDecisionCount: countPendingDecisions(),
      perStore: computeStoreHealth(),
    };
    lastSyncResult = result;
    return mockDelay(result, 900);
  },
};

export const newProductCandidatesApi = {
  list: (): Promise<NewProductCandidate[]> => mockDelay([...newProductCandidates]),

  /** Accepts the AI recommendation: creates a new master (already carrying one live listing) from the candidate. */
  accept: (id: AllMallId): Promise<Product | undefined> => {
    const candidate = newProductCandidates.find((c) => c.id === id);
    if (!candidate) return mockDelay(undefined);
    const product: Product = {
      id: nextId('products', products.length),
      spuCode: candidate.platformSkuRef,
      name: candidate.name,
      images: candidate.images,
      category: candidate.category,
      cost: candidate.cost,
      description: '',
      totalStock: 0,
      primaryStoreId: candidate.storeId,
      createdBy: 'ai',
      provenance: {
        name: AI_FROM(candidate.storeId), images: AI_FROM(candidate.storeId), category: AI_FROM(candidate.storeId),
        cost: AI_FROM(candidate.storeId), description: AI_FROM(candidate.storeId),
      },
      createdAt: new Date().toISOString(),
    };
    appendItem(products, product);
    const listing: ProductListing = {
      id: nextId('productListings', productListings.length),
      productId: product.id, storeId: candidate.storeId, platformSkuRef: candidate.platformSkuRef,
      sellingPrice: candidate.sellingPrice, status: 'listed', inventoryMode: 'shared', safetyStock: 0,
      lastSyncedAt: new Date().toISOString(),
    };
    appendItem(productListings, listing);
    removeWhere(newProductCandidates, (c) => c.id === id);
    logProductAction(product.id, '接受新品建议', `从同步发现创建商品主体: ${product.name}`);
    return mockDelay(product);
  },

  dismiss: (id: AllMallId): Promise<void> => {
    const candidate = newProductCandidates.find((c) => c.id === id);
    removeWhere(newProductCandidates, (c) => c.id === id);
    if (candidate) logProductAction(candidate.id, '忽略新品建议', `忽略同步发现的新品: ${candidate.name}`);
    return mockDelay(undefined);
  },
};

export const fieldConflictsApi = {
  list: (): Promise<FieldConflict[]> => mockDelay([...fieldConflicts]),

  /** Resolves a conflict: 'keep_yours' leaves the master untouched (still locked); 'accept_platform' overwrites the field and unlocks it back to AI provenance. */
  resolve: (id: AllMallId, decision: 'keep_yours' | 'accept_platform'): Promise<void> => {
    const conflict = fieldConflicts.find((c) => c.id === id);
    if (conflict && decision === 'accept_platform') {
      const numericValue = Number(conflict.platformValue.replace(/[^0-9.]/g, ''));
      replaceItem(products, (p) => p.id === conflict.productId, (current) => ({
        ...current,
        cost: conflict.field === 'cost' ? numericValue : current.cost,
        provenance: { ...current.provenance, [conflict.field]: AI_FROM(conflict.storeId) },
      }));
    }
    removeWhere(fieldConflicts, (c) => c.id === id);
    if (conflict) logProductAction(conflict.productId, '处理字段冲突', `${decision === 'keep_yours' ? '保留你的值' : '采用平台值'}: ${conflict.field}`);
    return mockDelay(undefined);
  },
};
