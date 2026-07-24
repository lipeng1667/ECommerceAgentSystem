# Product Management — Redesign Plan (SPU + Store Listings)

Companion to `product-design.md` §3.14 and decision record D6. Scope: rework the Products feature so that a row represents a **master product**, and the store becomes an attribute of that product (its listing status per store), rather than one row per store-listing.

Core mental shift: **one row = one master product (SPU); "store" is an attribute** (where and how the product is listed), not the primary grouping.

---

## 1. Data Model — two layers

### Master product (Product / SPU)
Merchant-owned, unique across stores. May exist with **zero listings** (create first, list later). Numeric `AllMallId`.
Fields: `spuCode` (merchant SKU/货号), name, images, category, cost, description, shared total-stock pool, `primaryStoreId`, and per-attribute provenance.

### Store listing (ProductListing)
The product's presence on one store. One master → many listings.
Fields: `productId`, `storeId`, external platform product/SKU ref (`*Ref`), per-store `sellingPrice`, `status` (listed / draft / pending_review / delisted), `inventoryMode`, independent allocation or safety stock, `lastSyncedAt`.

**"Not listed" is derived**: a product's distribution = the merchant's stores minus the stores that already have a listing. No redundant stored state.

### Four locked decisions
1. **Merge key** — SPU code first; because imported products may carry different codes per platform, augment with multi-factor matching (title / main-image similarity / price proximity). Three bands: ≥95% or same SPU → auto-merge (reversible); 60–95% → "possible duplicate" review queue, **suggest only, never auto-merge**; <60% → separate.
2. **Attribute provenance** — seed master fields from the **primary store** (default: highest GMV, snapshotted, user-overridable), tagged "AI-detected · from [store]". Once a user edits a field it becomes user-owned and **locked — sync will not overwrite it**.
3. **Inventory** — the master holds a **shared total pool**; each listing chooses `shared` (draws the pool, prevents overselling) or `independent` (a fixed allocation carved from the pool). **Mixing is allowed** per store. Available stock is derived (shared = pool − safety stock; independent = allocation); low-stock alerts split accordingly (shared alerts on the pool, independent on the allocation).
4. **Merchant-created products** — users can create a master with zero listings and list it to platforms later; the code they enter becomes the clean merge key for future imports.

---

## 2. UX / Layout Plan

### Page skeleton
PageHeader → sync strip → KPI row → filter bar → main tabs/table → modals/drawers. Reuse `MetricCard`, `DataTableCard`, `PageFilterBar`, `TableActionGroup`, `DetailSection`, `StatusBadge`, and design tokens for visual parity with the Store pages.

### Sync strip (new; mirrors Stores)
A slim strip under the header: "Last synced 06-15 14:00 · 12 pending changes" + **[Sync now]**, deep-linking to store sync. This is the product-side counterpart to the store connection/sync flow.

### KPI row (redefined for the SPU model)
Four `MetricCard`s: **Total products** (SPU count), **Distribution coverage** (listed vs. not, avg x/y stores), **Inventory alerts** (click to filter), **To handle** (merge suggestions + drafts). Equal-height cards, click-to-filter like the Store pages.

### Filter bar (`PageFilterBar`)
- Search: product name / SPU code / platform SKU.
- Store + listing toggle: "listed on / **not listed on** [store]" — the "not listed" axis surfaces distribution gaps to fill.
- Listing status: listed / draft / not-listed / delisted.
- Stock: all / healthy / low / out.
- No inline widths — rely on the shared filter-bar sizing.

### Main table — one row per master product
| Column | Content |
|---|---|
| Product | thumbnail + name + SPU code + (`AI` / `Manual` tag) |
| Category | master category |
| Cost | master cost |
| Price range | min–max across listings (e.g. ¥39.99–¥45.99) |
| **Distribution** | platform chips: PDD ✓ Taobao ✓ JD ✗ (green=listed / amber=draft / gray=not listed / red=delisted) + "2/3 stores" |
| Stock | shared pool total + low/out dot; sortable |
| Actions | expand ▸ · List to store · Edit |

The distribution chips should be a reusable `ListingDistribution` component.

### Expanded row — per-store listing matrix
Expanding a row reveals `Store | Status | Price | Stock (mode) | Platform SKU | Last synced | Actions`. It lists both **stores that have a listing** and **stores that don't** (the latter with a "List to this store" CTA), so the cross-store picture is visible at a glance.

### Product detail page `/products/:productId` (tabs, like Store detail)
- **Distribution** — full per-store matrix + bulk listing.
- **Product info** — master attributes (name/images/category/cost/description), each with a provenance tag ("from [store] · AI" or "manually edited"), editable; primary store switchable.
- **Inventory** — total pool + per-store allocation table (shared shows available = pool − safety; independent shows allocation), with a pool-usage visualization.

### Create flow (master-first)
`New product ▾`: **Manual** (SPU code / name / images / category / cost / total stock → a master with zero listings) or **Upload & recognize** (AI-seeded master). After creation, land on the detail page with a prominent "List it" CTA.

### List-to-store action (reuse the cross-platform migration flow)
Triggered from a list row, the matrix, or right after creation. Opens the onboarding migration flow prefilled (master + target store): category mapping + suggested price + **inventory-mode choice (shared/independent)** + content adaptation → draft listing → review → publish. No new wheel — consistent with onboarding.

### Merge-review queue ("possible duplicates")
A "To merge (n)" tab: each suggestion shows candidate masters side by side (image/title/price/source store) with confidence + matching factors, and Merge / Dismiss actions. The 60–95% band is confirmed here; ≥95%/same-SPU are auto-merged and don't appear. Reuse the migration flow's confidence-tag visual language.

### Tabs & empty states
- Tabs: All products / To merge (n) / Drafts (n) — drafts = listings awaiting publish/review (read-only here if folded into the Action Inbox).
- Empty states: no store → store-connection empty state; connected but unsynced → "No products yet" + Sync now + New product; zero-listing master → prominent "List it".

### Consistency & responsive
Reuse the shared components and tokens; equal-height cards; no inline widths (lessons from the Store pages). Mobile: chips wrap, the matrix collapses into stacked cards, the sync strip compacts.

---

## 3. Phasing

- **P0** — the two-layer types + mock data (including a product listed across multiple stores, with one store not listed) + main table (one row per master) + distribution chips column + expandable matrix + redefined KPIs.
- **P1** — sync strip + list-to-store (wired to migration) + product detail page (three tabs).
- **P2** — merge-review queue + create-flow polish + folding drafts into the Action Inbox.
