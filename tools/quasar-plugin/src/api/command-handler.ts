import type { PlannerState } from '@/core/types';
import type { PlannerApiContext, PluginRequest, PluginResponse } from './public-contract';

const ALLOWED_ACTIONS = new Set(['getState', 'setState', 'getRecommendations', 'setLocale', 'setTheme']);

function success<T>(requestId: string, data: T): PluginResponse<T> {
  return {
    type: 'PLUGIN_RESPONSE',
    requestId,
    ok: true,
    data,
  };
}

function failure(requestId: string, code: string, message: string): PluginResponse {
  return {
    type: 'PLUGIN_RESPONSE',
    requestId,
    ok: false,
    error: { code, message },
  };
}

export function handlePluginRequest(request: PluginRequest, ctx: PlannerApiContext): PluginResponse {
  if (!request || request.type !== 'PLUGIN_REQUEST') {
    return failure('unknown', 'BAD_REQUEST', 'invalid request type');
  }

  if (!request.requestId) {
    return failure('unknown', 'BAD_REQUEST', 'missing requestId');
  }

  if (!ALLOWED_ACTIONS.has(request.action)) {
    return failure(request.requestId, 'ACTION_NOT_ALLOWED', `unsupported action: ${request.action}`);
  }

  if (request.action === 'getState') {
    return success(request.requestId, ctx.getState());
  }

  if (request.action === 'getRecommendations') {
    return success(request.requestId, ctx.getRecommendations());
  }

  if (request.action === 'setLocale') {
    const payload = request.payload as { lang?: PlannerState['lang'] };
    if (!payload?.lang) {
      return failure(request.requestId, 'VALIDATION_ERROR', 'missing lang');
    }
    return success(request.requestId, ctx.setState({ lang: payload.lang }));
  }

  if (request.action === 'setTheme') {
    const payload = request.payload as { theme?: PlannerState['theme'] };
    if (!payload?.theme) {
      return failure(request.requestId, 'VALIDATION_ERROR', 'missing theme');
    }
    return success(request.requestId, ctx.setState({ theme: payload.theme }));
  }

  const payload = request.payload as Partial<PlannerState> | undefined;
  return success(request.requestId, ctx.setState(payload ?? {}));
}
