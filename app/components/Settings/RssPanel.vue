<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">RSS 订阅</div>
    <div slot="content" class="form-grid">

      <!-- 启用开关 -->
      <div class="row">
        <span class="row-label">
          <Icon name="material-symbols:rss-feed" class="label-icon" />
          启用 RSS
        </span>
        <m3e-switch
          id="rss-enabled"
          :selected="modelValue.rssEnabled"
          @click="$emit('update:modelValue', { ...modelValue, rssEnabled: !modelValue.rssEnabled })"
        />
      </div>

      <!-- 新闻源选择 → RadioModal -->
      <div class="field">
        <label class="tiny-label">
          <Icon name="material-symbols:library-books-outline" class="label-icon" />
          选择新闻源
        </label>
        <button
          class="select-trigger"
          :disabled="!modelValue.rssEnabled"
          @click="rssModalOpen = true"
        >
          <span class="select-trigger-label">{{ selectedLabel }}</span>
          <Icon name="material-symbols:chevron-right" class="select-trigger-arrow" />
        </button>
      </div>

      <!-- 自定义 URL -->
      <div class="field">
        <label class="tiny-label" for="rss-url">
          <Icon name="material-symbols:link-outline" class="label-icon" />
          自定义 RSS 地址
        </label>
        <input
          id="rss-url"
          class="text-input"
          :value="modelValue.rssUrl"
          :disabled="!modelValue.rssEnabled"
          @input="$emit('update:modelValue', { ...modelValue, rssUrl: ($event.target as HTMLInputElement).value })"
          placeholder="https://www.chinanews.com.cn/rss/china.xml"
        />
      </div>

    </div>
  </m3e-card>

  <RadioModal
    :open="rssModalOpen"
    title="选择新闻源"
    :model-value="presetVal"
    :options="presetOptions"
    @update:model-value="onPresetSelect"
    @close="rssModalOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RSS_PRESETS } from "@/composables/useConfig";
import RadioModal from "@/components/Shared/RadioModal.vue";
import type { RadioOption } from "@/components/Shared/RadioModal.vue";

interface RssDraft {
  rssEnabled: boolean;
  rssUrl: string;
}

const props = defineProps<{ modelValue: RssDraft }>();
const emit = defineEmits<{ "update:modelValue": [value: RssDraft] }>();

const rssModalOpen = ref(false);

const presetOptions: RadioOption[] = RSS_PRESETS.map((p) => ({
  value: p.url,
  label: p.label,
  description: p.url || undefined,
}));

const presetVal = computed(() => {
  const found = RSS_PRESETS.find((p) => p.url && p.url === props.modelValue.rssUrl);
  return found?.url || "";
});

const selectedLabel = computed(() => {
  const found = RSS_PRESETS.find((p) => p.url && p.url === props.modelValue.rssUrl);
  return found?.label || "自定义";
});

function onPresetSelect(val: string): void {
  if (!val) return;
  emit("update:modelValue", { ...props.modelValue, rssUrl: val });
}
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 14px;
  margin-top: 6px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row-label {
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field {
  display: grid;
  gap: 4px;
}

.tiny-label {
  font-size: var(--md3-label-medium);
  letter-spacing: 0.02em;
  color: var(--md-sys-color-on-surface-variant);
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md3-body-medium);
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 200ms ease, background-color 200ms ease;
  box-sizing: border-box;
}

.select-trigger:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, var(--md-sys-color-surface-container));
}

.select-trigger:focus-visible {
  border-color: var(--md-sys-color-primary);
}

.select-trigger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.select-trigger-label {
  flex: 1;
  text-align: left;
}

.select-trigger-arrow {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant);
  flex-shrink: 0;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md3-body-medium);
  font-family: inherit;
  outline: none;
  transition: border-color 200ms ease;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: var(--md-sys-color-primary);
}

.text-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
