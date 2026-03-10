import weapons from '@/data/weapons.json';
import dungeons from '@/data/dungeons.json';
import gears from '@/data/gears.json';
import upSchedules from '@/data/up-schedules.json';
import weaponImages from '@/data/weapon-images.json';
import type { Dungeon, Gear, UpScheduleMap, Weapon } from './types';

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
  return weaponImages as string[];
}
