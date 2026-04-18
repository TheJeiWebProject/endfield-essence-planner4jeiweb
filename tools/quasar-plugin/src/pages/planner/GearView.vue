<template>
  <div class="planner-layout gear-layout" :class="{ 'single-column': props.state.hideWeaponSelector }">
    <div v-if="!props.state.hideWeaponSelector" class="panel-column">
      <q-card flat bordered class="panel-card main-panel">
        <q-card-section class="panel-header">
          <div class="text-h6">装备选择 ({{ filteredGears.length }})</div>
        </q-card-section>

        <q-card-section class="toolbar-section">
          <q-input
            v-model="gearQuery"
            dense
            outlined
            placeholder="🔍 搜索装备 / 词条 / 套装..."
            class="search-input"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="row q-gutter-sm q-mt-sm">
            <q-btn
              flat
              color="primary"
              :label="filterPanelCollapsed ? '展开筛选' : '收起筛选'"
              @click="filterPanelCollapsed = !filterPanelCollapsed"
            />
            <q-btn
              flat
              color="secondary"
              label="清空筛选"
              :disable="!hasActiveFilters"
              @click="clearFilters"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <div v-show="!filterPanelCollapsed" class="filter-panel-content">
            <q-separator />
            <q-card-section>
              <div class="filter-group">
                <div class="text-caption q-mb-xs">副词条 1</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="option in filterOptionEntries.sub1" :key="`gear-sub1-${option.value}`" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="filterSub1.includes(option.value) ? 'primary' : 'grey-9'"
                      :text-color="filterSub1.includes(option.value) ? 'white' : 'grey-4'"
                      :disable="option.isDisabled && !filterSub1.includes(option.value)"
                      :label="option.label"
                      @click="toggleFilterValue('sub1', option.value)"
                    />
                  </div>
                </div>
              </div>

              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">副词条 2</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="option in filterOptionEntries.sub2" :key="`gear-sub2-${option.value}`" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="filterSub2.includes(option.value) ? 'secondary' : 'grey-9'"
                      :text-color="filterSub2.includes(option.value) ? 'white' : 'grey-4'"
                      :disable="option.isDisabled && !filterSub2.includes(option.value)"
                      :label="option.label"
                      @click="toggleFilterValue('sub2', option.value)"
                    />
                  </div>
                </div>
              </div>

              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">特效</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="option in filterOptionEntries.special" :key="`gear-special-${option.value}`" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="filterSpecial.includes(option.value) ? 'accent' : 'grey-9'"
                      :text-color="filterSpecial.includes(option.value) ? 'white' : 'grey-4'"
                      :disable="option.isDisabled && !filterSpecial.includes(option.value)"
                      :label="option.label"
                      @click="toggleFilterValue('special', option.value)"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </div>
        </q-slide-transition>

        <q-separator />

        <q-card-section class="weapon-list-container">
          <div v-if="gearGroups.length" class="gear-set-list">
            <div v-for="group in gearGroups" :key="group.setName" class="gear-set-group">
              <button type="button" class="gear-set-header" @click="toggleSetCollapsed(group.setName)">
                <q-icon
                  :name="isSetCollapsed(group.setName) ? 'chevron_right' : 'expand_more'"
                  class="cursor-pointer q-mr-sm"
                />
                <span class="text-subtitle2">{{ group.setName }}</span>
                <q-space />
                <q-chip dense size="sm" color="grey-8" text-color="grey-4">{{ group.gears.length }}</q-chip>
              </button>

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
                      <div class="gear-card-part">{{ gear.part }}</div>
                    </div>
                    <div class="gear-part-badge">{{ gear.part }}</div>
                  </div>
                </div>
              </q-slide-transition>
            </div>
          </div>

          <div v-else class="empty-state text-center text-grey-6 q-py-xl">
            当前筛选没有匹配的装备。
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="panel-column">
      <q-card flat bordered class="panel-card">
        <q-card-section class="panel-header">
          <div class="text-h6">精锻推荐</div>
        </q-card-section>

        <q-separator />

        <div v-if="!selectedGear" class="empty-state text-center text-grey-6 q-py-xl">
          {{ props.state.hideWeaponSelector ? '当前已隐藏左侧选择器，请通过 URL 参数 gearName 预选一件装备。' : '请从左侧选择一件装备以查看精锻推荐。' }}
        </div>

        <div v-else class="gear-result-body q-pa-md">
          <div class="planner-section-label q-mb-sm">已选装备</div>
          <q-card flat bordered class="scheme-card planner-surface-card q-mb-md gear-selected-card">
            <q-card-section class="row items-center q-col-gutter-md">
              <div class="col-auto">
                <div class="weapon-thumb gear-selected-thumb" :class="rarityClass(selectedGear.rarity)">
                  <img v-if="getGearImageUrl(selectedGear.name)" :src="getGearImageUrl(selectedGear.name)" />
                  <span v-else>{{ selectedGear.rarity }}★</span>
                </div>
              </div>
              <div class="col">
                <div class="text-subtitle1 gear-selected-title">{{ selectedGear.name }}</div>
                <div class="text-caption planner-meta-text">
                  {{ selectedGear.setName }} · {{ selectedGear.part }} · {{ selectedGear.rarity }}★
                </div>
                <div class="gear-attrs q-mt-sm">
                  <div class="row items-center justify-between text-caption border-bottom q-pb-xs q-mb-xs gear-attr-row">
                    <span class="planner-meta-text">副词条 1</span>
                    <span class="gear-attr-value">{{ selectedGear.sub1Attr?.display || '无' }}</span>
                  </div>
                  <div class="row items-center justify-between text-caption border-bottom q-pb-xs q-mb-xs gear-attr-row">
                    <span class="planner-meta-text">副词条 2</span>
                    <span class="gear-attr-value">{{ selectedGear.sub2Attr?.display || '无' }}</span>
                  </div>
                  <div class="row items-center justify-between text-caption gear-attr-row">
                    <span class="planner-meta-text">特效</span>
                    <span class="gear-attr-value">{{ selectedGear.specialAttr?.display || '无' }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

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
                  {{ rec.targetAttr.display }}
                </div>
                <div class="text-caption planner-muted-text" v-else>无属性</div>
              </q-card-section>

              <q-separator />

              <div class="q-pa-md">
                <div v-if="!rec.targetAttr" class="text-caption planner-muted-text text-center">
                  该槽位无属性，无法精锻。
                </div>

                <div v-else>
                  <div v-if="rec.recommendSelf" class="text-body2 text-center text-positive q-py-sm">
                    <q-icon name="check_circle" size="sm" class="q-mr-sm" />
                    当前装备已经是该槽位最优值，可使用同名或同值装备精锻。
                  </div>

                  <div v-else class="text-caption planner-meta-text q-mb-sm">
                    推荐使用以下装备（最高值: <span class="text-primary">{{ rec.topValueDisplay }}</span>）
                  </div>

                  <div class="gear-grid-mini">
                    <div
                      v-for="candidate in visibleCandidates(rec)"
                      :key="`${rec.slotKey}-${candidate.gear.name}-${candidate.matchSlotKey}`"
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
                        <span class="gear-match-badge">{{ candidate.matchAttr.display }}</span>
                      </div>
                      <div class="weapon-band"></div>
                      <div class="weapon-name-mini gear-name-mini">
                        <div class="weapon-title">
                          <span class="weapon-title-text">{{ candidate.gear.name }}</span>
                        </div>
                        <div class="gear-card-part">{{ candidate.gear.part }} · {{ candidate.matchSlotLabel }}</div>
                      </div>
                    </div>
                  </div>

                  <div v-if="hasMoreCandidates(rec)" class="row justify-center q-mt-sm">
                    <q-btn
                      flat
                      color="primary"
                      :label="isRecommendationExpanded(rec.slotKey) ? '收起其他候选' : '展开其他候选'"
                      @click="toggleRecommendationExpanded(rec.slotKey)"
                    />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getGearImageId, getGears, toLegacyAssetUrl } from '@/core/data';
