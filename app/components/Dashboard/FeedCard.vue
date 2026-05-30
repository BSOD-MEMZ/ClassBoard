<template>
  <FeedListCard :data="feedData" fallback-title="校园资讯" />
</template>

<script setup lang="ts">
import type { FeedData } from "@/types";
import FeedListCard from "./FeedListCard.vue";

defineProps<{ feedData: FeedData }>();
</script>

