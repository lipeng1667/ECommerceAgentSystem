import {
  BankOutlined,
  BellOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FireOutlined,
  GiftOutlined,
  GlobalOutlined,
  LineChartOutlined,
  PictureOutlined,
  PushpinOutlined,
  RadarChartOutlined,
  SafetyOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SkinOutlined,
  SmileOutlined,
  StarOutlined,
  StopOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { AgentTaskGrid, type AgentTaskDefinition } from '../../components/agents/AgentTaskCard';
import { useI18n } from '../../app/i18n';
import type { AgentType } from '../../types/domain';

interface AgentBuiltinTasksSectionProps {
  agentType: AgentType;
  onOpenAdDashboard: () => void;
  onOpenCrmModal: () => void;
  onOpenReviewModal: () => void;
  onOpenCsModal: () => void;
  onOpenCreativeModal: () => void;
  onOpenRiskModal: () => void;
  onOpenLiveModal: () => void;
  onOpenABTest: () => void;
}

interface AgentTaskSectionConfig {
  titleIcon: JSX.Element;
  mdSpan?: number;
  smSpan?: number;
  tasks: AgentTaskDefinition[];
}

const taskIconStyle = (color: string) => ({ color, marginRight: 6 });

export function AgentBuiltinTasksSection({
  agentType,
  onOpenAdDashboard,
  onOpenCrmModal,
  onOpenReviewModal,
  onOpenCsModal,
  onOpenCreativeModal,
  onOpenRiskModal,
  onOpenLiveModal,
  onOpenABTest
}: AgentBuiltinTasksSectionProps) {
  const { t } = useI18n();

  const task = (
    icon: JSX.Element,
    titleKey: string,
    descriptionKey: string,
    tagKey?: string,
    tagColor?: string,
    onClick?: () => void
  ): AgentTaskDefinition => ({
    icon,
    title: t(`agent.${titleKey}`),
    description: t(`agent.${descriptionKey}`),
    tag: tagKey ? t(`agent.${tagKey}`) : undefined,
    tagColor,
    onClick
  });

  const sections: Partial<Record<AgentType, AgentTaskSectionConfig>> = {
    pricing_strategy: {
      titleIcon: <DollarOutlined />,
      tasks: [
        task(<EyeOutlined style={taskIconStyle('#2563eb')} />, 'priceScan', 'priceScanDesc', 'scheduled', 'purple'),
        task(<ToolOutlined style={taskIconStyle('#16a34a')} />, 'dynamicPrice', 'dynamicPriceDesc', 'auto', 'green'),
        task(<WarningOutlined style={taskIconStyle('#ea580c')} />, 'floorProtect', 'floorProtectDesc', 'scheduled', 'purple')
      ]
    },
    login_bootstrap: {
      titleIcon: <UnorderedListOutlined />,
      smSpan: 12,
      tasks: [
        task(<CheckCircleOutlined style={taskIconStyle('#2563eb')} />, 'sessionCheckTask', 'sessionCheckTaskDesc'),
        task(<BellOutlined style={taskIconStyle('#ea580c')} />, 'sessionFailedTask', 'sessionFailedTaskDesc'),
        task(<GlobalOutlined style={taskIconStyle('#7c3aed')} />, 'bulkPatrol', 'bulkPatrolDesc', 'scheduled', 'purple')
      ]
    },
    competitor_intel: {
      titleIcon: <RadarChartOutlined />,
      tasks: [
        task(<EyeOutlined style={taskIconStyle('#2563eb')} />, 'passiveCompetitorMonitor', 'passiveCompetitorMonitorDesc', 'passive', 'blue'),
        task(<SearchOutlined style={taskIconStyle('#16a34a')} />, 'productResearch', 'productResearchDesc', 'passive', 'blue'),
        task(<GlobalOutlined style={taskIconStyle('#7c3aed')} />, 'trendMonitor', 'trendMonitorDesc', 'passive', 'blue')
      ]
    },
    product_launch: {
      titleIcon: <CameraOutlined />,
      tasks: [
        task(<CameraOutlined style={taskIconStyle('#2563eb')} />, 'imageRecognition', 'imageRecognitionDesc', 'active', 'orange'),
        task(<EditOutlined style={taskIconStyle('#16a34a')} />, 'draftGeneration', 'draftGenerationDesc', 'passive', 'blue'),
        task(<SafetyOutlined style={taskIconStyle('#ea580c')} />, 'complianceCheck', 'complianceCheckDesc', 'auto', 'green')
      ]
    },
    ads_optimizer: {
      titleIcon: <ThunderboltOutlined />,
      tasks: [
        task(<LineChartOutlined style={taskIconStyle('#2563eb')} />, 'roiPatrol', 'roiPatrolDesc', 'scheduled', 'purple', onOpenAdDashboard),
        task(<ToolOutlined style={taskIconStyle('#16a34a')} />, 'budgetOptimize', 'budgetOptimizeDesc', 'auto', 'green'),
        task(<FireOutlined style={taskIconStyle('#ea580c')} />, 'abTest', 'abTestDesc', 'scheduled', 'purple', onOpenABTest)
      ]
    },
    crm_retention: {
      titleIcon: <GiftOutlined />,
      mdSpan: 6,
      smSpan: 12,
      tasks: [
        task(<SkinOutlined style={taskIconStyle('#2563eb')} />, 'segmentRefresh', 'segmentRefreshDesc', 'scheduled', 'purple', onOpenCrmModal),
        task(<GiftOutlined style={taskIconStyle('#16a34a')} />, 'couponSend', 'couponSendDesc', 'auto', 'green'),
        task(<WarningOutlined style={taskIconStyle('#ea580c')} />, 'churnPredict', 'churnPredictDesc', 'scheduled', 'purple'),
        task(<CrownOutlined style={taskIconStyle('#f59e0b')} />, 'vipCare', 'vipCareDesc', 'auto', 'green')
      ]
    },
    review_manager: {
      titleIcon: <StarOutlined />,
      tasks: [
        task(<WarningOutlined style={taskIconStyle('#dc2626')} />, 'negativeMonitor', 'negativeMonitorDesc', 'scheduled', 'purple', onOpenReviewModal),
        task(<EditOutlined style={taskIconStyle('#16a34a')} />, 'autoReply', 'autoReplyDesc', 'auto', 'green'),
        task(<SmileOutlined style={taskIconStyle('#2563eb')} />, 'reviewInvite', 'reviewInviteDesc', 'scheduled', 'purple')
      ]
    },
    customer_service: {
      titleIcon: <CustomerServiceOutlined />,
      tasks: [
        task(<SmileOutlined style={taskIconStyle('#16a34a')} />, 'smartReply', 'smartReplyDesc', 'auto', 'green', onOpenCsModal),
        task(<WarningOutlined style={taskIconStyle('#ea580c')} />, 'escalateHuman', 'escalateHumanDesc', 'passive', 'blue'),
        task(<SearchOutlined style={taskIconStyle('#7c3aed')} />, 'faqLearn', 'faqLearnDesc', 'passive', 'blue')
      ]
    },
    after_sales: {
      titleIcon: <ToolOutlined />,
      tasks: [
        task(<FileSearchOutlined style={taskIconStyle('#2563eb')} />, 'returnAudit', 'returnAuditDesc', 'auto', 'green'),
        task(<WalletOutlined style={taskIconStyle('#16a34a')} />, 'refundProcess', 'refundProcessDesc', 'auto', 'green'),
        task(<ShoppingCartOutlined style={taskIconStyle('#ea580c')} />, 'logisticsTrack', 'logisticsTrackDesc', 'passive', 'blue')
      ]
    },
    creative_factory: {
      titleIcon: <PictureOutlined />,
      tasks: [
        task(<PictureOutlined style={taskIconStyle('#2563eb')} />, 'imageGen', 'imageGenDesc', 'auto', 'green', onOpenCreativeModal),
        task(<CameraOutlined style={taskIconStyle('#16a34a')} />, 'videoGen', 'videoGenDesc', 'auto', 'green'),
        task(<EditOutlined style={taskIconStyle('#ea580c')} />, 'copyGen', 'copyGenDesc', 'scheduled', 'purple')
      ]
    },
    inventory_alert: {
      titleIcon: <ShoppingCartOutlined />,
      tasks: [
        task(<WarningOutlined style={taskIconStyle('#dc2626')} />, 'lowStockAlert', 'lowStockAlertDesc', 'scheduled', 'purple'),
        task(<StopOutlined style={taskIconStyle('#64748b')} />, 'deadStock', 'deadStockDesc', 'scheduled', 'purple'),
        task(<ShoppingCartOutlined style={taskIconStyle('#16a34a')} />, 'replenish', 'replenishDesc', 'auto', 'green')
      ]
    },
    risk_control: {
      titleIcon: <SafetyOutlined />,
      tasks: [
        task(<FileSearchOutlined style={taskIconStyle('#2563eb')} />, 'complianceScan', 'complianceScanDesc', 'scheduled', 'purple', onOpenRiskModal),
        task(<EyeOutlined style={taskIconStyle('#ea580c')} />, 'behaviorMonitor', 'behaviorMonitorDesc', 'passive', 'blue'),
        task(<StopOutlined style={taskIconStyle('#dc2626')} />, 'circuitBreaker', 'circuitBreakerDesc', 'passive', 'blue')
      ]
    },
    finance_audit: {
      titleIcon: <BankOutlined />,
      tasks: [
        task(<FileSearchOutlined style={taskIconStyle('#2563eb')} />, 'monthlyReconcile', 'monthlyReconcileDesc', 'scheduled', 'purple'),
        task(<WarningOutlined style={taskIconStyle('#ea580c')} />, 'discrepancyMark', 'discrepancyMarkDesc', 'auto', 'green'),
        task(<EditOutlined style={taskIconStyle('#16a34a')} />, 'reportGen', 'reportGenDesc', 'auto', 'green')
      ]
    },
    promotion_campaign: {
      titleIcon: <GiftOutlined />,
      tasks: [
        task(<ThunderboltOutlined style={taskIconStyle('#dc2626')} />, 'flashSaleSetup', 'flashSaleSetupDesc', 'active', 'orange'),
        task(<DollarOutlined style={taskIconStyle('#2563eb')} />, 'couponCampaign', 'couponCampaignDesc', 'scheduled', 'purple'),
        task(<ShoppingCartOutlined style={taskIconStyle('#16a34a')} />, 'bundleDeal', 'bundleDealDesc', 'auto', 'green')
      ]
    },
    live_stream_ops: {
      titleIcon: <CustomerServiceOutlined />,
      tasks: [
        task(<UnorderedListOutlined style={taskIconStyle('#2563eb')} />, 'liveSchedule', 'liveScheduleDesc', 'scheduled', 'purple', onOpenLiveModal),
        task(<PushpinOutlined style={taskIconStyle('#ea580c')} />, 'productPinning', 'productPinningDesc', 'auto', 'green'),
        task(<LineChartOutlined style={taskIconStyle('#16a34a')} />, 'liveMetrics', 'liveMetricsDesc', 'passive', 'blue')
      ]
    }
  };

  const section = sections[agentType];
  if (!section) return null;

  return (
    <AgentTaskGrid
      title={<>{section.titleIcon} {t('agent.builtinTasks')}</>}
      tasks={section.tasks}
      mdSpan={section.mdSpan}
      smSpan={section.smSpan}
    />
  );
}
