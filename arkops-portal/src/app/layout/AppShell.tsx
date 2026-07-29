/**
 * File: AppShell.tsx
 * Purpose: Authenticated application frame — responsive sidebar/drawer navigation,
 * header controls (theme, notifications, identity), demo banner, and routed content.
 *
 * Author: Michael Lee
 *
 * Main exports:
 * - AppShell: layout wrapper rendered by the router for all authenticated pages.
 *
 * Major updates:
 * - 2026-07-22: WS-E — responsive navigation: Sider collapses via breakpoint="lg"
 *   with collapsedWidth={0}; under 768px the nav renders in a Drawer opened by a
 *   header hamburger trigger, keeping the app usable at 375px.
 */
import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  DashboardOutlined,
  DesktopOutlined,
  InboxOutlined, // WS-B
  PayCircleOutlined,
  ExperimentOutlined as LabOutlined,
  ExperimentOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SunOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Divider, Drawer, Dropdown, Layout, Menu, Segmented, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDemoMode } from '../demoMode';
import { LANGUAGE_SWITCHER_ENABLED, useI18n } from '../i18n';
import { useStoreScope } from '../storeScope';
import { useTheme } from '../theme';
import { dashboardApi } from '../../api/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { getAccessiblePaths } from '../rolePermissions';
import type { Role } from '../rolePermissions';
import { CommandPalette } from '../../components/CommandPalette';
import { OnboardingTour } from '../../components/OnboardingTour';
import { useEffect, useState } from 'react';

const { Header, Sider, Content } = Layout;

const MOBILE_NAV_MEDIA_QUERY = '(max-width: 767px)';

