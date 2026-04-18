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
          <q-card-section class="planner-topbar-section">
            <div class="row q-col-gutter-sm items-center planner-topbar-row">
              <div class="col planner-toolbar-nav">
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
                    <q-tab name="planner" :label="t('基质规划')" />
                    <q-tab name="strategy" :label="t('角色攻略')" />
                    <q-tab name="match" :label="t('词条对照')" />
                    <q-tab name="gear-refining" :label="t('装备精锻')" />
                    <q-tab name="rerun-ranking" :label="t('复刻排行')" />
                    <q-tab name="editor" :label="t('角色编辑')" />
                  </q-tabs>
                </div>
              </div>
              
              <div class="col-auto planner-toolbar-column">
                <div class="planner-toolbar-controls">
                  <div class="planner-toolbar-selects">
                  <q-btn flat dense round icon="translate" color="primary">
                    <q-tooltip>{{ t('语言', '语言') }}: {{ currentLangLabel }}</q-tooltip>
                    <q-menu>
                      <q-list style="min-width: 160px">
                        <q-item
                          v-for="option in langOptions"
                          :key="option.value"
                          clickable
                          v-close-popup
                          @click="state.lang = option.value"
                        >
                          <q-item-section>{{ option.label }}</q-item-section>
                          <q-item-section side>
                            <q-icon v-if="state.lang === option.value" name="check" color="primary" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>

                  <q-btn flat dense round icon="palette" color="primary">
                    <q-tooltip>{{ t('主题', '主题') }}: {{ currentThemeLabel }}</q-tooltip>
                    <q-menu>
                      <q-list style="min-width: 160px">
                        <q-item
                          v-for="option in themeOptions"
                          :key="option.value"
                          clickable
                          v-close-popup
                          @click="state.theme = option.value"
                        >
                          <q-item-section>{{ option.label }}</q-item-section>
                          <q-item-section side>
                            <q-icon v-if="state.theme === option.value" name="check" color="primary" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                  
                  <q-btn-dropdown flat dense dropdown-icon="settings">
                    <q-list style="min-width: 200px">
                      <q-item v-if="showClassicThemeSettings" tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>{{ t('背景显示', '背景显示') }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-toggle v-model="backgroundDisplayEnabled" />
                        </q-item-section>
                      </q-item>
                      <q-item v-if="showClassicThemeSettings">
                        <q-item-section>
                          <q-item-label>{{ t('背景图系统', '背景图系统') }}</q-item-label>
                          <q-item-label caption>{{ backgroundStatusLabel }}</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item v-if="showClassicThemeSettings">
                        <q-item-section>
                          <q-input
                            v-model.trim="customBackgroundApi"
                            dense
                            outlined
                            :label="t('背景图 API', '背景图 API')"
                            :placeholder="t('留空时使用默认背景', '留空时使用默认背景')"
                          />
                        </q-item-section>
                      </q-item>
                      <q-item v-if="showClassicThemeSettings">
                        <q-item-section>
                          <div class="row q-gutter-sm">
                            <q-btn dense flat color="primary" :label="t('导入背景', '导入背景')" @click="triggerBackgroundImport" />
                            <q-btn dense flat color="grey-6" :label="t('恢复默认', '恢复默认')" @click="clearCustomBackground" />
                          </div>
                          <input
                            ref="backgroundImportInput"
                            type="file"
                            accept="image/*"
                            style="display:none"
                            @change="handleBackgroundFile"
                          />
                          <div v-if="customBackgroundError" class="text-caption text-negative q-mt-xs">{{ customBackgroundError }}</div>
                        </q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>{{ t('嵌入模式', '嵌入模式') }}</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.embed" :disable="state.readonly" />
                        </q-item-section>
                      </q-item>
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>{{ t('API 模式', 'API 模式') }}</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.api" :disable="state.readonly" />
                        </q-item-section>
                      </q-item>
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>{{ t('只读模式', '只读模式') }}</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.readonly" />
                        </q-item-section>
                      </q-item>
                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>{{ t('隐藏武器选择器', '隐藏武器选择器') }}</q-item-label>
                          <q-item-label caption>{{ t('对基质规划 / 词条对照 / 装备精锻生效', '对基质规划 / 词条对照 / 装备精锻生效') }}</q-item-label>
                        </q-item-section>
                        <q-item-section side >
                          <q-toggle v-model="state.hideWeaponSelector" :disable="state.readonly" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  </div>

                  <q-separator vertical class="planner-toolbar-separator" />

                  <div class="planner-toolbar-actions">
                  <q-btn
                    v-if="showClassicThemeSettings"
                    flat
                    dense
                    color="primary"
                    icon="wallpaper"
                    no-caps
                    @click="openBackgroundPreview"
                  >
                    <q-tooltip>{{ t('看背景图', '看背景图') }}</q-tooltip>
                  </q-btn>

                  <q-btn
                    v-if="hasPlannerContent"
                    flat
                    dense
                    color="primary"
                    icon="campaign"
                    no-caps
                    @click="openAnnouncementDialog"
                  >
                    <q-badge v-if="hasUnreadAnnouncement" floating rounded color="negative" />
                    <q-tooltip>
                      {{ t('公告', '公告') }}
                      <br>
                      当前支持 {{ supportedVersionLabel }}
                      <span v-if="nextVersionLabel">，下个版本 {{ nextVersionLabel }}</span>
                      <span v-if="nextVersionDateLabel">，预计 {{ nextVersionDateLabel }}</span>
                    </q-tooltip>
                  </q-btn>
                  
                  <q-btn
                    unelevated
                    color="primary"
                    icon="history"
                    :label="t('Legacy', 'Legacy')"
                    no-caps
                    @click="renderer = 'legacy'"
                  >
                    <q-tooltip>切换回旧版界面</q-tooltip>
                  </q-btn>
                  </div>
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

            <q-card-section class="content-card-body notice-body q-gutter-y-md">
              <section v-if="announcementItems.length" class="content-section">
                <div class="text-subtitle2 q-mb-sm">公告</div>
                <ul class="content-item-list">
                  <li v-for="(item, index) in announcementItems" :key="`announcement-${index}`" v-html="renderContentLine(item)"></li>
                </ul>
              </section>

              <section class="content-section">
                <div class="text-subtitle2 q-mb-sm">站点说明</div>
                <ul class="content-item-list">
                  <li
                    v-for="(item, index) in officialSiteAnnouncementItems"
                    :key="`official-site-${index}`"
                    v-html="renderContentLine(item)"
                  ></li>
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

            <q-card-actions align="right" class="notice-footer">
              <q-btn flat color="primary" :label="t('关闭', '关闭')" @click="closeAnnouncementDialog()" />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-dialog
          v-model="showBackgroundPreviewDialog"
          maximized
          transition-show="fade"
          transition-hide="fade"
          @hide="showBackgroundPreviewDialog = false"
        >
          <q-card
            class="background-preview-dialog background-preview-dialog--fullscreen"
            :class="{ 'background-preview-dialog--light': backgroundPreviewIsLight }"
          >
            <q-card-section class="background-preview-topbar row items-start justify-between q-col-gutter-md">
              <div class="col">
                <div class="text-h6">{{ t('背景图预览', '背景图预览') }}</div>
                <div class="text-caption q-mt-xs background-preview-caption">{{ backgroundStatusLabel }}</div>
              </div>
              <div class="col-auto row items-center q-gutter-sm">
                <q-btn
                  flat
                  class="background-preview-action-button"
                  :label="t('打开原图', '打开原图')"
                  @click="openBackgroundInNewTab"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  class="background-preview-action-button"
                  @click="showBackgroundPreviewDialog = false"
                />
              </div>
            </q-card-section>

            <q-card-section class="background-preview-body">
              <div class="background-preview-frame">
                <img :src="activeBackgroundPreviewUrl" :alt="backgroundStatusLabel" />
              </div>
            </q-card-section>
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
import {
  clearBackgroundSnapshot,
  getBackgroundSnapshot,
  setBackgroundSnapshot,
  useBackgroundSnapshotStore,
} from '@/core/background-snapshot-store';
import { detectPlannerLocale, getPlannerLangStorageKey, translatePlannerText } from '@/core/i18n';
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
const BACKGROUND_STORAGE_KEY = 'modern-planner-background:v1';
const BACKGROUND_API_STORAGE_KEY = 'modern-planner-background-api:v1';
const BACKGROUND_DISPLAY_STORAGE_KEY = 'modern-planner-background-display:v1';
const DEFAULT_CLASSIC_BACKGROUND_URL = 'https://img.canmoe.com/image?img=ua';

const backgroundImportInput = ref<HTMLInputElement | null>(null);
const backgroundDisplayEnabled = ref(true);
const customBackground = ref('');
const customBackgroundName = ref('');
const customBackgroundApi = ref('');
const customBackgroundError = ref('');
const { snapshotDataUrl: resolvedRemoteBackgroundUrl, snapshotSource: resolvedRemoteBackgroundSource } = useBackgroundSnapshotStore();
let backgroundFadeTimer: number | null = null;
let backgroundResolveToken = 0;

const langOptions = computed<Array<{ label: string; value: PlannerState['lang'] }>>(() => [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
]);

const currentLangLabel = computed(
  () => langOptions.value.find((option) => option.value === state.lang)?.label || state.lang,
);

const themeOptions = computed<Array<{ label: string; value: PlannerState['theme'] }>>(() => [
  { label: t('自动'), value: 'auto' },
  { label: t('浅色', '浅色'), value: 'light' },
  { label: t('深色', '深色'), value: 'dark' },
  { label: t('原版浅色', '原版浅色'), value: 'classic-light' },
  { label: t('原版深色', '原版深色'), value: 'classic-dark' },
]);

const currentThemeLabel = computed(
  () => themeOptions.value.find((option) => option.value === state.theme)?.label || state.theme,
);

const showClassicThemeSettings = computed(() =>
  state.theme === 'classic-light' || state.theme === 'classic-dark',
);

const backgroundPreviewIsLight = computed(() => resolveTheme(state.theme) === 'light');

const backgroundStatusLabel = computed(() => {
  if (customBackgroundName.value) {
    return customBackgroundName.value;
  }
  if (customBackgroundApi.value) {
    return customBackgroundApi.value;
  }
  return t('使用默认背景', '使用默认背景');
});

const backgroundRemoteSource = computed(() => customBackgroundApi.value || DEFAULT_CLASSIC_BACKGROUND_URL);

const activeBackgroundPreviewUrl = computed(() => {
  if (customBackground.value) {
    return customBackground.value;
  }
  if (resolvedRemoteBackgroundSource.value === backgroundRemoteSource.value && resolvedRemoteBackgroundUrl.value) {
    return resolvedRemoteBackgroundUrl.value;
  }
  return backgroundRemoteSource.value;
});

const initialState = parseStateFromUrl();
const hasLangParam = new URL(window.location.href).searchParams.has('lang');
const state = reactive<PlannerState>({
  ...DEFAULT_STATE,
  ...initialState,
  lang: hasLangParam ? initialState.lang : detectPlannerLocale(),
});
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
const showBackgroundPreviewDialog = ref(false);

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

function t(key: string, fallback = key, params?: Record<string, string | number>): string {
  return translatePlannerText(state.lang, key, fallback, params);
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
const officialSiteAnnouncementItems = computed(() => [
  t('当前 JeiWeb 版本为原站官方授权的重构版本。', '当前 JeiWeb 版本为原站官方授权的重构版本。'),
  '[原始版本原站](https://end.canmoe.com/)',
]);
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

async function ensureResolvedBackgroundPreviewUrl(): Promise<string> {
  if (customBackground.value) {
    return customBackground.value;
  }
  const remoteSource = backgroundRemoteSource.value;
  const resolved = await resolveRemoteBackground(remoteSource);
  if (showClassicThemeSettings.value) {
    setAppliedBackgroundImage(resolved || remoteSource);
  }
  return resolved || remoteSource;
}

async function openBackgroundPreview() {
  await ensureResolvedBackgroundPreviewUrl();
  showBackgroundPreviewDialog.value = true;
}

async function openBackgroundInNewTab() {
  const previewWindow = window.open('about:blank', '_blank');
  const target = await ensureResolvedBackgroundPreviewUrl();
  if (previewWindow) {
    previewWindow.opener = null;
    previewWindow.location.replace(target);
    return;
  }
  window.open(target, '_blank', 'noopener,noreferrer');
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

function loadBackgroundState() {
  try {
    const rawDisplay = window.localStorage.getItem(BACKGROUND_DISPLAY_STORAGE_KEY);
    if (rawDisplay === '0' || rawDisplay === '1') {
      backgroundDisplayEnabled.value = rawDisplay === '1';
    }
  } catch {
    // Ignore non-critical storage failures.
  }

  try {
    const rawBackground = window.localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (rawBackground) {
      const parsed = JSON.parse(rawBackground) as { data?: string; name?: string };
      customBackground.value = typeof parsed?.data === 'string' ? parsed.data : '';
      customBackgroundName.value = typeof parsed?.name === 'string' ? parsed.name : '';
    }
  } catch {
    customBackground.value = '';
    customBackgroundName.value = '';
  }

  try {
    const rawApi = window.localStorage.getItem(BACKGROUND_API_STORAGE_KEY);
    if (typeof rawApi === 'string') {
      customBackgroundApi.value = rawApi;
    }
  } catch {
    customBackgroundApi.value = '';
  }
}

function normalizeBackgroundCssValue(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^url\(/i.test(trimmed)) return trimmed;
  return `url("${trimmed.replace(/"/g, '\\"')}")`;
}

function revokeResolvedRemoteBackgroundUrl() {
  clearBackgroundSnapshot();
}

async function resolveImageFinalUrl(source: string): Promise<string> {
  const sourceUrl = new URL(source, window.location.href);
  const existingEntry = [...performance.getEntriesByType('resource')].reverse().find((entry) => {
    try {
      const entryUrl = new URL(entry.name, window.location.href);
      return entryUrl.host === sourceUrl.host && entryUrl.pathname.startsWith('/img/');
    } catch {
      return false;
    }
  });

  if (existingEntry?.name) {
    return existingEntry.name;
  }

  return new Promise((resolve, reject) => {
    const startIndex = performance.getEntriesByType('resource').length;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const entries = performance.getEntriesByType('resource').slice(startIndex);
      const matchedEntry = [...entries].reverse().find((entry) => {
        try {
          const entryUrl = new URL(entry.name, window.location.href);
          return entryUrl.host === sourceUrl.host && entryUrl.pathname.startsWith('/img/');
        } catch {
          return false;
        }
      });
      resolve(matchedEntry?.name || image.currentSrc || image.src || source);
    };
    image.onerror = () => reject(new Error('Failed to load image source'));
    image.src = source;
  });
}

async function resolveRemoteBackground(source: string): Promise<string> {
  const normalizedSource = String(source || '').trim();
  if (!normalizedSource) {
    revokeResolvedRemoteBackgroundUrl();
    return '';
  }
  if (
    getBackgroundSnapshot(normalizedSource)
  ) {
    return getBackgroundSnapshot(normalizedSource);
  }

  const requestToken = ++backgroundResolveToken;

  try {
    const finalUrl = await resolveImageFinalUrl(normalizedSource);
    if (requestToken !== backgroundResolveToken) {
      return activeBackgroundPreviewUrl.value;
    }
    setBackgroundSnapshot(normalizedSource, finalUrl);
    return finalUrl;
  } catch {
    if (requestToken === backgroundResolveToken) {
      revokeResolvedRemoteBackgroundUrl();
    }
    return normalizedSource;
  }
}

function setAppliedBackgroundImage(backgroundUrl: string) {
  const root = document.documentElement;
  const normalized = normalizeBackgroundCssValue(backgroundUrl);
  const current = String(root.style.getPropertyValue('--planner-bg-image') || '').trim();
  if (current !== normalized) {
    root.style.setProperty('--planner-bg-image', normalized);
    if (backgroundDisplayEnabled.value) {
      markBackgroundFadeIn();
    }
  }
}

function clearBackgroundFadeTimer() {
  if (backgroundFadeTimer !== null) {
    window.clearTimeout(backgroundFadeTimer);
    backgroundFadeTimer = null;
  }
  document.documentElement.classList.remove('planner-bg-image-fading-in');
}

function markBackgroundFadeIn() {
  const root = document.documentElement;
  root.classList.add('planner-bg-image-fading-in');
  if (backgroundFadeTimer !== null) {
    window.clearTimeout(backgroundFadeTimer);
  }
  backgroundFadeTimer = window.setTimeout(() => {
    backgroundFadeTimer = null;
    root.classList.remove('planner-bg-image-fading-in');
  }, 720);
}

async function applyClassicBackground(theme: PlannerState['theme']) {
  const root = document.documentElement;
  if (theme !== 'classic-light' && theme !== 'classic-dark') {
    backgroundResolveToken++;
    clearBackgroundFadeTimer();
    root.removeAttribute('data-bg-display');
    root.style.removeProperty('--planner-bg-image');
    return;
  }

  root.setAttribute('data-bg-display', backgroundDisplayEnabled.value ? 'on' : 'off');
  if (customBackground.value) {
    backgroundResolveToken++;
    revokeResolvedRemoteBackgroundUrl();
    setAppliedBackgroundImage(customBackground.value);
    return;
  }

  const remoteSource = backgroundRemoteSource.value;
  const resolvedBackground = await resolveRemoteBackground(remoteSource);
  if (theme !== state.theme || remoteSource !== backgroundRemoteSource.value) {
    return;
  }
  setAppliedBackgroundImage(resolvedBackground || remoteSource);
}

function triggerBackgroundImport() {
  backgroundImportInput.value?.click();
}

function handleBackgroundFile(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      return;
    }
    customBackground.value = reader.result;
    customBackgroundName.value = file.name;
    customBackgroundError.value = '';
    if (input) {
      input.value = '';
    }
  };
  reader.onerror = () => {
    customBackgroundError.value = t('背景图片读取失败', '背景图片读取失败');
    if (input) {
      input.value = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearCustomBackground() {
  customBackground.value = '';
  customBackgroundName.value = '';
  customBackgroundApi.value = '';
  customBackgroundError.value = '';
}

loadPersistedState();
loadBackgroundState();
applyMarksFromUrl();

function resolveTheme(theme: PlannerState['theme']): 'light' | 'dark' {
  if (theme === 'classic-light') {
    return 'light';
  }
  if (theme === 'classic-dark') {
    return 'dark';
  }
  if (theme !== 'auto') {
    return theme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function isClassicTheme(theme: PlannerState['theme']): boolean {
  return theme === 'classic-light' || theme === 'classic-dark';
}

function applyTheme(theme: PlannerState['theme']) {
  const resolved = resolveTheme(theme);
  $q.dark.set(resolved === 'dark');
  document.documentElement.setAttribute('data-theme', resolved);
  if (isClassicTheme(theme)) {
    document.documentElement.setAttribute('data-theme-style', 'classic');
  } else {
    document.documentElement.removeAttribute('data-theme-style');
  }
  document.documentElement.style.colorScheme = resolved;
  applyClassicBackground(theme);
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

watch(backgroundDisplayEnabled, (value) => {
  try {
    window.localStorage.setItem(BACKGROUND_DISPLAY_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Ignore non-critical storage failures.
  }
  applyClassicBackground(state.theme);
});

watch(
  () => customBackground.value,
  (value) => {
    try {
      if (!value) {
        window.localStorage.removeItem(BACKGROUND_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          BACKGROUND_STORAGE_KEY,
          JSON.stringify({ data: value, name: customBackgroundName.value || '' }),
        );
      }
      customBackgroundError.value = '';
    } catch {
      customBackgroundError.value = t('背景图片过大，无法保存到浏览器。', '背景图片过大，无法保存到浏览器。');
    }
    applyClassicBackground(state.theme);
  },
);

watch(
  () => customBackgroundApi.value,
  (value) => {
    try {
      if (!value) {
        window.localStorage.removeItem(BACKGROUND_API_STORAGE_KEY);
      } else {
        window.localStorage.setItem(BACKGROUND_API_STORAGE_KEY, value);
      }
    } catch {
      // Ignore non-critical storage failures.
    }
    applyClassicBackground(state.theme);
  },
);

watch(
  () => customBackgroundName.value,
  () => {
    if (!customBackground.value) {
      return;
    }
    try {
      window.localStorage.setItem(
        BACKGROUND_STORAGE_KEY,
        JSON.stringify({ data: customBackground.value, name: customBackgroundName.value || '' }),
      );
    } catch {
      customBackgroundError.value = t('背景图片过大，无法保存到浏览器。', '背景图片过大，无法保存到浏览器。');
    }
  },
);

watch(
  () => state.lang,
  (value) => {
    try {
      window.localStorage.setItem(getPlannerLangStorageKey(), value);
    } catch {
      // Ignore storage failures for non-critical UI state.
    }
  },
  { immediate: true },
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
  backgroundResolveToken++;
  mediaQuery.removeEventListener('change', onSystemThemeChange);
  clearBackgroundFadeTimer();
  revokeResolvedRemoteBackgroundUrl();
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
  min-height: 100dvh;
}

.planner-page.is-embed .planner-container {
  max-width: 100%;
  padding: 0;
  gap: 0;
  min-height: 100dvh;
}

.planner-topbar-section {
  padding: 8px 12px !important;
}

.planner-topbar-section > .row {
  row-gap: 8px;
}

.planner-topbar-row {
  align-items: center;
}

.planner-toolbar-nav {
  min-width: 0;
}

.planner-toolbar-column {
  min-width: 0;
}

.planner-toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px 8px;
}

.planner-toolbar-selects,
.planner-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.planner-toolbar-select {
  min-width: 104px;
}

.planner-lang-select {
  min-width: 116px;
}

.planner-toolbar-separator {
  height: 34px;
}

.content-card-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.notice-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.notice-body {
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.notice-footer {
  margin-top: 0;
  padding-top: 10px;
  padding-bottom: 4px;
  border-top: 1px dashed var(--planner-notice-border);
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

.background-preview-dialog {
  width: min(960px, 96vw);
  max-height: min(86vh, 900px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.background-preview-dialog--fullscreen {
  width: 100vw;
  max-height: 100vh;
  min-height: 100vh;
  background: rgba(8, 12, 18, 0.94) !important;
  color: rgba(255, 255, 255, 0.92) !important;
  grid-template-rows: auto minmax(0, 1fr);
}

.background-preview-dialog--fullscreen .q-card__section {
  background: transparent !important;
  color: inherit !important;
}

.background-preview-topbar {
  position: relative;
  z-index: 1;
  padding-bottom: 0;
  background: linear-gradient(180deg, rgba(8, 12, 18, 0.74), rgba(8, 12, 18, 0));
}

.background-preview-action-button {
  color: rgba(255, 255, 255, 0.92) !important;
}

.background-preview-caption {
  color: rgba(255, 255, 255, 0.72);
}

.background-preview-dialog--light {
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(235, 242, 250, 0.98)) !important;
  color: var(--planner-text-primary) !important;
}

.background-preview-dialog--light .background-preview-topbar {
  background: linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(247, 250, 255, 0));
}

.background-preview-dialog--light .background-preview-caption {
  color: var(--planner-text-secondary);
}

.background-preview-dialog--light .background-preview-action-button {
  color: var(--planner-text-primary) !important;
  border-color: rgba(22, 44, 72, 0.12);
  background: rgba(255, 255, 255, 0.68);
}

.background-preview-body {
  min-height: 0;
  overflow: auto;
  padding-top: 8px;
}

.background-preview-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 112px);
}

.background-preview-frame img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 132px);
  object-fit: contain;
  border-radius: 12px;
}

.background-preview-dialog--light .background-preview-frame img {
  box-shadow: 0 18px 40px rgba(22, 44, 72, 0.12);
}

@media (min-width: 921px) {
  .planner-topbar-row {
    flex-wrap: nowrap;
  }

  .planner-toolbar-controls {
    justify-content: flex-end;
  }
}

@media (max-width: 650px) {
  .planner-toolbar-separator {
    display: none;
  }

  .planner-toolbar-nav,
  .planner-toolbar-column {
    flex: 0 0 100%;
    max-width: 100%;
    width: 100%;
  }

  .planner-toolbar-controls {
    justify-content: flex-start;
  }

  .planner-toolbar-actions {
    justify-content: flex-start;
  }
}
</style>
