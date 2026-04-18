import type { PlannerState, RecommendationConfig } from './types';

export interface WeaponMarkUrlState {
  ownedWeaponNames: string[];
  ownedMatrixNames: string[];
  hasOwnedWeaponParam: boolean;
  hasOwnedMatrixParam: boolean;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  hideEssenceOwnedWeaponsInSelector: false,
  hideEssenceOwnedWeaponsInPlans: false,
  hideEssenceOwnedOwnedOnly: false,
  hideUnownedWeaponsInSelector: false,
  hideUnownedWeaponsInPlans: false,
  hideFourStarWeaponsInSelector: false,
  hideFourStarWeaponsInPlans: false,
  showWeaponOwnership: true,
  attributeFilterAffectsHiddenWeapons: false,
  preferredRegion1: '',
  preferredRegion2: '',
  regionPriorityMode: 'ignore',
  ownershipPriorityMode: 'ignore',
  strictPriorityOrder: 'ownershipFirst',
};

export const DEFAULT_STATE: PlannerState = {
  view: 'planner',
  selectedWeapons: [],
  lang: 'zh-CN',
  theme: 'auto',
  embed: false,
  api: false,
  readonly: false,
  hideWeaponSelector: false,
  recommendationConfig: { ...DEFAULT_RECOMMENDATION_CONFIG },
};

function normalizeBooleanParam(value: string | null): boolean {
  return value === '1' || value === 'true';
}

function normalizeView(value: string | null): PlannerState['view'] {
  if (value === 'planner' || value === 'strategy' || value === 'match' || value === 'gear-refining' || value === 'rerun-ranking' || value === 'editor') {
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
  if (
    value === 'light' ||
    value === 'dark' ||
    value === 'auto' ||
    value === 'classic-light' ||
    value === 'classic-dark'
  ) {
    return value;
  }
  if (value === 'classic') {
    return 'classic-dark';
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
    selectedCharacterId: params.get('operator') || undefined,
    lang: normalizeLang(params.get('lang')),
    theme: normalizeTheme(params.get('theme')),
    embed: params.get('embed') === '1',
    api: params.get('api') === '1',
    readonly: params.get('readonly') === '1',
    hideWeaponSelector: normalizeBooleanParam(params.get('hideWeaponSelector')) || normalizeBooleanParam(params.get('hideSelector')),
    matchSource: params.get('matchSource') || undefined,
    gearName: params.get('gearName') || undefined,
    recommendationConfig: { ...DEFAULT_RECOMMENDATION_CONFIG },
  };
}

function parseNameListFromParams(params: URLSearchParams, keys: string[]): { values: string[]; hasAny: boolean } {
  const entries: string[] = [];
  let hasAny = false;
  keys.forEach((key) => {
    if (params.has(key)) {
      hasAny = true;
      const packed = params.get(key);
      if (packed) {
        entries.push(...packed.split(','));
      }
      const repeated = params.getAll(key);
      if (repeated.length > 1) {
        entries.push(...repeated.slice(1));
      }
    }
  });
  const values = Array.from(new Set(entries.map((item) => item.trim()).filter(Boolean)));
  return { values, hasAny };
}

export function parseWeaponMarksFromUrl(
  url = window.location.href,
  weaponNameSet?: Set<string>,
): WeaponMarkUrlState {
  const parsedUrl = new URL(url);
  const params = parsedUrl.searchParams;

  const ownedWeaponParsed = parseNameListFromParams(params, ['ownedWeapons', 'ownedWeapon']);
  const ownedMatrixParsed = parseNameListFromParams(params, ['ownedMatrix', 'ownedMatrices']);

  const ownedWeaponNames = weaponNameSet
    ? ownedWeaponParsed.values.filter((name) => weaponNameSet.has(name))
    : ownedWeaponParsed.values;
  const ownedMatrixNames = weaponNameSet
    ? ownedMatrixParsed.values.filter((name) => weaponNameSet.has(name))
    : ownedMatrixParsed.values;

  return {
    ownedWeaponNames,
    ownedMatrixNames,
    hasOwnedWeaponParam: ownedWeaponParsed.hasAny,
    hasOwnedMatrixParam: ownedMatrixParsed.hasAny,
  };
}

export function writeStateToUrl(
  state: PlannerState,
  mode: 'replace' | 'push' = 'replace',
  options?: {
    ownedWeaponNames?: string[];
    ownedMatrixNames?: string[];
  },
): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  params.set('view', state.view);
  if (state.view === 'strategy' && state.selectedCharacterId) params.set('operator', state.selectedCharacterId);
  else params.delete('operator');
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

  if (state.hideWeaponSelector) params.set('hideWeaponSelector', '1');
  else {
    params.delete('hideWeaponSelector');
    params.delete('hideSelector');
  }

  if (state.matchSource) params.set('matchSource', state.matchSource);
  else params.delete('matchSource');

  if (state.gearName) params.set('gearName', state.gearName);
  else params.delete('gearName');

  if (options?.ownedWeaponNames) {
    if (options.ownedWeaponNames.length > 0) {
      params.set('ownedWeapons', options.ownedWeaponNames.join(','));
    } else {
      params.delete('ownedWeapons');
      params.delete('ownedWeapon');
    }
  }

  if (options?.ownedMatrixNames) {
    if (options.ownedMatrixNames.length > 0) {
      params.set('ownedMatrix', options.ownedMatrixNames.join(','));
    } else {
      params.delete('ownedMatrix');
      params.delete('ownedMatrices');
    }
  }

  const next = `${url.pathname}?${params.toString()}${url.hash}`;
  if (mode === 'replace') {
    window.history.replaceState({}, '', next);
    return;
  }
  window.history.pushState({}, '', next);
}
