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
          @change="$emit('update:modelValue', { ...modelValue, rssEnabled: !modelValue.rssEnabled })"
        />
      </div>

      <!-- 预设源 -->
      <div class="field">
        <label class="tiny-label" for="rss-preset">
          <Icon name="material-symbols:library-books-outline" class="label-icon" />
          选择新闻源
        </label>
        <select
          id="rss-preset"
          class="text-input"
          :value="presetVal"
          :disabled="!modelValue.rssEnabled"
          @change="onPresetChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="p in presets" :key="p.url || '__custom__'" :value="p.url">{{ p.label }}</option>
        </select>
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RSS_PRESETS } from "@/composables/useConfig";

interface RssDraft {
  rssEnabled: boolean;
  rssUrl: string;
}

const props = defineProps<{ modelValue: RssDraft }>();
const emit = defineEmits<{ "update:modelValue": [value: RssDraft] }>();

const presets = RSS_PRESETS;

const presetVal = computed(() => {
  const found = presets.find((p) => p.url && p.url === props.modelValue.rssUrl);
  return found?.url || "";
});

function onPresetChange(val: string): void {
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

select.text-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 36px;
  cursor: pointer;
}
</style>
