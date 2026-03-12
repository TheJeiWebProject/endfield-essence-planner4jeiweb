<template>
  <div class="planner-layout">
    <!-- Left Panel: Weapon Selector -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card main-panel">
        <q-card-section class="panel-header">
          <div class="text-h6">武器选择器</div>
          <!-- TODO: Plan Config Control -->
        </q-card-section>

        <q-card-section class="toolbar-section">
          <q-input
            v-model="weaponKeyword"
            dense
            outlined
            placeholder="🔍 搜索武器 / 属性 / 角色"
            class="search-input"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="filter-actions row q-gutter-sm q-mt-sm">
            <q-btn
              :color="showWeaponAttrs ? 'primary' : 'grey-8'"
              :outline="!showWeaponAttrs"
              label="显示属性/拥有/备注"
              @click="showWeaponAttrs = !showWeaponAttrs"
              class="col-grow"
            />
            <q-btn
              flat
              color="primary"
              :label="showFilterPanel ? '收起筛选' : '展开筛选'"
              @click="showFilterPanel = !showFilterPanel"
            />
            <q-btn
              flat
              color="secondary"
              label="清空筛选"
              :disable="!hasAttributeFilters"
              @click="clearPlannerFilters"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <div v-if="showFilterPanel" class="filter-panel-content">
            <q-separator />
            <q-card-section>
              <div class="filter-group">
                <div class="text-caption q-mb-xs">基础属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS1Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS1Filters.includes(opt.value) ? 'primary' : 'grey-9'"
                      :text-color="plannerS1Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS1Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s1', opt.value)"
                    />
                  </div>
                </div>
              </div>
              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">附加属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS2Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS2Filters.includes(opt.value) ? 'secondary' : 'grey-9'"
                      :text-color="plannerS2Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS2Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s2', opt.value)"
                    />
                  </div>
                </div>
              </div>
              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">技能属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS3Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS3Filters.includes(opt.value) ? 'accent' : 'grey-9'"
                      :text-color="plannerS3Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS3Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s3', opt.value)"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </div>
        </q-slide-transition>

        <q-separator />

        <q-card-section class="selection-bar row items-center justify-between">
          <div class="selection-tags row q-gutter-xs">
            <span v-if="state.selectedWeapons.length === 0" class="text-grey-6 text-caption">未选择任何武器</span>
            <q-chip
              v-for="name in state.selectedWeapons"
              :key="name"
              removable
              dense
              square
              color="grey-9"
              text-color="white"
              @remove="toggleWeaponSelection(name)"
            >
              {{ name }}
              <q-badge v-if="ensureMark(name).ownedWeapon" color="primary" floating transparent rounded />
            </q-chip>
          </div>
          <div class="selection-actions row q-gutter-xs">
            <q-btn flat dense size="sm" color="primary" label="全选" @click="onSelectAllVisible" />
            <q-btn flat dense size="sm" color="negative" label="清空" @click="onSelectWeapons([])" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="weapon-list-container">
          <!-- Mode 1: Grid View (Images) -->
          <div v-if="!showWeaponAttrs" class="weapon-grid">
            <div
              v-for="item in weaponGalleryRows"
              :key="item.name"
              class="weapon-card-mini"
              :class="{ 'is-selected': item.selected }"
              @click="toggleWeaponSelection(item.name)"
            >
              <div class="weapon-cover-box">
                <img
                  v-if="getWeaponImageUrl(item.name)"
                  :src="getWeaponImageUrl(item.name)"
                  loading="lazy"
                  class="weapon-cover"
                />
                <div v-else class="weapon-fallback">{{ item.rarity }}★</div>
                <!-- Badges -->
                <div class="weapon-badges">
                  <q-badge v-if="item.mark.ownedWeapon" color="primary" label="已拥" />
                  <q-badge v-if="item.mark.excluded" color="negative" label="排除" />
                </div>
              </div>
              <div class="weapon-name-mini text-caption text-center text-truncate">{{ item.name }}</div>
            </div>
          </div>

          <!-- Mode 2: Attribute List View -->
          <div v-else class="weapon-attr-list">
            <div
              v-for="item in weaponGalleryRows"
              :key="item.name"
              class="weapon-attr-item"
              :class="{ 'is-selected': item.selected }"
            >
              <div class="row items-start q-col-gutter-sm cursor-pointer" @click="toggleWeaponSelection(item.name)">
                <div class="col-auto">
                  <div class="weapon-thumb">
                    <img v-if="getWeaponImageUrl(item.name)" :src="getWeaponImageUrl(item.name)" />
                    <span v-else>{{ item.rarity }}★</span>
                  </div>
                </div>
                <div class="col">
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle2">{{ item.name }}</span>
                    <q-badge :color="item.selected ? 'primary' : 'grey-7'">{{ item.selected ? '已选' : '未选' }}</q-badge>
                    <q-badge v-if="item.mark.ownedWeapon" color="primary" outline>已拥武器</q-badge>
                    <q-badge v-if="item.mark.ownedMatrix" color="teal" outline>已有基质</q-badge>
                  </div>
                  <div class="text-caption text-grey-4 q-mt-xs">
                    {{ item.type }} · {{ item.rarity }}★
                  </div>
                  <div class="row q-gutter-x-md q-mt-xs text-caption">
                    <span :class="{ 'text-primary': plannerS1Filters.includes(item.s1 || '') }">基础: {{ item.s1 || '-' }}</span>
                    <span :class="{ 'text-secondary': plannerS2Filters.includes(item.s2 || '') }">附加: {{ item.s2 || '-' }}</span>
                    <span :class="{ 'text-accent': plannerS3Filters.includes(item.s3 || '') }">技能: {{ item.s3 || '-' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Inline Actions Row -->
              <div class="row items-center q-gutter-sm q-mt-sm q-pa-sm rounded-borders planner-inline-tools">
                <q-btn
                  size="sm"
                  unelevated
                  :color="item.mark.ownedWeapon ? 'primary' : 'grey-8'"
                  :label="item.mark.ownedWeapon ? '标记未拥' : '标记已拥'"
                  @click.stop="item.mark.ownedWeapon = !item.mark.ownedWeapon"
                />
                <q-btn
                  size="sm"
                  unelevated
                  :color="item.mark.ownedMatrix ? 'teal' : 'grey-8'"
                  :label="item.mark.ownedMatrix ? '标记无基质' : '标记有基质'"
                  @click.stop="item.mark.ownedMatrix = !item.mark.ownedMatrix"
                />
                <q-input
                  v-model="item.mark.note"
                  dense
                  borderless
                  placeholder="备注..."
                  class="col-grow text-caption note-input"
                  input-class="planner-note-input"
                  @click.stop
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Right Panel: Recommendations -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card">
        <q-card-section class="panel-header row items-center justify-between">
          <div class="text-h6">方案推荐列表</div>
          <div class="row q-gutter-sm items-center">
            <q-chip dense color="secondary" text-color="white">
              已选 {{ effectiveSelectedWeaponNames.length }} / 待刷 {{ pendingCount }} 把
            </q-chip>
            <q-btn
              v-if="extraRecommendations.length"
              flat
              dense
              size="sm"
              color="primary"
              :label="showAllSchemes ? '收起其他方案' : `展开其他方案 (+${extraRecommendations.length})`"
              @click="showAllSchemes = !showAllSchemes"
            />
          </div>
        </q-card-section>

        <q-separator />

        <div class="recommendations-container q-pa-md">
          <!-- Case 1: No Selection -->
          <div v-if="!state.selectedWeapons.length" class="empty-state text-center text-grey-6 q-py-xl">
            请选择至少一把武器，系统将自动推荐可共刷的副本方案。
          </div>

          <!-- Case 2: Filtered Out (Has selection but effective list is empty) -->
          <div v-else-if="!effectiveSelectedWeaponNames.length" class="empty-state text-center text-grey-6 q-py-xl">
            所有已选武器均被配置排除（已拥有或手动排除）。
          </div>

          <!-- Case 3: No Scheme Found (Conflict) -->
          <div v-else-if="!recommendations.length" class="conflict-state">
            <q-banner rounded class="conflict-banner q-mb-md">
              <template v-slot:avatar>
                <q-icon name="warning" color="warning" />
              </template>
              <div class="text-subtitle1">当前选择无可用共刷方案</div>
              <div class="text-caption text-grey-4">
                附加属性或技能属性无法统一，或无副本掉落该组合。
              </div>
            </q-banner>

            <div v-if="fallbackPlan" class="conflict-details">
              <div class="text-subtitle2 q-mb-sm">冲突分析</div>
              <div class="row q-gutter-sm q-mb-md">
                <q-chip
                  v-if="fallbackPlan.baseOverflow"
                  color="negative"
                  text-color="white"
                  icon="error"
                  label="基础属性冲突"
                />
                <q-chip
                  v-if="fallbackPlan.s2Conflict"
                  color="warning"
                  text-color="dark"
                  icon="warning"
                  label="附加属性不一致"
                />
                <q-chip
                  v-if="fallbackPlan.s3Conflict"
                  color="warning"
                  text-color="dark"
                  icon="warning"
                  label="技能属性不一致"
                />
              </div>

              <div class="conflict-weapon-list">
                <div
                  v-for="weapon in fallbackPlan.weaponRows"
                  :key="weapon.name"
                  class="weapon-attr-item"
                  :class="{ 'conflict-item': weapon.baseConflict }"
                >
                   <div class="row items-center q-gutter-x-sm">
                      <span class="text-subtitle2">{{ weapon.name }}</span>
                      <div class="row q-gutter-x-sm text-caption">
                        <span :class="{ 'text-negative': weapon.baseConflict }">基础: {{ weapon.s1 }}</span>
                        <span :class="{ 'text-warning': fallbackPlan.s2Conflict }">附加: {{ weapon.s2 }}</span>
                        <span :class="{ 'text-warning': fallbackPlan.s3Conflict }">技能: {{ weapon.s3 }}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Case 4: Recommendations List -->
          <div v-else class="scheme-list q-gutter-y-md">
            <q-card
              v-for="scheme in visibleRecommendations"
              :key="scheme.dungeonId"
              flat
              bordered
              class="scheme-card"
            >
              <q-card-section class="scheme-header planner-scheme-header">
                <div class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle1">{{ scheme.dungeonName }}</div>
                    <div class="text-caption text-grey-4">
                      覆盖 {{ scheme.score }} 把武器
                      <span v-if="scheme.missingWeapons.length > 0" class="text-warning">
                        (丢失 {{ scheme.missingWeapons.length }})
                      </span>
                    </div>
                    <div class="text-caption text-primary">
                      <q-icon name="lock" size="xs" /> 锁定{{ getLockLabel(scheme.lockType) }}：{{ scheme.lockValue }}
                    </div>
                  </div>
                  <div class="column items-end">
                    <q-chip color="primary" text-color="white" size="sm">推荐</q-chip>
                    <q-chip v-if="scheme.baseOverflow" color="negative" text-color="white" size="sm" icon="warning">基础冲突</q-chip>
                  </div>
                </div>
              </q-card-section>
              
              <q-separator />
              
              <div class="scheme-weapons">
                 <div
                  v-for="weaponName in scheme.coveredWeapons"
                  :key="weaponName"
                  class="scheme-weapon-row q-pa-sm border-bottom"
                 >
                   <div class="row items-center q-col-gutter-sm">
                     <div class="col-auto">
                       <div class="weapon-thumb-mini">
                         <img v-if="getWeaponImageUrl(weaponName)" :src="getWeaponImageUrl(weaponName)" />
                         <span v-else>{{ getWeapon(weaponName)?.rarity }}★</span>
                       </div>
                     </div>
                     <div class="col">
                       <div class="row items-center q-gutter-x-sm">
                         <span class="text-body2">{{ weaponName }}</span>
                         <q-badge v-if="getWeapon(weaponName)?.short" color="secondary" outline size="sm">
                           {{ getWeapon(weaponName)?.short }}
                         </q-badge>
                       </div>
                       <div class="row q-gutter-x-sm text-caption text-grey-4">
                         <span :class="{ 'text-negative': scheme.baseOverflow && !scheme.basePick.includes(getWeapon(weaponName)?.s1 || '') }">
                           基础: {{ getWeapon(weaponName)?.s1 }}
                         </span>
                         <span :class="{ 'text-accent': scheme.lockType === 's2' }">
                           附加: {{ getWeapon(weaponName)?.s2 }}
                         </span>
                         <span :class="{ 'text-accent': scheme.lockType === 's3' }">
                           技能: {{ getWeapon(weaponName)?.s3 }}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            </q-card>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { getDungeons, getWeaponImageNames, getWeapons } from '@/core/data';
import { getRecommendations } from '@/core/recommender';
import type { PlannerState, RecommendationResult, Weapon } from '@/core/types';

const props = defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, { ownedWeapon: boolean; ownedMatrix: boolean; excluded: boolean; note: string }>;
}>();

const emit = defineEmits<{
  (e: 'update:selectedWeapons', value: string[]): void;
}>();

const allWeapons = getWeapons();
const weaponImageNameSet = new Set(getWeaponImageNames());
const dungeons = getDungeons();

const hideFourStar = ref(true);
const hideExcluded = ref(false);
const recExcludeOwnedWeapon = ref(false);
const recExcludeOwnedMatrix = ref(false);
const plannerS1Filters = ref<string[]>([]);
const plannerS2Filters = ref<string[]>([]);
const plannerS3Filters = ref<string[]>([]);
const weaponKeyword = ref('');
const showWeaponAttrs = ref(false);
const showFilterPanel = ref(true);
const showAllSchemes = ref(false);

const weaponNameSet = computed(() => new Set(allWeapons.map((item) => item.name)));

function ensureMark(name: string) {
  // Accessing prop directly; mutations should happen on parent ideally or reactive object
  return props.weaponMarks[name] || { ownedWeapon: false, ownedMatrix: false, excluded: false, note: '' };
}

function normalizeSelectedWeapons(list: string[]): string[] {
  return [...new Set(list)].filter((name) => weaponNameSet.value.has(name));
}

const plannerS1Options = computed(() => {
  const pool = [...new Set(allWeapons.map((item) => item.s1).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.some((w) => {
      if (w.s1 !== value) return false;
      if (plannerS2Filters.value.length && !plannerS2Filters.value.includes(w.s2 || '')) return false;
      if (plannerS3Filters.value.length && !plannerS3Filters.value.includes(w.s3 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const plannerS2Options = computed(() => {
  const pool = [...new Set(allWeapons.map((item) => item.s2).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.some((w) => {
      if (w.s2 !== value) return false;
      if (plannerS1Filters.value.length && !plannerS1Filters.value.includes(w.s1 || '')) return false;
      if (plannerS3Filters.value.length && !plannerS3Filters.value.includes(w.s3 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const plannerS3Options = computed(() => {
  const pool = [...new Set(allWeapons.map((item) => item.s3).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.some((w) => {
      if (w.s3 !== value) return false;
      if (plannerS1Filters.value.length && !plannerS1Filters.value.includes(w.s1 || '')) return false;
      if (plannerS2Filters.value.length && !plannerS2Filters.value.includes(w.s2 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const hasAttributeFilters = computed(() => {
  return plannerS1Filters.value.length > 0 || plannerS2Filters.value.length > 0 || plannerS3Filters.value.length > 0;
});

const filteredWeapons = computed(() => {
  return allWeapons.filter((weapon) => {
    const mark = ensureMark(weapon.name);
    if (hideFourStar.value && weapon.rarity <= 4) {
      return false;
    }
    if (hideExcluded.value && mark.excluded) {
      return false;
    }
    if (plannerS1Filters.value.length > 0 && !plannerS1Filters.value.includes(weapon.s1 || '')) {
      return false;
    }
    if (plannerS2Filters.value.length > 0 && !plannerS2Filters.value.includes(weapon.s2 || '')) {
      return false;
    }
    if (plannerS3Filters.value.length > 0 && !plannerS3Filters.value.includes(weapon.s3 || '')) {
      return false;
    }
    if (!weaponKeyword.value) {
      return true;
    }
    const text = `${weapon.name}${weapon.short || ''}${weapon.type}${weapon.chars?.join('') || ''}`.toLowerCase();
    return text.includes(weaponKeyword.value.toLowerCase());
  });
});

const weaponGalleryRows = computed(() => {
  return filteredWeapons.value.map((item) => ({
    ...item,
    selected: props.state.selectedWeapons.includes(item.name),
    mark: ensureMark(item.name),
  }));
});

const selectedMarkRows = computed(() => {
  const selectedSet = new Set(props.state.selectedWeapons);
  return allWeapons
    .filter((item) => selectedSet.has(item.name))
    .map((item) => ({
      name: item.name,
      type: item.type,
      rarity: item.rarity,
    }));
});

const effectiveSelectedWeaponNames = computed(() => {
  return props.state.selectedWeapons.filter((name) => {
    const mark = ensureMark(name);
    if (mark.excluded) {
      return false;
    }
    if (recExcludeOwnedWeapon.value && mark.ownedWeapon) {
      return false;
    }
    if (recExcludeOwnedMatrix.value && mark.ownedMatrix) {
      return false;
    }
    return true;
  });
});

const recommendations = computed<RecommendationResult[]>(() => {
  return getRecommendations(effectiveSelectedWeaponNames.value, allWeapons, dungeons);
});

const pendingCount = computed(() => {
  return props.state.selectedWeapons.filter((name) => {
    const mark = ensureMark(name);
    return !mark.ownedWeapon && !mark.ownedMatrix;
  }).length;
});

const extraRecommendations = computed(() => {
  return recommendations.value.slice(3);
});

const visibleRecommendations = computed(() => {
  return showAllSchemes.value ? recommendations.value : recommendations.value.slice(0, 3);
});

const fallbackPlan = computed(() => {
  if (recommendations.value.length > 0) return null;
  if (props.state.selectedWeapons.length === 0) return null;

  const targets = allWeapons.filter((w) => props.state.selectedWeapons.includes(w.name));
  
  const baseCounts: Record<string, number> = {};
  targets.forEach((w) => {
    baseCounts[w.s1 || ''] = (baseCounts[w.s1 || ''] || 0) + 1;
  });
  const baseKeys = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a]);
  const baseOverflow = baseKeys.length > 3;
  const basePick = baseKeys.slice(0, 3);

  const s2Set = new Set(targets.map((w) => w.s2).filter(Boolean));
  const s3Set = new Set(targets.map((w) => w.s3).filter(Boolean));
  const s2Conflict = s2Set.size > 1;
  const s3Conflict = s3Set.size > 1;

  const weaponRows = targets.map((weapon) => ({
    ...weapon,
    baseConflict: baseOverflow && !basePick.includes(weapon.s1 || ''),
  }));

  return {
    baseOverflow,
    s2Conflict,
    s3Conflict,
    weaponRows,
  };
});

function togglePlannerFilter(target: 's1' | 's2' | 's3', value: string) {
  const list = target === 's1' ? plannerS1Filters.value : target === 's2' ? plannerS2Filters.value : plannerS3Filters.value;
  const index = list.indexOf(value);
  if (index >= 0) {
    list.splice(index, 1);
    return;
  }
  list.push(value);
}

function clearPlannerFilters() {
  plannerS1Filters.value = [];
  plannerS2Filters.value = [];
  plannerS3Filters.value = [];
}

function getWeaponImageUrl(name: string): string {
  if (!weaponImageNameSet.has(name)) {
    return '';
  }
  return `/legacy/image/${encodeURIComponent(name)}.png`;
}

function toggleWeaponSelection(name: string) {
  if (props.state.readonly) {
    return;
  }
  if (props.state.selectedWeapons.includes(name)) {
    emit('update:selectedWeapons', props.state.selectedWeapons.filter((item) => item !== name));
  } else {
    emit('update:selectedWeapons', normalizeSelectedWeapons([...props.state.selectedWeapons, name]));
  }
}

function onSelectAllVisible() {
  if (props.state.readonly) {
    return;
  }
  const visible = filteredWeapons.value.map((item) => item.name);
  emit('update:selectedWeapons', normalizeSelectedWeapons(visible));
}

function onSelectWeapons(value: string[]) {
  if (props.state.readonly) {
    return;
  }
  emit('update:selectedWeapons', normalizeSelectedWeapons(value));
}

function getWeapon(name: string): Weapon | undefined {
  return allWeapons.find((w) => w.name === name);
}

function getLockLabel(type: 's2' | 's3'): string {
  return type === 's2' ? '附加属性' : '技能属性';
}
</script>

<style scoped lang="scss">
.planner-inline-tools {
  background: var(--planner-surface-soft);
  border: 1px solid var(--planner-item-border);
}

.conflict-banner {
  background: var(--planner-surface-soft) !important;
  color: var(--planner-text-primary) !important;
  border: 1px solid var(--planner-item-border);
}

.planner-scheme-header {
  background: var(--planner-surface-soft) !important;
}

:deep(.planner-note-input) {
  color: var(--planner-text-primary) !important;
}
</style>