import type { Gear, PlannerState } from '@/core/types';

type SlotKey = 'sub1' | 'sub2' | 'special';

interface ParsedAttr {
  display: string;
  key: string;
  value: number | null;
  unit: string;
}

interface NormalizedGear extends Gear {
  setName: string;
  part: string;
  sub1Attr: ParsedAttr | null;
  sub2Attr: ParsedAttr | null;
  specialAttr: ParsedAttr | null;
  searchText: string;
}

interface FilterOptionEntry {
  value: string;
  label: string;
  count: number;
  isDisabled: boolean;
}

interface CandidateMatch {
  gear: NormalizedGear;
  matchAttr: ParsedAttr;
  matchSlotKey: SlotKey;
  matchSlotLabel: string;
}

interface RefiningRecommendation {
  slotKey: SlotKey;
  slotLabel: string;
  targetAttr: ParsedAttr | null;
  recommendSelf: boolean;
  topValueDisplay: string;
  candidates: CandidateMatch[];
}

const props = defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:gearName', value: string): void;
}>();

const slotMeta: Array<{ key: SlotKey; label: string }> = [
  { key: 'sub1', label: '副词条 1' },
  { key: 'sub2', label: '副词条 2' },
  { key: 'special', label: '特效' },
];

const partRank = new Map<string, number>([
  ['护甲', 0],
  ['护手', 1],
  ['配件', 2],
]);

