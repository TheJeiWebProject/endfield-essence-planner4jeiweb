import type { PlannerApiContext, PlannerAction } from './public-contract';
import type { PlannerState } from '@/core/types';

interface PluginGlobalApi {
  call: (action: PlannerAction, payload?: unknown) => unknown;
}

declare global {
  interface Window {
    EndfieldPlannerPlugin?: PluginGlobalApi;
  }
}

export function exposeGlobalApi(ctx: PlannerApiContext): void {
  window.EndfieldPlannerPlugin = {
    call(action, payload) {
      if (!ctx.getState().api) {
        throw new Error('api mode disabled');
      }
      if (action === 'getState') {
        return ctx.getState();
      }
      if (action === 'setState') {
        return ctx.setState((payload as Record<string, unknown>) ?? {});
      }
      if (action === 'getRecommendations') {
        return ctx.getRecommendations();
      }
      if (action === 'setLocale') {
        const lang = (payload as { lang?: PlannerState['lang'] } | undefined)?.lang;
        if (!lang) {
          throw new Error('missing lang');
        }
        return ctx.setState({ lang });
      }
      if (action === 'setTheme') {
        const theme = (payload as { theme?: PlannerState['theme'] } | undefined)?.theme;
        if (!theme) {
          throw new Error('missing theme');
        }
        return ctx.setState({ theme });
      }
      throw new Error(`unsupported action: ${action}`);
    },
  };
}
