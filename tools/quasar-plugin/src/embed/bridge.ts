import type { PlannerApiContext } from '@/api/public-contract';
import type { PluginRequest } from '@/api/public-contract';
import { handlePluginRequest } from '@/api/command-handler';

interface BridgeOptions {
  allowedOrigins?: string[];
}

export function installBridge(ctx: PlannerApiContext, options: BridgeOptions = {}): () => void {
  const allowedOrigins = options.allowedOrigins ?? [];

  const onMessage = (event: MessageEvent) => {
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
      return;
    }

    const request = event.data as PluginRequest;
    if (!request || request.type !== 'PLUGIN_REQUEST') {
      return;
    }

    if (!ctx.getState().api) {
      return;
    }

    const response = handlePluginRequest(request, ctx);
    if (event.source && 'postMessage' in event.source) {
      (event.source as Window).postMessage(response, event.origin || '*');
      return;
    }
    window.parent.postMessage(response, '*');
  };

  window.addEventListener('message', onMessage);

  return () => {
    window.removeEventListener('message', onMessage);
  };
}