const RECOMMENDATION_PREVIEW_DESKTOP = 4;
const RECOMMENDATION_PREVIEW_MOBILE = 2;

function compareText(a: string, b: string): number {
  return String(a || '').localeCompare(String(b || ''), 'zh-Hans-CN');
}

function normalizeAttrText(value: string | undefined): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([+＋])\s*/g, '+')
    .replace(/\s*%\s*/g, '%')
    .trim();
}

function parseAttr(raw: string | undefined): ParsedAttr | null {
  const text = normalizeAttrText(raw);
  if (!text) return null;
  const match = text.match(/^(.*?)([-+]?\d+(?:\.\d+)?)(%)?$/);
  if (!match) {
    return {
      display: text,
      key: text,
      value: null,
      unit: '',
    };
  }
  const key = String(match[1] || '').replace(/\+$/g, '').trim();
  const value = Number(match[2]);
  return {
    display: text,
    key: key || text,
    value: Number.isFinite(value) ? value : null,
    unit: match[3] || '',
  };
}

function normalizeGear(gear: Gear): NormalizedGear {
  const setName = String(gear.set || '').trim() || '未分类';
  const part = String(gear.type || '').trim();
  const sub1Attr = parseAttr(gear.sub1);
  const sub2Attr = parseAttr(gear.sub2);
  const specialAttr = parseAttr(gear.special);
  const searchText = [
    gear.name,
    setName,
    part,
    sub1Attr?.display || '',
    sub2Attr?.display || '',
    specialAttr?.display || '',
    sub1Attr?.key || '',
    sub2Attr?.key || '',
    specialAttr?.key || '',
  ]
    .join(' ')
    .toLowerCase();

  return {
    ...gear,
    setName,
    part,
    sub1Attr,
    sub2Attr,
    specialAttr,
    searchText,
  };
}

function getParsedAttr(gear: NormalizedGear, slotKey: SlotKey): ParsedAttr | null {
  if (slotKey === 'sub1') return gear.sub1Attr;
  if (slotKey === 'sub2') return gear.sub2Attr;
  return gear.specialAttr;
}

function uniqueSortedValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort(compareText);
}

const normalizedGears = getGears()
  .map(normalizeGear)
  .sort((a, b) => {
    const setDiff = compareText(a.setName, b.setName);
    if (setDiff !== 0) return setDiff;
    const partDiff = (partRank.get(a.part) ?? 99) - (partRank.get(b.part) ?? 99);
    if (partDiff !== 0) return partDiff;
    return compareText(a.name, b.name);
  });

