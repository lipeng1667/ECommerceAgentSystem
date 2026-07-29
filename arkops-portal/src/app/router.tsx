import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './layout/AppShell';
import { FocusedLayout } from './layout/FocusedLayout';
import { useAuth } from './auth';
import { RoleGuard } from '../components/RoleGuard';
import { DashboardSkeleton, AgentListSkeleton, TablePageSkeleton } from '../components/PageSkeleton';

const AgentConfigPage = lazy(() => import('../pages/agents/AgentConfigPage').then((module) => ({ default: module.AgentConfigPage })));
const AgentListPage = lazy(() => import('../pages/agents/AgentListPage').then((module) => ({ default: module.AgentListPage })));
const ApprovalDetailPage = lazy(() => import('../pages/approvals/ApprovalDetailPage').then((module) => ({ default: module.ApprovalDetailPage })));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })));
const BillingSettingsPage = lazy(() => import('../pages/billing/BillingSettingsPage').then((module) => ({ default: module.BillingSettingsPage })));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const InboxPage = lazy(() => import('../pages/inbox/InboxPage').then((module) => ({ default: module.InboxPage }))); // WS-B
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const MembersSettingsPage = lazy(() => import('../pages/settings/MembersSettingsPage').then((module) => ({ default: module.MembersSettingsPage })));
const ModelListPage = lazy(() => import('../pages/models/ModelListPage').then((module) => ({ default: module.ModelListPage })));
const NotificationsSettingsPage = lazy(() => import('../pages/settings/NotificationsSettingsPage').then((module) => ({ default: module.NotificationsSettingsPage })));
const OrderAutomationPage = lazy(() => import('../pages/orders/OrderAutomationPage').then((module) => ({ default: module.OrderAutomationPage })));
const ProductDetailPage = lazy(() => import('../pages/products/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })));
const ProductManagementPage = lazy(() => import('../pages/products/ProductManagementPage').then((module) => ({ default: module.ProductManagementPage })));
const StoreDetailPage = lazy(() => import('../pages/stores/StoreDetailPage').then((module) => ({ default: module.StoreDetailPage })));
const StoreListPage = lazy(() => import('../pages/stores/StoreListPage').then((module) => ({ default: module.StoreListPage })));
const StoreOnboardingPage = lazy(() => import('../pages/stores/StoreOnboardingPage').then((module) => ({ default: module.StoreOnboardingPage })));
const SetupConfigPage = lazy(() => import('../pages/setup/SetupConfigPage').then((module) => ({ default: module.SetupConfigPage })));
const UsageGuideSettingsPage = lazy(() => import('../pages/guide/UsageGuideSettingsPage').then((module) => ({ default: module.UsageGuideSettingsPage })));

const routerBase = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

const routeFallback = (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
    <Spin size="large" />
  </div>
);

const dashboardFallback = <DashboardSkeleton />;
const agentListFallback = <AgentListSkeleton />;
const tableFallback = <TablePageSkeleton />;

function withSuspense(element: ReactNode, fallback: ReactNode = routeFallback) {
  return <Suspense fallback={fallback}>{element}</Suspense>;
}

/** Wrap a page element with RoleGuard for the given path */
function guarded(path: string, element: ReactNode, fallback?: ReactNode) {
  return withSuspense(<RoleGuard path={path}>{element}</RoleGuard>, fallback ?? routeFallback);
}

function ProtectedAppShell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <AppShell />;
}

/**
 * Auth gate for immersive flows: same protection as the app shell, but renders
 * the distraction-free FocusedLayout instead of the full navigation frame.
 */
function ProtectedFocusedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <FocusedLayout />;
}

function LoginEntry() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={user.experience === 'onboarding' ? '/stores/onboarding?journey=import' : '/dashboard'} replace />;
  }
  return withSuspense(<LoginPage />);
}

const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginEntry /> },
    // 店铺引导 / 迁移向导 —— 使用聚焦布局，隐藏全局导航，让用户专注单一任务
    {
      path: '/stores/onboarding',
      element: <ProtectedFocusedLayout />,
      children: [
        { index: true, element: guarded('/stores', <StoreOnboardingPage />) },
      ],
    },
    {
      path: '/',
      element: <ProtectedAppShell />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },

        // 经营总览
        { path: 'dashboard', element: guarded('/dashboard', <DashboardPage />, dashboardFallback) },
        // 旧路由重定向
        { path: 'operations', element: <Navigate to="/dashboard" replace /> },

        // 行动收件箱（WS-B, D2）— 审批 + 异常 + 重新登录统一队列
        { path: 'inbox', element: guarded('/inbox', <InboxPage />, tableFallback) },

        // 订单管理
        { path: 'orders', element: guarded('/orders', <OrderAutomationPage />, tableFallback) },

        // 商品管理
        { path: 'products', element: guarded('/products', <ProductManagementPage />, tableFallback) },
        { path: 'products/:productId', element: guarded('/products', <ProductDetailPage />) },

        // Agent 中心
        { path: 'agents', element: guarded('/agents', <AgentListPage />, agentListFallback) },
        { path: 'agents/:agentType', element: guarded('/agents', <AgentConfigPage />) },
        // D9: both list pages are folded into the inbox's three tabs; the routes stay as
        // redirects that preserve which kind of item the link meant.
        { path: 'agents/exceptions', element: <Navigate to="/inbox?type=exception" replace /> },
        { path: 'agents/approvals', element: <Navigate to="/inbox?type=approval" replace /> },
        { path: 'agents/approvals/:approvalId', element: guarded('/agents/approvals', <ApprovalDetailPage />) },
        // 旧路由重定向
        { path: 'exception-center', element: <Navigate to="/inbox?type=exception" replace /> },
        { path: 'approvals', element: <Navigate to="/inbox?type=approval" replace /> },
        { path: 'approvals/:approvalId', element: guarded('/agents/approvals', <ApprovalDetailPage />) },

        // 店铺管理
        { path: 'stores', element: guarded('/stores', <StoreListPage />) },
        // 注：stores/onboarding 已提升为顶层聚焦路由（见上），此处不再挂载
        { path: 'stores/new', element: guarded('/stores', <StoreDetailPage mode="new" />) },
        { path: 'stores/:storeId', element: guarded('/stores', <StoreDetailPage />) },

        // 设置（含子项）
        { path: 'settings/members', element: guarded('/settings/members', <MembersSettingsPage />) },
        { path: 'settings/notifications', element: guarded('/settings/notifications', <NotificationsSettingsPage />) },
        { path: 'settings/stores', element: guarded('/settings/stores', <StoreListPage />) },
        { path: 'settings/models', element: guarded('/settings/models', <ModelListPage />) },
        { path: 'settings/audit-logs', element: guarded('/settings/audit-logs', <AuditLogsPage />) },
        { path: 'settings/billing', element: guarded('/settings/billing', <BillingSettingsPage />) },
        { path: 'settings/guide', element: guarded('/settings/guide', <UsageGuideSettingsPage />) },
        // 旧路由重定向
        { path: 'models', element: <Navigate to="/settings/models" replace /> },
        { path: 'audit-logs', element: <Navigate to="/settings/audit-logs" replace /> },
        { path: 'billing', element: <Navigate to="/settings/billing" replace /> },
        { path: 'guide', element: <Navigate to="/settings/guide" replace /> },

        // 快速配置
        { path: 'setup', element: guarded('/setup', <SetupConfigPage />) },
      ]
    }
  ],
  { basename: routerBase }
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
