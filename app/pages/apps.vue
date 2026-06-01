<template>
  <ClientOnly>
    <section class="view view-apps">
      <AppList
        v-if="appsView === 'list'"
        :tools="appTools"
        @open-tool="openAppTool"
      />
      <AppWebView v-else :url="activeApp?.url || 'about:blank'" :sandbox="sandboxEnabled" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import AppList from "@/components/Apps/AppList.vue";
import AppWebView from "@/components/Apps/AppWebView.vue";
import { useApps } from "@/composables/useApps";
import { loadConfig } from "@/composables/useConfig";

const { appsView, activeApp, appTools, openAppTool } = useApps();
const sandboxEnabled = computed(() => {
  const cfg = loadConfig();
  return cfg.webViewSandbox === true;
});
</script>

<style scoped>
.view {
  display: grid;
  gap: 12px;
  animation: rise-in 280ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
</style>
