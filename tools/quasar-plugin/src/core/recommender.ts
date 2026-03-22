import type { Dungeon, RecommendationConfig, RecommendationResult, Weapon } from './types';

interface RecommendationOptions {
  config?: RecommendationConfig;
  isWeaponOwned?: (name: string) => boolean;
  isMatrixOwned?: (name: string) => boolean;
}

interface RankedScheme {
  result: RecommendationResult;
  regionRank: number;
  ownedMatchCount: number;
  unownedMatchCount: number;
  selectedMatchCount: number;
  realFarmableCount: number;
  weaponCount: number;
  maxWeaponCount: number;
}

function uniqueSorted(items: string[], sorter?: (a: string, b: string) => number): string[] {
  const values = Array.from(new Set(items.filter(Boolean)));
  if (sorter) values.sort(sorter);
  return values;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value || value === '任意') return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function getDungeonRegion(name: string): string {
  const delimiter = name.indexOf('·');
  if (delimiter > 0) {
    return name.slice(0, delimiter).trim();
  }
  return name.trim();
}

function getRegionRank(region: string, preferred1: string, preferred2: string): number {
  if (!region) return 99;
  if (preferred1 && region === preferred1) return 0;
  if (preferred2 && region === preferred2) return 1;
  return 2;
}

function compareByPriority(a: RankedScheme, b: RankedScheme, config?: RecommendationConfig): number {
  const regionMode = config?.regionPriorityMode || 'ignore';
  const ownershipMode = config?.ownershipPriorityMode || 'ignore';
  const strictPriorityOrder = config?.strictPriorityOrder || 'ownershipFirst';

  const coverageDiff = b.selectedMatchCount - a.selectedMatchCount;
  const farmableDiff = b.realFarmableCount - a.realFarmableCount;
  const maxWeaponDiff = b.maxWeaponCount - a.maxWeaponCount;
  const ownedDiff = b.ownedMatchCount - a.ownedMatchCount;
  const unownedDiff = a.unownedMatchCount - b.unownedMatchCount;
  const regionDiff = a.regionRank - b.regionRank;

  const hasStrict = regionMode === 'strict' || ownershipMode === 'strict';
  if (hasStrict && regionMode === 'strict' && ownershipMode === 'strict') {
    if (strictPriorityOrder === 'ownershipFirst') {
      if (ownedDiff !== 0) return ownedDiff;
      if (unownedDiff !== 0) return unownedDiff;
      if (regionDiff !== 0) return regionDiff;
    } else {
      if (regionDiff !== 0) return regionDiff;
      if (ownedDiff !== 0) return ownedDiff;
      if (unownedDiff !== 0) return unownedDiff;
    }
  } else if (hasStrict) {
    if (ownershipMode === 'strict') {
      if (ownedDiff !== 0) return ownedDiff;
      if (unownedDiff !== 0) return unownedDiff;
    }
    if (regionMode === 'strict' && regionDiff !== 0) return regionDiff;
  }

  if (coverageDiff !== 0) return coverageDiff;
  if (farmableDiff !== 0) return farmableDiff;
  if (maxWeaponDiff !== 0) return maxWeaponDiff;

  if (ownershipMode === 'sameCoverage') {
    if (ownedDiff !== 0) return ownedDiff;
    if (unownedDiff !== 0) return unownedDiff;
  }
  if (regionMode === 'sameCoverage' && regionDiff !== 0) return regionDiff;

  if (ownershipMode === 'sameEfficiency') {
    if (ownedDiff !== 0) return ownedDiff;
    if (unownedDiff !== 0) return unownedDiff;
  }
  if (regionMode === 'sameEfficiency' && regionDiff !== 0) return regionDiff;

  if (a.result.dungeonName !== b.result.dungeonName) {
    return a.result.dungeonName.localeCompare(b.result.dungeonName, 'zh-Hans-CN');
  }
  if (a.result.lockType !== b.result.lockType) {
    return a.result.lockType.localeCompare(b.result.lockType, 'zh-Hans-CN');
  }
  if (a.result.lockValue !== b.result.lockValue) {
    return a.result.lockValue.localeCompare(b.result.lockValue, 'zh-Hans-CN');
  }
  return a.result.dungeonName.localeCompare(b.result.dungeonName, 'zh-Hans-CN');
}

