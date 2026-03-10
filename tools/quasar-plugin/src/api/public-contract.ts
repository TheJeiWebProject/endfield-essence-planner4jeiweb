import type { PlannerState, RecommendationResult } from '@/core/types';

export type PlannerAction = 'getState' | 'setState' | 'getRecommendations' | 'setLocale' | 'setTheme';

export interface PluginRequest<T = unknown> {
  type: 'PLUGIN_REQUEST';
  requestId: string;
  action: PlannerAction;
  payload?: T;
}

export interface PluginSuccessResponse<T = unknown> {
  type: 'PLUGIN_RESPONSE';
  requestId: string;
  ok: true;
  data: T;
}

export interface PluginErrorResponse {
  type: 'PLUGIN_RESPONSE';
  requestId: string;
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type PluginResponse<T = unknown> = PluginSuccessResponse<T> | PluginErrorResponse;

export interface PlannerApiContext {
  getState: () => PlannerState;
  setState: (partial: Partial<PlannerState>) => PlannerState;
  getRecommendations: () => RecommendationResult[];
}
