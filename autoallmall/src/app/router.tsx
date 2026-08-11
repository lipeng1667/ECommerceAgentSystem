import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './layout/AppShell';

const fallback = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Spin size="large" />
  </div>
);

const OperationsHub = lazy(() => import('../pages/hub/OperationsHub').then((m) => ({ default: m.OperationsHub })));
const DecisionCenter = lazy(() => import('../pages/decisions/DecisionCenter').then((m) => ({ default: m.DecisionCenter })));
const AgentCommand = lazy(() => import('../pages/command/AgentCommand').then((m) => ({ default: m.AgentCommand })));
const ProductLine = lazy(() => import('../pages/business/ProductLine').then((m) => ({ default: m.ProductLine })));
const OrderLine = lazy(() => import('../pages/business/OrderLine').then((m) => ({ default: m.OrderLine })));
const ServiceLine = lazy(() => import('../pages/business/ServiceLine').then((m) => ({ default: m.ServiceLine })));
const MarketingLine = lazy(() => import('../pages/business/MarketingLine').then((m) => ({ default: m.MarketingLine })));
const InventoryLine = lazy(() => import('../pages/business/InventoryLine').then((m) => ({ default: m.InventoryLine })));
const ReviewLine = lazy(() => import('../pages/business/ReviewLine').then((m) => ({ default: m.ReviewLine })));
const LiveLine = lazy(() => import('../pages/business/LiveLine').then((m) => ({ default: m.LiveLine })));
const StoreConnectPage = lazy(() => import('../pages/settings/StoreConnectPage').then((m) => ({ default: m.StoreConnectPage })));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/hub" replace /> },
      { path: 'hub', element: <Suspense fallback={fallback}><OperationsHub /></Suspense> },
      { path: 'decisions', element: <Suspense fallback={fallback}><DecisionCenter /></Suspense> },
      { path: 'command', element: <Suspense fallback={fallback}><AgentCommand /></Suspense> },
      { path: 'business/products', element: <Suspense fallback={fallback}><ProductLine /></Suspense> },
      { path: 'business/orders', element: <Suspense fallback={fallback}><OrderLine /></Suspense> },
      { path: 'business/service', element: <Suspense fallback={fallback}><ServiceLine /></Suspense> },
      { path: 'business/marketing', element: <Suspense fallback={fallback}><MarketingLine /></Suspense> },
      { path: 'business/inventory', element: <Suspense fallback={fallback}><InventoryLine /></Suspense> },
      { path: 'business/reviews', element: <Suspense fallback={fallback}><ReviewLine /></Suspense> },
      { path: 'business/live', element: <Suspense fallback={fallback}><LiveLine /></Suspense> },
      { path: 'settings/stores', element: <Suspense fallback={fallback}><StoreConnectPage /></Suspense> },
    ],
  },
]);
