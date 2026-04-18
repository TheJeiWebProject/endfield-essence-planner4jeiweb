import { ref } from 'vue';

const snapshotSource = ref('');
const snapshotDataUrl = ref('');

export function useBackgroundSnapshotStore() {
  return {
    snapshotSource,
    snapshotDataUrl,
  };
}

export function clearBackgroundSnapshot() {
  snapshotSource.value = '';
  snapshotDataUrl.value = '';
}

export function setBackgroundSnapshot(source: string, dataUrl: string) {
  snapshotSource.value = source;
  snapshotDataUrl.value = dataUrl;
}

export function getBackgroundSnapshot(source: string): string {
  return snapshotSource.value === source ? snapshotDataUrl.value : '';
}