import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  DashboardOutlined,
  DesktopOutlined,
  DollarOutlined,
  ExperimentOutlined as LabOutlined,
  ExperimentOutlined,
  LogoutOutlined,
  MoonOutlined,
  RobotOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SunOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Layout, Menu, Segmented, Select, Space, Tag, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDemoMode } from '../demoMode';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { dashboardApi } from '../../api/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { getAccessiblePaths } from '../rolePermissions';
import type { Role } from '../rolePermissions';
import { OnboardingTour } from '../../components/OnboardingTour';
import { useEffect, useState } from 'react';

const { Header, Sider, Content } = Layout;

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
  // agents sub-items
  if (pathname === '/agents/exceptions') return '/agents/exceptions';
  if (pathname === '/agents/approvals') return '/agents/approvals';
  if (pathname.startsWith('/agents/')) return '/agents';
  if (pathname === '/agents') return '/agents';
  return routeMenuPrefixes.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? pathname;
}

function getActiveMenuGroup(selectedKey: string): string | null {
  if (selectedKey === '/agents/exceptions' || selectedKey === '/agents/approvals') return 'todo-group';
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
  const selectedMenuKey = getSelectedMenuKey(location.pathname);
  const activeMenuGroup = getActiveMenuGroup(selectedMenuKey);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>(() => activeMenuGroup ? [activeMenuGroup] : []);

  useEffect(() => {
    setOpenMenuKeys(activeMenuGroup ? [activeMenuGroup] : []);
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

    // 5. 待办中心 — 聚合异常和审批
    {
      key: 'todo-group',
      icon: <CheckSquareOutlined />,
      label: (
        <span>
          {t('nav.todoCenter')}
          {exceptionPending + pendingApprovals > 0 && (
            <Badge count={exceptionPending + pendingApprovals} size="small" offset={[8, -2]} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: [
        {
          key: '/agents/exceptions',
          icon: <AlertOutlined />,
          label: (
            <span>
              {t('nav.exceptionCenter')}
              {exceptionPending > 0 && (
                <Badge count={exceptionPending} size="small" offset={[8, -2]} style={{ marginLeft: 8 }} />
              )}
            </span>
          )
        },
        {
          key: '/agents/approvals',
          icon: <CheckSquareOutlined />,
          label: (
            <span>
              {t('nav.approvalCenter')}
              {pendingApprovals > 0 && (
                <Badge count={pendingApprovals} size="small" offset={[8, -2]} style={{ marginLeft: 8 }} />
              )}
            </span>
          )
        },
      ]
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
    { key: '/settings/billing', icon: <DollarOutlined />, label: t('nav.planBilling') },
    { key: '/settings/guide', icon: <QuestionCircleOutlined />, label: t('nav.helpCenter') },
  ];

  return (
    <Layout className="app-shell">
      <Sider width={248} className="app-sider">
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
          onOpenChange={(keys) => {
            const latestKey = keys.find(key => !openMenuKeys.includes(key));
            setOpenMenuKeys(latestKey ? [latestKey] : []);
          }}
          items={filterMenuByRole(menuItems)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space>
            <Badge status="processing" text={t('app.beta')} />
            <Typography.Text type="secondary">
              {user?.experience === 'onboarding' ? '租户：新用户体验空间' : t('app.tenant')}
            </Typography.Text>
          </Space>
          <Space>
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
            <Segmented
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as 'en' | 'zh')}
              options={[
                { label: 'EN', value: 'en' },
                { label: '中文', value: 'zh' }
              ]}
            />
            <Button icon={<BellOutlined />}>{t('app.alerts')}</Button>
            <Select
              size="small"
              value={role ?? 'Owner'}
              onChange={(v) => setRole(v as Role)}
              style={{ width: 110 }}
              options={[
                { label: 'Owner', value: 'Owner' },
                { label: 'Admin', value: 'Admin' },
                { label: 'Operator', value: 'Operator' },
                { label: 'Approver', value: 'Approver' },
                { label: 'Finance', value: 'Finance' },
                { label: 'Viewer', value: 'Viewer' },
              ]}
            />
            <Space size={8} className="header-user-summary">
              <Avatar style={{ background: user?.experience === 'onboarding' ? '#2563eb' : '#16a34a' }}>
                {user?.name.slice(-2) ?? 'AM'}
              </Avatar>
              <div>
                <Typography.Text strong style={{ display: 'block', fontSize: 12 }}>{user?.name}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 10 }}>
                  {user?.experience === 'onboarding' ? '新用户' : '成熟商家'}
                </Typography.Text>
              </div>
            </Space>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} title="退出登录" />
          </Space>
        </Header>
        <Content className="app-content">
          {isDemo && (
            <div style={{
              background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
              borderBottom: '1px solid #f59e0b',
              padding: '6px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <Space size={8}>
                <LabOutlined style={{ color: '#d97706', fontSize: 14 }} />
                <Typography.Text style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>
                  {t('app.demoBanner')}
                </Typography.Text>
                <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>完整经营场景体验</Tag>
              </Space>
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={exitDemo}
                style={{ color: '#92400e', fontSize: 11 }}>
                {t('app.exitDemo')}
              </Button>
            </div>
          )}
          <Outlet />
        </Content>
      </Layout>
      <OnboardingTour />
    </Layout>
  );
}
