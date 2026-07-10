import { useQuery } from '@tanstack/react-query';
import { Button, Card, List, Switch, Typography } from 'antd';
import { settingsApi } from '../../api/settings';
import { useI18n } from '../../app/i18n';
import { DescriptionPanel } from '../../components/detail/DescriptionPanel';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';

export function NotificationsSettingsPage() {
  const { t } = useI18n();
  const { data = [] } = useQuery({ queryKey: ['notifications'], queryFn: settingsApi.notifications });
  return (
    <div className="page-stack">
      <PageHeader
        title={t('settings.notificationsTitle')}
        description={t('settings.notificationsDescription')}
        actions={<Button type="primary">{t('settings.addChannel')}</Button>}
      />
      <Card>
        <List
          dataSource={data}
          locale={{ emptyText: <EmptyState description={t('common.emptyList')} /> }}
          renderItem={(item) => (
            <List.Item extra={<Switch checked={item.status === 'connected'} />}>
              <List.Item.Meta title={item.channel} description={`${t('settings.events')}: ${item.events}`} />
            </List.Item>
          )}
        />
      </Card>
      <DescriptionPanel
        title={t('settings.defaultPolicy')}
        column={1}
        size="default"
        items={[
          { label: t('settings.eventApprovalRequired'), value: t('settings.policyApprovalRequired') },
          { label: t('settings.eventLoginRequired'), value: t('settings.policyLoginRequired') },
          { label: t('settings.eventRunFailed'), value: t('settings.policyRunFailed') },
        ]}
      />
    </div>
  );
}
