/**
 * File: scenarioData.ts
 * Purpose: WS-D scenario-first configuration model (S2/S3). Defines the 5 confirmed
 * scenario bundles (product-design.md 五、D1), their agent membership, per-store override
 * fields, mock runtime state (enabled / autonomy / earned-trust streak), and the
 * scenariosApi mock endpoints consumed by SetupConfigPage.
 *
 * Author: Michael Lee (WS-D)
 * Created: 2026-07-22
 */
import { mockDelay } from './client';
import { agentConfigs } from './agentMockData';
import { recordAuditLog } from './auditLogger';
import type {
  AgentType,
  AutonomyLevel,
  RiskLevel,
  ScenarioKey,
  ScenarioState,
  ScenarioStoreOverride,
  WeeklyDigest,
} from '../types/domain';

/** Per-store override field definition (labels resolved via i18n key). */
export interface ScenarioOverrideField {
  id: string;
  labelKey: string;
  type: 'number' | 'switch' | 'text';
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  /** id of another number field this one must not exceed (cross-field validation). */
  mustNotExceed?: string;
  /** number fields that guard spend/discount must stay > 0. */
  mustBePositive?: boolean;
}

export interface ScenarioDefinition {
  key: ScenarioKey;
  nameKey: string;
  descKey: string;
  color: string;
  agents: AgentType[];
  overrideFields: ScenarioOverrideField[];
}

/** D1-confirmed mapping: 5 scenario bundles ← 15 agents. */
export const scenarioDefinitions: ScenarioDefinition[] = [
  {
    key: 'pricing_promo',
    nameKey: 'scenario.pricingPromo',
    descKey: 'scenario.pricingPromoDesc',
    color: 'var(--ark-blue)',
    agents: ['pricing_strategy', 'promotion_campaign', 'ads_optimizer', 'competitor_intel'],
    overrideFields: [
      { id: 'targetMargin', labelKey: 'scenario.fieldTargetMargin', type: 'number', defaultValue: 30, min: 5, max: 80, suffix: '%' },
      { id: 'adDailyBudget', labelKey: 'scenario.fieldAdDailyBudget', type: 'number', defaultValue: 500, min: 0, prefix: '¥', mustBePositive: true, mustNotExceed: 'adMonthlyBudget' },
      { id: 'adMonthlyBudget', labelKey: 'scenario.fieldAdMonthlyBudget', type: 'number', defaultValue: 10000, min: 0, prefix: '¥', mustBePositive: true },
      { id: 'maxDiscount', labelKey: 'scenario.fieldMaxDiscount', type: 'number', defaultValue: 50, min: 0, max: 90, suffix: '%' },
    ],
  },
  {
    key: 'cs_aftersales',
    nameKey: 'scenario.csAftersales',
    descKey: 'scenario.csAftersalesDesc',
    color: 'var(--ark-green)',
    agents: ['customer_service', 'after_sales', 'review_manager', 'crm_retention'],
    overrideFields: [
      { id: 'autoRefundCap', labelKey: 'scenario.fieldAutoRefundCap', type: 'number', defaultValue: 20, min: 0, prefix: '¥' },
      { id: 'couponCap', labelKey: 'scenario.fieldCouponCap', type: 'number', defaultValue: 20, min: 0, max: 100, suffix: '%' },
      { id: 'autoReplyEnabled', labelKey: 'scenario.fieldAutoReply', type: 'switch', defaultValue: true },
    ],
  },
  {
    key: 'inventory',
    nameKey: 'scenario.inventory',
    descKey: 'scenario.inventoryDesc',
    color: 'var(--ark-purple)',
    agents: ['inventory_alert'],
    overrideFields: [
      { id: 'lowStockThreshold', labelKey: 'scenario.fieldLowStock', type: 'number', defaultValue: 50, min: 0, suffix: '件' },
      { id: 'autoReplenish', labelKey: 'scenario.fieldAutoReplenish', type: 'switch', defaultValue: true },
    ],
  },
  {
    key: 'fulfillment_risk',
    nameKey: 'scenario.fulfillmentRisk',
    descKey: 'scenario.fulfillmentRiskDesc',
    color: 'var(--ark-red)',
    agents: ['risk_control', 'finance_audit', 'login_bootstrap'],
    overrideFields: [
      { id: 'discrepancyThreshold', labelKey: 'scenario.fieldDiscrepancy', type: 'number', defaultValue: 100, min: 0, prefix: '¥' },
    ],
  },
  {
    key: 'listing_content',
    nameKey: 'scenario.listingContent',
    descKey: 'scenario.listingContentDesc',
    color: 'var(--ark-orange)',
    agents: ['product_launch', 'creative_factory', 'live_stream_ops'],
    overrideFields: [
      { id: 'defaultCategory', labelKey: 'scenario.fieldDefaultCategory', type: 'text', defaultValue: '' },
    ],
  },
];

