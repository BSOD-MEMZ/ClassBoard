<template>
  <m3e-card class="block time-block" variant="elevated">
    <div slot="content">
      <div class="clock">{{ timeText }}</div>
      <div class="line">
        <Icon name="material-symbols:calendar-month" /><span>{{
          dateText
        }}</span>
      </div>
      <div v-if="weatherVisible || weatherLoading" class="line">
        <Icon name="material-symbols:partly-cloudy-day" />
        <m3e-skeleton :loaded="!weatherLoading">
          <span>{{ weatherText }}</span>
        </m3e-skeleton>
      </div>
      <div v-else class="line unavailable">
        <Icon name="material-symbols:cloud-off" />
        <span>不可用</span>
      </div>
    </div>
  </m3e-card>
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
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 4px;
}

.line.unavailable {
  opacity: 0.5;
}
</style>