/**
 * Tracks a CSS media query, initialized synchronously to avoid layout flicker.
 *
 * @param query - Media query string to observe.
 * @returns Whether the query currently matches.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

const routeMenuPrefixes = [
  '/orders',
  '/products',
  '/stores',
  '/agents',
  '/dashboard',
  '/settings',
];

function getSelectedMenuKey(pathname: string) {
  if (pathname === '/') return '/dashboard';
  if (pathname === '/settings/stores') return '/stores';
  // settings sub-items match their exact path
  if (pathname.startsWith('/settings/')) return pathname;
  // store workflow pages belong to the top-level Store Management item
  if (pathname === '/stores' || pathname.startsWith('/stores/')) return '/stores';
  // D9: the exception/approval centres are folded into the inbox; only the approval
  // detail page remains under /agents/approvals/:id and it belongs to the inbox entry.
  if (pathname.startsWith('/agents/approvals')) return '/inbox';
  if (pathname.startsWith('/agents/')) return '/agents';
  if (pathname === '/agents') return '/agents';
  return routeMenuPrefixes.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? pathname;
}

function getActiveMenuGroup(selectedKey: string): string | null {
  // D9: 待办中心 is a single top-level item now, so it has no group to expand.
  if (selectedKey === '/agents' || selectedKey === '/setup') return 'agents-group';
  if (selectedKey.startsWith('/settings/') && selectedKey !== '/settings/billing' && selectedKey !== '/settings/guide') return 'settings-group';
  return null;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { mode, setMode } = useTheme();
  const { isDemo, exitDemo } = useDemoMode();
  const { role, setRole, user, logout } = useAuth();
  const { scope: storeScope, setScope: setStoreScope, stores: scopeStores } = useStoreScope();
  const accessiblePaths = getAccessiblePaths(role ?? 'Owner');

  const handleLogout = () => {
    exitDemo();
    logout();
    navigate('/login', { replace: true });
  };

  /** Filter menu items based on role permissions */
  function filterMenuByRole(items: any[]): any[] {
    if (!accessiblePaths) return items; // null = all visible
    return items.filter(item => {
      if (item.children) {
        const filteredChildren = filterMenuByRole(item.children);
        return filteredChildren.length > 0;
      }
      return accessiblePaths.includes(item.key);
    }).map(item => {
      if (item.children) {
        return { ...item, children: filterMenuByRole(item.children) };
      }
      return item;
    });
  }

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30_000
  });

  const hasBusinessData = user?.experience !== 'onboarding';
  const pendingApprovals = hasBusinessData ? dashboard?.pendingApprovals ?? 0 : 0;
  const exceptionPending = hasBusinessData ? dashboard?.exceptionCenterPending ?? 0 : 0;
  const orderExceptions = hasBusinessData ? dashboard?.orderExceptions ?? 0 : 0;
  // WS-B (B2): unified Action Inbox count = approvals + exceptions + re-login stores
  const loginRequiredStores = hasBusinessData ? dashboard?.loginRequiredStores ?? 0 : 0;
  const inboxCount = hasBusinessData ? dashboard?.inboxTotal ?? 0 : 0;
  const selectedMenuKey = getSelectedMenuKey(location.pathname);
  const activeMenuGroup = getActiveMenuGroup(selectedMenuKey);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>(() => activeMenuGroup ? [activeMenuGroup] : []);
  const isMobileNav = useMediaQuery(MOBILE_NAV_MEDIA_QUERY);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close the mobile nav drawer after any route change.
  useEffect(() => {
    setNavDrawerOpen(false);
  }, [location.pathname]);

  // E4: auto-open the active group additively — never force-close groups the user opened.
  useEffect(() => {
    if (!activeMenuGroup) return;
    setOpenMenuKeys((prev) => (prev.includes(activeMenuGroup) ? prev : [...prev, activeMenuGroup]));
  }, [activeMenuGroup]);

  const menuItems = [
    // 1. 经营总览
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },

    // 2. 店铺管理 — 新用户连接入口与多店铺管理
    {
      key: '/stores',
      icon: <ShopOutlined />,
      label: user?.experience === 'onboarding' ? t('nav.connectStore') : t('nav.storeManagement')
    },

    // 3. 商品管理
    { key: '/products', icon: <AppstoreOutlined />, label: t('nav.products') },

    // 4. 订单管理 — 日常订单处理
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: (
        <span>
          {t('nav.orders')}
          {orderExceptions > 0 && (
            <Badge count={orderExceptions} size="small" offset={[8, -2]} style={{ marginLeft: 8 }} />
          )}
        </span>
      )
    },

    // 5. 待办中心 — 审批 / 异常 / 重新登录 / 订单 / 商品的统一队列（D9：三合一，不再分子项）
    {
      key: '/inbox',
      icon: <InboxOutlined />,
      label: (
        <span>
          {t('nav.todoCenter')}
          {inboxCount > 0 && (
            <Badge count={inboxCount} size="small" offset={[8, -2]} style={{ marginLeft: 8 }} />
          )}
        </span>
      )
    },

    // 6. Agent 中心
    {
      key: 'agents-group',
      icon: <RobotOutlined />,
      label: t('nav.agents'),
      children: [
        { key: '/agents', icon: <RobotOutlined />, label: t('nav.agentManagement') },
        { key: '/setup', icon: <ThunderboltOutlined />, label: t('nav.automationConfig') },
      ]
    },

    // 7. 平台设置
    {
      key: 'settings-group',
      icon: <SettingOutlined />,
      label: t('nav.platformSettings'),
      children: [
        { key: '/settings/members', icon: <TeamOutlined />, label: t('nav.memberManagement') },
        { key: '/settings/models', icon: <ExperimentOutlined />, label: t('nav.models') },
        { key: '/settings/notifications', icon: <BellOutlined />, label: t('nav.notificationSettings') },
        { key: '/settings/audit-logs', icon: <AuditOutlined />, label: t('nav.auditLogs') },
      ]
    },

    // 8-9. 账户与帮助
    { key: '/settings/billing', icon: <PayCircleOutlined />, label: t('nav.planBilling') },
    { key: '/settings/guide', icon: <QuestionCircleOutlined />, label: t('nav.helpCenter') },
  ];

  const experienceLabel =
    user?.experience === 'onboarding' ? t('shell.newMerchant') : t('shell.establishedMerchant');

  // Identity panel (E3): user summary + demo "view as" role switcher + logout in one place.
  const identityPanel = (
    <div className="identity-menu">
      <div className="identity-menu-user">
        <Avatar
          size={40}
          style={{ background: user?.experience === 'onboarding' ? 'var(--ark-blue)' : 'var(--ark-green)' }}
        >
          {user?.name.slice(-2) ?? 'AM'}
        </Avatar>
        <div>
          <Typography.Text strong style={{ display: 'block' }}>{user?.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{experienceLabel}</Typography.Text>
        </div>
      </div>
      <div className="identity-menu-role">
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('shell.currentRole')}</Typography.Text>
        <Tag style={{ margin: 0 }}>{role ?? 'Owner'}</Tag>
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <div className="identity-menu-viewas">
        <Space size={6}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('shell.viewAs')}</Typography.Text>
          <Tooltip title={t('shell.viewAsHint')}>
            <QuestionCircleOutlined className="identity-menu-hint" />
          </Tooltip>
        </Space>
        <Select
          size="small"
          value={role ?? 'Owner'}
          onChange={(v) => setRole(v as Role)}
          style={{ width: '100%' }}
          options={[
            { label: 'Owner', value: 'Owner' },
            { label: 'Admin', value: 'Admin' },
            { label: 'Operator', value: 'Operator' },
            { label: 'Approver', value: 'Approver' },
            { label: 'Finance', value: 'Finance' },
            { label: 'Viewer', value: 'Viewer' },
          ]}
        />
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <Button block icon={<LogoutOutlined />} onClick={handleLogout}>
        {t('shell.logout')}
      </Button>
    </div>
  );

  const navContent = (
    <>
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <Typography.Text strong>AllMall</Typography.Text>
          <Typography.Text type="secondary" className="brand-subtitle">
            {t('app.subtitle')}
          </Typography.Text>
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedMenuKey]}
        openKeys={openMenuKeys}
        onOpenChange={(keys) => setOpenMenuKeys(keys as string[])}
        items={filterMenuByRole(menuItems)}
        onClick={({ key }) => {
          navigate(key);
          if (isMobileNav) setNavDrawerOpen(false);
        }}
      />
    </>
  );

  return (
    <Layout className="app-shell">
      {isMobileNav ? (
        <Drawer
          placement="left"
          width={264}
          open={navDrawerOpen}
          onClose={() => setNavDrawerOpen(false)}
          closable={false}
          className="app-nav-drawer"
          styles={{ body: { padding: 0 } }}
        >
          {navContent}
        </Drawer>
      ) : (
        <Sider
          width={248}
          className="app-sider"
          collapsible
          collapsed={siderCollapsed}
          trigger={null}
          breakpoint="lg"
          collapsedWidth={0}
          onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
        >
          {navContent}
        </Sider>
      )}
      <Layout>
        <Header className="app-header">
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label={t('shell.menuToggle')}
              title={t('shell.menuToggle')}
              onClick={() => (isMobileNav ? setNavDrawerOpen(true) : setSiderCollapsed((prev) => !prev))}
            />
            <Badge status="processing" text={t('app.beta')} />
            <Typography.Text type="secondary" className="app-header-tenant">
              {user?.experience === 'onboarding' ? t('shell.tenantOnboarding') : t('app.tenant')}
            </Typography.Text>
          </Space>
          <Space>
            <Select
              className="header-store-scope"
              size="small"
              aria-label={t('shell.storeScope')}
              title={t('shell.storeScope')}
              value={storeScope === 'all' ? 'all' : String(storeScope)}
              onChange={(value) => setStoreScope(value === 'all' ? 'all' : Number(value))}
              popupMatchSelectWidth={false}
              options={[
                { value: 'all', label: <><ShopOutlined /> {t('shell.allStores')}</> },
                ...scopeStores.map((store) => ({
                  value: String(store.id),
                  label: <><ShopOutlined /> {store.name}</>
                }))
              ]}
            />
            <Segmented
              size="small"
              value={mode}
              onChange={(value) => setMode(value as 'system' | 'light' | 'dark')}
              options={[
                { label: <span title={t('theme.system')}><DesktopOutlined /></span>, value: 'system' },
                { label: <span title={t('theme.light')}><SunOutlined /></span>, value: 'light' },
                { label: <span title={t('theme.dark')}><MoonOutlined /></span>, value: 'dark' }
              ]}
            />
            {LANGUAGE_SWITCHER_ENABLED && (
              <Segmented
                size="small"
                value={language}
                onChange={(value) => setLanguage(value as 'en' | 'zh')}
                options={[
                  { label: 'EN', value: 'en' },
                  { label: '中文', value: 'zh' }
                ]}
              />
            )}
            <Button
              icon={<SearchOutlined />}
              aria-label={t('shell.searchOpen')}
              title={t('shell.searchOpen')}
              onClick={() => setPaletteOpen(true)}
            />
            {/* WS-B (B2): bell links to the Action Inbox with a live count badge */}
            <Badge count={inboxCount} size="small" offset={[-4, 4]}>
              <Button icon={<BellOutlined />} onClick={() => navigate('/inbox')}>{t('app.alerts')}</Button>
            </Badge>
            <Dropdown trigger={['click']} placement="bottomRight" dropdownRender={() => identityPanel}>
              <button type="button" className="header-identity" aria-label={t('shell.currentRole')}>
                <Avatar style={{ background: user?.experience === 'onboarding' ? 'var(--ark-blue)' : 'var(--ark-green)' }}>
                  {user?.name.slice(-2) ?? 'AM'}
                </Avatar>
                <span className="header-identity-copy">
                  <Typography.Text strong style={{ display: 'block', fontSize: 12 }}>{user?.name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 10 }}>
                    {experienceLabel}
                  </Typography.Text>
                </span>
              </button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">
          {isDemo && (
            <div className="demo-banner">
              <Space size={8}>
                <LabOutlined className="demo-banner-icon" />
                <Typography.Text className="demo-banner-text">
                  {t('app.demoBanner')}
                </Typography.Text>
                <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>{t('shell.demoScenarioTag')}</Tag>
              </Space>
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={exitDemo} className="demo-banner-exit">
                {t('app.exitDemo')}
              </Button>
            </div>
          )}
          <Outlet />
        </Content>
      </Layout>
      <OnboardingTour />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </Layout>
  );
}
