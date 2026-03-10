export interface Weapon {
  name: string;
  short?: string;
  rarity: number;
  type: string;
  chars?: string[];
  isPreview?: boolean;
  s1?: string;
  s2?: string;
  s3?: string;
}

export interface Dungeon {
  id: string;
  name: string;
  s2_pool: string[];
  s3_pool: string[];
}

export interface Gear {
  name: string;
  set: string;
  rarity: number;
  type: string;
  sub1: string;
  sub2: string;
  special: string;
}

export interface UpWindow {
  start: string;
  end: string;
}

export interface UpScheduleEntry {
  windows: UpWindow[];
}

export type UpScheduleMap = Record<string, UpScheduleEntry>;

export type PlannerView = 'planner' | 'strategy' | 'match' | 'gear-refining' | 'rerun-ranking';

export interface PlannerState {
  view: PlannerView;
  selectedWeapons: string[];
  lang: 'zh-CN' | 'zh-TW' | 'en' | 'ja';
  theme: 'light' | 'dark' | 'auto';
  embed: boolean;
  api: boolean;
  readonly: boolean;
  // Sub-view states
  matchSource?: string;
  gearName?: string;
}

export interface RecommendationResult {
  dungeonId: string;
  dungeonName: string;
  lockType: 's2' | 's3';
  lockValue: string;
  schemeKey: string;
  coveredWeapons: string[];
  missingWeapons: string[];
  score: number;
  baseOverflow: boolean;
  basePick: string[];
  conflictWeapons: string[]; // Weapons that are in the "covered" list but base attribute conflict
}
