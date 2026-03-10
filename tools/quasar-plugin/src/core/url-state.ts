import type { PlannerState } from './types';

export const DEFAULT_STATE: PlannerState = {
  view: 'planner',
  selectedWeapons: [],
  lang: 'zh-CN',
  theme: 'auto',
  embed: false,
  api: false,
  readonly: false,
};

function normalizeView(value: string | null): PlannerState['view'] {
  if (value === 'planner' || value === 'strategy' || value === 'match' || value === 'gear-refining' || value === 'rerun-ranking') {
    return value;
  }
  if (value === 'weapons' || value === 'recommendation') {
    return 'planner';
  }
  if (value === 'rerun') {
    return 'rerun-ranking';
  }
  return 'planner';
}

function normalizeLang(value: string | null): PlannerState['lang'] {
  if (value === 'zh-TW' || value === 'en' || value === 'ja' || value === 'zh-CN') {
    return value;
  }
  return 'zh-CN';
}

function normalizeTheme(value: string | null): PlannerState['theme'] {
  if (value === 'light' || value === 'dark' || value === 'auto') {
    return value;
  }
  return 'auto';
}

export function parseStateFromUrl(url = window.location.href): PlannerState {
  const parsedUrl = new URL(url);
  const params = parsedUrl.searchParams;
  const weaponsRaw = params.get('weapons') || params.get('weapon') || '';
  const selectedWeapons = weaponsRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    view: normalizeView(params.get('view')),
    selectedWeapons,
    lang: normalizeLang(params.get('lang')),
    theme: normalizeTheme(params.get('theme')),
    embed: params.get('embed') === '1',
    api: params.get('api') === '1',
    readonly: params.get('readonly') === '1',
    matchSource: params.get('matchSource') || undefined,
    gearName: params.get('gearName') || undefined,
  };
}

export function writeStateToUrl(state: PlannerState, mode: 'replace' | 'push' = 'replace'): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  params.set('view', state.view);
  if (state.selectedWeapons.length > 0) {
    params.set('weapons', state.selectedWeapons.join(','));
  } else {
    params.delete('weapons');
    params.delete('weapon');
  }
  params.set('lang', state.lang);
  params.set('theme', state.theme);

  if (state.embed) params.set('embed', '1');
  else params.delete('embed');

  if (state.api) params.set('api', '1');
  else params.delete('api');

  if (state.readonly) params.set('readonly', '1');
  else params.delete('readonly');

  if (state.matchSource) params.set('matchSource', state.matchSource);
  else params.delete('matchSource');

  if (state.gearName) params.set('gearName', state.gearName);
  else params.delete('gearName');

  const next = `${url.pathname}?${params.toString()}${url.hash}`;
  if (mode === 'replace') {
    window.history.replaceState({}, '', next);
    return;
  }
  window.history.pushState({}, '', next);
}
