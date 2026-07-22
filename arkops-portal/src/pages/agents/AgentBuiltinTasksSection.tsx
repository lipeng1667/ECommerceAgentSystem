import {
  AppstoreOutlined,
  BankOutlined,
  BellOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  PayCircleOutlined,
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
  /**
   * WS-D (D6): when provided, built-in task cards become clickable and hand the
   * selected template (localized title + goal) to the caller — used by
   * AgentConfigPage to pre-fill the task creation modal.
   */
  onTaskSelect?: (template: { title: string; goal: string }) => void;
}

/**
 * WS-D: plain-data spec for every agent's built-in tasks (i18n keys, no JSX).
 * Shared by this section, the pre-enable drawer ("what it will do") and the
 * new-task goal templates. Icons/spans stay in the component below.
 */
export interface BuiltinTaskSpec {
  titleKey: string;
  descKey: string;
  tagKey?: string;
  tagColor?: string;
}

export const BUILTIN_TASKS: Partial<Record<AgentType, BuiltinTaskSpec[]>> = {
  pricing_strategy: [
    { titleKey: 'priceScan', descKey: 'priceScanDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'dynamicPrice', descKey: 'dynamicPriceDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'floorProtect', descKey: 'floorProtectDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  login_bootstrap: [
    { titleKey: 'sessionCheckTask', descKey: 'sessionCheckTaskDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'sessionFailedTask', descKey: 'sessionFailedTaskDesc', tagKey: 'passive', tagColor: 'blue' },
    { titleKey: 'bulkPatrol', descKey: 'bulkPatrolDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  competitor_intel: [
    { titleKey: 'passiveCompetitorMonitor', descKey: 'passiveCompetitorMonitorDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'productResearch', descKey: 'productResearchDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'trendMonitor', descKey: 'trendMonitorDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  product_launch: [
    { titleKey: 'imageRecognition', descKey: 'imageRecognitionDesc', tagKey: 'active', tagColor: 'orange' },
    { titleKey: 'draftGeneration', descKey: 'draftGenerationDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'complianceCheck', descKey: 'complianceCheckDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  ads_optimizer: [
    { titleKey: 'roiPatrol', descKey: 'roiPatrolDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'budgetOptimize', descKey: 'budgetOptimizeDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'abTest', descKey: 'abTestDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  crm_retention: [
    { titleKey: 'segmentRefresh', descKey: 'segmentRefreshDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'couponSend', descKey: 'couponSendDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'churnPredict', descKey: 'churnPredictDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'vipCare', descKey: 'vipCareDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  review_manager: [
    { titleKey: 'negativeMonitor', descKey: 'negativeMonitorDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'autoReply', descKey: 'autoReplyDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'reviewInvite', descKey: 'reviewInviteDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  customer_service: [
    { titleKey: 'smartReply', descKey: 'smartReplyDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'escalateHuman', descKey: 'escalateHumanDesc', tagKey: 'passive', tagColor: 'blue' },
    { titleKey: 'faqLearn', descKey: 'faqLearnDesc', tagKey: 'passive', tagColor: 'blue' },
  ],
  after_sales: [
    { titleKey: 'returnAudit', descKey: 'returnAuditDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'refundProcess', descKey: 'refundProcessDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'logisticsTrack', descKey: 'logisticsTrackDesc', tagKey: 'scheduled', tagColor: 'purple' },
  ],
  creative_factory: [
    { titleKey: 'imageGen', descKey: 'imageGenDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'videoGen', descKey: 'videoGenDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'copyGen', descKey: 'copyGenDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  inventory_alert: [
    { titleKey: 'lowStockAlert', descKey: 'lowStockAlertDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'deadStock', descKey: 'deadStockDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'replenish', descKey: 'replenishDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  risk_control: [
    { titleKey: 'complianceScan', descKey: 'complianceScanDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'behaviorMonitor', descKey: 'behaviorMonitorDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'circuitBreaker', descKey: 'circuitBreakerDesc', tagKey: 'passive', tagColor: 'blue' },
  ],
  finance_audit: [
    { titleKey: 'monthlyReconcile', descKey: 'monthlyReconcileDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'discrepancyMark', descKey: 'discrepancyMarkDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'reportGen', descKey: 'reportGenDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  promotion_campaign: [
    { titleKey: 'flashSaleSetup', descKey: 'flashSaleSetupDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'couponCampaign', descKey: 'couponCampaignDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'bundleDeal', descKey: 'bundleDealDesc', tagKey: 'auto', tagColor: 'green' },
  ],
  live_stream_ops: [
    { titleKey: 'liveSchedule', descKey: 'liveScheduleDesc', tagKey: 'scheduled', tagColor: 'purple' },
    { titleKey: 'productPinning', descKey: 'productPinningDesc', tagKey: 'auto', tagColor: 'green' },
    { titleKey: 'liveMetrics', descKey: 'liveMetricsDesc', tagKey: 'passive', tagColor: 'blue' },
  ],
};

const taskIconStyle = (color: string) => ({ color, marginRight: 6 });

interface AgentTaskLayout {
  titleIcon: JSX.Element;
  mdSpan?: number;
  smSpan?: number;
  /** Ordered icons matching BUILTIN_TASKS[agentType]. */
  icons: JSX.Element[];
}

export function AgentBuiltinTasksSection({
  agentType,
  onTaskSelect,
}: AgentBuiltinTasksSectionProps) {
  const { t } = useI18n();

  const layouts: Partial<Record<AgentType, AgentTaskLayout>> = {
    pricing_strategy: {
      titleIcon: <PayCircleOutlined />,
      icons: [
        <EyeOutlined style={taskIconStyle('#2563eb')} />,
        <ToolOutlined style={taskIconStyle('#16a34a')} />,
        <WarningOutlined style={taskIconStyle('#ea580c')} />,
      ],
    },
    login_bootstrap: {
      titleIcon: <UnorderedListOutlined />,
      smSpan: 12,
      icons: [
        <CheckCircleOutlined style={taskIconStyle('#2563eb')} />,
        <BellOutlined style={taskIconStyle('#ea580c')} />,
        <GlobalOutlined style={taskIconStyle('#7c3aed')} />,
      ],
    },
    competitor_intel: {
      titleIcon: <RadarChartOutlined />,
      icons: [
        <EyeOutlined style={taskIconStyle('#2563eb')} />,
        <SearchOutlined style={taskIconStyle('#16a34a')} />,
        <GlobalOutlined style={taskIconStyle('#7c3aed')} />,
      ],
    },
    product_launch: {
      titleIcon: <CameraOutlined />,
      icons: [
        <CameraOutlined style={taskIconStyle('#2563eb')} />,
        <EditOutlined style={taskIconStyle('#16a34a')} />,
        <SafetyOutlined style={taskIconStyle('#ea580c')} />,
      ],
    },
    ads_optimizer: {
      titleIcon: <ThunderboltOutlined />,
      icons: [
        <LineChartOutlined style={taskIconStyle('#2563eb')} />,
        <ToolOutlined style={taskIconStyle('#16a34a')} />,
        <FireOutlined style={taskIconStyle('#ea580c')} />,
      ],
    },
    crm_retention: {
      titleIcon: <GiftOutlined />,
      mdSpan: 6,
      smSpan: 12,
      icons: [
        <SkinOutlined style={taskIconStyle('#2563eb')} />,
        <GiftOutlined style={taskIconStyle('#16a34a')} />,
        <WarningOutlined style={taskIconStyle('#ea580c')} />,
        <CrownOutlined style={taskIconStyle('#f59e0b')} />,
      ],
    },
    review_manager: {
      titleIcon: <StarOutlined />,
      icons: [
        <WarningOutlined style={taskIconStyle('#dc2626')} />,
        <EditOutlined style={taskIconStyle('#16a34a')} />,
        <SmileOutlined style={taskIconStyle('#2563eb')} />,
      ],
    },
    customer_service: {
      titleIcon: <CustomerServiceOutlined />,
      icons: [
        <SmileOutlined style={taskIconStyle('#16a34a')} />,
        <WarningOutlined style={taskIconStyle('#ea580c')} />,
        <SearchOutlined style={taskIconStyle('#7c3aed')} />,
      ],
    },
    after_sales: {
      titleIcon: <ToolOutlined />,
      icons: [
        <FileSearchOutlined style={taskIconStyle('#2563eb')} />,
        <WalletOutlined style={taskIconStyle('#16a34a')} />,
        <ShoppingCartOutlined style={taskIconStyle('#ea580c')} />,
      ],
    },
    creative_factory: {
      titleIcon: <PictureOutlined />,
      icons: [
        <PictureOutlined style={taskIconStyle('#2563eb')} />,
        <CameraOutlined style={taskIconStyle('#16a34a')} />,
        <EditOutlined style={taskIconStyle('#ea580c')} />,
      ],
    },
    inventory_alert: {
      titleIcon: <ShoppingCartOutlined />,
      icons: [
        <WarningOutlined style={taskIconStyle('#dc2626')} />,
        <StopOutlined style={taskIconStyle('#64748b')} />,
        <ShoppingCartOutlined style={taskIconStyle('#16a34a')} />,
      ],
    },
    risk_control: {
      titleIcon: <SafetyOutlined />,
      icons: [
        <FileSearchOutlined style={taskIconStyle('#2563eb')} />,
        <EyeOutlined style={taskIconStyle('#ea580c')} />,
        <StopOutlined style={taskIconStyle('#dc2626')} />,
      ],
    },
    finance_audit: {
      titleIcon: <BankOutlined />,
      icons: [
        <FileSearchOutlined style={taskIconStyle('#2563eb')} />,
        <WarningOutlined style={taskIconStyle('#ea580c')} />,
        <EditOutlined style={taskIconStyle('#16a34a')} />,
      ],
    },
    promotion_campaign: {
      titleIcon: <GiftOutlined />,
      icons: [
        <ThunderboltOutlined style={taskIconStyle('#dc2626')} />,
        <PayCircleOutlined style={taskIconStyle('#2563eb')} />,
        <ShoppingCartOutlined style={taskIconStyle('#16a34a')} />,
      ],
    },
    live_stream_ops: {
      titleIcon: <CustomerServiceOutlined />,
      icons: [
        <UnorderedListOutlined style={taskIconStyle('#2563eb')} />,
        <PushpinOutlined style={taskIconStyle('#ea580c')} />,
        <LineChartOutlined style={taskIconStyle('#16a34a')} />,
      ],
    },
  };

  const specs = BUILTIN_TASKS[agentType];
  const layout = layouts[agentType];
  if (!specs || !layout) return null;

  const tasks: AgentTaskDefinition[] = specs.map((spec, i) => {
    const title = t(`agent.${spec.titleKey}`);
    const description = t(`agent.${spec.descKey}`);
    return {
      icon: layout.icons[i],
      title,
      description,
      tag: spec.tagKey ? t(`agent.${spec.tagKey}`) : undefined,
      tagColor: spec.tagColor,
      onClick: onTaskSelect ? () => onTaskSelect({ title, goal: description }) : undefined,
    };
  });

  return (
    <AgentTaskGrid
      title={<><AppstoreOutlined /> {t('agent.builtinTasks')}</>}
      tasks={tasks}
      mdSpan={layout.mdSpan}
      smSpan={layout.smSpan}
    />
  );
}
