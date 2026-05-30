<template>
  <m3e-theme ref="themeEl" :color="themeColor" :scheme="themeScheme" motion="expressive">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </m3e-theme>
  <VirtualKeyboard />
</template>

<script setup lang="ts">
import { themeColor, themeScheme, themeEl } from "@/composables/useDisplay";
import { useVirtualKeyboard } from "@/composables/useVirtualKeyboard";
import VirtualKeyboard from "@/components/Shared/VirtualKeyboard.vue";

const { showKeyboard, hideKeyboard } = useVirtualKeyboard();

// Block right-click on non-input elements to prevent exiting fullscreen
if (import.meta.client) {
  document.addEventListener("contextmenu", (e) => {
    const el = e.target as HTMLElement;
    if (el?.closest("input, textarea")) return;
    e.preventDefault();
  });

  // Show virtual keyboard when any input is focused
  document.addEventListener("focusin", (e) => {
    const el = e.target as HTMLElement;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      showKeyboard(el);
    }
  });

  // Also show on click/tap (for already-focused inputs)
  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      showKeyboard(el);
    }
  });

  // Suppress system keyboard: add inputmode="none" to all inputs
  function suppressSystemKeyboard(el: Element) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("inputmode", "none");
    }
    el.querySelectorAll?.("input, textarea").forEach((child) => {
      child.setAttribute("inputmode", "none");
    });
  }

  document.querySelectorAll("input, textarea").forEach(suppressSystemKeyboard);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) suppressSystemKeyboard(node);
      });
    }
  }).observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}
</script>
