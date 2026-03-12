<template>
  <div class="planner-layout single-column">
    <q-card flat bordered class="panel-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1">复刻排行</div>
        <div class="row q-gutter-sm">
           <q-chip color="positive" text-color="white" icon="event_available">进行中: {{ activeRows.length }}</q-chip>
           <q-chip color="warning" text-color="dark" icon="update">即将开始: {{ upcomingRows.length }}</q-chip>
           <q-chip color="grey-7" text-color="white" icon="history">已结束: {{ inactiveRows.length }}</q-chip>
        </div>
      </q-card-section>
      <q-separator />
      
      <div class="q-pa-md q-gutter-y-md">
        <!-- Active -->
        <div v-if="activeRows.length > 0">
          <div class="text-subtitle2 text-positive q-mb-sm">正在 UP</div>
          <div class="rerun-grid">
            <div v-for="row in activeRows" :key="row.characterName" class="rerun-card active-card">
              <div class="rerun-avatar">
                <img :src="getCharacterImageUrl(row.characterName)" loading="lazy" class="rerun-avatar-img" />
              </div>
              <div class="rerun-info">
                <div class="text-subtitle1">{{ row.characterName }}</div>
                <div class="text-caption text-positive">UP 进行中</div>
                <div class="text-caption text-grey-5">
                   结束于 {{ formatDate(row.currentEndMs) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming -->
        <div v-if="upcomingRows.length > 0">
          <div class="text-subtitle2 text-warning q-mb-sm">即将开始</div>
          <div class="rerun-grid">
             <div v-for="row in upcomingRows" :key="row.characterName" class="rerun-card upcoming-card">
              <div class="rerun-avatar">
                <img :src="getCharacterImageUrl(row.characterName)" loading="lazy" class="rerun-avatar-img" />
              </div>
              <div class="rerun-info">
                <div class="text-subtitle1">{{ row.characterName }}</div>
                <div class="text-caption text-warning">还有 {{ row.nextStartDelta }} 天</div>
                <div class="text-caption text-grey-5">
                   开启于 {{ formatDate(row.nextStartMs) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive (Ranking) -->
        <div>
          <div class="text-subtitle2 text-grey-6 q-mb-sm">等待复刻 (按间隔天数排序)</div>
          <div class="rerun-list">
            <div v-for="row in inactiveRows" :key="row.characterName" class="rerun-item">
               <div class="row items-center q-col-gutter-md">
                  <div class="col-auto">
                    <div class="rerun-avatar-small">
                      <img :src="getCharacterImageUrl(row.characterName)" loading="lazy" class="rerun-avatar-img" />
                    </div>
                  </div>
                  <div class="col-3 col-sm-2">
                    <div class="text-subtitle2">{{ row.characterName }}</div>
                  </div>
                  <div class="col-grow">
                    <div class="rerun-bar-track">
                      <div 
                        class="rerun-bar-fill" 
                        :style="{ width: `${Math.min(100, (row.gapDays / maxGap) * 100)}%` }"
                        :class="getBarColorClass(row.gapDays)"
                      ></div>
                    </div>
                  </div>
                  <div class="col-auto text-right" style="min-width: 80px">
                    <div class="text-subtitle2" :class="getTextColorClass(row.gapDays)">{{ row.gapDays }} 天</div>
                    <div class="text-caption text-grey-6">上次UP: {{ formatDate(row.lastEndMs) }}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getUpSchedules } from '@/core/data';

const upSchedules = getUpSchedules();
const DAY_MS = 24 * 60 * 60 * 1000;

interface RerunRow {
  characterName: string;
  isActive: boolean;
  isUpcoming: boolean;
  currentEndMs?: number;
  nextStartMs?: number;
  nextStartDelta?: number;
  lastEndMs?: number;
  gapDays: number;
  rerunCount: number;
}

const allRows = computed<RerunRow[]>(() => {
  const now = Date.now();
  return Object.entries(upSchedules).map(([characterName, entry]) => {
    // Sort windows by time
    const windows = entry.windows.map(w => ({
      startMs: new Date(w.start).getTime(),
      endMs: new Date(w.end).getTime()
    })).sort((a, b) => a.startMs - b.startMs);

    // Check active
    const activeWindow = windows.find(w => w.startMs <= now && now <= w.endMs);
    if (activeWindow) {
      return {
        characterName,
        isActive: true,
        isUpcoming: false,
        currentEndMs: activeWindow.endMs,
        gapDays: 0,
        rerunCount: windows.length
      };
    }

    // Check upcoming
    const upcomingWindow = windows.find(w => w.startMs > now);
    if (upcomingWindow) {
      // If no history, it's a new character coming
      return {
        characterName,
        isActive: false,
        isUpcoming: true,
        nextStartMs: upcomingWindow.startMs,
        nextStartDelta: Math.ceil((upcomingWindow.startMs - now) / DAY_MS),
        gapDays: 0,
        rerunCount: windows.length
      };
    }

    // History only
    const lastWindow = windows.filter(w => w.endMs < now).pop();
    const lastEndMs = lastWindow ? lastWindow.endMs : 0;
    const gapDays = lastEndMs ? Math.floor((now - lastEndMs) / DAY_MS) : 0;

    return {
      characterName,
      isActive: false,
      isUpcoming: false,
      lastEndMs,
      gapDays,
      rerunCount: windows.length
    };
  });
});

const activeRows = computed(() => {
  return allRows.value.filter(r => r.isActive).sort((a, b) => (a.currentEndMs || 0) - (b.currentEndMs || 0));
});

const upcomingRows = computed(() => {
  return allRows.value.filter(r => r.isUpcoming).sort((a, b) => (a.nextStartMs || 0) - (b.nextStartMs || 0));
});

const inactiveRows = computed(() => {
  return allRows.value.filter(r => !r.isActive && !r.isUpcoming).sort((a, b) => b.gapDays - a.gapDays);
});

const maxGap = computed(() => {
  if (inactiveRows.value.length === 0) return 100;
  return Math.max(...inactiveRows.value.map(r => r.gapDays));
});

function formatDate(ms?: number) {
  if (!ms) return '-';
  return new Date(ms).toLocaleDateString('zh-CN');
}

function getBarColorClass(days: number) {
  if (days > 180) return 'bg-negative';
  if (days > 90) return 'bg-warning';
  return 'bg-secondary';
}

function getTextColorClass(days: number) {
  if (days > 180) return 'text-negative';
  if (days > 90) return 'text-warning';
  return 'text-secondary';
}

function getCharacterImageUrl(name: string): string {
  return `/legacy/image/characters/${encodeURIComponent(name)}.png`;
}
</script>

<style scoped lang="scss">
.rerun-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.rerun-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--planner-surface-soft);
  border: 1px solid var(--planner-item-border);
  
  &.active-card {
    border-color: var(--q-positive);
    background: rgba(33, 186, 69, 0.1);
  }
  
  &.upcoming-card {
    border-color: var(--q-warning);
    background: rgba(242, 192, 55, 0.1);
  }
}

.rerun-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--planner-thumb-bg);
  margin-right: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rerun-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--planner-thumb-bg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rerun-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-weight: bold;
  color: var(--planner-text-primary);
}

.rerun-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rerun-item {
  padding: 8px 16px;
  background: var(--planner-surface-soft);
  border-radius: 4px;
  border: 1px solid var(--planner-item-border);
  transition: background 0.2s;
  
  &:hover {
    background: var(--planner-surface-strong);
  }
}

.rerun-bar-track {
  height: 6px;
  background: var(--planner-surface-strong);
  border-radius: 3px;
  overflow: hidden;
}

.rerun-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
</style>
