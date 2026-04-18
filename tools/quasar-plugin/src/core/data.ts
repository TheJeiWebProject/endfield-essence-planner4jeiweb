import weapons from '@/data/weapons.json';
import dungeons from '@/data/dungeons.json';
import gears from '@/data/gears.json';
import upSchedules from '@/data/up-schedules.json';
import weaponImages from '@/data/weapon-images.json';
import gearImages from '@/data/equip-images.json';
import characters from '@/data/characters.json';
import content from '@/data/content.json';
import type { Character, Dungeon, Gear, PlannerContent, UpScheduleMap, Weapon } from './types';

export function toLegacyAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function getWeapons(): Weapon[] {
  return weapons as Weapon[];
}

export function getDungeons(): Dungeon[] {
  return dungeons as Dungeon[];
}

export function getGears(): Gear[] {
  return gears as Gear[];
}

export function getUpSchedules(): UpScheduleMap {
  return upSchedules as UpScheduleMap;
}

export function getWeaponImageNames(): string[] {
  const map = weaponImages as unknown as Record<string, string>;
  return Object.keys(map);
}

export function getWeaponImageId(name: string): string | undefined {
  const map = weaponImages as unknown as Record<string, string>;
  return map[name];
}

export function getGearImageId(name: string): string | undefined {
  const map = gearImages as unknown as Record<string, string>;
  return map[name];
}

export function getCharacters(): Character[] {
  return characters as unknown as Character[];
}

export function getPlannerContent(): PlannerContent {
  return content as unknown as PlannerContent;
}
