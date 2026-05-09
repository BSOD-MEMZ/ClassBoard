<template>
  <mdui-card class="block time-block">
    <div class="clock">{{ timeText }}</div>
    <div class="line">
      <span class="material-symbols-outlined">calendar_month</span
      ><span>{{ dateText }}</span>
    </div>
    <div v-if="weatherLoading" class="line">
      <span class="material-symbols-outlined">partly_cloudy_day</span>
      <span class="skeleton-line"></span>
    </div>
    <div v-else-if="weatherVisible" class="line">
      <span class="material-symbols-outlined">partly_cloudy_day</span
      ><span>{{ weatherText }}</span>
    </div>
    <div v-else class="line unavailable">
      <span class="material-symbols-outlined">cloud_off</span
      ><span>不可用</span>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
defineProps<{
  timeText: string;
  dateText: string;
  weatherText: string;
  weatherVisible: boolean;
  weatherLoading: boolean;
}>();
</script>

<style scoped>
.clock {
  font-size: clamp(2.2rem, 8.8vw, 3.4rem);
  line-height: 1.04;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--md3-body-medium);
  color: rgb(var(--mdui-color-on-surface-variant));
  margin-top: 4px;
}

.line.unavailable {
  opacity: 0.5;
}

.skeleton-line {
  display: inline-block;
  height: 14px;
  width: 160px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(var(--mdui-color-on-surface-variant), 0.12) 25%,
    rgba(var(--mdui-color-on-surface-variant), 0.25) 50%,
    rgba(var(--mdui-color-on-surface-variant), 0.12) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
