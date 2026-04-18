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
                    <q-tab name="editor" label="角色编辑" />
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
                    v-if="hasPlannerContent"
                    flat
                    dense
                    color="primary"
                    icon="campaign"
                    label="公告"
                    no-caps
                    @click="openAnnouncementDialog"
                  >
                    <q-badge v-if="hasUnreadAnnouncement" floating rounded color="negative" />
                    <q-tooltip>
                      当前支持 {{ supportedVersionLabel }}
                      <span v-if="nextVersionLabel">，下个版本 {{ nextVersionLabel }}</span>
                      <span v-if="nextVersionDateLabel">，预计 {{ nextVersionDateLabel }}</span>
                    </q-tooltip>
                  </q-btn>
                  
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
            @update:selected-character-id="state.selectedCharacterId = $event || undefined"
            @update:weapon-mark="onUpdateWeaponMark"
            @update:match-source="state.matchSource = $event"
            @update:gear-name="state.gearName = $event"
            @update:recommendation-config="onUpdateRecommendationConfig"
            @export:weapon-marks="exportWeaponMarks"
            @import:weapon-marks="importWeaponMarks"
          />
        </keep-alive>

        <q-dialog v-model="showAnnouncementDialog" @hide="closeAnnouncementDialog()">
          <q-card class="notice-dialog">
            <q-card-section class="row items-start justify-between q-col-gutter-md">
              <div class="col">
                <div class="text-h6">{{ announcementTitle }}</div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  当前支持 {{ supportedVersionLabel }}
                  <span v-if="nextVersionLabel">，下个版本 {{ nextVersionLabel }}</span>
                  <span v-if="nextVersionDateLabel">，预计 {{ nextVersionDateLabel }}</span>
                </div>
              </div>
              <div class="col-auto row q-gutter-sm items-center">
                <q-chip v-if="plannerAnnouncement?.date" dense color="grey-8" text-color="white">
                  {{ plannerAnnouncement.date }}
                </q-chip>
                <q-chip v-if="plannerAnnouncement?.version" dense color="primary" text-color="white">
                  {{ plannerAnnouncement.version }}
                </q-chip>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="content-card-body q-gutter-y-md">
              <section v-if="announcementItems.length" class="content-section">
                <div class="text-subtitle2 q-mb-sm">公告</div>
                <ul class="content-item-list">
                  <li v-for="(item, index) in announcementItems" :key="`announcement-${index}`" v-html="renderContentLine(item)"></li>
                </ul>
              </section>

              <section v-if="qqGroupEntries.length" class="content-section">
                <div class="text-subtitle2 q-mb-sm">交流群</div>
                <div class="column q-gutter-y-sm">
                  <div v-for="entry in qqGroupEntries" :key="entry.group" class="row q-gutter-sm items-center">
                    <q-chip dense color="secondary" text-color="white">{{ entry.label }} {{ entry.group }}</q-chip>
                    <div v-if="entry.note" class="text-caption text-grey-6">{{ entry.note }}</div>
                  </div>
                </div>
              </section>

              <section v-if="latestChangelogEntries.length" class="content-section">
                <div class="text-subtitle2 q-mb-sm">{{ changelogTitle }}</div>
                <div v-for="entry in latestChangelogEntries" :key="entry.date" class="changelog-entry">
                  <div class="text-caption text-grey-5 q-mb-xs">{{ entry.date }}</div>
                  <ul class="content-item-list">
                    <li v-for="(item, itemIndex) in entry.items" :key="`${entry.date}-${itemIndex}`" v-html="renderContentLine(item)"></li>
                  </ul>
                </div>
              </section>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
              <q-btn flat color="primary" label="关闭" @click="closeAnnouncementDialog()" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </q-page>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { getWeapons, getDungeons, getPlannerContent } from '@/core/data';
