<template>
  <m3e-dialog :open="open" dismissible @closed="$emit('close')">
    <span slot="header">{{ title }}</span>

    <div class="radio-list">
      <label
        v-for="option in options"
        :key="option.value"
        class="radio-item"
        :class="{ 'radio-item--selected': modelValue === option.value }"
      >
        <div class="radio-item-content">
          <span class="radio-item-label">{{ option.label }}</span>
          <span v-if="option.description" class="radio-item-desc">{{ option.description }}</span>
        </div>
        <m3e-radio
          :checked="modelValue === option.value"
          @change="$emit('update:modelValue', option.value); $emit('close')"
        />
      </label>
      <div v-if="!options.length" class="radio-empty">暂无可用选项</div>
    </div>
  </m3e-dialog>
</template>

<script setup lang="ts">
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

defineProps<{
  open: boolean;
  title: string;
  modelValue: string;
  options: RadioOption[];
}>();

defineEmits<{
  "update:modelValue": [value: string];
  close: [];
}>();
</script>

<style scoped>
.radio-list {
  display: grid;
  gap: 2px;
  min-width: 280px;
}

.radio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 200ms ease;
  gap: 12px;
}

.radio-item:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.radio-item--selected {
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.radio-item-content {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.radio-item-label {
  font-size: var(--md3-body-large);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  line-height: 1.4;
}

.radio-item-desc {
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.35;
}

.radio-empty {
  padding: 20px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}
</style>
