import { ABTestComparisonModal } from './workflow-modals/ABTestComparisonModal';
import { AdsDashboardModals } from './workflow-modals/AdsDashboardModals';
import { CreativePreviewModal } from './workflow-modals/CreativePreviewModal';
import { CrmRetentionModal } from './workflow-modals/CrmRetentionModal';
import { CustomerServiceModal } from './workflow-modals/CustomerServiceModal';
import { LiveOpsModal } from './workflow-modals/LiveOpsModal';
import { ReviewManagementModal } from './workflow-modals/ReviewManagementModal';
import { RiskScanModal } from './workflow-modals/RiskScanModal';
import { SessionStatusModal } from './workflow-modals/SessionStatusModal';
import { CompetitorIntelModal } from './workflow-modals/CompetitorIntelModal';
import { AfterSalesModal } from './workflow-modals/AfterSalesModal';
import { PromotionCampaignModal } from './workflow-modals/PromotionCampaignModal';
import { InventoryAlertModal } from './workflow-modals/InventoryAlertModal';
import { FinanceAuditModal } from './workflow-modals/FinanceAuditModal';
import { PricingAnalysisModal } from './workflow-modals/PricingAnalysisModal';

interface AgentWorkflowModalsProps {
  reviewOpen: boolean;
  onCloseReview: () => void;
  customerServiceOpen: boolean;
  onCloseCustomerService: () => void;
  adsDashboardOpen: boolean;
  onCloseAdsDashboard: () => void;
  creativeOpen: boolean;
  onCloseCreative: () => void;
  riskOpen: boolean;
  onCloseRisk: () => void;
  liveOpen: boolean;
  onCloseLive: () => void;
  crmOpen: boolean;
  onCloseCrm: () => void;
  abTestOpen: boolean;
  onCloseABTest: () => void;
  sessionStatusOpen: boolean;
  onCloseSessionStatus: () => void;
  competitorIntelOpen: boolean;
  onCloseCompetitorIntel: () => void;
  afterSalesOpen: boolean;
  onCloseAfterSales: () => void;
  promotionOpen: boolean;
  onClosePromotion: () => void;
  inventoryOpen: boolean;
  onCloseInventory: () => void;
  financeAuditOpen: boolean;
  onCloseFinanceAudit: () => void;
  pricingOpen: boolean;
  onClosePricing: () => void;
}

export function AgentWorkflowModals(props: AgentWorkflowModalsProps) {
  return (
    <>
      <ReviewManagementModal reviewOpen={props.reviewOpen} onCloseReview={props.onCloseReview} />
      <CustomerServiceModal customerServiceOpen={props.customerServiceOpen} onCloseCustomerService={props.onCloseCustomerService} />
      <AdsDashboardModals adsDashboardOpen={props.adsDashboardOpen} onCloseAdsDashboard={props.onCloseAdsDashboard} />
      <CreativePreviewModal creativeOpen={props.creativeOpen} onCloseCreative={props.onCloseCreative} />
      <RiskScanModal riskOpen={props.riskOpen} onCloseRisk={props.onCloseRisk} />
      <LiveOpsModal liveOpen={props.liveOpen} onCloseLive={props.onCloseLive} />
      <CrmRetentionModal crmOpen={props.crmOpen} onCloseCrm={props.onCloseCrm} />
      <ABTestComparisonModal open={props.abTestOpen} onClose={props.onCloseABTest} />
      <SessionStatusModal open={props.sessionStatusOpen} onClose={props.onCloseSessionStatus} />
      <CompetitorIntelModal open={props.competitorIntelOpen} onClose={props.onCloseCompetitorIntel} />
      <AfterSalesModal open={props.afterSalesOpen} onClose={props.onCloseAfterSales} />
      <PromotionCampaignModal open={props.promotionOpen} onClose={props.onClosePromotion} />
      <InventoryAlertModal open={props.inventoryOpen} onClose={props.onCloseInventory} />
      <FinanceAuditModal open={props.financeAuditOpen} onClose={props.onCloseFinanceAudit} />
      <PricingAnalysisModal open={props.pricingOpen} onClose={props.onClosePricing} />
    </>
  );
}
