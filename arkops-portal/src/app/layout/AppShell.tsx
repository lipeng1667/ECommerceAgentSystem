import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  BookOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  DashboardOutlined,
  DesktopOutlined,
  DollarOutlined,
  ExperimentOutlined as LabOutlined,
  ExperimentOutlined,
  MoonOutlined,
  RobotOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SunOutlined,
  TeamOutlined
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
  // settings sub-items match their exact path
  if (pathname.startsWith('/settings/')) return pathname;
  // agents sub-items
  if (pathname === '/agents/exceptions') return '/agents/exceptions';
  if (pathname === '/agents/approvals') return '/agents/approvals';
  if (pathname.startsWith('/agents/')) return '/agents';
  if (pathname === '/agents') return '/agents';
  return routeMenuPrefixes.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? pathname;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { mode, setMode } = useTheme();
  const { isDemo, exitDemo } = useDemoMode();
  const { role, setRole } = useAuth();
  const accessiblePaths = getAccessiblePaths(role ?? 'Owner');

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

  const pendingApprovals = dashboard?.pendingApprovals ?? 0;
  const exceptionPending = dashboard?.exceptionCenterPending ?? 0;
  const orderExceptions = dashboard?.orderExceptions ?? 0;
  const selectedMenuKey = getSelectedMenuKey(location.pathname);

  const menuItems = [
    // 1. 经营总览
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },

    // 2. 订单管理 — 日常订单处理
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

    // 3. 商品管理
    { key: '/products', icon: <AppstoreOutlined />, label: t('nav.products') },

    // 4. Agent 中心
    {
      key: 'agents-group',
      icon: <RobotOutlined />,
      label: t('nav.agents'),
      children: [
        {
          key: '/agents',
          icon: <RobotOutlined />,
          label: t('nav.agentList')
        },
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

    // 5. 设置
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
      children: [
        { key: '/settings/stores', icon: <ShopOutlined />, label: t('nav.storeManagement') },
        { key: '/settings/members', icon: <TeamOutlined />, label: t('nav.memberManagement') },
        { key: '/settings/models', icon: <ExperimentOutlined />, label: t('nav.models') },
        { key: '/settings/billing', icon: <DollarOutlined />, label: t('nav.billingFinance') },
        { key: '/settings/audit-logs', icon: <AuditOutlined />, label: t('nav.auditLogs') },
        { key: '/settings/notifications', icon: <BellOutlined />, label: t('nav.notificationSettings') },
        { key: '/settings/guide', icon: <BookOutlined />, label: t('nav.usageGuide') },
      ]
    },
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
          defaultOpenKeys={['agents-group', 'settings']}
          items={filterMenuByRole(menuItems)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space>
            <Badge status="processing" text={t('app.beta')} />
            <Typography.Text type="secondary">{t('app.tenant')}</Typography.Text>
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
            <Avatar style={{ background: '#2563eb' }}>LP</Avatar>
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
                <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>2 家店铺 · 12 个商品 · 10 个任务</Tag>
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
