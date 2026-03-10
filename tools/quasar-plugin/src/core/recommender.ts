import type { Dungeon, RecommendationResult, Weapon } from './types';

function dungeonCanDropWeapon(dungeon: Dungeon, weapon: Weapon): boolean {
  if (!weapon.s2 || !weapon.s3) {
    return false;
  }
  return dungeon.s2_pool.includes(weapon.s2) && dungeon.s3_pool.includes(weapon.s3);
}

export function getRecommendations(
  selectedWeaponNames: string[],
  weapons: Weapon[],
  dungeons: Dungeon[],
): RecommendationResult[] {
  const selectedSet = new Set(selectedWeaponNames);
  const targets = weapons.filter((item) => selectedSet.has(item.name));
  const results: RecommendationResult[] = [];

  // 1. Collect lock options from selected weapons
  const s2Options = [...new Set(targets.map((w) => w.s2).filter(Boolean) as string[])];
  const s3Options = [...new Set(targets.map((w) => w.s3).filter(Boolean) as string[])];

  // 2. Iterate dungeons
  dungeons.forEach((dungeon) => {
    // Try lock S2
    s2Options.forEach((option) => {
      if (!dungeon.s2_pool.includes(option)) {
        return;
      }
      // In this scheme (Lock S2=option), check coverage
      // A weapon is covered if: (w.s2 == option) AND (w.s3 in dungeon.s3_pool)
      const covered: string[] = [];
      const missing: string[] = [];
      const baseCounts: Record<string, number> = {};

      targets.forEach((w) => {
        if (w.s2 === option && w.s3 && dungeon.s3_pool.includes(w.s3)) {
          covered.push(w.name);
          const s1 = w.s1 || 'unknown';
          baseCounts[s1] = (baseCounts[s1] || 0) + 1;
        } else {
          missing.push(w.name);
        }
      });

      if (covered.length === 0) {
        return;
      }

      // Check base overflow
      const baseKeys = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a]);
      const baseOverflow = baseKeys.length > 3;
      const basePick = baseKeys.slice(0, 3);
      const conflictWeapons = baseOverflow
        ? covered.filter((name) => {
            const w = weapons.find((i) => i.name === name);
            return w && !basePick.includes(w.s1 || 'unknown');
          })
        : [];

      results.push({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        lockType: 's2',
        lockValue: option,
        schemeKey: `${dungeon.id}-s2-${option}`,
        coveredWeapons: covered,
        missingWeapons: missing,
        score: covered.length,
        baseOverflow,
        basePick,
        conflictWeapons,
      });
    });

    // Try lock S3
    s3Options.forEach((option) => {
      if (!dungeon.s3_pool.includes(option)) {
        return;
      }
      // In this scheme (Lock S3=option), check coverage
      // A weapon is covered if: (w.s3 == option) AND (w.s2 in dungeon.s2_pool)
      const covered: string[] = [];
      const missing: string[] = [];
      const baseCounts: Record<string, number> = {};

      targets.forEach((w) => {
        if (w.s3 === option && w.s2 && dungeon.s2_pool.includes(w.s2)) {
          covered.push(w.name);
          const s1 = w.s1 || 'unknown';
          baseCounts[s1] = (baseCounts[s1] || 0) + 1;
        } else {
          missing.push(w.name);
        }
      });

      if (covered.length === 0) {
        return;
      }

      const baseKeys = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a]);
      const baseOverflow = baseKeys.length > 3;
      const basePick = baseKeys.slice(0, 3);
      const conflictWeapons = baseOverflow
        ? covered.filter((name) => {
            const w = weapons.find((i) => i.name === name);
            return w && !basePick.includes(w.s1 || 'unknown');
          })
        : [];

      results.push({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        lockType: 's3',
        lockValue: option,
        schemeKey: `${dungeon.id}-s3-${option}`,
        coveredWeapons: covered,
        missingWeapons: missing,
        score: covered.length,
        baseOverflow,
        basePick,
        conflictWeapons,
      });
    });
  });

  return results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.dungeonName.localeCompare(b.dungeonName, 'zh-Hans-CN');
  });
}
