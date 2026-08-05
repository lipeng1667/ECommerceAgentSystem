/**
 * File: storeHealthVisuals.tsx
 * Purpose: Shared visual atoms for the store "AI health" read-out — the tone→token
 * color map and the circular 0–100 gauge — used by both the overview card
 * (StoreCard) and the detail-page banner (StoreAiHealthBanner) so a store's score
 * looks identical wherever it appears.
 *
 * Created: 2026-08-05
 */
import type { StoreHealthTone } from '../../utils/storeHealth';

export const TONE_COLOR: Record<StoreHealthTone, string> = {
  good: 'var(--ark-green)',
  warn: 'var(--ark-orange)',
  bad: 'var(--ark-red)',
  idle: 'var(--ark-muted)',
};

/** Circular 0–100 health gauge. Shows a dashed placeholder ring when score is null. */
export function HealthRing({ score, color, size = 46 }: { score: number | null; color: string; size?: number }) {
  const center = size / 2;
  const r = center - 4;
  const circumference = 2 * Math.PI * r;
  const fontSize = Math.round(size * 0.3);
  if (score == null) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--ark-border)" strokeWidth={4} strokeDasharray="4 4" />
        <text x={center} y={center + fontSize / 3} textAnchor="middle" fontSize={fontSize - 1} fontWeight={500} fill="var(--ark-muted)">
          —
        </text>
      </svg>
    );
  }
  const offset = circumference * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={center} cy={center} r={r} fill="none" stroke="var(--ark-border)" strokeWidth={4} />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center + fontSize / 3} textAnchor="middle" fontSize={fontSize} fontWeight={500} fill="var(--ark-ink)">
        {score}
      </text>
    </svg>
  );
}
