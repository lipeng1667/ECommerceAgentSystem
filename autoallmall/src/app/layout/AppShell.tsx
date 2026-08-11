import {
  ThunderboltOutlined, SettingOutlined, AppstoreOutlined,
  ShopOutlined, BellOutlined, SearchOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import {
  Avatar, Badge, Input, Layout, Menu, Select, Space, Typography,
} from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useStoreScope } from '../storeScope';
import { mockReport } from '../../mock/data';

const { Sider, Content } = Layout;

const BREADCRUMB_MAP: Record<string, string> = {
  '/hub': 'nav.hub',
  '/decisions': 'nav.decisions',
  '/command': 'nav.command',
  '/business': 'nav.business',
  '/business/products': 'nav.business',
  '/business/orders': 'nav.business',
  '/business/service': 'nav.business',
  '/business/marketing': 'nav.business',
  '/business/inventory': 'nav.business',
  '/business/reviews': 'nav.business',
  '/business/live': 'nav.business',
  '/settings/stores': 'nav.store',
};

const SUBTITLE_MAP: Record<string, string> = {
  '/business/products': 'nav.product',
  '/business/orders': 'nav.order',
  '/business/service': 'nav.service',
  '/business/marketing': 'nav.marketing',
  '/business/inventory': 'nav.inventory',
  '/business/reviews': 'nav.review',
  '/business/live': 'nav.live',
};

function useSelectedKey(pathname: string) {
  if (pathname === '/') return '/hub';
  if (pathname.startsWith('/decisions')) return '/decisions';
  if (pathname.startsWith('/command')) return '/command';
  if (pathname.startsWith('/business')) return pathname;
  if (pathname.startsWith('/settings')) return pathname;
  return pathname;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { storeId, setStoreId, stores } = useStoreScope();
  const selectedKey = useSelectedKey(location.pathname);

  const relevantDecisions = storeId
    ? mockReport.decisions.filter((d) => d.storeId === storeId)
    : mockReport.decisions;

  const breadcrumbKey = BREADCRUMB_MAP[location.pathname] ?? 'nav.hub';
  const subKey = SUBTITLE_MAP[location.pathname];

  const menuItems = [
    {
      key: '/hub',
      icon: <DashboardOutlined />,
      label: t('nav.hub'),
    },
    {
      key: '/decisions',
      icon: <ThunderboltOutlined />,
      label: (
        <span>
          {t('nav.decisions')}
          {relevantDecisions.length > 0 && (
            <Badge
              count={relevantDecisions.length}
              size="small"
              style={{ marginLeft: 8 }}
              styles={{ indicator: { fontSize: 10, minWidth: 18, height: 18, lineHeight: '18px', boxShadow: 'none' } }}
            />
          )}
        </span>
      ),
    },
    {
      key: '/command',
      icon: <SettingOutlined />,
      label: t('nav.command'),
    },
    {
      type: 'divider' as const,
      style: { borderColor: 'rgba(255,255,255,0.08)', margin: '8px 12px' },
    },
    {
      key: 'business-group',
      icon: <AppstoreOutlined />,
      label: t('nav.business'),
      children: [
        { key: '/business/products', label: t('nav.product') },
        { key: '/business/orders', label: t('nav.order') },
        { key: '/business/service', label: t('nav.service') },
        { key: '/business/marketing', label: t('nav.marketing') },
        { key: '/business/inventory', label: t('nav.inventory') },
        { key: '/business/reviews', label: t('nav.review') },
        { key: '/business/live', label: t('nav.live') },
      ],
    },
  ];

  const bottomItems = [
    { key: '/settings/stores', icon: <ShopOutlined />, label: t('nav.store') },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Dark Sidebar */}
      <Sider
        width={220}
        breakpoint="lg"
        collapsedWidth={0}
        style={{
          background: '#0F172A',
          borderRight: 'none',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 20px 16px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/hub')}
        >
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              A
            </div>
            <div>
              <Typography.Text
                style={{
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  display: 'block',
                  lineHeight: 1.3,
                }}
              >
                AutoAllMall
              </Typography.Text>
              <Typography.Text style={{ color: '#64748B', fontSize: 10 }}>
                Agent 协同运营平台
              </Typography.Text>
            </div>
          </Space>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['business-group']}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key);
          }}
          style={{
            background: 'transparent',
            borderRight: 0,
            color: '#94A3B8',
          }}
          theme="dark"
        />

        {/* Bottom Section */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={bottomItems}
            onClick={({ key }) => {
              if (key.startsWith('/')) navigate(key);
            }}
            style={{
              background: 'transparent',
              borderRight: 0,
            }}
            theme="dark"
          />
        </div>
      </Sider>

      {/* Main Content */}
      <Layout style={{ background: 'var(--app-bg-page)' }}>
        {/* Header */}
        <div
          style={{
            height: 52,
            background: '#fff',
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Typography.Text
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}
            >
              {t(breadcrumbKey)}
            </Typography.Text>
            {subKey && (
              <>
                <Typography.Text style={{ color: 'var(--app-border)', fontSize: 14 }}>
                  /
                </Typography.Text>
                <Typography.Text style={{ fontSize: 13, color: 'var(--app-text-secondary)' }}>
                  {t(subKey)}
                </Typography.Text>
              </>
            )}
          </div>

          {/* Right Controls */}
          <Space size={16}>
            {/* Store Selector */}
            <Select
              size="small"
              style={{ minWidth: 180 }}
              value={storeId ?? undefined}
              onChange={(val) => setStoreId(val ?? null)}
              allowClear
              placeholder="全部店铺"
              options={stores.filter((s) => s.status === 'connected').map((s) => ({
                value: s.id,
                label: `${s.platformIcon} ${s.name}`,
              }))}
            />

            {/* Search */}
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--app-text-tertiary)' }} />}
              placeholder="搜索..."
              size="small"
              style={{ width: 180 }}
            />

            {/* Notifications */}
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 16, color: 'var(--app-text-secondary)', cursor: 'pointer' }} />
            </Badge>

            {/* User */}
            <Avatar
              size={30}
              style={{ background: 'var(--app-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              U
            </Avatar>
          </Space>
        </div>

        {/* Page Content */}
        <Content style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
