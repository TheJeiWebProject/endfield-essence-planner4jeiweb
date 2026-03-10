<template>
  <div class="planner-layout single-column">
    <q-card flat bordered class="panel-card">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-subtitle1">角色攻略</div>
        <q-chip color="primary" text-color="white">{{ characterRows.length }} 名角色</q-chip>
      </q-card-section>
      
      <q-card-section>
        <q-input
          v-model="filter"
          dense
          outlined
          placeholder="搜索角色 / 武器..."
          class="search-input"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-separator />
      
      <div class="q-pa-md">
        <div class="strategy-grid">
          <div v-for="row in filteredRows" :key="row.name" class="strategy-card">
            <div class="char-section">
              <div class="char-avatar">
                <img :src="getCharacterImageUrl(row.name)" loading="lazy" />
              </div>
              <div class="char-name">{{ row.name }}</div>
            </div>
            <div class="weapon-section">
              <div class="text-caption text-grey-5 q-mb-xs">推荐武器</div>
              <div class="weapon-chips">
                <div v-for="weapon in row.weapons" :key="weapon" class="weapon-chip-large">
                  <div class="weapon-cover-box">
                    <img v-if="getWeaponImageUrl(weapon)" :src="getWeaponImageUrl(weapon)" class="weapon-cover" />
                    <div v-else class="weapon-fallback">W</div>
                  </div>
                  <div class="weapon-name">{{ weapon }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredRows.length === 0" class="text-center text-grey-6 q-py-lg">
          未找到匹配的角色或武器
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getWeapons, getWeaponImageNames } from '@/core/data';

const allWeapons = getWeapons();
const weaponImageNameSet = new Set(getWeaponImageNames());
const filter = ref('');

const characterRows = computed(() => {
  const map = new Map<string, string[]>();
  allWeapons.forEach((weapon) => {
    (weapon.chars || []).forEach((char) => {
      if (!map.has(char)) {
        map.set(char, []);
      }
      map.get(char)?.push(weapon.name);
    });
  });
  return Array.from(map.entries())
    .map(([name, weapons]) => ({ name, weapons: [...new Set(weapons)] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
});

const filteredRows = computed(() => {
  const kw = filter.value.trim().toLowerCase();
  if (!kw) return characterRows.value;
  return characterRows.value.filter(
    (row) => row.name.toLowerCase().includes(kw) || row.weapons.some((w) => w.toLowerCase().includes(kw)),
  );
});

function getCharacterImageUrl(name: string): string {
  return `/legacy/image/characters/${encodeURIComponent(name)}.png`;
}

function getWeaponImageUrl(name: string): string {
  if (!weaponImageNameSet.has(name)) {
    return '';
  }
  return `/legacy/image/${encodeURIComponent(name)}.png`;
}
</script>

<style scoped lang="scss">
.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.strategy-card {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: background 0.2s;
  min-height: 120px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.char-section {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.char-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.char-name {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

.weapon-section {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.weapon-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.weapon-chip-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px;
  
  .weapon-cover-box {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
    margin-bottom: 6px;
    border: 1px solid rgba(146, 174, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    
    &:hover img {
      transform: scale(1.1);
    }
  }
  
  .weapon-name {
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
    color: #eef2ff;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .weapon-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: rgba(255,255,255,0.5);
  }
}
</style>
