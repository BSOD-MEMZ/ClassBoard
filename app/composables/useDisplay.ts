import { nextTick } from "vue";
import type { ThemeMode } from "@/types/config";
import { defaultConfig } from "./useConfig";

// Module-level singletons — shared across all useDisplay() calls
const screenOff = ref(false);
const isFullscreen = ref(false);
const fakeDevEnabled = ref(false);
const modelTapCount = ref(0);

export const themeColor = ref(defaultConfig.themeColor);
export const themeScheme = ref<"light" | "dark" | "auto">("auto");
export const themeEl = ref<HTMLElement | null>(null);

const ROOT_TOKENS = [
  "--md-sys-color-background",
  "--md-sys-color-on-background",
  "--md-sys-color-surface",
  "--md-sys-color-on-surface",
  "--md-sys-color-surface-container",
  "--md-sys-color-surface-container-low",
  "--md-sys-color-surface-container-high",
  "--md-sys-color-surface-container-highest",
  "--md-sys-color-on-surface-variant",
  "--md-sys-color-outline-variant",
  "--md-sys-color-primary-container",
  "--md-sys-color-on-primary-container",
];

function syncTokensToRoot(): void {
  if (import.meta.server || !themeEl.value) return;
  const styles = getComputedStyle(themeEl.value);
  const root = document.documentElement;
  let synced = false;
  for (const token of ROOT_TOKENS) {
    const value = styles.getPropertyValue(token).trim();
    if (value) { root.style.setProperty(token, value); synced = true; }
  }
  // Retry up to 3 times on slower devices where M3E theme init may be delayed
  if (!synced && _retries < 3) {
    _retries++;
    requestAnimationFrame(() => syncTokensToRoot());
  }
}
let _retries = 0;

export function useDisplay() {
  function applyTheme(mode?: string, color?: string): void {
    if (import.meta.server) return;
    const themeMode = (mode || "auto") as "light" | "dark" | "auto";
    const seed = color || defaultConfig.themeColor;

    themeColor.value = seed;
    themeScheme.value = themeMode;

    _retries = 0;
    nextTick(() => requestAnimationFrame(() => syncTokensToRoot()));
  }

  function setupMediaListener(_getMode: () => ThemeMode, _getColor: () => string): void {
    themeEl.value?.addEventListener("change", syncTokensToRoot);
  }

  function cleanupMediaListener(): void {
    themeEl.value?.removeEventListener("change", syncTokensToRoot);
  }

  function toggleFullscreen(): void {
    if (import.meta.server) return;
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isFullscreen.value = true;
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => {
          isFullscreen.value = false;
        })
        .catch(() => {
          isFullscreen.value = false;
        });
    }
  }

  function powerOffScreen(): void {
    screenOff.value = true;
  }
  function wakeScreen(): void {
    screenOff.value = false;
  }

  function onDeviceModelTap(): void {
    if (fakeDevEnabled.value) return;
    modelTapCount.value += 1;
    const remain = 5 - modelTapCount.value;
    if (remain > 0) {
      if (!import.meta.server) alert(`现在只需要再执行 ${remain} 步操作即可进入开发者模式。`);
    } else {
      fakeDevEnabled.value = true;
      if (!import.meta.server) alert("您现在处于开发者模式！");
    }
  }

  return {
    screenOff,
    isFullscreen,
    fakeDevEnabled,
    modelTapCount,
    applyTheme,
    setupMediaListener,
    cleanupMediaListener,
    toggleFullscreen,
    powerOffScreen,
    wakeScreen,
    onDeviceModelTap,
  };
}