const gearQuery = ref('');
const filterPanelCollapsed = ref(true);
const filterSub1 = ref<string[]>([]);
const filterSub2 = ref<string[]>([]);
const filterSpecial = ref<string[]>([]);
const selectedGearName = ref<string | null>(props.state.gearName || null);
const collapsedSets = ref<Record<string, boolean>>({});
const expandedRecommendations = ref<Record<string, boolean>>({});
const recommendationPreviewLimit = ref(RECOMMENDATION_PREVIEW_DESKTOP);

function syncRecommendationPreviewLimit() {
  if (typeof window === 'undefined') {
    recommendationPreviewLimit.value = RECOMMENDATION_PREVIEW_DESKTOP;
    return;
  }
  recommendationPreviewLimit.value =
    window.innerWidth <= 640 ? RECOMMENDATION_PREVIEW_MOBILE : RECOMMENDATION_PREVIEW_DESKTOP;
}

onMounted(() => {
  syncRecommendationPreviewLimit();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', syncRecommendationPreviewLimit);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', syncRecommendationPreviewLimit);
  }
});

watch(
  () => props.state.gearName,
  (newVal) => {
    if ((newVal || null) !== selectedGearName.value) {
      selectedGearName.value = newVal || null;
    }
  },
);

function matchesAttrFilters(gear: NormalizedGear, filters: Record<SlotKey, string[]>): boolean {
  return slotMeta.every(({ key }) => {
    const selected = filters[key];
    if (!selected.length) return true;
    const attr = getParsedAttr(gear, key);
    return Boolean(attr?.key && selected.includes(attr.key));
  });
}

const hasActiveFilters = computed(
  () => filterSub1.value.length > 0 || filterSub2.value.length > 0 || filterSpecial.value.length > 0,
);

const filteredGears = computed(() => {
  const query = gearQuery.value.trim().toLowerCase();
  const filters: Record<SlotKey, string[]> = {
    sub1: filterSub1.value,
    sub2: filterSub2.value,
    special: filterSpecial.value,
  };

  return normalizedGears.filter((gear) => {
    if (query && !gear.searchText.includes(query)) {
      return false;
    }
    return matchesAttrFilters(gear, filters);
  });
});

function buildFilterOptionEntries(slotKey: SlotKey, selectedValues: string[]): FilterOptionEntry[] {
  const activeFilters: Record<SlotKey, string[]> = {
    sub1: [...filterSub1.value],
    sub2: [...filterSub2.value],
    special: [...filterSpecial.value],
  };
  const optionValues = uniqueSortedValues(
    normalizedGears.map((gear) => getParsedAttr(gear, slotKey)?.key || ''),
  );

  return optionValues.map((value) => {
    const relaxedFilters: Record<SlotKey, string[]> = {
      sub1: slotKey === 'sub1' ? activeFilters.sub1.filter((item) => item !== value) : activeFilters.sub1,
      sub2: slotKey === 'sub2' ? activeFilters.sub2.filter((item) => item !== value) : activeFilters.sub2,
      special:
        slotKey === 'special' ? activeFilters.special.filter((item) => item !== value) : activeFilters.special,
    };

    const count = normalizedGears.filter((gear) => {
      if (!matchesAttrFilters(gear, relaxedFilters)) return false;
      return getParsedAttr(gear, slotKey)?.key === value;
    }).length;

    return {
      value,
      label: `${value} · ${count}`,
      count,
      isDisabled: count === 0,
    };
  });
}

const filterOptionEntries = computed(() => ({
  sub1: buildFilterOptionEntries('sub1', filterSub1.value),
  sub2: buildFilterOptionEntries('sub2', filterSub2.value),
  special: buildFilterOptionEntries('special', filterSpecial.value),
}));

