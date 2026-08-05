/**
 * File: StoreCard.tsx
 * Purpose: One store rendered as a rich, "AI-native" card for the store overview wall.
 * Three stacked layers:
 *   ① business pulse — today's GMV + 7-day sparkline + orders / ROAS / GMV share
 *   ② AI pulse       — what the Agents did for this store today (or why they paused)
 *   ③ AI health      — one composite score + one plain verdict + one next step
 *
 * Created: 2026-08-05
 */
import { PauseCircleOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../app/i18n';
import type { Store, StoreBusinessDetail } from '../../types/domain';
import type { StoreHealth, StoreHealthTone } from '../../utils/storeHealth';
import { getPlatformName, renderSessionTag } from '../../utils/storeDisplay';

const TONE_COLOR: Record<StoreHealthTone, string> = {
  good: 'var(--ark-green)',
  warn: 'var(--ark-orange)',
  bad: 'var(--ark-red)',
  idle: 'var(--ark-muted)',
};

/** Tiny inline GMV trend line. Returns a flat dashed baseline when there's no data. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 96;
  const h = 36;
  if (values.length < 2) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <line x1={0} y1={h - 2} x2={w} y2={h - 2} stroke="var(--ark-border)" strokeWidth={2} strokeDasharray="2 3" />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 6);
    return { x, y };
  });
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }} aria-hidden>
      <polyline
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill={color} />
    </svg>
  );
}

/** Circular 0–100 health gauge. Shows a dashed placeholder ring when score is null. */
function HealthRing({ score, color }: { score: number | null; color: string }) {
  const r = 19;
  const circumference = 2 * Math.PI * r;
  if (score == null) {
    return (
      <svg width={46} height={46} viewBox="0 0 46 46" aria-hidden>
        <circle cx={23} cy={23} r={r} fill="none" stroke="var(--ark-border)" strokeWidth={4} strokeDasharray="4 4" />
        <text x={23} y={27} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--ark-muted)">
          —
        </text>
      </svg>
    );
  }
  const offset = circumference * (1 - score / 100);
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" aria-hidden>
      <circle cx={23} cy={23} r={r} fill="none" stroke="var(--ark-border)" strokeWidth={4} />
      <circle
        cx={23}
        cy={23}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 23 23)"
      />
      <text x={23} y={27} textAnchor="middle" fontSize={14} fontWeight={500} fill="var(--ark-ink)">
        {score}
      </text>
    </svg>
  );
}

interface StoreCardProps {
  store: Store;
  biz?: StoreBusinessDetail;
  gmvShare: number;
  health: StoreHealth;
}

