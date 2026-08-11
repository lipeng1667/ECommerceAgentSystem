export interface AgentStatus {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  running: boolean;
  autonomyLevel: 'full_auto' | 'semi_auto' | 'manual' | 'disabled';
  lastActivity: string;
  todayCount: number;
  description: string;
}

export interface Decision {
  id: string;
  agentId: string;
  agentName: string;
  storeId?: string;
  level: 'critical' | 'medium' | 'normal';
  title: string;
  summary: string;
  analysis: string;
  suggestions: DecisionOption[];
  createdAt: string;
  context: Record<string, unknown>;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
}

export interface DailyReport {
  agentCount: number;
  runningCount: number;
  totalAutoActions: number;
  hoursSaved: number;
  autoRate: number;
  agentCoverage: number;
  decisionCount: number;
  decisions: Decision[];
  moduleCoverage: { total: number; covered: number };
  gmv: string;
  gmvChange: string;
  ratingScore: number;
  inventoryTurnover: string;
  healthLabel: string;
}

export interface BusinessOperated extends Record<string, unknown> {
  id: string;
  name: string;
  status: 'auto' | 'manual' | 'warning' | 'critical';
  agentAction: string;
  agentActionTime: string;
}
