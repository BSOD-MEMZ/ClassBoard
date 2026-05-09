<template>
  <mdui-card class="block settings-block">
    <div class="block-title">外观</div>
    <div class="form-grid">
      <div class="mode-group">
        <mdui-button
          :variant="modelValue.themeMode === 'light' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'light' })
          "
          >浅色</mdui-button
        >
        <mdui-button
          :variant="modelValue.themeMode === 'dark' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'dark' })
          "
          >深色</mdui-button
        >
        <mdui-button
          :variant="modelValue.themeMode === 'auto' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'auto' })
          "
          >跟随系统</mdui-button
        >
      </div>
      <div class="color-row">
        <label class="tiny-label" for="theme-color">主题色</label>
        <input
          id="theme-color"
          class="color-input"
          type="color"
          :value="modelValue.themeColor"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              themeColor: $event.target.value,
            })
          "
        />
        <mdui-text-field
          label="主题色 HEX"
          :value="modelValue.themeColor"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              themeColor: $event.target.value,
            })
          "
        ></mdui-text-field>
      </div>
      <div class="actions">
        <mdui-button
          :variant="isFullscreen ? 'filled' : 'outlined'"
          @click="$emit('toggle-fullscreen')"
        >
          <span slot="icon" class="material-symbols-outlined">{{
            isFullscreen ? "fullscreen_exit" : "fullscreen"
          }}</span>
          {{ isFullscreen ? "退出全屏" : "全屏显示" }}
        </mdui-button>
      </div>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
interface AppearanceDraft {
  themeMode: string;
  themeColor: string;
}
defineProps<{ modelValue: AppearanceDraft; isFullscreen: boolean }>();
defineEmits<{
  "update:modelValue": [value: AppearanceDraft];
  "toggle-fullscreen": [];
}>();
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.mode-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.color-row {
  display: grid;
  gap: 8px;
}

.tiny-label {
  font-size: var(--md3-label-medium);
  letter-spacing: 0.02em;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.color-input {
  width: 100%;
  height: 38px;
  border: 1px solid
    color-mix(in srgb, rgb(var(--mdui-color-outline)) 35%, transparent 65%);
  border-radius: 10px;
  background: transparent;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}
</style>
