/**
 * File: storeHealth.ts
 * Purpose: Compose a single AI "health" read-out for a store from its real business
 * signals (session, inventory, after-sales, ad performance) so the store card can show
 * one score + one plain-language verdict + one next step — instead of making the
 * merchant read a wall of numbers. This is the "AI 化" layer of the store card wall.
 *
 * Created: 2026-08-05
 */
import type { Store, StoreBusinessDetail } from '../types/domain';

export type StoreHealthTone = 'good' | 'warn' | 'bad' | 'idle';

export interface StoreHealthAction {
  labelKey: string;
  to: string;
}

export interface StoreHealth {
  /** 0–100, or null when the store isn't authorized yet (nothing to score). */
  score: number | null;
  tone: StoreHealthTone;
  /** i18n key for the one-line verdict. */
  verdictKey: string;
  verdictParams?: Record<string, string | number>;
  /** The single most useful next step for this store. */
  action?: StoreHealthAction;
}

/** Campaigns earning below this ROI are treated as leaking spend. */
const TARGET_ROAS = 3;

/**
 * Turns a store's real signals into one score + verdict + next step.
 *
 * The verdict surfaces the single worst actionable issue (worst-first), so the card
 * always points at exactly one thing to do — consistent with the platform's
 * "results-first, one clear decision" methodology.
 */
export function computeStoreHealth(store: Store, biz?: StoreBusinessDetail): StoreHealth {
  // Not yet usable — there is nothing to score until the store is authorized.
  if (store.status === 'pending_login') {
    return {
      score: null,
      tone: 'idle',
      verdictKey: 'storecard.verdictPending',
      action: { labelKey: 'storecard.actionConnect', to: `/stores/${store.id}` },
    };
  }
  if (store.status === 'revoked') {
    return {
      score: null,
      tone: 'idle',
      verdictKey: 'storecard.verdictRevoked',
      action: { labelKey: 'storecard.actionConnect', to: `/stores/${store.id}` },
    };
  }

  const outOfStock = biz?.inventory.outOfStockCount ?? 0;
  const lowStock = biz?.inventory.lowStockCount ?? 0;
  const pendingDisputes = biz?.afterSales.disputes.pending ?? 0;
  const unresolvedReviews = biz?.afterSales.unresolvedReviews ?? 0;
  const rating = biz?.afterSales.storeRating ?? 5;
  // A paused campaign is one the Agent has already acted on — only still-open ones count.
  const weakCampaigns = (biz?.adMetrics.campaigns ?? []).filter(
    (c) => c.status === 'warning' || (c.status === 'active' && c.roi < TARGET_ROAS)
  );

  let score = 100;
  score -= Math.min(outOfStock * 2, 8);
  score -= Math.min(Math.round(lowStock / 2), 4);
  score -= pendingDisputes * 4;
  score -= unresolvedReviews * 3;
  score -= weakCampaigns.length * 3;
  if (rating < 4.5) score -= Math.round((4.5 - rating) * 8);

  // A broken session dominates: the Agents can't act, and the numbers may be stale.
  const sessionBroken = store.status === 'login_required' || store.status === 'expired';
  if (sessionBroken) score -= 30;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (sessionBroken) {
    return {
      score,
      tone: 'bad',
      verdictKey: 'storecard.verdictSessionBroken',
      action: { labelKey: 'storecard.actionRelogin', to: `/stores/${store.id}` },
    };
  }

  const tone: StoreHealthTone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';

  if (outOfStock > 0) {
    return {
      score,
      tone,
      verdictKey: 'storecard.verdictRestock',
      verdictParams: { count: outOfStock },
      action: { labelKey: 'storecard.actionRestock', to: '/products' },
    };
  }
  const reviewLoad = pendingDisputes + unresolvedReviews;
  if (reviewLoad > 0) {
    return {
      score,
      tone,
      verdictKey: 'storecard.verdictReviews',
      verdictParams: { count: reviewLoad },
      action: { labelKey: 'storecard.actionReviews', to: '/inbox' },
    };
  }
  if (weakCampaigns.length > 0) {
    return {
      score,
      tone,
      verdictKey: 'storecard.verdictAdRoi',
      verdictParams: { name: weakCampaigns[0].name },
      action: { labelKey: 'storecard.actionAdRoi', to: '/inbox' },
    };
  }
  if (lowStock > 0) {
    return {
      score,
      tone,
      verdictKey: 'storecard.verdictLowStock',
      verdictParams: { count: lowStock },
      action: { labelKey: 'storecard.actionRestock', to: '/products' },
    };
  }
  return {
    score,
    tone,
    verdictKey: 'storecard.verdictHealthy',
    action: { labelKey: 'storecard.actionView', to: `/stores/${store.id}` },
  };
}
