<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">外观</div>
    <div slot="content" class="form-grid">
      <m3e-button-group variant="connected">
        <m3e-button
          :variant="modelValue.themeMode === 'light' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'light' })
          "
          >浅色</m3e-button
        >
        <m3e-button
          :variant="modelValue.themeMode === 'dark' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'dark' })
          "
          >深色</m3e-button
        >
        <m3e-button
          :variant="modelValue.themeMode === 'auto' ? 'filled' : 'tonal'"
          @click="
            $emit('update:modelValue', { ...modelValue, themeMode: 'auto' })
          "
          >跟随系统</m3e-button
        >
      </m3e-button-group>
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
        <m3e-form-field>
          <label slot="label" for="theme-hex">主题色 HEX</label>
          <input
            id="theme-hex"
            class="text-input"
            :value="modelValue.themeColor"
            @input="
              $emit('update:modelValue', {
                ...modelValue,
                themeColor: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </m3e-form-field>
      </div>
      <div class="actions">
        <m3e-button
          variant="elevated"
          toggle
          @click="$emit('toggle-fullscreen')"
        >
          <Icon
            slot="icon"
            :name="`material-symbols:${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}`"
          />
          {{ isFullscreen ? "退出全屏" : "全屏显示" }}
        </m3e-button>
      </div>
    </div>
  </m3e-card>
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

.color-row {
  display: grid;
  gap: 8px;
}

.tiny-label {
  font-size: var(--md3-label-medium);
  letter-spacing: 0.02em;
  color: var(--md-sys-color-on-surface-variant);
}

.color-input {
  width: 100%;
  height: 38px;
  border: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline) 35%, transparent 65%);
  border-radius: 10px;
  background: transparent;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  padding: 4px 0;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}
</style>
