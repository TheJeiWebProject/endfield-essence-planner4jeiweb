<template>
  <q-page class="legacy-page">
    <q-banner v-if="!legacyReady" rounded class="legacy-tip bg-warning text-black q-mb-md">
      Legacy 资源不存在，请先执行 pnpm --dir tools/quasar-plugin run copy:legacy
    </q-banner>
    <iframe
      v-else
      class="legacy-frame"
      :src="legacySrc"
      title="Endfield Planner Legacy"
      loading="eager"
      referrerpolicy="no-referrer"
      allow="clipboard-read; clipboard-write"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const legacyReady = ref(false);

const legacySrc = computed(() => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  params.delete('renderer');
  
  // Convert modern array params to legacy comma-separated string if needed
  // Note: Modern already uses 'weapons' with comma-separated string in URL,
  // so we might just need to ensure 'view' is mapped correctly if different.
  // Modern: view=planner, weapons=a,b
  // Legacy: view=planner, weapons=a,b
  // They seem compatible for now.
  
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return `/legacy/index.html${suffix}${url.hash || ''}`;
});

onMounted(async () => {
  try {
    const response = await fetch('/legacy/index.html', { method: 'HEAD' });
    legacyReady.value = response.ok;
  } catch {
    legacyReady.value = false;
  }
});
</script>

<style scoped>
.legacy-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.legacy-frame {
  flex-grow: 1;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
