/**
 * File: ListingMatrix.tsx
 * Purpose: Reusable per-store listing matrix (product-design.md §3.14.3/§3.14.4) — lists
 * every merchant store with this product's listing status, price, stock, platform SKU,
 * and last-synced time. Stores with no listing get a "list to this store" CTA. Shared by
 * the product list's expand row and the product detail page's Distribution tab.
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 *
 * Main exports:
 * - ListingMatrix: renders the per-store table with lifecycle actions.
 */
import { Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useI18n } from '../../app/i18n';
import { TableActionGroup } from '../table/TableActionGroup';
import type { AllMallId, ListingStatus, Product, ProductListing, Store } from '../../types/domain';
import { listingAvailableStock } from '../../types/domain';

const LISTING_STATUS_COLOR: Record<ListingStatus, string> = { listed: 'green', draft: 'gold', pending_review: 'gold', delisted: 'red' };

interface ListingMatrixRow {
  store: Store;
  listing?: ProductListing;
}

interface ListingMatrixProps {
  product: Product;
  stores: Store[];
  listings: ProductListing[];
  onListToStore: (storeId: AllMallId) => void;
  onSubmitForReview: (listingId: AllMallId) => void;
  onPublish: (listingId: AllMallId) => void;
  onDelist: (listingId: AllMallId) => void;
  size?: 'small' | 'middle';
}

/**
 * Renders the full per-store listing matrix for one product, including stores that
 * don't have a listing yet (derived — no stored "not listed" state, per D6).
 *
 * @param product - The master product (needed to derive available stock per listing).
 * @param stores - All merchant stores.
 * @param listings - This product's listings.
 * @param onListToStore - Opens the list-to-store wizard for a store with no listing.
 * @param onSubmitForReview - Advances a draft listing to pending_review.
 * @param onPublish - Advances a pending_review listing to listed.
 * @param onDelist - Moves a listed listing to delisted.
 * @param size - Table density; defaults to 'small' for the inline expand-row usage.
 * @returns React element containing the per-store table.
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 */
export function ListingMatrix({ product, stores, listings, onListToStore, onSubmitForReview, onPublish, onDelist, size = 'small' }: ListingMatrixProps) {
  const { t } = useI18n();
  const listingByStoreId = new Map(listings.map((l) => [l.storeId, l]));
  const rows: ListingMatrixRow[] = stores.map((store) => ({ store, listing: listingByStoreId.get(store.id) }));

  const columns: ColumnsType<ListingMatrixRow> = [
    { title: t('products.store'), key: 'store', render: (_: unknown, row) => row.store.name },
    {
      title: t('products.status'), key: 'status',
      render: (_: unknown, row) => row.listing
        ? <Tag color={LISTING_STATUS_COLOR[row.listing.status]}>{t(`listing.${row.listing.status}`)}</Tag>
        : <Tag>{t('listing.notListed')}</Tag>
    },
    { title: t('products.price'), key: 'price', align: 'right', render: (_: unknown, row) => row.listing ? `¥${row.listing.sellingPrice.toFixed(2)}` : '-' },
    {
      title: t('products.stock'), key: 'stock', align: 'right',
      render: (_: unknown, row) => row.listing ? `${listingAvailableStock(product, row.listing)} (${t(`listing.mode_${row.listing.inventoryMode}`)})` : '-'
    },
    { title: t('listing.platformSku'), key: 'sku', render: (_: unknown, row) => row.listing?.platformSkuRef ?? '-' },
    { title: t('listing.lastSynced'), key: 'sync', render: (_: unknown, row) => row.listing ? dayjs(row.listing.lastSyncedAt).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: t('common.actions'), key: 'actions',
      render: (_: unknown, row) => {
        if (!row.listing) {
          return <Button size="small" type="link" onClick={() => onListToStore(row.store.id)} style={{ padding: 0 }}>{t('listing.listToThisStore')}</Button>;
        }
        const listing = row.listing;
        return (
          <TableActionGroup>
            {listing.status === 'draft' && <Button size="small" onClick={() => onSubmitForReview(listing.id)}>{t('listing.submitForReview')}</Button>}
            {listing.status === 'pending_review' && <Button size="small" type="primary" onClick={() => onPublish(listing.id)}>{t('listing.publish')}</Button>}
            {listing.status === 'listed' && <Button size="small" danger onClick={() => onDelist(listing.id)}>{t('listing.delist')}</Button>}
          </TableActionGroup>
        );
      }
    },
  ];

  return <Table<ListingMatrixRow> rowKey={(row) => row.store.id} size={size} pagination={false} columns={columns} dataSource={rows} />;
}
