<template>
  <q-card flat bordered class="panel-card">
    <q-card-section>
      <div class="text-subtitle1">武器选择</div>
      <q-select
        :model-value="modelValue"
        :options="weaponOptions"
        multiple
        use-chips
        use-input
        dense
        outlined
        emit-value
        map-options
        option-value="value"
        option-label="label"
        @update:model-value="onUpdate"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Weapon } from '@/core/types';

const props = defineProps<{
  weapons: Weapon[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const weaponOptions = computed(() =>
  props.weapons.map((item) => ({
    label: `${item.name} · ${item.type} · ${item.rarity}★`,
    value: item.name,
  })),
);

function onUpdate(value: string[] | null) {
  emit('update:modelValue', value ?? []);
}
</script>
