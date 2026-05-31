<template>
  <m3e-theme ref="themeEl" :color="themeColor" :scheme="themeScheme" motion="expressive">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </m3e-theme>
  <VirtualKeyboard v-if="keyboardMounted" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { themeColor, themeScheme, themeEl } from "@/composables/useDisplay";
import { useVirtualKeyboard } from "@/composables/useVirtualKeyboard";
import { startScheduleClock, bindScheduleConfig } from "@/composables/useScheduleStore";
import { loadConfig } from "@/composables/useConfig";

const VirtualKeyboard = defineAsyncComponent(() => import("@/components/Shared/VirtualKeyboard.vue"));

const { showKeyboard, hideKeyboard, keyboardVisible } = useVirtualKeyboard();

// Lazy-mount VirtualKeyboard only when first needed (saves ~8KB of template parsing)
const keyboardMounted = ref(false);
watch(keyboardVisible, (v) => {
  if (v) keyboardMounted.value = true;
});

// Bind shared schedule config — always reloads from localStorage to pick up changes
bindScheduleConfig(() => loadConfig());
startScheduleClock();

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
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !el.hasAttribute("data-no-keyboard")) {
      showKeyboard(el);
    }
  });

  // Also show on click/tap (for already-focused inputs)
  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !el.hasAttribute("data-no-keyboard")) {
      showKeyboard(el);
    }
  });

  // Suppress system keyboard: add inputmode="none" to all inputs
  const suppressed = new WeakSet<Element>();
  function suppressSystemKeyboard(el: Element) {
    if (suppressed.has(el)) return;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("inputmode", "none");
      suppressed.add(el);
    }
    el.querySelectorAll?.("input, textarea").forEach((child) => {
      if (suppressed.has(child)) return;
      child.setAttribute("inputmode", "none");
      suppressed.add(child);
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
