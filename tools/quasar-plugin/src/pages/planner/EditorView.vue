<template>
  <div class="planner-layout single-column">
    <q-card flat bordered class="panel-card">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-subtitle1">角色编辑器</div>
        <div class="row q-gutter-sm items-center">
          <q-chip color="primary" text-color="white">{{ characters.length }} 名角色</q-chip>
          <q-chip color="grey-7" text-color="white" icon="info" size="sm">
            完整编辑请使用 Legacy 旧版界面
          </q-chip>
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="搜索角色..."
          class="search-input"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-separator />

      <div class="editor-layout q-pa-md">
        <!-- Left: Character List -->
        <div class="editor-list-col">
          <div v-if="filteredCharacters.length === 0" class="text-center text-grey-6 q-py-lg">
            <q-icon name="person_off" size="48px" class="q-mb-sm" />
            <div>暂无角色数据</div>
            <div class="text-caption q-mt-sm">请先运行数据同步脚本，或在旧版界面添加角色</div>
          </div>
          <q-list v-else separator>
            <q-item
              v-for="char in filteredCharacters"
              :key="char.id"
              clickable
              :active="selectedCharId === char.id"
              active-color="primary"
              @click="selectedCharId = char.id"
            >
              <q-item-section avatar>
                <q-avatar size="40px" rounded>
                  <img :src="characterAvatarUrl(char.name)" @error="onAvatarError" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ char.name }}</q-item-label>
                <q-item-label caption>
                  {{ char.element || '-' }} · {{ char.weaponType || '-' }} · {{ char.rarity }}★
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="elementColor(char.element)" :label="char.element || '?'" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Right: Character Detail -->
        <div class="editor-detail-col">
          <div v-if="!selectedChar" class="text-center text-grey-6 q-py-xl">
            <q-icon name="person" size="64px" class="q-mb-md text-grey-7" />
            <div class="text-subtitle1">从左侧选择角色查看详情</div>
          </div>

          <div v-else>
            <!-- Header -->
            <div class="char-detail-header q-mb-md">
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <q-avatar size="80px" rounded class="char-avatar-large">
                    <img :src="characterAvatarUrl(selectedChar.name)" @error="onAvatarError" />
                  </q-avatar>
                </div>
                <div class="col">
                  <div class="text-h5">{{ selectedChar.name }}</div>
                  <div class="row q-gutter-sm q-mt-xs">
                    <q-badge :color="elementColor(selectedChar.element)" :label="selectedChar.element || '未知'" />
                    <q-badge color="grey-7" :label="`${selectedChar.rarity}★`" />
                    <q-badge color="secondary" :label="selectedChar.weaponType || '未知武器'" />
                    <q-badge color="teal" :label="selectedChar.profession || '未知职业'" />
                  </div>
                  <div class="text-caption text-grey-5 q-mt-xs">
                    主属性: {{ selectedChar.mainAbility || '-' }} · 副属性: {{ selectedChar.subAbility || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <q-tabs
              v-model="activeTab"
              dense
              align="left"
              active-color="primary"
              indicator-color="primary"
              class="q-mb-md"
            >
              <q-tab name="stats" label="属性" />
              <q-tab name="skills" label="技能" v-if="selectedChar.skills?.length" />
              <q-tab name="talents" label="天赋" v-if="selectedChar.talents?.length" />
            </q-tabs>

            <!-- Stats Tab -->
            <div v-if="activeTab === 'stats'">
              <q-card flat bordered v-if="selectedChar.stats" class="panel-card-inner q-pa-md">
                <div class="stats-grid">
                  <div class="stat-row">
                    <span class="stat-label">力量</span>
                    <span class="stat-value">{{ selectedChar.stats.strength || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">敏捷</span>
                    <span class="stat-value">{{ selectedChar.stats.agility || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">智力</span>
                    <span class="stat-value">{{ selectedChar.stats.intellect || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">意志</span>
                    <span class="stat-value">{{ selectedChar.stats.will || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">攻击</span>
                    <span class="stat-value text-primary">{{ selectedChar.stats.attack || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">生命值</span>
                    <span class="stat-value text-positive">{{ selectedChar.stats.hp || '-' }}</span>
                  </div>
                </div>
              </q-card>
              <div v-else class="text-grey-6 text-center q-py-md">暂无属性数据</div>
            </div>

            <!-- Skills Tab -->
            <div v-if="activeTab === 'skills'">
              <q-expansion-item
                v-for="skill in selectedChar.skills"
                :key="skill.name"
                :label="skill.name"
                :caption="skill.type"
                header-class="skill-header"
                expand-icon-class="text-primary"
                class="editor-expansion q-mb-sm"
              >
                <q-card flat class="panel-card-inner">
                  <q-card-section>
                    <div class="text-body2" style="white-space: pre-line">{{ skill.description }}</div>
                    <div v-if="skill.dataTables?.length" class="q-mt-md">
                      <div v-for="table in skill.dataTables" :key="table.title" class="q-mb-sm">
                        <div class="text-caption text-grey-5 q-mb-xs">{{ table.title }}</div>
                        <q-table
                          dense
                          flat
                          bordered
                          :rows="table.rows"
                          :columns="skillTableColumns"
                          row-key="name"
                          hide-pagination
                          :rows-per-page-options="[0]"
                          class="skill-table"
                        >
                          <template #body-cell-values="cellProps">
                            <q-td :props="cellProps">
                              <div class="row q-gutter-xs">
                                <q-badge
                                  v-for="(val, idx) in cellProps.row.values"
                                  :key="idx"
                                  color="grey-8"
                                  :label="val"
                                  size="sm"
                                />
                              </div>
                            </q-td>
                          </template>
                        </q-table>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </div>

            <!-- Talents Tab -->
            <div v-if="activeTab === 'talents'">
              <q-expansion-item
                v-for="talent in selectedChar.talents"
                :key="talent.name"
                :label="talent.name"
                :caption="talent.type"
                header-class="skill-header"
                expand-icon-class="text-secondary"
                class="editor-expansion q-mb-sm"
              >
                <q-card flat class="panel-card-inner">
                  <q-card-section>
                    <div class="text-body2" style="white-space: pre-line">{{ talent.description }}</div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getCharacters, toLegacyAssetUrl } from '@/core/data';
import type { Character, PlannerState } from '@/core/types';

defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, unknown>;
}>();

const characters = getCharacters();
const searchQuery = ref('');
const selectedCharId = ref<string | null>(characters[0]?.id ?? null);
const activeTab = ref('stats');

const filteredCharacters = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase();
  if (!kw) return characters;
  return characters.filter(
    (c) =>
      c.name.toLowerCase().includes(kw) ||
      (c.element || '').toLowerCase().includes(kw) ||
      (c.profession || '').toLowerCase().includes(kw),
  );
});

const selectedChar = computed<Character | null>(
  () => characters.find((c) => c.id === selectedCharId.value) ?? null,
);

const skillTableColumns = [
  { name: 'name', label: '数值名称', field: 'name', align: 'left' as const },
  { name: 'values', label: '等级数值', field: 'values', align: 'left' as const },
];

const ELEMENT_COLORS: Record<string, string> = {
  寒冷: 'light-blue',
  灼热: 'deep-orange',
  电磁: 'purple',
  自然: 'green',
  源石技艺: 'teal',
  法术: 'indigo',
};

function elementColor(element?: string): string {
  return element ? ELEMENT_COLORS[element] || 'grey-7' : 'grey-7';
}

function characterAvatarUrl(name: string): string {
  return toLegacyAssetUrl(`legacy/image/characters/${encodeURIComponent(name)}.avif`);
}

function onAvatarError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped lang="scss">
.editor-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  min-height: 500px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.editor-list-col {
  border: 1px solid var(--planner-item-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--planner-surface-soft);
  max-height: 70vh;
  overflow-y: auto;
}

.editor-detail-col {
  background: transparent;
}

.char-detail-header {
  background: var(--planner-surface-soft);
  border: 1px solid var(--planner-item-border);
  border-radius: 12px;
  padding: 16px;
}

.char-avatar-large {
  border: 2px solid var(--planner-item-border);
  background: var(--planner-thumb-bg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  background: var(--planner-surface-soft);
  border: 1px solid var(--planner-item-border);
  border-radius: 6px;
  padding: 8px 12px;

  .stat-label {
    font-size: 11px;
    color: var(--planner-text-secondary);
    margin-bottom: 2px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--planner-text-primary);
  }
}

.editor-expansion {
  border: 1px solid var(--planner-item-border);
  border-radius: 8px;
  overflow: hidden;

  :deep(.q-expansion-item__container .q-item) {
    background: var(--planner-surface-soft);
    color: var(--planner-text-primary);
  }
}

.panel-card-inner {
  background: var(--planner-item-bg) !important;
  border-color: var(--planner-item-border) !important;
}

.skill-table {
  font-size: 12px;
  :deep(th) {
    color: var(--planner-text-secondary);
    font-weight: 600;
  }
  :deep(td) {
    color: var(--planner-text-primary);
  }
}
</style>
