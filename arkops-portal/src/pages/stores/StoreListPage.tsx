import { AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, CloudSyncOutlined, ExclamationCircleOutlined, EyeOutlined, LoginOutlined, PayCircleOutlined, ShopOutlined, ShoppingCartOutlined, TableOutlined, WifiOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Input, Segmented, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storeBusinessApi } from '../../api/storeBusiness';
import { storesApi } from '../../api/stores';
import { useAuth } from '../../app/auth';
import { useI18n } from '../../app/i18n';
import { PageFilterBar } from '../../components/filters/PageFilterBar';
import { PageHeader } from '../../components/PageHeader';
import { StoreConnectionEmptyState } from '../../components/StoreConnectionEmptyState';
import { DataTableCard } from '../../components/table/DataTableCard';
import { TableActionGroup } from '../../components/table/TableActionGroup';
import type { Store } from '../../types/domain';
import { SERVICE_ICONS, getExpiringInDays, getPlatformName, getSessionHealthColor, renderSessionTag } from '../../utils/storeDisplay';
import { computeStoreHealth } from '../../utils/storeHealth';
import { StoreCard } from './StoreCard';

const SESSION_DOT_COLOR: Record<string, string> = {
  green: 'var(--ark-green)',
  red: 'var(--ark-red)',
  orange: 'var(--ark-orange)',
};

