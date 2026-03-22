<template>
  <div class="planner-layout gear-layout">
    <!-- Left Panel: Gear Selector -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card main-panel">
        <q-card-section class="panel-header">
          <div class="text-h6">装备选择 ({{ filteredGears.length }})</div>
        </q-card-section>

        <q-card-section class="toolbar-section">
          <q-input
            v-model="gearQuery"
            dense
            outlined
            placeholder="🔍 搜索装备..."
            class="search-input"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-section class="weapon-list-container">
          <div class="gear-set-list">
            <div v-for="group in gearGroups" :key="group.setName" class="gear-set-group">
              <div
                class="gear-set-header"
                @click="toggleSetCollapsed(group.setName)"
              >
                <q-icon
                  :name="isSetCollapsed(group.setName) ? 'expand_more' : 'expand_less'"
                  class="cursor-pointer q-mr-sm"
                />
                <span class="text-subtitle2">{{ group.setName }}</span>
                <q-space />
                <q-chip dense size="sm" color="grey-8" text-color="grey-4">{{ group.gears.length }}</q-chip>
              </div>
              
              <q-slide-transition>
                <div v-show="!isSetCollapsed(group.setName)" class="gear-grid q-pa-sm">
                  <div
                    v-for="gear in group.gears"
                    :key="gear.name"
                    class="weapon-card-mini gear-card-mini"
                    :class="[rarityClass(gear.rarity), { 'is-selected': selectedGearName === gear.name }]"
                    @click="selectGear(gear)"
                  >
                    <div class="weapon-art-layer">
                      <img
                        v-if="getGearImageUrl(gear.name)"
                        :src="getGearImageUrl(gear.name)"
                        loading="lazy"
                        class="weapon-cover"
                      />
                      <div v-else class="weapon-fallback">{{ gear.rarity }}★</div>
                    </div>
                    <div class="weapon-band"></div>
                    <div class="weapon-name-mini gear-name-mini">
                      <div class="weapon-title">
                        <span class="weapon-title-text">{{ gear.name }}</span>
                      </div>
                      <div class="gear-card-part">{{ gear.type }}</div>
                    </div>
                    <div class="gear-part-badge">{{ gear.type }}</div>
                  </div>
                </div>
              </q-slide-transition>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Right Panel: Refining Recommendations -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card">
        <q-card-section class="panel-header">
          <div class="text-h6">精锻推荐</div>
        </q-card-section>

        <q-separator />

        <div v-if="!selectedGear" class="empty-state text-center text-grey-6 q-py-xl">
          请从左侧选择一件装备以查看精锻推荐。
        </div>

        <div v-else class="gear-result-body q-pa-md">
          <!-- Selected Gear Card -->
          <div class="planner-section-label q-mb-sm">已选装备</div>
          <q-card flat bordered class="scheme-card planner-surface-card q-mb-md gear-selected-card">
            <q-card-section class="row items-center q-col-gutter-md">
              <div class="col-auto">
                <div class="weapon-thumb gear-selected-thumb" :class="rarityClass(selectedGear.rarity)">
                  <img
                    v-if="getGearImageUrl(selectedGear.name)"
                    :src="getGearImageUrl(selectedGear.name)"
                  />
                  <span v-else>{{ selectedGear.rarity }}★</span>
                </div>
              </div>
              <div class="col">
                <div class="text-subtitle1 gear-selected-title">{{ selectedGear.name }}</div>
                <div class="text-caption planner-meta-text">
                  {{ selectedGear.set }} · {{ selectedGear.type }} · {{ selectedGear.rarity }}★
                </div>
                <div class="gear-attrs q-mt-sm">
                  <div class="row items-center justify-between text-caption border-bottom q-pb-xs q-mb-xs gear-attr-row">
                    <span class="planner-meta-text">副词条1</span>
                    <span class="gear-attr-value">{{ selectedGear.sub1 || '无' }}</span>
                  </div>
                  <div class="row items-center justify-between text-caption border-bottom q-pb-xs q-mb-xs gear-attr-row">
                    <span class="planner-meta-text">副词条2</span>
                    <span class="gear-attr-value">{{ selectedGear.sub2 || '无' }}</span>
                  </div>
                  <div class="row items-center justify-between text-caption gear-attr-row">
                    <span class="planner-meta-text">特效</span>
                    <span class="gear-attr-value">{{ selectedGear.special || '无' }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Refining Recommendations -->
          <div class="planner-section-label q-mb-sm">推荐狗粮</div>
          <div class="q-gutter-y-md">
            <q-card
              v-for="rec in refiningRecommendations"
              :key="rec.slotKey"
              flat
              bordered
              class="scheme-card planner-surface-card"
            >
              <q-card-section class="scheme-header planner-surface-header row items-center justify-between">
                <div class="text-subtitle2">{{ rec.slotLabel }}</div>
                <div class="text-caption text-primary" v-if="rec.targetAttr">
                  {{ rec.targetAttr }}
                </div>
                <div class="text-caption planner-muted-text" v-else>无属性</div>
              </q-card-section>
              
              <q-separator />
              
              <div class="q-pa-md">
                <div v-if="!rec.targetAttr" class="text-caption planner-muted-text text-center">
                  该槽位无属性，无法精锻。
                </div>
                
                <div v-else-if="rec.recommendSelf" class="text-body2 text-center text-positive q-py-sm">
                  <q-icon name="check_circle" size="sm" class="q-mr-sm" />
                  推荐使用同名装备进行精锻
                </div>
                
                <div v-else>
                  <div class="text-caption planner-meta-text q-mb-sm">
                    推荐使用以下装备（数值: <span class="text-primary">{{ rec.topValue }}</span>）
                  </div>
                  <div class="gear-grid-mini">
                    <div
                      v-for="candidate in rec.candidates"
                      :key="candidate.gear.name"
                      class="weapon-card-mini gear-card-mini"
                      :class="rarityClass(candidate.gear.rarity)"
                    >
                      <div class="weapon-art-layer">
                        <img
                          v-if="getGearImageUrl(candidate.gear.name)"
                          :src="getGearImageUrl(candidate.gear.name)"
                          loading="lazy"
                          class="weapon-cover"
                        />
                        <div v-else class="weapon-fallback">{{ candidate.gear.rarity }}★</div>
                      </div>
                      <div class="weapon-band"></div>
                      <div class="weapon-name-mini gear-name-mini">
                        <div class="weapon-title">
                          <span class="weapon-title-text">{{ candidate.gear.name }}</span>
                        </div>
                        <div class="gear-card-part">{{ candidate.gear.type }}</div>
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
import { computed, ref, reactive, watch } from 'vue';
import { getGears, toLegacyAssetUrl } from '@/core/data';
import type { Gear, PlannerState } from '@/core/types';

const props = defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:gearName', value: string): void;
}>();

