<template>
  <div class="planner-page-root">
    <!-- Legacy Mode: Fullscreen Iframe -->
    <div v-if="renderer === 'legacy'" class="legacy-fullscreen-container">
      <legacy-planner-page />
      
      <!-- Floating Switch Back Button -->
      <q-btn
        round
        color="primary"
        icon="view_quilt"
        class="floating-switch-btn"
        @click="renderer = 'modern'"
      >
        <q-tooltip anchor="center left" self="center right">切换回新版界面</q-tooltip>
      </q-btn>
    </div>

    <!-- Modern Mode: Standard Layout -->
    <q-page v-else class="planner-page" :class="{ 'is-embed': state.embed }">
      <div class="planner-container">
        <q-card v-if="!state.embed" flat bordered class="panel-card toolbar-card">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-8">
                <div class="row items-center no-wrap scroll">
                  <q-tabs
                    v-model="state.view"
                    dense
                    align="left"
                    inline-label
                    active-color="primary"
                    indicator-color="primary"
                    class="col-grow"
                  >
                    <q-tab name="planner" label="基质规划" />
                    <q-tab name="strategy" label="角色攻略" />
                    <q-tab name="match" label="词条对照" />
                    <q-tab name="gear-refining" label="装备精锻" />
                    <q-tab name="rerun-ranking" label="复刻排行" />
                  </q-tabs>
                </div>
              </div>
              
              <div class="col-12 col-md-4">
                <div class="row q-gutter-sm justify-end items-center no-wrap">
                  <q-select 
                    v-model="state.lang" 
                    :options="langOptions" 
                    dense 
                    outlined 
                    emit-value 
                    map-options 
                    options-dense
                    label="语言" 
                    style="min-width: 100px"
                  />
                  
                  <q-btn-dropdown flat dense dropdown-icon="settings">
                    <q-list style="min-width: 200px">
                      <q-item>
                        <q-item-section>
                          <q-select 
                            v-model="state.theme" 
                            :options="themeOptions" 
                            dense 
                            outlined 
                            emit-value 
                            map-options 
                            label="主题" 
                          />
                        </q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>嵌入模式</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.embed" :disable="state.readonly" />
                        </q-item-section>
                      </q-item>
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>API 模式</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.api" :disable="state.readonly" />
                        </q-item-section>
                      </q-item>
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>只读模式</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.readonly" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  
                  <q-separator vertical class="q-mx-sm" />
                  
                  <q-btn
                    unelevated
                    color="primary"
                    icon="history"
                    label="Legacy"
                    no-caps
                    @click="renderer = 'legacy'"
                  >
                    <q-tooltip>切换回旧版界面</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <keep-alive>
          <component
            :is="currentViewComponent"
            :state="state"
            :weapon-marks="weaponMarks"
            @update:selected-weapons="onUpdateSelectedWeapons"
            @update:match-source="state.matchSource = $event"
            @update:gear-name="state.gearName = $event"
          />
        </keep-alive>
      </div>
    </q-page>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { getWeapons } from '@/core/data';
import { DEFAULT_STATE, parseStateFromUrl, writeStateToUrl } from '@/core/url-state';
import type { PlannerState } from '@/core/types';
import { installBridge } from '@/embed/bridge';
import { exposeGlobalApi } from '@/api/expose-global';
import LegacyPlannerPage from '@/pages/LegacyPlannerPage.vue';

// Sub-views
import PlannerView from './planner/PlannerView.vue';
import StrategyView from './planner/StrategyView.vue';
import MatchView from './planner/MatchView.vue';
import GearView from './planner/GearView.vue';
import RerunView from './planner/RerunView.vue';

const $q = useQuasar();

type RendererMode = 'modern' | 'legacy';

function parseRendererFromUrl(url = window.location.href): RendererMode {
  const parsed = new URL(url);
  const value = parsed.searchParams.get('renderer');
  if (value === 'legacy') {
    return 'legacy';
  }
  return 'modern';
}

const renderer = ref<RendererMode>(parseRendererFromUrl());

watch(renderer, (value) => {
  const url = new URL(window.location.href);
  if (value === 'legacy') {
    url.searchParams.set('renderer', 'legacy');
  } else {
    url.searchParams.delete('renderer');
  }
  const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
  window.history.replaceState({}, '', next);
});

interface WeaponMark {
  ownedWeapon: boolean;
  ownedMatrix: boolean;
  excluded: boolean;
  note: string;
}

const STORAGE_KEY = 'modern-planner-state:v1';

const langOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
];

