<template>
  <q-card flat bordered class="panel-card">
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">副本推荐</div>
      <q-badge color="primary" transparent>{{ results.length }} 个副本</q-badge>
    </q-card-section>
    <q-separator />
    <q-list separator>
      <q-item v-for="item in results" :key="item.dungeonId">
        <q-item-section>
          <q-item-label>{{ item.dungeonName }}</q-item-label>
          <q-item-label caption>覆盖武器：{{ item.coveredWeapons.join('、') || '无' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip color="secondary" text-color="white">{{ item.score }}</q-chip>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import type { RecommendationResult } from '@/core/types';

defineProps<{
  results: RecommendationResult[];
}>();
</script>
