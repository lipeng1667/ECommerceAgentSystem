import type { useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '../../../api/agents';
import type { AgentConfig, AgentStrategyConfig } from '../../../types/domain';

export type AgentWithStrategyConfig = AgentConfig & { strategyConfig: NonNullable<AgentConfig['strategyConfig']> };

/**
 * Shared utility for safely updating a strategyConfig sub-section via React Query cache.
 * Extracted from 4 duplicated definitions across strategy-config components.
 */
export function updateConfigSection(
  queryClient: ReturnType<typeof useQueryClient>,
  agent: AgentWithStrategyConfig,
  sectionKey: string,
  updater: (section: any) => any,
) {
  // 先更新 React Query 缓存（即时 UI 响应）
  queryClient.setQueryData(['agent', agent.agentType], (prev: any) => {
    if (!prev?.strategyConfig) return prev;
    return {
      ...prev,
      strategyConfig: {
        ...prev.strategyConfig,
        [sectionKey]: updater(prev.strategyConfig[sectionKey]),
      },
    };
  });
  // 同时调用 API 持久化到 mock 数据层
  const current = queryClient.getQueryData<AgentConfig>(['agent', agent.agentType]);
  if (current?.strategyConfig) {
    const sectionValue = (current.strategyConfig as Record<string, unknown>)[sectionKey];
    agentsApi.saveStrategyConfig(agent.agentType, { [sectionKey]: sectionValue } as Partial<AgentStrategyConfig>);
  }
}
