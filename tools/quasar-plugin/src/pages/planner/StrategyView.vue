<template>
  <div class="planner-layout">
    <q-card flat bordered class="panel-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1">角色攻略</div>
        <q-chip color="primary" text-color="white">{{ characterRows.length }} 名角色</q-chip>
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item v-for="row in characterRows" :key="row.name">
          <q-item-section>
            <q-item-label>{{ row.name }}</q-item-label>
            <q-item-label caption>推荐武器：{{ row.weapons.join('、') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getWeapons } from '@/core/data';

const allWeapons = getWeapons();

const characterRows = computed(() => {
  const map = new Map<string, string[]>();
  allWeapons.forEach((weapon) => {
    (weapon.chars || []).forEach((char) => {
      if (!map.has(char)) {
        map.set(char, []);
      }
      map.get(char)?.push(weapon.name);
    });
  });
  return Array.from(map.entries())
    .map(([name, weapons]) => ({ name, weapons: [...new Set(weapons)] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
});
</script>
