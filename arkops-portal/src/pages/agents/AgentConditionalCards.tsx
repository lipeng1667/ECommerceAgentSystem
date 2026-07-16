/**
 * AgentConditionalCards — 各 Agent 专属操作卡片的条件渲染聚合组件。
 *
 * 将 14 个 agentType 条件判断集中管理，保持 AgentConfigPage 简洁。
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import { memo } from 'react';
import { CompetitorIntelCard } from './workflow-modals/CompetitorIntelCard';
import { CreativeLibraryCard } from './workflow-modals/CreativeLibraryCard';
import { AdDashboardCard } from './workflow-modals/AdDashboardCard';
import { PricingMonitorCard } from './workflow-modals/PricingMonitorCard';
import { CrmSegmentCard } from './workflow-modals/CrmSegmentCard';
import { ReviewMonitorCard } from './workflow-modals/ReviewMonitorCard';
import { CsQueueCard } from './workflow-modals/CsQueueCard';
import { AfterSalesQueueCard } from './workflow-modals/AfterSalesQueueCard';
import { PromotionManagerCard } from './workflow-modals/PromotionManagerCard';
import { InventoryDashboardCard } from './workflow-modals/InventoryDashboardCard';
import { RiskScannerCard } from './workflow-modals/RiskScannerCard';
import { FinanceReconcileCard } from './workflow-modals/FinanceReconcileCard';
import { LiveMonitorCard } from './workflow-modals/LiveMonitorCard';
import type { AgentType } from '../../types/domain';

export interface AgentConditionalCardsProps {
  agentType: AgentType;
}

export const AgentConditionalCards = memo(function AgentConditionalCards({ agentType }: AgentConditionalCardsProps) {
  switch (agentType) {
    case 'competitor_intel':
      return <CompetitorIntelCard />;
    case 'creative_factory':
      return <CreativeLibraryCard />;
    case 'ads_optimizer':
      return <AdDashboardCard />;
    case 'pricing_strategy':
      return <PricingMonitorCard />;
    case 'crm_retention':
      return <CrmSegmentCard />;
    case 'review_manager':
      return <ReviewMonitorCard />;
    case 'customer_service':
      return <CsQueueCard />;
    case 'after_sales':
      return <AfterSalesQueueCard />;
    case 'promotion_campaign':
      return <PromotionManagerCard />;
    case 'inventory_alert':
      return <InventoryDashboardCard />;
    case 'risk_control':
      return <RiskScannerCard />;
    case 'finance_audit':
      return <FinanceReconcileCard />;
    case 'live_stream_ops':
      return <LiveMonitorCard />;
    default:
      return null;
  }
});