import { getRecommendations } from '@/core/recommender';
import {
  DEFAULT_RECOMMENDATION_CONFIG,
  DEFAULT_STATE,
  parseStateFromUrl,
  parseWeaponMarksFromUrl,
  writeStateToUrl,
} from '@/core/url-state';
import type { PlannerState, RecommendationConfig } from '@/core/types';
import { installBridge } from '@/embed/bridge';
import { exposeGlobalApi } from '@/api/expose-global';
import LegacyPlannerPage from '@/pages/LegacyPlannerPage.vue';

// Sub-views
import PlannerView from './planner/PlannerView.vue';
import StrategyView from './planner/StrategyView.vue';
import MatchView from './planner/MatchView.vue';
import GearView from './planner/GearView.vue';
import RerunView from './planner/RerunView.vue';
import EditorView from './planner/EditorView.vue';

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
const NOTICE_SEEN_KEY = 'modern-planner-announcement-seen:v1';

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
const plannerContent = getPlannerContent();
const weaponNameSet = new Set(allWeapons.map((item) => item.name));
const marksFromUrl = parseWeaponMarksFromUrl(window.location.href, weaponNameSet);
const plannerAnnouncement = plannerContent.announcement;
const announcementItems = Array.isArray(plannerAnnouncement?.items) ? plannerAnnouncement.items : [];
const latestChangelogEntries = Array.isArray(plannerContent.changelog?.entries)
  ? plannerContent.changelog.entries.slice(0, 3)
  : [];
const hasPlannerContent = Boolean(
  plannerContent.gameCompat || announcementItems.length || latestChangelogEntries.length,
);
const supportedVersionLabel = plannerContent.gameCompat?.supportedVersion || '未知版本';
const nextVersionLabel = plannerContent.gameCompat?.nextVersion || '';
const showAnnouncementDialog = ref(false);

function formatPlannerContentDate(value?: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('zh-CN');
}

const nextVersionDateLabel = formatPlannerContentDate(plannerContent.gameCompat?.nextVersionAt);
const announcementVersion = plannerAnnouncement?.version || plannerAnnouncement?.date || '';
const contentTitlePattern = /^[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)+$/;

const contentTitleMessages: Record<string, Record<string, string>> = {
  'zh-CN': {
    'nav.announcement': '公告',
    'nav.changelog': '更新日志',
  },
  'zh-TW': {
    'nav.announcement': '公告',
    'nav.changelog': '更新日誌',
  },
  en: {
    'nav.announcement': 'Announcement',
    'nav.changelog': 'Changelog',
  },
  ja: {
    'nav.announcement': 'お知らせ',
    'nav.changelog': '更新履歴',
  },
};

function t(key: string, fallback = key): string {
  return contentTitleMessages[state.lang]?.[key] || contentTitleMessages['zh-CN']?.[key] || fallback;
}

function resolveContentTitle(rawTitle: string | undefined, fallbackKey: string): string {
  const fallbackTitle = t(fallbackKey, fallbackKey);
  if (typeof rawTitle !== 'string') {
    return fallbackTitle;
  }
  const normalizedTitle = rawTitle.trim();
  if (!normalizedTitle) {
    return fallbackTitle;
  }
  if (!contentTitlePattern.test(normalizedTitle)) {
    return normalizedTitle;
  }
  return t(normalizedTitle, fallbackTitle);
}

const announcementTitle = computed(() => resolveContentTitle(plannerAnnouncement?.title, 'nav.announcement'));
const changelogTitle = computed(() => resolveContentTitle(plannerContent.changelog?.title, 'nav.changelog'));
const qqGroupEntries = computed(() => {
  const entries: Array<{ label: string; group: string; note: string }> = [];
  if (plannerAnnouncement?.qqGroup) {
    entries.push({
      label: '主站 QQ 群',
      group: plannerAnnouncement.qqGroup,
      note: plannerAnnouncement.qqNote || '',
    });
  }
  entries.push({
    label: 'JeiWeb QQ 群',
    group: '1080814651',
    note: 'JeiWeb 版本反馈与交流',
  });
  return entries;
});

function loadSeenAnnouncementVersion(): string {
  try {
    return window.localStorage.getItem(NOTICE_SEEN_KEY) || '';
  } catch {
    return '';
  }
}

