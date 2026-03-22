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
              class="weapon-card-mini match-weapon-card"
              :class="[rarityClass(weapon.rarity), { 'is-selected': matchSourceName === weapon.name }]"
              @click="selectMatchSource(weapon)"
            >
              <div class="weapon-art-layer">
                <img
                  v-if="getWeaponImageUrl(weapon.name)"
                  :src="getWeaponImageUrl(weapon.name)"
                  loading="lazy"
                  class="weapon-cover"
                />
                <div v-else class="weapon-fallback">{{ weapon.rarity }}★</div>
              </div>
              <div class="weapon-band"></div>
              <div class="weapon-name-mini">
                <div class="weapon-title">
                  <span class="weapon-title-text">{{ weapon.name }}</span>
                </div>
                <div class="match-weapon-meta">{{ weapon.type }}</div>
              </div>
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

        <div v-else class="match-result-body q-pa-md">
          <!-- Selected Source Weapon Card -->
          <div class="planner-section-label q-mb-sm">已选武器</div>
          <q-card flat bordered class="scheme-card planner-surface-card q-mb-md">
            <q-card-section class="row items-center q-col-gutter-md match-selected-section">
              <div class="col-auto">
                <div class="weapon-thumb match-selected-thumb" :class="rarityClass(matchSourceWeapon.rarity)">
                  <img
                    v-if="getWeaponImageUrl(matchSourceWeapon.name)"
                    :src="getWeaponImageUrl(matchSourceWeapon.name)"
                  />
                  <span v-else>{{ matchSourceWeapon.rarity }}★</span>
                </div>
              </div>
              <div class="col">
                <div class="text-subtitle1 match-selected-title">{{ matchSourceWeapon.name }}</div>
                <div class="text-caption planner-meta-text">
                  {{ matchSourceWeapon.type }} · {{ matchSourceWeapon.rarity }}★
                </div>
                <div class="row q-gutter-x-md q-gutter-y-xs q-mt-sm match-inline-attrs">
                  <span class="text-caption match-attr-chip match-attr-chip-base">基础: {{ matchSourceWeapon.s1 || '-' }}</span>
                  <span class="text-caption match-attr-chip match-attr-chip-extra">附加: {{ matchSourceWeapon.s2 || '-' }}</span>
                  <span class="text-caption match-attr-chip match-attr-chip-skill">技能: {{ matchSourceWeapon.s3 || '-' }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Exact Match Results -->
          <div class="row items-center justify-between q-mb-sm">
            <div class="planner-section-label">同词条完全一致 ({{ matchResults.length }})</div>
          </div>
          
          <div v-if="matchResults.length === 0" class="text-caption planner-muted-text q-mb-lg">
            暂无其他武器拥有完全相同的词条组合。
          </div>

          <div v-else class="weapon-grid q-mb-lg">
            <div
              v-for="weapon in matchResults"
              :key="weapon.name"
              class="weapon-card-mini match-weapon-card"
              :class="rarityClass(weapon.rarity)"
            >
              <div class="weapon-art-layer">
                <img
                  v-if="getWeaponImageUrl(weapon.name)"
                  :src="getWeaponImageUrl(weapon.name)"
                  loading="lazy"
                  class="weapon-cover"
                />
                <div v-else class="weapon-fallback">{{ weapon.rarity }}★</div>
              </div>
              <div class="weapon-band"></div>
              <div class="weapon-name-mini">
                <div class="weapon-title">
                  <span class="weapon-title-text">{{ weapon.name }}</span>
                </div>
                <div class="match-weapon-meta">{{ weapon.type }}</div>
              </div>
            </div>
          </div>

          <!-- Dungeon Drop Info -->
          <div class="planner-section-label q-mb-sm">副本掉落匹配</div>
          <q-list separator bordered class="rounded-borders match-dungeon-list">
            <q-item v-if="compatibleDungeons.length === 0" class="planner-muted-text">
              <q-item-section>无副本同时掉落该组合</q-item-section>
            </q-item>
            <q-item v-for="dungeon in compatibleDungeons" :key="dungeon.id">
              <q-item-section>
                <q-item-label>{{ dungeon.name }}</q-item-label>
                <q-item-label caption class="planner-meta-text">
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
import { getDungeons, getWeaponImageId, getWeapons, toLegacyAssetUrl } from '@/core/data';
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
// weaponImageNameSet removed — use getWeaponImageId directly

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
  const id = getWeaponImageId(name);
  return id ? toLegacyAssetUrl(`legacy/image/weapon/${encodeURIComponent(id)}.avif`) : '';
}

function rarityClass(rarity: number): string {
  if (rarity === 6) return 'rarity-6';
  if (rarity === 5) return 'rarity-5';
  return 'rarity-4';
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

.match-result-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.match-weapon-card {
  width: 100%;
}

.match-weapon-card .weapon-name-mini {
  bottom: 6px;
  height: auto;
  min-height: 38px;
  padding: 0 6px;
  flex-direction: column;
  gap: 2px;
}

.match-weapon-meta {
  max-width: 100%;
  font-size: 10px;
  line-height: 1.1;
  font-weight: 500;
  color: rgba(245, 242, 238, var(--alpha-80));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planner-section-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--planner-text-secondary);
}

.planner-meta-text,
.planner-muted-text {
  color: var(--planner-text-secondary) !important;
}

.match-selected-title {
  color: var(--planner-text-primary);
}

.match-inline-attrs {
  align-items: center;
}

.match-attr-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
}

.match-attr-chip-base {
  border-color: rgba(var(--color-info-rgb), var(--alpha-38));
  background: rgba(var(--color-info-rgb), var(--alpha-12));
  color: rgba(var(--color-info-rgb), var(--alpha-100));
}

.match-attr-chip-extra {
  border-color: rgba(var(--color-secondary-rgb), 0.38);
  background: rgba(var(--color-secondary-rgb), 0.12);
  color: rgb(156, 196, 255);
}

.match-attr-chip-skill {
  border-color: rgba(var(--color-accent-rgb), var(--alpha-38));
  background: rgba(var(--color-accent-rgb), var(--alpha-12));
  color: rgba(var(--color-accent-rgb), var(--alpha-100));
}

.match-selected-thumb {
  width: 84px;
  height: 84px;
}

.match-selected-thumb.rarity-6::after,
.match-selected-thumb.rarity-5::after,
.match-selected-thumb.rarity-4::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: 100% 100%;
  z-index: 2;
  pointer-events: none;
}

.match-selected-thumb.rarity-6::after {
  background-image: var(--rarity-6-frame);
}

.match-selected-thumb.rarity-5::after {
  background-image: var(--rarity-5-frame);
}

.match-selected-thumb.rarity-4::after {
  background-image: var(--rarity-4-frame);
}

.match-dungeon-list {
  border-color: var(--planner-item-border);
  background: var(--planner-surface-soft);
}

.weapon-card-mini.is-selected {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 2px var(--q-primary);
}

.planner-surface-card {
  background: var(--planner-surface-soft) !important;
  border-color: var(--planner-item-border) !important;
}

@media (max-width: 640px) {
  .match-weapon-card .weapon-name-mini {
    min-height: 34px;
  }

  .match-weapon-meta {
    font-size: 9px;
  }

  .match-selected-thumb {
    width: 72px;
    height: 72px;
  }
}
</style>
