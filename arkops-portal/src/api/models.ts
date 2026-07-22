import { mockDelay } from './client';
import { insertFirst, removeWhere, replaceItem } from './mockRepository';
import type { AgentModelBinding, ModelInfo, ModelUsageStats } from '../types/domain';

const platformModels: ModelInfo[] = [
  { id: 'auto', name: '自动选择', description: '由系统根据任务类型自动选择最合适的模型', isCustom: false, active: true },
  { id: 'ark-ecommerce-v1', name: 'Ark 电商专有模型', description: '平台自主研发，专为电商运营场景优化的垂类模型', isCustom: false, active: true },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI 旗舰模型，适合高精度广告分析和财务对账', isCustom: false, active: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI 轻量模型，速度快成本低，适合批量任务', isCustom: false, active: true },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Anthropic 旗舰模型，擅长文案生成和内容审核', isCustom: false, active: true },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', description: '高性价比模型，适合日常运营任务', isCustom: false, active: true },
  { id: 'deepseek-r1', name: 'DeepSeek-R1', description: '深度推理模型，适合复杂数据分析', isCustom: false, active: false },
  { id: 'qwen-max', name: '通义千问 Max', description: '阿里云旗舰模型，中文理解能力强', isCustom: false, active: false }
];

const customModels: ModelInfo[] = [];

const usageStats: Record<string, ModelUsageStats> = {
  'ark-ecommerce-v1': { modelId: 'ark-ecommerce-v1', modelName: 'Ark 电商专有模型', totalCalls: 1840, totalTokens: 42000000, trend: [
    { date: '6/9', calls: 280 }, { date: '6/10', calls: 310 }, { date: '6/11', calls: 295 },
    { date: '6/12', calls: 268 }, { date: '6/13', calls: 342 }, { date: '6/14', calls: 220 }, { date: '6/15', calls: 125 }
  ]},
  'gpt-4o': { modelId: 'gpt-4o', modelName: 'GPT-4o', totalCalls: 284, totalTokens: 3680000, trend: [
    { date: '6/9', calls: 42 }, { date: '6/10', calls: 48 }, { date: '6/11', calls: 45 },
    { date: '6/12', calls: 38 }, { date: '6/13', calls: 52 }, { date: '6/14', calls: 35 }, { date: '6/15', calls: 24 }
  ]},
  'gpt-4o-mini': { modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', totalCalls: 568, totalTokens: 12400000, trend: [
    { date: '6/9', calls: 82 }, { date: '6/10', calls: 95 }, { date: '6/11', calls: 88 },
    { date: '6/12', calls: 76 }, { date: '6/13', calls: 102 }, { date: '6/14', calls: 68 }, { date: '6/15', calls: 57 }
  ]},
  'claude-sonnet-4': { modelId: 'claude-sonnet-4', modelName: 'Claude Sonnet 4', totalCalls: 156, totalTokens: 2080000, trend: [
    { date: '6/9', calls: 24 }, { date: '6/10', calls: 28 }, { date: '6/11', calls: 26 },
    { date: '6/12', calls: 22 }, { date: '6/13', calls: 30 }, { date: '6/14', calls: 18 }, { date: '6/15', calls: 8 }
  ]},
  'deepseek-v3': { modelId: 'deepseek-v3', modelName: 'DeepSeek-V3', totalCalls: 1020, totalTokens: 20600000, trend: [
    { date: '6/9', calls: 155 }, { date: '6/10', calls: 172 }, { date: '6/11', calls: 160 },
    { date: '6/12', calls: 148 }, { date: '6/13', calls: 185 }, { date: '6/14', calls: 120 }, { date: '6/15', calls: 80 }
  ]}
};

const bindings: AgentModelBinding[] = [
  { agentType: 'ads_optimizer', agentDisplayName: '广告优化 Agent', boundModelId: 'auto', boundModelName: '自动选择' },
  { agentType: 'product_launch', agentDisplayName: '新品上架 Agent', boundModelId: 'auto', boundModelName: '自动选择' },
  { agentType: 'crm_retention', agentDisplayName: 'CRM 复购 Agent', boundModelId: 'auto', boundModelName: '自动选择' },
  { agentType: 'login_bootstrap', agentDisplayName: '登录引导 Agent', boundModelId: 'auto', boundModelName: '自动选择' },
  { agentType: 'finance_audit', agentDisplayName: '财务对账 Agent', boundModelId: 'auto', boundModelName: '自动选择' }
];

export const modelsApi = {
  listPlatform: (): Promise<ModelInfo[]> => mockDelay([...platformModels]),
  listCustom: (): Promise<ModelInfo[]> => mockDelay([...customModels]),
  toggle: (modelId: string, isCustom: boolean): Promise<ModelInfo | undefined> => {
    const list = isCustom ? customModels : platformModels;
    const model = replaceItem(list, (item) => item.id === modelId, (item) => ({ ...item, active: !item.active }));
    return mockDelay(model);
  },
  addCustom: (input: { modelType: string; description: string; apiKey: string }): Promise<ModelInfo> => {
    const labels: Record<string, string> = {
      'gpt-4o': 'GPT-4o', 'gpt-4o-mini': 'GPT-4o Mini', 'gpt-4-turbo': 'GPT-4 Turbo',
      'claude-sonnet-4': 'Claude Sonnet 4', 'claude-opus-4': 'Claude Opus 4',
      'deepseek-v3': 'DeepSeek-V3', 'deepseek-r1': 'DeepSeek-R1',
      'qwen-max': '通义千问 Max', 'glm-4': '智谱 GLM-4', 'moonshot-v1': 'Moonshot v1',
      'other': '自定义模型'
    };
    const model: ModelInfo = {
      id: `custom_${Date.now()}`,
      name: labels[input.modelType] ?? input.modelType,
      description: input.description || `${labels[input.modelType] ?? input.modelType} 私有部署`,
      isCustom: true,
      apiKey: `••••${input.apiKey.slice(-4)}`,
      active: true
    };
    insertFirst(customModels, model);
    return mockDelay(model);
  },
  // WS-F: mock API-key verification — succeeds for plausible sk- keys.
  verifyKey: (apiKey: string): Promise<{ ok: boolean }> =>
    mockDelay({ ok: apiKey.trim().startsWith('sk-') && apiKey.trim().length >= 12 }, 600),
  removeCustom: (modelId: string): Promise<void> => {
    removeWhere(customModels, (model) => model.id === modelId);
    return mockDelay(undefined);
  },
  getUsageStats: (): Promise<ModelUsageStats[]> => {
    const activeIds = [...platformModels.filter((m) => m.active), ...customModels.filter((m) => m.active)].map((m) => m.id);
    return mockDelay(Object.values(usageStats).filter((s) => activeIds.includes(s.modelId)));
  },
  getBindings: (): Promise<AgentModelBinding[]> => mockDelay([...bindings]),
  updateBinding: (agentType: string, modelId: string, modelName: string): Promise<AgentModelBinding[]> => {
    replaceItem(bindings, (binding) => binding.agentType === agentType, (binding) => ({
      ...binding,
      boundModelId: modelId,
      boundModelName: modelName
    }));
    return mockDelay([...bindings]);
  }
};
