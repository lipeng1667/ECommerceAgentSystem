import { ABTestComparisonModal } from './workflow-modals/ABTestComparisonModal';
import { AdsDashboardModals } from './workflow-modals/AdsDashboardModals';
import { CreativePreviewModal } from './workflow-modals/CreativePreviewModal';
import { CrmRetentionModal } from './workflow-modals/CrmRetentionModal';
import { CustomerServiceModal } from './workflow-modals/CustomerServiceModal';
import { LiveOpsModal } from './workflow-modals/LiveOpsModal';
import { ReviewManagementModal } from './workflow-modals/ReviewManagementModal';
import { RiskScanModal } from './workflow-modals/RiskScanModal';

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
    </>
  );
}