export function StoreListPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });
  // Item 3: GMV/orders keyed by store id instead of a hardcoded store-name map,
  // so renaming or adding a store no longer breaks the match.
  const { data: businessDetails = [] } = useQuery({ queryKey: ['storeBusiness', 'list'], queryFn: storeBusinessApi.list });
  const businessByStoreId = useMemo(
    () => new Map(businessDetails.map((detail) => [detail.storeId, detail])),
    [businessDetails]
  );

  const [keyword, setKeyword] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // GMV share is relative to the whole account, so it's computed across all stores
  // (not just the filtered subset) — a store's slice of the pie doesn't change when
  // you type in the search box.
  const totalGmv = useMemo(
    () => businessDetails.reduce((sum, d) => sum + (d.gmv.today ?? 0), 0),
    [businessDetails]
  );

  const platformOptions = useMemo(() => {
    const platforms = Array.from(new Set(data.map((store) => store.platform)));
    return platforms.map((platform) => ({ value: platform, label: getPlatformName(platform) }));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((store) => {
      if (keyword && !store.name.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (platformFilter && store.platform !== platformFilter) return false;
      return true;
    });
  }, [data, keyword, platformFilter]);

  const columns: ColumnsType<Store> = [
    { title: t('stores.store'), dataIndex: 'name', render: (name, record) => <Link to={`/stores/${record.id}`}>{name}</Link> },
    { title: t('stores.platform'), dataIndex: 'platform', render: (platform: string) => getPlatformName(platform) },
    { title: t('stores.authMethod'), dataIndex: 'authMethod', render: (method: Store['authMethod']) => {
      const map: Record<string, string> = { credentials: t('stores.authCredentials'), api_key: t('stores.authApiKey'), oauth: t('stores.authOauth') };
      return <Tag>{map[method] ?? method}</Tag>;
    }},
    {
      title: t('stores.todayGmv'),
      key: 'todayGmv',
      sorter: (a, b) => (businessByStoreId.get(a.id)?.gmv.today ?? 0) - (businessByStoreId.get(b.id)?.gmv.today ?? 0),
      render: (_: unknown, record: Store) => {
        const gmv = businessByStoreId.get(record.id)?.gmv.today;
        return <span><PayCircleOutlined style={{ marginRight: 4, color: 'var(--ark-green)' }} />¥{gmv != null ? gmv.toLocaleString() : '-'}</span>;
      }
    },
    {
      title: t('stores.todayOrders'),
      key: 'todayOrders',
      width: 116,
      sorter: (a, b) => (businessByStoreId.get(a.id)?.orders.today ?? 0) - (businessByStoreId.get(b.id)?.orders.today ?? 0),
      render: (_: unknown, record: Store) => {
        const orders = businessByStoreId.get(record.id)?.orders.today;
        return <span><ShoppingCartOutlined style={{ marginRight: 4, color: 'var(--ark-blue)' }} />{orders ?? '-'}</span>;
      }
    },
    { title: <><WifiOutlined /> {t('stores.session')}</>, dataIndex: 'status', render: (_status: string, record: Store) => (
      <Space size={4}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: SESSION_DOT_COLOR[getSessionHealthColor(record.status)] ?? 'var(--ark-muted)',
          flexShrink: 0
        }} />
        {renderSessionTag(record.status, t)}
      </Space>
    )},
    {
      title: t('stores.enabledServices'),
      dataIndex: 'connections',
      render: (connections: Store['connections']) => {
        if (!connections || connections.length === 0) return <Typography.Text type="secondary">-</Typography.Text>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {connections.map((c) => (
              <Tag key={c.id} icon={SERVICE_ICONS[c.serviceType] ?? SERVICE_ICONS.other}>
                {c.serviceName}
              </Tag>
            ))}
          </div>
        );
      }
    },
    {
      // Item 4 + 6: quick fix action for unhealthy sessions, plus a settings shortcut.
      // Revoke intentionally stays out of the list row actions — it opens a
      // dedicated confirm-with-consequences modal on the detail page (A8) and
      // shouldn't be a one-click list action.
      title: t('common.actions'),
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Store) => {
        const needsRelogin = record.status === 'login_required' || record.status === 'expired';
        const needsReauth = record.status === 'revoked';
        return (
          <TableActionGroup>
            {(needsRelogin || needsReauth) && (
              <Button size="small" type="primary" icon={<LoginOutlined />} onClick={() => navigate(`/stores/${record.id}`)}>
                {needsReauth ? t('storewizard.reauthorize') : t('stores.reloginNow')}
              </Button>
            )}
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/stores/${record.id}`)}>
              {t('stores.viewAction')}
            </Button>
          </TableActionGroup>
        );
      }
    }
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title={t('stores.title')}
        description={t('stores.description')}
        actions={
          /* D7: single primary CTA — "高级接入" removed from top level and folded
             into the onboarding wizard's "安全连接" step as a context fallback. */
          <Button type="primary" icon={<CloudSyncOutlined />} onClick={() => navigate('/stores/onboarding?journey=import')}>
            {t('storewizard.connectStoreCta')}
          </Button>
        }
      />
      {user?.experience === 'onboarding' ? (
        <StoreConnectionEmptyState description="你还没有连接任何店铺。完成授权后，店铺、商品、订单、评价和库存会自动同步到这里。" />
      ) : (
        <>
          {/* D7: store health summary bar — shows at-a-glance counts and
              pushes unhealthy stores to the top of the user's attention. */}
          {data.length > 0 && (() => {
            const online = data.filter((s) => s.status === 'connected').length;
            const needsRelogin = data.filter((s) => s.status === 'login_required' || s.status === 'expired').length;
            // D7.3: proactive expiry warning — connected stores whose session runs out soon.
            const expiringSoon = data.filter((s) => getExpiringInDays(s) !== undefined).length;
            const pending = data.filter((s) => s.status === 'pending_login').length;
            const revoked = data.filter((s) => s.status === 'revoked').length;
            return (
              <Card
                size="small"
                style={{ marginBottom: 16 }}
                styles={{
                  body: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    padding: '8px 16px'
                  }
                }}
              >
                <Space size={4} wrap>
                  <ShopOutlined />
                  <Typography.Text strong>{data.length} {t('stores.healthTotalStores')}</Typography.Text>
                  <span style={{ color: 'var(--ark-muted)' }}>·</span>
                  <CheckCircleOutlined style={{ color: 'var(--ark-green)' }} />
                  <Typography.Text>{online} {t('stores.healthOnline')}</Typography.Text>
                </Space>
                {needsRelogin > 0 && (
                  <Button
                    type="link"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => navigate('/inbox?type=store')}
                    style={{ color: 'var(--ark-red)', padding: 0 }}
                  >
                    {needsRelogin} {t('stores.healthNeedsRelogin')} → {t('stores.healthGoHandle')}
                  </Button>
                )}
                {/* Shown alongside the re-login count, not instead of it: "expiring soon"
                    is a different, still-actionable state and links to the same queue. */}
                {expiringSoon > 0 && (
                  <Button
                    type="link"
                    icon={<ClockCircleOutlined />}
                    onClick={() => navigate('/inbox?type=store')}
                    style={{ color: 'var(--ark-orange)', padding: 0, fontSize: 12 }}
                  >
                    {expiringSoon} {t('stores.healthExpiringSoon')} → {t('stores.healthGoHandle')}
                  </Button>
                )}
                {pending > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {pending} {t('stores.healthPending')}
                  </Typography.Text>
                )}
                {revoked > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {revoked} {t('stores.healthRevoked')}
                  </Typography.Text>
                )}
                <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                  {t('stores.healthAutoCheck')}
                </Typography.Text>
              </Card>
            );
          })()}
          {/* Shared controls: view switch on the left, filters on the right —
              both views read the same keyword/platform state. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'cards' | 'table')}
              options={[
                { value: 'cards', label: t('storecard.viewCards'), icon: <AppstoreOutlined /> },
                { value: 'table', label: t('storecard.viewTable'), icon: <TableOutlined /> },
              ]}
            />
            <div style={{ flex: 1 }} />
            <PageFilterBar>
              <Input.Search
                placeholder={t('stores.searchPlaceholder')}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
              <Select
                placeholder={t('stores.allPlatforms')}
                allowClear
                value={platformFilter}
                onChange={setPlatformFilter}
                options={platformOptions}
              />
            </PageFilterBar>
          </div>

          {viewMode === 'cards' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}
            >
              {filteredData.map((store) => {
                const biz = businessByStoreId.get(store.id);
                const gmvShare = totalGmv > 0 ? Math.round(((biz?.gmv.today ?? 0) / totalGmv) * 100) : 0;
                return (
                  <StoreCard
                    key={store.id}
                    store={store}
                    biz={biz}
                    gmvShare={gmvShare}
                    health={computeStoreHealth(store, biz)}
                  />
                );
              })}
            </div>
          ) : (
            <DataTableCard<Store>
              rowKey="id"
              columns={columns}
              dataSource={filteredData}
              scroll={{ x: 1350 }}
            />
          )}
        </>
      )}
    </div>
  );
}