function buildConflictReason(
  weapon: Weapon,
  dungeon: Dungeon,
  lockType: 's2' | 's3',
  lockValue: string,
): string {
  if (lockType === 's2') {
    if (weapon.s2 !== lockValue) {
      return `附加属性需为「${lockValue}」`;
    }
    if (!weapon.s3 || !dungeon.s3_pool.includes(weapon.s3)) {
      return `副本不掉落技能属性「${weapon.s3 || '-'}」`;
    }
    return '与当前锁定方案不兼容';
  }

  if (weapon.s3 !== lockValue) {
    return `技能属性需为「${lockValue}」`;
  }
  if (!weapon.s2 || !dungeon.s2_pool.includes(weapon.s2)) {
    return `副本不掉落附加属性「${weapon.s2 || '-'}」`;
  }
  return '与当前锁定方案不兼容';
}

function getS1OrderIndex(value?: string): number {
  const order = ['敏捷提升', '力量提升', '意志提升', '智识提升', '主能力提升'];
  const index = order.indexOf(value || '');
  return index === -1 ? 99 : index;
}

function compareText(a?: string, b?: string): number {
  return (a || '').localeCompare(b || '', 'zh-Hans-CN');
}

function getSchemeWeaponSorter(lockType: 's2' | 's3', selectedSet: Set<string>, baseCounts: Record<string, number>) {
  const secondaryKey = lockType === 's2' ? 's3' : 's2';
  return (a: Weapon, b: Weapon) => {
    const selectedDiff = (selectedSet.has(b.name) ? 1 : 0) - (selectedSet.has(a.name) ? 1 : 0);
    if (selectedDiff !== 0) return selectedDiff;
    const baseCountDiff = (baseCounts[b.s1 || ''] || 0) - (baseCounts[a.s1 || ''] || 0);
    if (baseCountDiff !== 0) return baseCountDiff;
    const baseDiff = getS1OrderIndex(a.s1) - getS1OrderIndex(b.s1);
    if (baseDiff !== 0) return baseDiff;
    const secondaryDiff = compareText(a[secondaryKey], b[secondaryKey]);
    if (secondaryDiff !== 0) return secondaryDiff;
    if (b.rarity !== a.rarity) return b.rarity - a.rarity;
    return compareText(a.name, b.name);
  };
}

function isWeaponCompatible(weapon: Weapon, dungeon: Dungeon, lockType: 's2' | 's3', lockValue: string): boolean {
  if (lockType === 's2') {
    return (
      weapon.s2 === lockValue &&
      dungeon.s2_pool.includes(lockValue) &&
      Boolean(weapon.s3) &&
      dungeon.s3_pool.includes(weapon.s3 || '')
    );
  }
  return (
    weapon.s3 === lockValue &&
    dungeon.s3_pool.includes(lockValue) &&
    Boolean(weapon.s2) &&
    dungeon.s2_pool.includes(weapon.s2 || '')
  );
}