const allGears = getGears();

const gearQuery = ref('');
const selectedGearName = ref<string | null>(props.state.gearName || null);
const collapsedSets = reactive<Record<string, boolean>>({});

watch(() => props.state.gearName, (newVal) => {
  if (newVal && newVal !== selectedGearName.value) {
    selectedGearName.value = newVal || null;
  }
});

// Simple numeric parser for attributes like "攻击力+5%" -> 5
function parseAttrValue(attr: string): number {
  if (!attr) return 0;
  const match = attr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function getGearImageUrl(name: string): string {
  const gear = allGears.find((g) => g.name === name);
  if (!gear) return '';
  return toLegacyAssetUrl(`legacy/image/gear/${gear.rarity}/${encodeURIComponent(name)}.png`);
}

function rarityClass(rarity: number): string {
  if (rarity === 6) return 'rarity-6';
  if (rarity === 5) return 'rarity-5';
  return 'rarity-4';
}

const filteredGears = computed(() => {
  if (!gearQuery.value) {
    return allGears;
  }
  const query = gearQuery.value.toLowerCase();
  return allGears.filter((g) => {
    const text = `${g.name}${g.set}${g.type}${g.sub1 || ''}${g.sub2 || ''}${g.special || ''}`.toLowerCase();
    return text.includes(query);
  });
});

const gearGroups = computed(() => {
  const map = new Map<string, Gear[]>();
  filteredGears.value.forEach((g) => {
    const key = g.set || '未分类';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(g);
  });
  return Array.from(map.entries()).map(([setName, gears]) => ({
    setName,
    gears: gears.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
  }));
});

const selectedGear = computed(() => {
  return allGears.find((g) => g.name === selectedGearName.value) || null;
});

interface RefiningRecommendation {
  slotKey: string;
  slotLabel: string;
  targetAttr: string;
  recommendSelf: boolean;
  topValue: number;
  candidates: { gear: Gear; value: number }[];
}

const refiningRecommendations = computed<RefiningRecommendation[]>(() => {
  if (!selectedGear.value) return [];
  
  const slots = [
    { key: 'sub1', label: '副词条1', attr: selectedGear.value.sub1 },
    { key: 'sub2', label: '副词条2', attr: selectedGear.value.sub2 },
    { key: 'special', label: '特效', attr: selectedGear.value.special },
  ];

  return slots.map((slot) => {
    if (!slot.attr) {
      return {
        slotKey: slot.key,
        slotLabel: slot.label,
        targetAttr: '',
        recommendSelf: false,
        topValue: 0,
        candidates: [],
      };
    }

    // Find other gears that have this attribute in the same slot or other slots
    // Legacy logic simplifies this: usually same slot type matches best
    // Here we implement a simplified version: check all slots of all other gears
    
    // Self is always a match
    const candidates: { gear: Gear; value: number }[] = [];
    const targetValue = parseAttrValue(slot.attr);

    // Naive search for now: find any gear with same attribute string (simplified)
    // Real logic needs to parse attribute types (e.g. "ATK%") and compare values
    // For this demo, we assume "same string prefix" means same type
    const attrType = slot.attr.replace(/[\d.+\s%]+$/, ''); // Remove numbers/symbols at end

    allGears.forEach((other) => {
      if (other.name === selectedGear.value!.name) return; // Skip self

      [other.sub1, other.sub2, other.special].forEach((otherAttr) => {
        if (!otherAttr) return;
        if (otherAttr.startsWith(attrType)) {
          const val = parseAttrValue(otherAttr);
          if (val > targetValue) {
             candidates.push({ gear: other, value: val });
          }
        }
      });
    });

    if (candidates.length === 0) {
      return {
        slotKey: slot.key,
        slotLabel: slot.label,
        targetAttr: slot.attr,
        recommendSelf: true,
        topValue: targetValue,
        candidates: [],
      };
    }

    // Sort by value DESC
    candidates.sort((a, b) => b.value - a.value);
    const topValue = candidates[0].value;
    const topCandidates = candidates.filter((c) => c.value === topValue);

    return {
      slotKey: slot.key,
      slotLabel: slot.label,
      targetAttr: slot.attr,
      recommendSelf: false,
      topValue,
      candidates: topCandidates,
    };
  });
});

function isSetCollapsed(setName: string) {
  return collapsedSets[setName];
}

function toggleSetCollapsed(setName: string) {
  collapsedSets[setName] = !collapsedSets[setName];
}

function selectGear(gear: Gear) {
  selectedGearName.value = gear.name;
  emit('update:gearName', gear.name);
}

// Auto-select first
if (!selectedGearName.value && allGears.length > 0) {
  selectedGearName.value = allGears[0].name;
  // Don't emit here on init
}
</script>

<style scoped lang="scss">
.gear-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 900px) {
    grid-template-columns: 4fr 3fr;
  }
}

