<template>
  <m3e-card v-if="showWhenEmpty || data.items.length" class="block feed-block" variant="elevated">
    <div slot="header" class="block-title">
      {{ data.title || fallbackTitle }}
    </div>
    <div slot="content">
      <div v-if="data.updatedAt" class="tip">
        更新：{{ data.updatedAt }}
      </div>
      <div class="feed-list">
        <div
          v-for="(item, idx) in data.items.slice(0, maxItems)"
          :key="idx"
          class="feed-item"
        >
          <div class="feed-title">{{ item.title }}</div>
          <div v-if="item.summary" class="feed-summary">{{ item.summary }}</div>
          <div v-if="item.time" class="feed-time">{{ item.time }}</div>
        </div>
        <div v-if="!data.items.length" class="tip">暂无资讯</div>
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import type { FeedData } from "@/types";

withDefaults(defineProps<{
  data: FeedData;
  fallbackTitle?: string;
  maxItems?: number;
  showWhenEmpty?: boolean;
}>(), {
  fallbackTitle: "资讯",
  maxItems: 4,
  showWhenEmpty: true,
});
</script>

<style scoped>
.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}

.feed-list {
  margin-top: 8px;
  display: grid;
  gap: 8px;
}

.feed-item {
  border-radius: 12px;
  border: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline-variant) 36%, transparent 64%);
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container-high) 68%,
    transparent 32%
  );
  padding: 12px 14px;
  line-height: 1.7;
}

.feed-title {
  font-size: var(--md3-body-large);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.feed-summary {
  margin-top: 4px;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}

.feed-time {
  margin-top: 4px;
  line-height: 1.4;
  color: var(--md-sys-color-outline);
  font-size: var(--md3-label-medium);
}
</style>
