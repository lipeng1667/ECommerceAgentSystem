import { CloudSyncOutlined, EyeOutlined, LoginOutlined, PayCircleOutlined, ShoppingCartOutlined, WifiOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, Space, Tag, Typography } from 'antd';
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
import { SERVICE_ICONS, getPlatformName, getSessionHealthColor, renderSessionTag } from '../../utils/storeDisplay';

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
        {renderSessionTag(record.status)}
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
        <DataTableCard<Store>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1350 }}
          toolbar={
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
          }
        />
      )}
    </div>
  );
}
