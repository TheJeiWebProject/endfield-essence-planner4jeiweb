<template>
  <div class="planner-layout match-layout">
    <!-- Left Panel: Weapon Source Selector -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card main-panel">
        <q-card-section class="panel-header">
          <div class="text-h6">武器选择 ({{ matchSourceList.length }})</div>
        </q-card-section>

        <q-card-section class="toolbar-section">
          <q-input
            v-model="matchQuery"
            dense
            outlined
            placeholder="🔍 搜索武器..."
            class="search-input"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-section class="weapon-list-container">
          <div class="weapon-grid">
            <div
              v-for="weapon in matchSourceList"
              :key="weapon.name"
              class="weapon-card-mini"
              :class="{ 'is-selected': matchSourceName === weapon.name }"
              @click="selectMatchSource(weapon)"
            >
              <div class="weapon-cover-box">
                <img
                  v-if="getWeaponImageUrl(weapon.name)"
                  :src="getWeaponImageUrl(weapon.name)"
                  loading="lazy"
                  class="weapon-cover"
                />
                <div v-else class="weapon-fallback">{{ weapon.rarity }}★</div>
              </div>
              <div class="weapon-name-mini text-caption text-center text-truncate">{{ weapon.name }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Right Panel: Match Results -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card">
        <q-card-section class="panel-header">
          <div class="text-h6">词条对照结果</div>
        </q-card-section>

        <q-separator />

        <div v-if="!matchSourceWeapon" class="empty-state text-center text-grey-6 q-py-xl">
          请从左侧选择一把武器以查看同词条对照。
        </div>

        <div v-else class="q-pa-md">
          <!-- Selected Source Weapon Card -->
          <div class="text-subtitle2 q-mb-sm text-grey-5">已选武器</div>
          <q-card flat bordered class="scheme-card bg-grey-9 q-mb-md">
            <q-card-section class="row items-center q-col-gutter-md">
              <div class="col-auto">
                <div class="weapon-thumb">
                  <img
                    v-if="getWeaponImageUrl(matchSourceWeapon.name)"
                    :src="getWeaponImageUrl(matchSourceWeapon.name)"
                  />
                  <span v-else>{{ matchSourceWeapon.rarity }}★</span>
                </div>
              </div>
              <div class="col">
                <div class="text-subtitle1">{{ matchSourceWeapon.name }}</div>
                <div class="text-caption text-grey-4">
                  {{ matchSourceWeapon.type }} · {{ matchSourceWeapon.rarity }}★
                </div>
                <div class="row q-gutter-x-md q-mt-xs">
                  <span class="text-caption text-primary">基础: {{ matchSourceWeapon.s1 || '-' }}</span>
                  <span class="text-caption text-secondary">附加: {{ matchSourceWeapon.s2 || '-' }}</span>
                  <span class="text-caption text-accent">技能: {{ matchSourceWeapon.s3 || '-' }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Exact Match Results -->
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2 text-grey-5">同词条完全一致 ({{ matchResults.length }})</div>
          </div>
          
          <div v-if="matchResults.length === 0" class="text-caption text-grey-6 q-mb-lg">
            暂无其他武器拥有完全相同的词条组合。
          </div>

          <div v-else class="weapon-grid q-mb-lg">
            <div
              v-for="weapon in matchResults"
              :key="weapon.name"
              class="weapon-card-mini"
            >
              <div class="weapon-cover-box">
                <img
                  v-if="getWeaponImageUrl(weapon.name)"
                  :src="getWeaponImageUrl(weapon.name)"
                  loading="lazy"
                  class="weapon-cover"
                />
                <div v-else class="weapon-fallback">{{ weapon.rarity }}★</div>
              </div>
              <div class="weapon-name-mini text-caption text-center text-truncate">{{ weapon.name }}</div>
            </div>
          </div>

          <!-- Dungeon Drop Info -->
          <div class="text-subtitle2 q-mb-sm text-grey-5">副本掉落匹配</div>
          <q-list separator bordered class="rounded-borders">
            <q-item v-if="compatibleDungeons.length === 0" class="text-grey-6">
              <q-item-section>无副本同时掉落该组合</q-item-section>
            </q-item>
            <q-item v-for="dungeon in compatibleDungeons" :key="dungeon.id">
              <q-item-section>
                <q-item-label>{{ dungeon.name }}</q-item-label>
                <q-item-label caption>
                  同时包含 {{ matchSourceWeapon.s2 }} / {{ matchSourceWeapon.s3 }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getDungeons, getWeaponImageNames, getWeapons } from '@/core/data';
import type { Weapon, PlannerState } from '@/core/types';

const props = defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:matchSource', value: string): void;
}>();

const allWeapons = getWeapons();
const dungeons = getDungeons();
const weaponImageNameSet = new Set(getWeaponImageNames());

const matchQuery = ref('');
const matchSourceName = ref(props.state.matchSource || '');

watch(() => props.state.matchSource, (newVal) => {
  if (newVal && newVal !== matchSourceName.value) {
    matchSourceName.value = newVal || '';
  }
});

// Sort: Rarity DESC, then Name ASC
const sortedWeapons = [...allWeapons].sort((a, b) => {
  if (b.rarity !== a.rarity) return b.rarity - a.rarity;
  return a.name.localeCompare(b.name, 'zh-Hans-CN');
});

const matchSourceList = computed(() => {
  if (!matchQuery.value) {
    return sortedWeapons;
  }
  const query = matchQuery.value.toLowerCase();
  return sortedWeapons.filter((w) => {
    const text = `${w.name}${w.short || ''}${w.type}${w.s1 || ''}${w.s2 || ''}${w.s3 || ''}`.toLowerCase();
    return text.includes(query);
  });
});

const matchSourceWeapon = computed(() => {
  return allWeapons.find((w) => w.name === matchSourceName.value) || null;
});

const matchResults = computed(() => {
  const source = matchSourceWeapon.value;
  if (!source) return [];
  return allWeapons.filter(
    (weapon) =>
      weapon.name !== source.name &&
      weapon.s1 === source.s1 &&
      weapon.s2 === source.s2 &&
      weapon.s3 === source.s3
  );
});

const compatibleDungeons = computed(() => {
  const source = matchSourceWeapon.value;
  if (!source || !source.s2 || !source.s3) return [];
  return dungeons.filter((d) => 
    d.s2_pool.includes(source.s2!) && d.s3_pool.includes(source.s3!)
  );
});

function selectMatchSource(weapon: Weapon) {
  matchSourceName.value = weapon.name;
  emit('update:matchSource', weapon.name);
}

function getWeaponImageUrl(name: string): string {
  if (!weaponImageNameSet.has(name)) {
    return '';
  }
  return `/legacy/image/${encodeURIComponent(name)}.png`;
}

// Auto-select first if empty
if (!matchSourceName.value && sortedWeapons.length > 0) {
  matchSourceName.value = sortedWeapons[0].name;
  // Don't emit here to avoid URL thrashing on init if not needed
}
</script>

<style scoped lang="scss">
.match-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
}

.weapon-card-mini.is-selected {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 2px var(--q-primary);
}
</style>