export function getRecommendations(
  selectedWeaponNames: string[],
  weapons: Weapon[],
  dungeons: Dungeon[],
  options?: RecommendationOptions,
): RecommendationResult[] {
  const selectedSet = new Set(selectedWeaponNames);
  const targets = weapons.filter((item) => selectedSet.has(item.name));
  const ranked: RankedScheme[] = [];
  const config = options?.config;
  const isWeaponOwned = options?.isWeaponOwned ?? (() => false);
  const isMatrixOwned = options?.isMatrixOwned ?? (() => false);

  const hideEssenceOwnedInPlans = Boolean(config?.hideEssenceOwnedWeaponsInPlans);
  const hideEssenceOwnedOwnedOnly = Boolean(config?.hideEssenceOwnedOwnedOnly);
  const hideUnownedInPlans = Boolean(config?.hideUnownedWeaponsInPlans);
  const hideFourStarWeaponsInPlans = Boolean(config?.hideFourStarWeaponsInPlans);
  const useEffectiveMetrics = hideEssenceOwnedInPlans && hideEssenceOwnedOwnedOnly;

  const shouldHideWeaponInPlan = (weapon: Weapon): boolean => {
    if (!weapon) return true;
    if (hideEssenceOwnedInPlans && isMatrixOwned(weapon.name)) {
      if (!hideEssenceOwnedOwnedOnly || isWeaponOwned(weapon.name)) {
        return true;
      }
    }
    if (hideUnownedInPlans && !isWeaponOwned(weapon.name)) {
      return true;
    }
    return false;
  };

  const targetsInPlan = targets.filter((weapon) => !shouldHideWeaponInPlan(weapon));
  if (!targetsInPlan.length) {
    return [];
  }

  const isFarmableInCurrentVersion = (weapon: Weapon): boolean => {
    if (!weapon.s2 || !weapon.s3) return false;
    return dungeons.some((dungeon) => {
      return dungeon.s2_pool.includes(weapon.s2 || '') && dungeon.s3_pool.includes(weapon.s3 || '');
    });
  };

  const farmableS1Pool = uniqueSorted(
    weapons
      .filter((weapon) => isFarmableInCurrentVersion(weapon))
      .map((weapon) => weapon.s1 || ''),
    (a, b) => getS1OrderIndex(a) - getS1OrderIndex(b),
  );

  const lockOptions = [
    ...uniqueSorted(
      targetsInPlan.map((w) => w.s2 || ''),
      (a, b) => a.localeCompare(b, 'zh-Hans-CN'),
    ).map((value) => ({ type: 's2' as const, value })),
    ...uniqueSorted(
      targetsInPlan.map((w) => w.s3 || ''),
      (a, b) => a.localeCompare(b, 'zh-Hans-CN'),
    ).map((value) => ({ type: 's3' as const, value })),
  ];

  if (!lockOptions.length) {
    return [];
  }

  dungeons.forEach((dungeon) => {
    lockOptions.forEach((option) => {
      const lockPool = option.type === 's2' ? dungeon.s2_pool : dungeon.s3_pool;
      if (!lockPool.includes(option.value)) {
        return;
      }

      const matchedSelected = targetsInPlan.filter((weapon) =>
        isWeaponCompatible(weapon, dungeon, option.type, option.value),
      );
      if (!matchedSelected.length) {
        return;
      }

      const schemePool = weapons.filter((weapon) => {
        if (hideFourStarWeaponsInPlans && weapon.rarity === 4) return false;
        return isWeaponCompatible(weapon, dungeon, option.type, option.value);
      });

      const schemePoolVisible = schemePool.filter((weapon) => !shouldHideWeaponInPlan(weapon));

      const baseCounts = countBy(schemePoolVisible.map((weapon) => weapon.s1 || ''));
      const baseKeys = Object.keys(baseCounts);
      const baseSorted = baseKeys.sort((a, b) => {
        if (baseCounts[b] !== baseCounts[a]) return baseCounts[b] - baseCounts[a];
        return getS1OrderIndex(a) - getS1OrderIndex(b);
      });
      const baseLimit = Math.min(3, baseKeys.length);
      const baseOverflow = baseKeys.length > 3;

      const selectedBaseSet = new Set(matchedSelected.map((weapon) => weapon.s1 || '').filter(Boolean));
      const baseAutoPick: string[] = [];
      baseKeys.forEach((key) => {
        if (baseAutoPick.length >= baseLimit) return;
        if (selectedBaseSet.has(key) && !baseAutoPick.includes(key)) {
          baseAutoPick.push(key);
        }
      });
      baseKeys.forEach((key) => {
        if (baseAutoPick.length >= baseLimit) return;
        if (!baseAutoPick.includes(key)) {
          baseAutoPick.push(key);
        }
      });

      if (baseAutoPick.length < 3) {
        const fillers = farmableS1Pool.filter((value) => !baseAutoPick.includes(value));
        baseAutoPick.push(...fillers.slice(0, 3 - baseAutoPick.length));
      }

      const baseAutoPickSet = new Set(baseAutoPick);
      const activeBaseSet = baseOverflow ? baseAutoPickSet : new Set(baseKeys);

      const selectedCovered = matchedSelected.filter((weapon) => activeBaseSet.has(weapon.s1 || '')).map((weapon) => weapon.name);
      const selectedCoveredSet = new Set(selectedCovered);
      const selectedMissing = targetsInPlan.filter((weapon) => !selectedCoveredSet.has(weapon.name)).map((weapon) => weapon.name);

      const coveredPool = schemePoolVisible.filter((weapon) => activeBaseSet.has(weapon.s1 || '')).map((weapon) => weapon.name);
      const realFarmableCount = schemePool.filter((weapon) => {
        return activeBaseSet.has(weapon.s1 || '') && !isMatrixOwned(weapon.name);
      }).length;

      const sorter = getSchemeWeaponSorter(option.type, selectedSet, baseCounts);
      const weaponRows = schemePoolVisible.slice().sort(sorter).map((weapon) => ({
        name: weapon.name,
        s1: weapon.s1 || '-',
        s2: weapon.s2 || '-',
        s3: weapon.s3 || '-',
        rarity: weapon.rarity,
        type: weapon.type,
        short: weapon.short,
        isCustom: Boolean(weapon.isPreview),
        isSelected: selectedSet.has(weapon.name),
        isWeaponOwned: isWeaponOwned(weapon.name),
        isUnowned: !isWeaponOwned(weapon.name),
        isEssenceOwned: isMatrixOwned(weapon.name),
      }));

      const incompatibleSelected = targetsInPlan
        .filter((weapon) => !isWeaponCompatible(weapon, dungeon, option.type, option.value))
        .map((weapon) => ({
          name: weapon.name,
          s1: weapon.s1 || '-',
          s2: weapon.s2 || '-',
          s3: weapon.s3 || '-',
          reason: buildConflictReason(weapon, dungeon, option.type, option.value),
        }));
      const conflictWeapons = incompatibleSelected.map((item) => item.name);

      const coveredOwned = selectedCovered.filter((name) => isWeaponOwned(name));
      const effectiveSelectedCovered = useEffectiveMetrics
        ? selectedCovered.filter((name) => !(isMatrixOwned(name) && isWeaponOwned(name)))
        : selectedCovered.slice();
      const effectiveCoveredOwned = effectiveSelectedCovered.filter((name) => isWeaponOwned(name));
      const effectiveCoveredPool = useEffectiveMetrics
        ? coveredPool.filter((name) => !(isMatrixOwned(name) && isWeaponOwned(name)))
        : coveredPool.slice();

      const result: RecommendationResult = {
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        lockType: option.type,
        lockValue: option.value,
        schemeKey: `${dungeon.id}-${option.type}-${option.value}`,
        coveredWeapons: coveredPool,
        missingWeapons: selectedMissing,
        score: selectedCovered.length,
        baseOverflow,
        basePick: baseOverflow ? baseAutoPick.slice(0, 3) : baseAutoPick.slice(),
        conflictWeapons,
        weaponCount: coveredPool.length,
        maxWeaponCount: schemePoolVisible.length,
        targetCount: targetsInPlan.length,
        selectedMatchCount: selectedCovered.length,
        selectedMissingNames: selectedMissing,
        selectedMatchNames: selectedCovered,
        dungeonRegion: getDungeonRegion(dungeon.name),
        conflictDetails: incompatibleSelected,
        weaponRows,
        baseAllLabels: baseSorted.slice(),
        baseAutoPickKeys: baseAutoPick.slice(),
        requiredBaseKeys: uniqueSorted(
          matchedSelected.map((weapon) => weapon.s1 || '').filter(Boolean),
          (a, b) => getS1OrderIndex(a) - getS1OrderIndex(b),
        ),
        baseCount: baseKeys.length,
      };

      ranked.push({
        result,
        regionRank: getRegionRank(
          getDungeonRegion(dungeon.name),
          config?.preferredRegion1 || '',
          config?.preferredRegion2 || '',
        ),
        ownedMatchCount: effectiveCoveredOwned.length,
        unownedMatchCount: effectiveSelectedCovered.length - effectiveCoveredOwned.length,
        selectedMatchCount: effectiveSelectedCovered.length,
        realFarmableCount,
        weaponCount: effectiveCoveredPool.length,
        maxWeaponCount: schemePoolVisible.length,
      });
    });
  });

  return ranked.sort((a, b) => compareByPriority(a, b, config)).map((item) => item.result);
}
