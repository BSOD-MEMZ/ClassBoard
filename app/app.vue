<template>
  <m3e-theme ref="themeEl" :color="themeColor" :scheme="themeScheme" motion="expressive">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </m3e-theme>
</template>

<script setup lang="ts">
import { themeColor, themeScheme, themeEl } from "@/composables/useDisplay";

// Block right-click on non-input elements to prevent exiting fullscreen
if (import.meta.client) {
  document.addEventListener("contextmenu", (e) => {
    const el = e.target as HTMLElement;
    if (el?.closest("input, textarea")) return;
    e.preventDefault();
  });
}
</script>
