/**
 * File: ListingDistribution.tsx
 * Purpose: Reusable per-store listing-status chip row (D6, product-design.md §3.14.2).
 * Green = listed, amber = draft/pending review, red = delisted, gray = not listed
 * (derived — no listing row exists for that store). Shared by the product list's
 * "铺货状态" column and the per-store expand matrix.
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 *
 * Main exports:
 * - ListingDistribution: renders one chip per merchant store plus a "listed on x/y" summary.
 */
import { Space, Tag, Typography } from 'antd';
import type { ListingStatus, ProductListing, Store } from '../../types/domain';

const STATUS_COLOR: Record<ListingStatus, string> = {
  listed: 'green',
  draft: 'gold',
  pending_review: 'gold',
  delisted: 'red',
};

const STATUS_MARK: Record<ListingStatus, string> = {
  listed: '✓',
  draft: '…',
  pending_review: '…',
  delisted: '⊘',
};

interface ListingDistributionProps {
  /** All merchant stores — the universe distribution is measured against. */
  stores: Store[];
  /** This product's listings (a subset; at most one per store). */
  listings: ProductListing[];
  /** Compact mode truncates store names to fit narrow table cells. */
  compact?: boolean;
}

/**
 * Renders one status chip per merchant store, plus a "listed on x of y stores" summary.
 *
 * @param stores - All merchant stores.
 * @param listings - This product's listings.
 * @param compact - Truncates chip labels for table-cell density.
 * @returns React element with the chip row and summary text.
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 */
export function ListingDistribution({ stores, listings, compact = false }: ListingDistributionProps) {
  const listingByStoreId = new Map(listings.map((l) => [l.storeId, l]));
  const listedCount = stores.filter((store) => listingByStoreId.get(store.id)?.status === 'listed').length;

  return (
    <Space size={4} wrap>
      {stores.map((store) => {
        const listing = listingByStoreId.get(store.id);
        const color = listing ? STATUS_COLOR[listing.status] : 'default';
        const mark = listing ? STATUS_MARK[listing.status] : '✗';
        const label = compact ? store.name.slice(0, 2) : store.name;
        return (
          <Tag key={store.id} color={color} style={{ marginInlineEnd: 0 }}>
            {label} {mark}
          </Tag>
        );
      })}
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        {listedCount}/{stores.length} 店铺
      </Typography.Text>
    </Space>
  );
}