function saveSeenAnnouncementVersion(version: string) {
  try {
    if (version) {
      window.localStorage.setItem(NOTICE_SEEN_KEY, version);
      return;
    }
    window.localStorage.removeItem(NOTICE_SEEN_KEY);
  } catch {
    // Ignore localStorage failures for non-critical UI state.
  }
}

const seenAnnouncementVersion = ref(loadSeenAnnouncementVersion());
const hasUnreadAnnouncement = computed(() => Boolean(announcementVersion && seenAnnouncementVersion.value !== announcementVersion));

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineText(value: string): string {
  return escapeHtml(value).replace(/==([^=]+)==/g, '<strong>$1</strong>');
}

function renderContentLine(value: string): string {
  const source = String(value || '');
  const tokenPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(source))) {
    html += renderInlineText(source.slice(lastIndex, match.index));
    if (match[1] && match[2]) {
      html += `<a href="${escapeHtml(match[2])}" target="_blank" rel="noopener noreferrer">${renderInlineText(match[1])}</a>`;
    } else if (match[3]) {
      const url = match[3];
      html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    }
    lastIndex = tokenPattern.lastIndex;
  }

  html += renderInlineText(source.slice(lastIndex));
  return html;
}

function openAnnouncementDialog() {
  showAnnouncementDialog.value = true;
}

function closeAnnouncementDialog(markAsSeen = true) {
  if (showAnnouncementDialog.value) {
    showAnnouncementDialog.value = false;
  }
  if (!markAsSeen || !announcementVersion) {
    return;
  }
  seenAnnouncementVersion.value = announcementVersion;
  saveSeenAnnouncementVersion(announcementVersion);
}

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
    case 'editor':
      return EditorView;
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

function onUpdateWeaponMark(name: string, partial: Partial<WeaponMark>) {
  if (state.readonly) return;
  const mark = ensureMark(name);
  Object.assign(mark, partial);
}

function getOwnedMarkLists() {
  const ownedWeaponNames: string[] = [];
  const ownedMatrixNames: string[] = [];
  Object.entries(weaponMarks).forEach(([name, mark]) => {
    if (!weaponNameSet.has(name)) return;
    if (mark.ownedWeapon) ownedWeaponNames.push(name);
    if (mark.ownedMatrix) ownedMatrixNames.push(name);
  });
  ownedWeaponNames.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  ownedMatrixNames.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return { ownedWeaponNames, ownedMatrixNames };
}

function applyMarksFromUrl() {
  if (marksFromUrl.hasOwnedWeaponParam) {
    Object.values(weaponMarks).forEach((mark) => {
      mark.ownedWeapon = false;
    });
    marksFromUrl.ownedWeaponNames.forEach((name) => {
      ensureMark(name).ownedWeapon = true;
    });
  }
  if (marksFromUrl.hasOwnedMatrixParam) {
    Object.values(weaponMarks).forEach((mark) => {
      mark.ownedMatrix = false;
    });
    marksFromUrl.ownedMatrixNames.forEach((name) => {
      ensureMark(name).ownedMatrix = true;
    });
  }
}

function onUpdateRecommendationConfig(partial: Partial<RecommendationConfig>) {
  Object.assign(state.recommendationConfig, partial);
}

function exportWeaponMarks() {
  const data = JSON.stringify({ weaponMarks }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'weapon-marks.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importWeaponMarks(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { weaponMarks?: Record<string, WeaponMark> };
    if (parsed.weaponMarks && typeof parsed.weaponMarks === 'object') {
      let count = 0;
      Object.entries(parsed.weaponMarks).forEach(([name, mark]) => {
        if (!weaponNameSet.has(name)) return;
        weaponMarks[name] = {
          ownedWeapon: Boolean(mark?.ownedWeapon),
          ownedMatrix: Boolean(mark?.ownedMatrix),
          excluded: Boolean(mark?.excluded),
          note: typeof mark?.note === 'string' ? mark.note.slice(0, 60) : '',
        };
        count++;
      });
      $q.notify({ type: 'positive', message: `已导入 ${count} 条标记数据` });
    }
  } catch {
    $q.notify({ type: 'negative', message: '导入失败：文件格式无效' });
  }
}

function loadPersistedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    const parsed = JSON.parse(raw) as {
      selectedWeapons?: string[];
      selectedCharacterId?: string;
      weaponMarks?: Record<string, WeaponMark>;
      matchSource?: string;
      gearName?: string;
      hideWeaponSelector?: boolean;
      recommendationConfig?: Partial<RecommendationConfig>;
    };

    if (Array.isArray(parsed.selectedWeapons) && state.selectedWeapons.length === 0) {
      state.selectedWeapons = normalizeSelectedWeapons(parsed.selectedWeapons);
    }

    if (parsed.selectedCharacterId && !state.selectedCharacterId) {
      state.selectedCharacterId = parsed.selectedCharacterId;
    }
    
    if (parsed.matchSource && !state.matchSource) {
      state.matchSource = parsed.matchSource;
    }
    
    if (parsed.gearName && !state.gearName) {
      state.gearName = parsed.gearName;
    }

    if (typeof parsed.hideWeaponSelector === 'boolean' && !state.hideWeaponSelector) {
      state.hideWeaponSelector = parsed.hideWeaponSelector;
    }

    if (parsed.recommendationConfig && typeof parsed.recommendationConfig === 'object') {
      Object.assign(state.recommendationConfig, parsed.recommendationConfig);
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
applyMarksFromUrl();

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

onMounted(() => {
  if (state.embed || !hasPlannerContent) {
    return;
  }
  if (hasUnreadAnnouncement.value || (plannerAnnouncement?.forceModal && !announcementVersion)) {
    openAnnouncementDialog();
  }
});

watch(
  () => state.theme,
  (value) => {
    applyTheme(value);
  },
);

watch(
  () => ({
    selectedWeapons: [...state.selectedWeapons],
    selectedCharacterId: state.selectedCharacterId,
    weaponMarks: JSON.parse(JSON.stringify(weaponMarks)),
    matchSource: state.matchSource,
    gearName: state.gearName,
    hideWeaponSelector: state.hideWeaponSelector,
  }),
  (payload) => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    const prev = existing ? JSON.parse(existing) : {};
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...payload }));
    const ownedMarks = getOwnedMarkLists();
    writeStateToUrl(state, 'replace', ownedMarks);
  },
  { deep: true },
);

watch(
  () => state.view,
  (view) => {
    writeStateToUrl(state, 'push', getOwnedMarkLists());
  }
);

watch(
  () => ({
    selectedWeapons: [...state.selectedWeapons],
    selectedCharacterId: state.selectedCharacterId,
    lang: state.lang,
    theme: state.theme,
    embed: state.embed,
    api: state.api,
    readonly: state.readonly,
    hideWeaponSelector: state.hideWeaponSelector,
    matchSource: state.matchSource,
    gearName: state.gearName,
    recommendationConfig: { ...state.recommendationConfig },
  }),
  () => {
    writeStateToUrl(state, 'replace', getOwnedMarkLists());
  },
  { deep: true },
);

const allDungeons = getDungeons();

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
    if (partial.selectedCharacterId === null) {
      state.selectedCharacterId = undefined;
    }
    return { ...state, selectedWeapons: [...state.selectedWeapons] };
  },
  getRecommendations: () => getRecommendations(state.selectedWeapons, allWeapons, allDungeons),
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

.content-card-body {
  display: flex;
  flex-direction: column;
}

.content-section + .content-section {
  padding-top: 8px;
  border-top: 1px solid var(--planner-item-border);
}

.content-item-list {
  margin: 0;
  padding-left: 18px;
  color: var(--planner-text-secondary);
}

.content-item-list li + li {
  margin-top: 6px;
}

.content-item-list :deep(a) {
  color: var(--q-primary);
  text-decoration: underline;
}

.content-item-list :deep(strong) {
  color: var(--planner-text-primary);
}

.changelog-entry + .changelog-entry {
  margin-top: 12px;
}
</style>
