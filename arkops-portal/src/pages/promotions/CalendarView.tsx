/**
 * Promotion Calendar View — V1.1
 * Month calendar showing campaign badges on their active dates.
 */
import { Calendar, Badge, Tooltip, Typography, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useI18n } from '../../app/i18n';
import type { PromotionCampaign, Store } from '../../types/domain';

interface Props {
  campaigns: PromotionCampaign[];
  stores: Store[];
}

const TYPE_COLORS: Record<string, string> = {
  flash_sale: '#ff4d4f',
  seckill: '#f5222d',
  coupon: '#faad14',
  bundle: '#722ed1',
  full_reduction: '#1890ff',
};

export function CalendarView({ campaigns, stores }: Props) {
  const { t } = useI18n();
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const dateRender = (date: Dayjs) => {
    const dayCampaigns = campaigns.filter((c) => {
      const start = dayjs(c.startDate);
      const end = dayjs(c.endDate);
      return date.isAfter(start.subtract(1, 'day')) && date.isBefore(end.add(1, 'day'));
    });

    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <div style={{ fontSize: 12, marginBottom: 2, textAlign: 'right', paddingRight: 4 }}>
          {date.date()}
        </div>
        {dayCampaigns.slice(0, 3).map((c) => (
          <Tooltip key={c.id} title={`${c.name}\n${storeById.get(c.storeId)?.name ?? ''}\n${dayjs(c.startDate).format('MM/DD')} - ${dayjs(c.endDate).format('MM/DD')}`}>
            <div style={{
              fontSize: 10, lineHeight: '16px', padding: '0 3px', marginBottom: 1,
              background: TYPE_COLORS[c.type] ?? 'var(--ark-purple)',
              color: '#fff', borderRadius: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}>
              {c.name}
            </div>
          </Tooltip>
        ))}
        {dayCampaigns.length > 3 && (
          <Typography.Text type="secondary" style={{ fontSize: 10, paddingLeft: 3 }}>
            +{dayCampaigns.length - 3} {t('promotions.more')}
          </Typography.Text>
        )}
      </div>
    );
  };

  return (
    <Calendar
      dateCellRender={dateRender}
      style={{ background: 'var(--ark-bg-surface)', borderRadius: 8, padding: 16 }}
    />
  );
}
