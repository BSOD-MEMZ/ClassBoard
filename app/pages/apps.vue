<template>
  <ClientOnly>
    <section class="view view-apps">
      <AppList
        v-if="appsView === 'list'"
        :tools="appTools"
        @open-tool="openAppTool"
      />
      <AppWebView v-else :url="activeApp?.url || 'about:blank'" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import AppList from "@/components/Apps/AppList.vue";
import AppWebView from "@/components/Apps/AppWebView.vue";
import { useApps } from "@/composables/useApps";

const { appsView, activeApp, appTools, openAppTool } = useApps();
</script>

<style scoped>
.view {
  display: grid;
  gap: 12px;
  animation: rise-in 180ms ease;
}
</style>
