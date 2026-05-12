<template>   <m3e-card class="block feed-block" variant="outlined">
    <div slot="header" class="block-title">
      {{ feedData.title || "校园资讯" }}
    </div>
    <div slot="content">
      <div v-if="feedData.updatedAt" class="tip">
        更新：{{ feedData.updatedAt }}
      </div>
      <div class="feed-list">
        <div
          v-for="(item, idx) in feedData.items.slice(0, 4)"
          :key="idx"
          class="feed-item"
        >
          <div class="feed-title">{{ item.title }}</div>
          <div v-if="item.summary" class="feed-summary">{{ item.summary }}</div>
          <div v-if="item.time" class="feed-time">{{ item.time }}</div>
        </div>
        <div v-if="!feedData.items.length" class="tip">暂无资讯</div>
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import type { FeedData } from "@/types";
defineProps<{ feedData: FeedData }>();
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
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.feed-time {
  margin-top: 4px;
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
