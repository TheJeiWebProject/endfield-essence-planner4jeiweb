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

export interface CharacterSkillDataRow {
  name: string;
  values: string[];
}

export interface CharacterSkillDataTable {
  title: string;
  rows: CharacterSkillDataRow[];
}

export interface CharacterSkill {
  name: string;
  type?: string;
  description: string;
  icon?: string;
  dataTables?: CharacterSkillDataTable[];
}

export interface CharacterStats {
  strength?: string;
  agility?: string;
  intellect?: string;
  will?: string;
  attack?: string;
  hp?: string;
}

export interface Character {
  id: string;
  name: string;
  rarity?: number;
  element?: string;
  weaponType?: string;
  mainAbility?: string;
  subAbility?: string;
  role?: string;
  profession?: string;
  stats?: CharacterStats;
  skills?: CharacterSkill[];
  talents?: CharacterSkill[];
  baseSkills?: CharacterSkill[];
  potentials?: unknown[];
  materials?: Record<string, unknown>;
  guide?: Record<string, unknown>;
}

export interface PlannerContentCompat {
  supportedVersion?: string;
  nextVersion?: string;
  nextVersionAt?: string;
}

export interface PlannerContentAnnouncement {
  version?: string;
  title?: string;
  date?: string;
  forceModal?: boolean;
  qqGroup?: string;
  qqNote?: string;
  items?: string[];
}

export interface PlannerContentChangelogEntry {
  date: string;
  items: string[];
}

export interface PlannerContentChangelog {
  title?: string;
  entries?: PlannerContentChangelogEntry[];
}

export interface PlannerContent {
  gameCompat?: PlannerContentCompat;
  announcement?: PlannerContentAnnouncement;
  changelog?: PlannerContentChangelog;
}

export interface UpWindow {
  start: string;
  end: string;
}

export interface UpScheduleEntry {
  windows: UpWindow[];
}

export type UpScheduleMap = Record<string, UpScheduleEntry>;

export type PlannerView = 'planner' | 'strategy' | 'match' | 'gear-refining' | 'rerun-ranking' | 'editor';

export interface RecommendationConfig {
  hideEssenceOwnedWeaponsInSelector: boolean;
  hideEssenceOwnedWeaponsInPlans: boolean;
  hideEssenceOwnedOwnedOnly: boolean;
  hideUnownedWeaponsInSelector: boolean;
  hideUnownedWeaponsInPlans: boolean;
  hideFourStarWeaponsInSelector: boolean;
  hideFourStarWeaponsInPlans: boolean;
  showWeaponOwnership: boolean;
  attributeFilterAffectsHiddenWeapons: boolean;
  preferredRegion1: string;
  preferredRegion2: string;
  regionPriorityMode: 'ignore' | 'sameCoverage' | 'sameEfficiency' | 'strict';
  ownershipPriorityMode: 'ignore' | 'sameCoverage' | 'sameEfficiency' | 'strict';
  strictPriorityOrder: 'ownershipFirst' | 'regionFirst';
}

export interface PlannerState {
  view: PlannerView;
  selectedWeapons: string[];
  selectedCharacterId?: string;
  lang: 'zh-CN' | 'zh-TW' | 'en' | 'ja';
  theme: 'light' | 'dark' | 'auto' | 'classic-light' | 'classic-dark';
  embed: boolean;
  api: boolean;
  readonly: boolean;
  hideWeaponSelector: boolean;
  // Sub-view states
  matchSource?: string;
  gearName?: string;
  recommendationConfig: RecommendationConfig;
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
  weaponCount?: number;
  maxWeaponCount?: number;
  targetCount?: number;
  selectedMatchCount?: number;
  selectedMissingNames?: string[];
  selectedMatchNames?: string[];
  dungeonRegion?: string;
  conflictDetails?: Array<{
    name: string;
    s1: string;
    s2: string;
    s3: string;
    reason: string;
  }>;
  weaponRows?: Array<{
    name: string;
    s1: string;
    s2: string;
    s3: string;
    rarity: number;
    type: string;
    short?: string;
    isCustom?: boolean;
    isSelected: boolean;
    isWeaponOwned: boolean;
    isUnowned: boolean;
    isEssenceOwned: boolean;
  }>;
  baseAllLabels?: string[];
  baseAutoPickKeys?: string[];
  requiredBaseKeys?: string[];
  baseCount?: number;
}
