<template>
  <FeedListCard
    :data="rssData"
    fallback-title="RSS 资讯"
    :show-when-empty="false"
  />
</template>

<script setup lang="ts">
import type { FeedData } from "@/types";
import FeedListCard from "./FeedListCard.vue";

defineProps<{ rssData: FeedData }>();
</script>