.gear-result-body {
  display: flex;
  flex-direction: column;
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

.gear-set-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--planner-surface-soft);
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  margin-bottom: 4px;
  
  &:hover {
    background: var(--planner-surface-strong);
  }
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 8px;
}

.gear-grid-mini {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 8px;
}

.gear-card-mini {
  width: 100%;
}

.gear-name-mini {
  bottom: 6px;
  height: auto;
  min-height: 40px;
  padding: 0 6px;
  flex-direction: column;
  gap: 2px;
}

.gear-card-part {
  max-width: 100%;
  font-size: 10px;
  line-height: 1.1;
  font-weight: 500;
  color: rgba(245, 242, 238, var(--alpha-80));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gear-part-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--planner-surface-strong);
  color: var(--planner-text-primary);
  border: 1px solid var(--planner-item-border);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  z-index: 5;
}

.border-bottom {
  border-bottom: 1px solid var(--planner-item-border);
}

.gear-selected-title,
.gear-attr-value {
  color: var(--planner-text-primary);
}

.gear-selected-thumb {
  width: 84px;
  height: 84px;
}

.gear-selected-thumb.rarity-6::after,
.gear-selected-thumb.rarity-5::after,
.gear-selected-thumb.rarity-4::after {
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

.gear-selected-thumb.rarity-6::after {
  background-image: var(--rarity-6-frame);
}

.gear-selected-thumb.rarity-5::after {
  background-image: var(--rarity-5-frame);
}

.gear-selected-thumb.rarity-4::after {
  background-image: var(--rarity-4-frame);
}

.planner-surface-card {
  background: var(--planner-surface-soft) !important;
  border-color: var(--planner-item-border) !important;
}

.planner-surface-header {
  background: var(--planner-surface-soft) !important;
}

@media (max-width: 640px) {
  .gear-grid-mini {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gear-name-mini {
    min-height: 34px;
  }

  .gear-card-part {
    font-size: 9px;
  }

  .gear-selected-thumb {
    width: 72px;
    height: 72px;
  }
}
</style>