const gearGroups = computed(() => {
  const groups = new Map<string, NormalizedGear[]>();
  filteredGears.value.forEach((gear) => {
    const key = gear.setName || '未分类';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(gear);
  });

  return Array.from(groups.entries()).map(([setName, gears]) => ({
    setName,
    gears,
  }));
});

watch(
  gearGroups,
  (groups) => {
    const next = { ...collapsedSets.value };
    groups.forEach((group) => {
      if (!Object.prototype.hasOwnProperty.call(next, group.setName)) {
        next[group.setName] = true;
      }
    });
    collapsedSets.value = next;
  },
  { immediate: true },
);

const selectedGear = computed(() => normalizedGears.find((gear) => gear.name === selectedGearName.value) || null);

watch(
  selectedGear,
  (gear) => {
    if (!gear) return;
    collapsedSets.value = {
      ...collapsedSets.value,
      [gear.setName]: false,
    };
  },
  { immediate: true },
);

function getCandidateBestMatch(gear: NormalizedGear, targetAttr: ParsedAttr): CandidateMatch | null {
  if (!targetAttr.key || targetAttr.value == null || !Number.isFinite(targetAttr.value)) return null;
  const targetValue = targetAttr.value;
  let best: CandidateMatch | null = null;

  slotMeta.forEach(({ key, label }) => {
    const attr = getParsedAttr(gear, key);
    if (!attr || attr.key !== targetAttr.key || attr.unit !== targetAttr.unit) return;
    if (attr.value == null || !Number.isFinite(attr.value)) return;
    const attrValue = attr.value;
    if (attrValue < targetValue) return;
    if (!best || attrValue > (best.matchAttr.value || 0)) {
      best = {
        gear,
        matchAttr: attr,
        matchSlotKey: key,
        matchSlotLabel: label,
      };
    }
  });

  return best;
}

function buildSlotRecommendation(gear: NormalizedGear, slot: { key: SlotKey; label: string }): RefiningRecommendation {
  const targetAttr = getParsedAttr(gear, slot.key);
  if (!targetAttr) {
    return {
      slotKey: slot.key,
      slotLabel: slot.label,
      targetAttr: null,
      recommendSelf: true,
      topValueDisplay: '',
      candidates: [],
    };
  }

  if (!targetAttr.key || !Number.isFinite(targetAttr.value)) {
    return {
      slotKey: slot.key,
      slotLabel: slot.label,
      targetAttr,
      recommendSelf: true,
      topValueDisplay: targetAttr.display,
      candidates: [
        {
          gear,
          matchAttr: targetAttr,
          matchSlotKey: slot.key,
          matchSlotLabel: slot.label,
        },
      ],
    };
  }

  const candidates = normalizedGears
    .filter((candidateGear) => candidateGear.name !== gear.name && candidateGear.part === gear.part)
    .map((candidateGear) => getCandidateBestMatch(candidateGear, targetAttr))
    .filter((candidate): candidate is CandidateMatch => Boolean(candidate));

  if (!candidates.length) {
    return {
      slotKey: slot.key,
      slotLabel: slot.label,
      targetAttr,
      recommendSelf: true,
      topValueDisplay: targetAttr.display,
      candidates: [
        {
          gear,
          matchAttr: targetAttr,
          matchSlotKey: slot.key,
          matchSlotLabel: slot.label,
        },
      ],
    };
  }

  const higherCandidates = candidates
    .filter((candidate) => Number.isFinite(candidate.matchAttr.value) && (candidate.matchAttr.value || 0) > (targetAttr.value || 0))
    .sort((a, b) => {
      const valueDiff = (b.matchAttr.value || 0) - (a.matchAttr.value || 0);
      if (valueDiff !== 0) return valueDiff;
      return compareText(a.gear.name, b.gear.name);
    });

  if (higherCandidates.length) {
    return {
      slotKey: slot.key,
      slotLabel: slot.label,
      targetAttr,
      recommendSelf: false,
      topValueDisplay: higherCandidates[0].matchAttr.display,
      candidates: higherCandidates,
    };
  }

  const sameValueCandidates = candidates
    .filter((candidate) => candidate.matchAttr.value === targetAttr.value)
    .sort((a, b) => compareText(a.gear.name, b.gear.name));

  return {
    slotKey: slot.key,
    slotLabel: slot.label,
    targetAttr,
    recommendSelf: true,
    topValueDisplay: targetAttr.display,
    candidates: [
      {
        gear,
        matchAttr: targetAttr,
        matchSlotKey: slot.key,
        matchSlotLabel: slot.label,
      },
      ...sameValueCandidates,
    ],
  };
}