const themeOptions = [
  { label: '自动', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];

const initialState = parseStateFromUrl();
const state = reactive<PlannerState>({ ...DEFAULT_STATE, ...initialState });
const weaponMarks = reactive<Record<string, WeaponMark>>({});
const allWeapons = getWeapons();
const weaponNameSet = new Set(allWeapons.map((item) => item.name));

const currentViewComponent = computed(() => {
  switch (state.view) {
    case 'planner':
      return PlannerView;
    case 'strategy':
      return StrategyView;
    case 'match':
      return MatchView;
    case 'gear-refining':
      return GearView;
    case 'rerun-ranking':
      return RerunView;
    default:
      return PlannerView;
  }
});

function ensureMark(name: string): WeaponMark {
  if (!weaponMarks[name]) {
    weaponMarks[name] = {
      ownedWeapon: false,
      ownedMatrix: false,
      excluded: false,
      note: '',
    };
  }
  return weaponMarks[name];
}

function normalizeSelectedWeapons(list: string[]): string[] {
  return [...new Set(list)].filter((name) => weaponNameSet.has(name));
}

function onUpdateSelectedWeapons(value: string[]) {
  if (state.readonly) return;
  state.selectedWeapons = normalizeSelectedWeapons(value);
  state.selectedWeapons.forEach(ensureMark);
}

function loadPersistedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    const parsed = JSON.parse(raw) as {
      selectedWeapons?: string[];
      weaponMarks?: Record<string, WeaponMark>;
      matchSource?: string;
      gearName?: string;
    };

    if (Array.isArray(parsed.selectedWeapons) && state.selectedWeapons.length === 0) {
      state.selectedWeapons = normalizeSelectedWeapons(parsed.selectedWeapons);
    }
    
    if (parsed.matchSource && !state.matchSource) {
      state.matchSource = parsed.matchSource;
    }
    
    if (parsed.gearName && !state.gearName) {
      state.gearName = parsed.gearName;
    }

    if (parsed.weaponMarks && typeof parsed.weaponMarks === 'object') {
      Object.entries(parsed.weaponMarks).forEach(([name, mark]) => {
        if (!weaponNameSet.has(name)) return;
        weaponMarks[name] = {
          ownedWeapon: Boolean(mark?.ownedWeapon),
          ownedMatrix: Boolean(mark?.ownedMatrix),
          excluded: Boolean(mark?.excluded),
          note: typeof mark?.note === 'string' ? mark.note.slice(0, 60) : '',
        };
      });
    }
    state.selectedWeapons.forEach(ensureMark);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

loadPersistedState();

function resolveTheme(theme: PlannerState['theme']): 'light' | 'dark' {
  if (theme !== 'auto') {
    return theme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: PlannerState['theme']) {
  const resolved = resolveTheme(theme);
  $q.dark.set(resolved === 'dark');
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
const onSystemThemeChange = () => {
  if (state.theme === 'auto') {
    applyTheme('auto');
  }
};

mediaQuery.addEventListener('change', onSystemThemeChange);
applyTheme(state.theme);

watch(
  () => state.theme,
  (value) => {
    applyTheme(value);
  },
);

watch(
  () => ({
    selectedWeapons: [...state.selectedWeapons],
    weaponMarks: JSON.parse(JSON.stringify(weaponMarks)),
    matchSource: state.matchSource,
    gearName: state.gearName,
  }),
  (payload) => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    const prev = existing ? JSON.parse(existing) : {};
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...payload }));
  },
  { deep: true },
);

watch(
  () => state.view,
  (view) => {
    writeStateToUrl(state, 'push');
  }
);

watch(
  () => ({
    selectedWeapons: [...state.selectedWeapons],
    lang: state.lang,
    theme: state.theme,
    embed: state.embed,
    api: state.api,
    readonly: state.readonly,
    matchSource: state.matchSource,
    gearName: state.gearName,
  }),
  () => {
    writeStateToUrl(state, 'replace');
  },
  { deep: true },
);

const apiContext = {
  getState: () => ({ ...state, selectedWeapons: [...state.selectedWeapons] }),
  setState: (partial: Partial<PlannerState>) => {
    if (state.readonly) {
      return { ...state, selectedWeapons: [...state.selectedWeapons] };
    }
    Object.assign(state, partial);
    if (partial.selectedWeapons) {
      state.selectedWeapons = normalizeSelectedWeapons(partial.selectedWeapons);
      state.selectedWeapons.forEach(ensureMark);
    }
    return { ...state, selectedWeapons: [...state.selectedWeapons] };
  },
  getRecommendations: () => [], 
};

exposeGlobalApi(apiContext);

const disposeBridge = installBridge(apiContext, {
  allowedOrigins: [],
});

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', onSystemThemeChange);
  disposeBridge();
});
</script>

<style scoped>
.legacy-fullscreen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;
}

.floating-switch-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.planner-page.is-embed {
  padding: 0;
}

.planner-page.is-embed .planner-container {
  max-width: 100%;
  padding: 0;
}
</style>
