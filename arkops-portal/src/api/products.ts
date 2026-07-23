/**
 * File: products.ts
 * Purpose: Mock API for the product catalog and the AI-recognition draft → review →
 * approve lifecycle. Previously all of this lived as component state directly inside
 * ProductManagementPage.tsx with no API seam — this module gives products the same
 * mockRepository-backed shape as every other domain (stores, agents, approvals).
 *
 * Author: Michael Lee
 * Created: 2026-07-23
 *
 * Main exports:
 * - productsApi: list/update/remove for live products.
 * - productDraftsApi: list/save/submitForReview/approve/reject for the draft lifecycle.
 */
import { mockDelay } from './client';
import { insertFirst, removeWhere, replaceItem } from './mockRepository';
import { nextId } from './idGenerator';
import { recordAuditLog } from './auditLogger';
import type { AllMallId, Product, ProductDraft } from '../types/domain';

const products: Product[] = [
  { id: 4001, storeId: 1001, sku: 'BT-E01', name: '蓝牙耳机 Pro', cost: 18.5, sellingPrice: 39.99, stock: 420, status: 'active' },
  { id: 4002, storeId: 1001, sku: 'BT-E02', name: '运动挂脖耳机', cost: 12.0, sellingPrice: 24.99, stock: 180, status: 'active' },
  { id: 4003, storeId: 1001, sku: 'CK-C01', name: '65W GaN 充电器', cost: 8.2, sellingPrice: 19.99, stock: 35, status: 'active' },
  { id: 4004, storeId: 1002, sku: 'OG-T01', name: '折叠露营椅', cost: 22.0, sellingPrice: 49.99, stock: 210, status: 'active' },
  { id: 4005, storeId: 1002, sku: 'OG-L01', name: 'LED 露营灯', cost: 6.5, sellingPrice: 15.99, stock: 95, status: 'active' },
  { id: 4006, storeId: 1002, sku: 'OG-B01', name: '户外登山包 40L', cost: 18.0, sellingPrice: 45.99, stock: 0, status: 'active' },
  { id: 4007, storeId: 1003, sku: 'SF-C01', name: '定制手机壳', cost: 3.5, sellingPrice: 12.99, stock: 520, status: 'active' },
];

const productDrafts: ProductDraft[] = [
  {
    id: 4501,
    storeId: 1001,
    sku: 'BT-N01',
    name: '便携式野营炉',
    cost: 14.2,
    sellingPrice: 35.99,
    description: '高品质便携式野营炉，采用不锈钢材质，折叠设计方便携带。适用于户外露营、野餐等场景，支持多种燃料类型。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20camping%20stove%20outdoor%20cooking%20equipment&image_size=square'],
    status: 'draft',
    createdAt: '2026-06-21 07:45',
  },
  {
    id: 4502,
    storeId: 1002,
    sku: 'OG-N01',
    name: '超轻登山杖一对',
    cost: 8.5,
    sellingPrice: 29.99,
    description: '碳纤维材质超轻登山杖，仅重180g，可伸缩调节长度，适合徒步旅行和登山运动。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=carbon%20fiber%20hiking%20trekking%20poles%20outdoor&image_size=square'],
    status: 'draft',
    createdAt: '2026-06-21 06:30',
  },
  {
    id: 4503,
    storeId: 1001,
    sku: 'BT-N02',
    name: '骨传导运动耳机',
    cost: 22.0,
    sellingPrice: 49.99,
    description: '骨传导技术，无需入耳，安全舒适。IPX6防水等级，适合跑步、骑行等运动场景。蓝牙5.3，续航8小时。',
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bone%20conduction%20sports%20headphones%20wireless&image_size=square'],
    status: 'pending_review',
    createdAt: '2026-06-20 15:00',
  },
];

function logProductAction(entityId: AllMallId, action: string, summary: string): void {
  recordAuditLog({ actor: '当前用户', action, entity: '商品', entityId, summary, category: 'human_ops' });
}

export const productsApi = {
  list: () => mockDelay([...products]),

  update: (id: AllMallId, patch: Partial<Pick<Product, 'name' | 'cost' | 'sellingPrice' | 'stock'>>): Promise<Product | undefined> => {
    const updated = replaceItem(products, (p) => p.id === id, (current) => ({ ...current, ...patch }));
    if (updated) logProductAction(id, '编辑商品', `更新商品信息: ${updated.name}`);
    return mockDelay(updated);
  },

  remove: (id: AllMallId): Promise<void> => {
    const target = products.find((p) => p.id === id);
    removeWhere(products, (p) => p.id === id);
    if (target) logProductAction(id, '删除商品', `删除商品: ${target.name}`);
    return mockDelay(undefined);
  },
};

export const productDraftsApi = {
  list: () => mockDelay([...productDrafts]),

  /** Saves a new draft (from the recognition flow), directly as draft or pending_review. */
  save: (input: Omit<ProductDraft, 'id' | 'createdAt' | 'status'> & { status?: ProductDraft['status'] }): Promise<ProductDraft> => {
    const draft: ProductDraft = {
      ...input,
      id: nextId('productDrafts', productDrafts.length),
      status: input.status ?? 'draft',
      createdAt: new Date().toLocaleString(),
    };
    insertFirst(productDrafts, draft);
    logProductAction(draft.id, draft.status === 'pending_review' ? '提交草稿审核' : '保存草稿', `${draft.status === 'pending_review' ? '提交审核' : '保存草稿'}: ${draft.name}`);
    return mockDelay(draft);
  },

  submitForReview: (id: AllMallId): Promise<ProductDraft | undefined> => {
    const updated = replaceItem(productDrafts, (d) => d.id === id, (current) => ({ ...current, status: 'pending_review' as const }));
    if (updated) logProductAction(id, '提交审核', `草稿提交审核: ${updated.name}`);
    return mockDelay(updated);
  },

  /** Approves a pending draft: creates the live Product and removes the draft (C7 unified lifecycle). */
  approve: (id: AllMallId, input: { sellingPrice: number; stock: number }): Promise<Product | undefined> => {
    const draft = productDrafts.find((d) => d.id === id);
    if (!draft) return mockDelay(undefined);
    const product: Product = {
      id: nextId('products', products.length),
      storeId: draft.storeId,
      sku: draft.sku,
      name: draft.name,
      cost: draft.cost,
      sellingPrice: input.sellingPrice,
      stock: input.stock,
      status: 'active',
      images: draft.images,
    };
    insertFirst(products, product);
    removeWhere(productDrafts, (d) => d.id === id);
    logProductAction(product.id, '通过草稿', `草稿通过并上架: ${product.name}`);
    return mockDelay(product);
  },

  reject: (id: AllMallId): Promise<void> => {
    const draft = productDrafts.find((d) => d.id === id);
    removeWhere(productDrafts, (d) => d.id === id);
    if (draft) logProductAction(id, '驳回草稿', `驳回草稿: ${draft.name}`);
    return mockDelay(undefined);
  },
};
