/**
 * File: StoreAiHealthBanner.tsx
 * Purpose: The store detail page's "catch" for the overview card — it repeats the
 * same AI health read-out (score + verdict + next step) and AI pulse the merchant
 * saw on the card, so clicking a card lands on the same AI narrative before the
 * supporting business data. Keeps the card→detail flow one continuous story.
 *
 * Created: 2026-08-05
 */
import { PauseCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../app/i18n';
import type { Store, StoreBusinessDetail } from '../../types/domain';
import { computeStoreHealth } from '../../utils/storeHealth';
import { HealthRing, TONE_COLOR } from './storeHealthVisuals';

function PulseStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--ark-ink)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ark-muted)' }}>{label}</div>
    </div>
  );
}

export function StoreAiHealthBanner({ store, biz }: { store: Store; biz?: StoreBusinessDetail }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const health = computeStoreHealth(store, biz);
  const toneColor = TONE_COLOR[health.tone];

  const connected = store.status === 'connected';
  const sessionBroken = store.status === 'login_required' || store.status === 'expired';
  const activity = biz?.aiActivity;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        gap: 16,
        border: `1px solid ${health.tone === 'good' ? 'var(--ark-border)' : toneColor}`,
        borderRadius: 12,
        background: `color-mix(in srgb, ${toneColor} 5%, var(--ark-panel))`,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* AI health verdict + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 320px', minWidth: 260 }}>
        <HealthRing score={health.score} color={toneColor} size={56} />
        <div>
          <div style={{ fontSize: 12, color: 'var(--ark-muted)', marginBottom: 3 }}>{t('storecard.healthTitle')}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ark-ink)' }}>
            {t(health.verdictKey, health.verdictParams)}{' '}
            {health.action && (
              <a
                onClick={() => navigate(health.action!.to)}
                style={{ color: health.tone === 'bad' ? 'var(--ark-red)' : 'var(--ark-blue)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {t(health.action.labelKey)}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* AI pulse — what the Agents did today, or why they're not acting */}
      <div
        style={{
          flex: '1 1 340px',
          minWidth: 280,
          borderLeft: '1px solid var(--ark-border)',
          paddingLeft: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {connected && activity ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ark-blue)', marginBottom: 10 }}>
              <ThunderboltOutlined />
              {t('storecard.aiPulseTitle')}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <PulseStat label={t('storecard.pulsePrice')} value={activity.priceAdjustments} />
              <PulseStat label={t('storecard.pulseCs')} value={activity.csReplies} />
              <PulseStat label={t('storecard.pulseRisk')} value={activity.riskIntercepts} />
              <PulseStat label={t('storecard.pulseHours')} value={`${activity.hoursSaved}h`} />
            </div>
          </>
        ) : sessionBroken ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ark-muted)', marginBottom: 6 }}>
              <PauseCircleOutlined />
              {t('storecard.aiPausedTitle')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ark-muted)', lineHeight: 1.5 }}>{t('storecard.aiPausedDesc')}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--ark-muted)', lineHeight: 1.5 }}>{t('storecard.aiIdleDesc')}</div>
        )}
      </div>
    </div>
  );
}