/** Aggregate risk of a scenario = highest member-agent risk. */
export function scenarioRiskLevel(def: ScenarioDefinition): RiskLevel {
  const order: RiskLevel[] = ['low', 'medium', 'high'];
  let max: RiskLevel = 'low';
  for (const at of def.agents) {
    const agent = agentConfigs.find((a) => a.agentType === at);
    if (agent && order.indexOf(agent.riskLevel) > order.indexOf(max)) max = agent.riskLevel;
  }
  return max;
}

/** Earned-trust suggestion threshold (S3): after N approved runs, prompt to loosen. */
export const TRUST_STREAK_THRESHOLD = 10;

/** Mutable mock runtime state — module-level, survives navigation within a session. */
const scenarioStates: ScenarioState[] = [
  { key: 'pricing_promo', enabled: false, autonomy: 'L1', approvedRunsStreak: 26, trustSuggestionDismissed: false, storeOverrides: {} },
  { key: 'cs_aftersales', enabled: false, autonomy: 'L1', approvedRunsStreak: 41, trustSuggestionDismissed: false, storeOverrides: {} },
  { key: 'inventory', enabled: false, autonomy: 'L2', approvedRunsStreak: 7, trustSuggestionDismissed: false, storeOverrides: {} },
  { key: 'fulfillment_risk', enabled: false, autonomy: 'L1', approvedRunsStreak: 3, trustSuggestionDismissed: false, storeOverrides: {} },
  { key: 'listing_content', enabled: false, autonomy: 'L1', approvedRunsStreak: 12, trustSuggestionDismissed: false, storeOverrides: {} },
];

function getState(key: ScenarioKey): ScenarioState {
  const state = scenarioStates.find((s) => s.key === key);
  if (!state) throw new Error(`Unknown scenario: ${key}`);
  return state;
}

/**
 * Computes the dependency closure for enabling a set of agents: returns all agents
 * that must be enabled (missing dependencies included), topologically ordered so
 * dependencies come first.
 */
export function computeEnableClosure(agentTypes: AgentType[]): { ordered: AgentType[]; extraDeps: AgentType[] } {
  const wanted = new Set<AgentType>(agentTypes);
  const extraDeps: AgentType[] = [];
  // Expand missing dependencies transitively.
  let changed = true;
  while (changed) {
    changed = false;
    for (const at of [...wanted]) {
      const agent = agentConfigs.find((a) => a.agentType === at);
      if (!agent) continue;
      for (const dep of agent.dependsOn) {
        const depAgent = agentConfigs.find((a) => a.agentType === dep);
        if (depAgent && !depAgent.enabled && !wanted.has(dep)) {
          wanted.add(dep);
          extraDeps.push(dep);
          changed = true;
        }
      }
    }
  }
  // Topological order: dependencies first.
  const ordered: AgentType[] = [];
  const satisfied = new Set<AgentType>(
    agentConfigs.filter((a) => a.enabled).map((a) => a.agentType)
  );
  const remaining = [...wanted].filter((at) => !satisfied.has(at));
  while (remaining.length > 0) {
    const before = remaining.length;
    for (let i = 0; i < remaining.length; i++) {
      const agent = agentConfigs.find((a) => a.agentType === remaining[i]);
      if (!agent || agent.dependsOn.every((dep) => satisfied.has(dep))) {
        ordered.push(remaining[i]);
        satisfied.add(remaining[i]);
        remaining.splice(i, 1);
        i--;
      }
    }
    if (remaining.length === before) {
      // Circular or unsatisfiable — append rest as-is.
      ordered.push(...remaining);
      break;
    }
  }
  return { ordered, extraDeps };
}

