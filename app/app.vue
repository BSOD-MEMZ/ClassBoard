<template>
  <m3e-theme ref="themeEl" :color="themeColor" :scheme="themeScheme" motion="expressive">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </m3e-theme>
</template>

<script setup lang="ts">
import { themeColor, themeScheme, themeEl } from "@/composables/useDisplay";
</script>