const refiningRecommendations = computed<RefiningRecommendation[]>(() => {
  if (!selectedGear.value) return [];
  return slotMeta.map((slot) => buildSlotRecommendation(selectedGear.value as NormalizedGear, slot));
});

function recommendationExpandKey(slotKey: SlotKey): string {
  return `${selectedGearName.value || ''}:${slotKey}`;
}

function isSetCollapsed(setName: string): boolean {
  return collapsedSets.value[setName] !== false;
}

function toggleSetCollapsed(setName: string) {
  collapsedSets.value = {
    ...collapsedSets.value,
    [setName]: !isSetCollapsed(setName),
  };
}

function isRecommendationExpanded(slotKey: SlotKey): boolean {
  return Boolean(expandedRecommendations.value[recommendationExpandKey(slotKey)]);
}

function toggleRecommendationExpanded(slotKey: SlotKey) {
  const key = recommendationExpandKey(slotKey);
  expandedRecommendations.value = {
    ...expandedRecommendations.value,
    [key]: !expandedRecommendations.value[key],
  };
}

function hasMoreCandidates(recommendation: RefiningRecommendation): boolean {
  return recommendation.candidates.length > recommendationPreviewLimit.value;
}

function visibleCandidates(recommendation: RefiningRecommendation): CandidateMatch[] {
  if (!hasMoreCandidates(recommendation) || isRecommendationExpanded(recommendation.slotKey)) {
    return recommendation.candidates;
  }
  return recommendation.candidates.slice(0, recommendationPreviewLimit.value);
}

function toggleFilterValue(slotKey: SlotKey, value: string) {
  const map = {
    sub1: filterSub1,
    sub2: filterSub2,
    special: filterSpecial,
  };
  const target = map[slotKey];
  const current = target.value;
  target.value = current.includes(value) ? current.filter((item) => item !== value) : current.concat(value);
}

function clearFilters() {
  filterSub1.value = [];
  filterSub2.value = [];
  filterSpecial.value = [];
}

function getGearImageUrl(name: string): string {
  const id = getGearImageId(name);
  return id ? toLegacyAssetUrl(`legacy/image/equip/${encodeURIComponent(id)}.avif`) : '';
}

function rarityClass(rarity: number): string {
  if (rarity === 6) return 'rarity-6';
  if (rarity === 5) return 'rarity-5';
  return 'rarity-4';
}

function selectGear(gear: NormalizedGear) {
  selectedGearName.value = gear.name;
  emit('update:gearName', gear.name);
}

if (!selectedGearName.value && normalizedGears.length > 0) {
  selectedGearName.value = normalizedGears[0].name;
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

.gear-layout.single-column {
  @media (min-width: 900px) {
    grid-template-columns: 1fr;
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

.filter-panel-content {
  background: var(--planner-surface-soft);
}

.gear-set-header {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--planner-surface-soft);
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  color: var(--planner-text-primary);
}

.gear-set-header:hover {
  background: var(--planner-surface-strong);
  border-color: var(--planner-item-border);
}

.gear-grid,
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

.gear-part-badge,
.gear-match-badge {
  position: absolute;
  right: 6px;
  background: rgba(12, 18, 26, 0.82);
  color: #f7f5f1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  z-index: 5;
}

.gear-part-badge {
  top: 6px;
}

.gear-match-badge {
  left: 6px;
  right: auto;
  bottom: 6px;
  max-width: calc(100% - 12px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