const AUTONOMY_LABELS: Record<AutonomyLevel, string> = { L1: 'L1', L2: 'L2', L3: 'L3' };

export const scenariosApi = {
  list: (): Promise<ScenarioState[]> => mockDelay(scenarioStates.map((s) => ({ ...s }))),

  setEnabled: (key: ScenarioKey, enabled: boolean): Promise<ScenarioState> => {
    const state = getState(key);
    state.enabled = enabled;
    recordAuditLog({
      actor: '当前用户',
      action: enabled ? '启用托管场景' : '停用托管场景',
      entity: '场景',
      entityId: key as unknown as number,
      summary: `托管场景 [${key}] 已${enabled ? '启用' : '停用'}`,
      category: 'agent',
    });
    return mockDelay({ ...state });
  },

  setAutonomy: (key: ScenarioKey, autonomy: AutonomyLevel): Promise<ScenarioState> => {
    const state = getState(key);
    state.autonomy = autonomy;
    state.trustSuggestionDismissed = false;
    recordAuditLog({
      actor: '当前用户',
      action: '调整自主等级',
      entity: '场景',
      entityId: key as unknown as number,
      summary: `托管场景 [${key}] 自主等级调整为 ${AUTONOMY_LABELS[autonomy]}`,
      category: 'agent',
    });
    return mockDelay({ ...state });
  },

  dismissTrustSuggestion: (key: ScenarioKey): Promise<ScenarioState> => {
    const state = getState(key);
    state.trustSuggestionDismissed = true;
    return mockDelay({ ...state });
  },

  saveStoreOverride: (
    key: ScenarioKey,
    storeId: string,
    override: ScenarioStoreOverride
  ): Promise<ScenarioState> => {
    const state = getState(key);
    state.storeOverrides = { ...state.storeOverrides, [storeId]: { ...override } };
    recordAuditLog({
      actor: '当前用户',
      action: '保存店铺参数覆盖',
      entity: '场景',
      entityId: key as unknown as number,
      summary: `托管场景 [${key}] 已保存店铺 ${storeId} 的参数覆盖`,
      category: 'agent',
    });
    return mockDelay({ ...state });
  },

  getWeeklyDigest: (): Promise<WeeklyDigest> =>
    mockDelay({
      weekLabel: '本周（7.14 – 7.20）',
      autonomousActions: 152,
      approvalsRequested: 9,
      approvalsApproved: 8,
      hoursSaved: 21,
      perScenario: [
        { key: 'pricing_promo', actions: 47, approvals: 5, hoursSaved: 6, outcomeKey: 'scenario.outcome_pricing_promo' },
        { key: 'cs_aftersales', actions: 68, approvals: 2, hoursSaved: 9, outcomeKey: 'scenario.outcome_cs_aftersales' },
        { key: 'inventory', actions: 18, approvals: 0, hoursSaved: 3, outcomeKey: 'scenario.outcome_inventory' },
        { key: 'fulfillment_risk', actions: 12, approvals: 1, hoursSaved: 2, outcomeKey: 'scenario.outcome_fulfillment_risk' },
        { key: 'listing_content', actions: 7, approvals: 1, hoursSaved: 1, outcomeKey: 'scenario.outcome_listing_content' },
      ],
    }),
};
