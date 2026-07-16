import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './layout/AppShell';
import { RoleGuard } from '../components/RoleGuard';
import { DashboardSkeleton, AgentListSkeleton, TablePageSkeleton } from '../components/PageSkeleton';

const AgentConfigPage = lazy(() => import('../pages/agents/AgentConfigPage').then((module) => ({ default: module.AgentConfigPage })));
const AgentListPage = lazy(() => import('../pages/agents/AgentListPage').then((module) => ({ default: module.AgentListPage })));
const ApprovalDetailPage = lazy(() => import('../pages/approvals/ApprovalDetailPage').then((module) => ({ default: module.ApprovalDetailPage })));
const ApprovalListPage = lazy(() => import('../pages/approvals/ApprovalListPage').then((module) => ({ default: module.ApprovalListPage })));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })));
const BillingSettingsPage = lazy(() => import('../pages/billing/BillingSettingsPage').then((module) => ({ default: module.BillingSettingsPage })));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ExceptionCenterPage = lazy(() => import('../pages/operations/ExceptionCenterPage').then((module) => ({ default: module.ExceptionCenterPage })));
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const MembersSettingsPage = lazy(() => import('../pages/settings/MembersSettingsPage').then((module) => ({ default: module.MembersSettingsPage })));
const ModelListPage = lazy(() => import('../pages/models/ModelListPage').then((module) => ({ default: module.ModelListPage })));
const NotificationsSettingsPage = lazy(() => import('../pages/settings/NotificationsSettingsPage').then((module) => ({ default: module.NotificationsSettingsPage })));
const OrderAutomationPage = lazy(() => import('../pages/orders/OrderAutomationPage').then((module) => ({ default: module.OrderAutomationPage })));
const ProductManagementPage = lazy(() => import('../pages/products/ProductManagementPage').then((module) => ({ default: module.ProductManagementPage })));
const StoreDetailPage = lazy(() => import('../pages/stores/StoreDetailPage').then((module) => ({ default: module.StoreDetailPage })));
const StoreListPage = lazy(() => import('../pages/stores/StoreListPage').then((module) => ({ default: module.StoreListPage })));
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

const router = createBrowserRouter(
  [
    { path: '/login', element: withSuspense(<LoginPage />) },
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },

        // 经营总览
        { path: 'dashboard', element: guarded('/dashboard', <DashboardPage />, dashboardFallback) },
        // 旧路由重定向
        { path: 'operations', element: <Navigate to="/dashboard" replace /> },

        // 订单管理
        { path: 'orders', element: guarded('/orders', <OrderAutomationPage />, tableFallback) },

        // 商品管理
        { path: 'products', element: guarded('/products', <ProductManagementPage />, tableFallback) },

        // Agent 中心
        { path: 'agents', element: guarded('/agents', <AgentListPage />, agentListFallback) },
        { path: 'agents/:agentType', element: guarded('/agents', <AgentConfigPage />) },
        { path: 'agents/exceptions', element: guarded('/agents/exceptions', <ExceptionCenterPage />) },
        { path: 'agents/approvals', element: guarded('/agents/approvals', <ApprovalListPage />) },
        { path: 'agents/approvals/:approvalId', element: guarded('/agents/approvals', <ApprovalDetailPage />) },
        // 旧路由重定向
        { path: 'exception-center', element: <Navigate to="/agents/exceptions" replace /> },
        { path: 'approvals', element: <Navigate to="/agents/approvals" replace /> },
        { path: 'approvals/:approvalId', element: guarded('/agents/approvals', <ApprovalDetailPage />) },

        // 店铺管理
        { path: 'stores', element: guarded('/stores', <StoreListPage />) },
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
