import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './layout/AppShell';

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

function withSuspense(element: ReactNode) {
  return <Suspense fallback={routeFallback}>{element}</Suspense>;
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
        { path: 'dashboard', element: withSuspense(<DashboardPage />) },
        // 旧路由重定向
        { path: 'operations', element: <Navigate to="/dashboard" replace /> },

        // 订单管理
        { path: 'orders', element: withSuspense(<OrderAutomationPage />) },

        // 商品管理
        { path: 'products', element: withSuspense(<ProductManagementPage />) },

        // Agent 中心
        { path: 'agents', element: withSuspense(<AgentListPage />) },
        { path: 'agents/:agentType', element: withSuspense(<AgentConfigPage />) },
        { path: 'agents/exceptions', element: withSuspense(<ExceptionCenterPage />) },
        { path: 'agents/approvals', element: withSuspense(<ApprovalListPage />) },
        { path: 'agents/approvals/:approvalId', element: withSuspense(<ApprovalDetailPage />) },
        // 旧路由重定向
        { path: 'exception-center', element: <Navigate to="/agents/exceptions" replace /> },
        { path: 'approvals', element: <Navigate to="/agents/approvals" replace /> },
        { path: 'approvals/:approvalId', element: withSuspense(<ApprovalDetailPage />) },

        // 店铺管理
        { path: 'stores', element: withSuspense(<StoreListPage />) },
        { path: 'stores/new', element: withSuspense(<StoreDetailPage mode="new" />) },
        { path: 'stores/:storeId', element: withSuspense(<StoreDetailPage />) },

        // 设置（含子项）
        { path: 'settings/members', element: withSuspense(<MembersSettingsPage />) },
        { path: 'settings/notifications', element: withSuspense(<NotificationsSettingsPage />) },
        { path: 'settings/stores', element: withSuspense(<StoreListPage />) },
        { path: 'settings/models', element: withSuspense(<ModelListPage />) },
        { path: 'settings/audit-logs', element: withSuspense(<AuditLogsPage />) },
        { path: 'settings/billing', element: withSuspense(<BillingSettingsPage />) },
        { path: 'settings/guide', element: withSuspense(<UsageGuideSettingsPage />) },
        // 旧路由重定向
        { path: 'models', element: <Navigate to="/settings/models" replace /> },
        { path: 'audit-logs', element: <Navigate to="/settings/audit-logs" replace /> },
        { path: 'billing', element: <Navigate to="/settings/billing" replace /> },
        { path: 'guide', element: <Navigate to="/settings/guide" replace /> },

        // 快速配置
        { path: 'setup', element: withSuspense(<SetupConfigPage />) },
      ]
    }
  ],
  { basename: routerBase }
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
