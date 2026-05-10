<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">壁纸</div>
    <div slot="content" class="form-grid">
      <div class="wallpaper-grid">
        <div
          class="wallpaper-item wallpaper-item--none"
          :class="{ 'wallpaper-item--active': !modelValue }"
          @click="$emit('update:modelValue', '')"
        >
          <span class="wallpaper-label">无壁纸</span>
        </div>
        <div
          v-for="wp in wallpapers"
          :key="wp.name"
          class="wallpaper-item"
          :class="{ 'wallpaper-item--active': modelValue === wp.name }"
          :style="{ backgroundImage: `url(${wp.url})` }"
          :title="wp.name"
          @click="$emit('update:modelValue', wp.name)"
        />
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import { useWallpaper } from "@/composables/useWallpaper";

const { wallpapers } = useWallpaper();

defineProps<{ modelValue: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 10px;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 2px;
}

.wallpaper-item {
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  border: 3px solid transparent;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: border-color 200ms ease, transform 150ms ease;
  overflow: hidden;
}

.wallpaper-item:hover {
  transform: scale(1.04);
}

.wallpaper-item--active {
  border-color: var(--md-sys-color-primary);
}

.wallpaper-item--none {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container-highest) 72%,
    transparent 28%
  );
  border: 2px dashed
    color-mix(in srgb, var(--md-sys-color-outline-variant) 48%, transparent 52%);
}

.wallpaper-label {
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
