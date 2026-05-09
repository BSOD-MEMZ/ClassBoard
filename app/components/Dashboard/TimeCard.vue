<template>
  <mdui-card class="block time-block">
    <div class="clock">{{ timeText }}</div>
    <div class="line"><span class="material-symbols-outlined">calendar_month</span><span>{{ dateText }}</span></div>
    <div v-if="weatherVisible" class="line"><span class="material-symbols-outlined">partly_cloudy_day</span><span>{{ weatherText }}</span></div>
  </mdui-card>
</template>

<script setup lang="ts">
defineProps<{ timeText: string; dateText: string; weatherText: string; weatherVisible: boolean }>()
</script>

<style scoped>
.clock { font-size: clamp(2.2rem, 8.8vw, 3.4rem); line-height: 1.04; font-weight: 500; letter-spacing: 0.02em; margin-bottom: 4px; }
.line { display: flex; align-items: center; gap: 8px; font-size: var(--md3-body-medium); color: rgb(var(--mdui-color-on-surface-variant)); margin-top: 4px; }
</style>