export function StoreCard({ store, biz, gmvShare, health }: StoreCardProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toneColor = TONE_COLOR[health.tone];

  const gmv = biz?.gmv.today ?? 0;
  const yesterday = biz?.gmv.yesterday ?? 0;
  const deltaPct = yesterday > 0 ? Math.round(((gmv - yesterday) / yesterday) * 100) : 0;
  const trendValues = (biz?.gmv.trend ?? []).map((p) => p.value);

  const connected = store.status === 'connected';
  const sessionBroken = store.status === 'login_required' || store.status === 'expired';
  const roas = biz?.adMetrics.roas ?? 0;
  const activity = biz?.aiActivity;

  // Card border leans on the health tone so a whole card reads at a glance.
  const borderColor = health.tone === 'good' ? 'var(--ark-border)' : toneColor;

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        background: 'var(--ark-panel)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header: identity + session pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => navigate(`/stores/${store.id}`)}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ark-ink)' }}>{store.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ark-muted)' }}>
              {getPlatformName(store.platform)} · {t(`stores.auth${store.authMethod === 'api_key' ? 'ApiKey' : store.authMethod === 'oauth' ? 'Oauth' : 'Credentials'}`)}
            </div>
          </div>
        </div>
        {renderSessionTag(store.status, t)}
      </div>

      {/* Layer ①: GMV headline + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ark-muted)', marginBottom: 2 }}>{t('stores.todayGmv')}</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--ark-ink)', letterSpacing: '-0.5px' }}>
            ¥{gmv.toLocaleString()}
          </div>
          {sessionBroken ? (
            <div style={{ fontSize: 12, color: 'var(--ark-muted)', marginTop: 2 }}>{t('storecard.dataIncomplete')}</div>
          ) : connected ? (
            <div style={{ fontSize: 12, color: deltaPct >= 0 ? 'var(--ark-green)' : 'var(--ark-red)', marginTop: 2 }}>
              {deltaPct >= 0 ? <RiseOutlined /> : <FallOutlined />} {deltaPct >= 0 ? '+' : ''}
              {deltaPct}% {t('storecard.vsYesterday')}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ark-muted)', marginTop: 2 }}>{t('storecard.awaitingAuth')}</div>
          )}
        </div>
        <Sparkline
          values={connected ? trendValues : []}
          color={deltaPct >= 0 ? 'var(--ark-green)' : 'var(--ark-red)'}
        />
      </div>

      {/* Layer ①: three mini metrics */}
      <div style={{ display: 'flex', gap: 8 }}>
        <MiniMetric label={t('stores.todayOrders')} value={`${biz?.orders.today ?? '—'}`} />
        <MiniMetric
          label="ROAS"
          value={roas > 0 ? `${roas.toFixed(1)}×` : '—'}
          color={roas >= 5 ? 'var(--ark-green)' : undefined}
        />
        <MiniMetric label={t('storecard.gmvShare')} value={`${gmvShare}%`} />
      </div>

      {/* Layer ②: AI pulse / paused / idle */}
      {connected && activity ? (
        <div
          style={{
            border: '1px solid color-mix(in srgb, var(--ark-blue) 30%, var(--ark-panel))',
            background: 'color-mix(in srgb, var(--ark-blue) 8%, var(--ark-panel))',
            borderRadius: 8,
            padding: '9px 11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ark-blue)', marginBottom: 4 }}>
            <ThunderboltOutlined />
            {t('storecard.aiPulseTitle')}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ark-blue)', lineHeight: 1.5 }}>
            {t('storecard.aiPulse', {
              price: activity.priceAdjustments,
              cs: activity.csReplies,
              risk: activity.riskIntercepts,
              hours: activity.hoursSaved,
            })}
          </div>
        </div>
      ) : sessionBroken ? (
        <div style={{ border: '1px solid var(--ark-border)', background: 'var(--ark-panel-soft)', borderRadius: 8, padding: '9px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ark-muted)', marginBottom: 4 }}>
            <PauseCircleOutlined />
            {t('storecard.aiPausedTitle')}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ark-muted)', lineHeight: 1.5 }}>{t('storecard.aiPausedDesc')}</div>
        </div>
      ) : (
        <div
          style={{
            border: '1px dashed var(--ark-border)',
            borderRadius: 8,
            padding: '9px 11px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--ark-muted)', lineHeight: 1.5 }}>{t('storecard.aiIdleDesc')}</div>
        </div>
      )}

      {/* Layer ③: AI health verdict + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--ark-border)', paddingTop: 12 }}>
        <HealthRing score={health.score} color={toneColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--ark-muted)', marginBottom: 2 }}>{t('storecard.healthTitle')}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ark-ink)' }}>
            {t(health.verdictKey, health.verdictParams)}{' '}
            {health.action && (
              <a
                onClick={() => navigate(health.action!.to)}
                style={{ color: health.tone === 'bad' ? 'var(--ark-red)' : 'var(--ark-blue)', cursor: 'pointer' }}
              >
                {t(health.action.labelKey)}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, border: '1px solid var(--ark-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ark-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: color ?? 'var(--ark-ink)' }}>{value}</div>
    </div>
  );
}
