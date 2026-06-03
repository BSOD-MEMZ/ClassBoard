import { nextTick } from "vue";
import type { ThemeMode } from "@/types/config";
import { defaultConfig } from "./useConfig";

// Module-level singletons — shared across all useDisplay() calls
const screenOff = ref(false);
const isFullscreen = ref(false);
const fakeDevEnabled = ref(false);
const modelTapCount = ref(0);
let fullscreenLocked = false;
let fullscreenChangeHandler: (() => void) | null = null;
let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

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
  for (const token of ROOT_TOKENS) {
    const value = styles.getPropertyValue(token).trim();
    if (value) root.style.setProperty(token, value);
  }
}

export function useDisplay() {
  function applyTheme(mode?: string, color?: string): void {
    if (import.meta.server) return;
    const themeMode = (mode || "auto") as "light" | "dark" | "auto";
    const seed = color || defaultConfig.themeColor;

    themeColor.value = seed;
    themeScheme.value = themeMode;

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
      // Block exit if fullscreen is locked (kiosk mode without admin)
      if (fullscreenLocked) return;
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

  /** Lock fullscreen — re-enter if user tries to exit (kiosk mode). */
  function lockFullscreen(): void {
    if (import.meta.server) return;
    fullscreenLocked = true;
    // Auto-enter fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true;
      }).catch(() => {});
    }
    // Watch for fullscreen exit and re-enter
    if (!fullscreenChangeHandler) {
      fullscreenChangeHandler = () => {
        if (fullscreenLocked && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          isFullscreen.value = true;
        } else if (!fullscreenLocked && !document.fullscreenElement) {
          isFullscreen.value = false;
        }
      };
      document.addEventListener("fullscreenchange", fullscreenChangeHandler);
    }
    // Block Escape key
    if (!escKeyHandler) {
      escKeyHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape" && fullscreenLocked) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      };
      document.addEventListener("keydown", escKeyHandler, true);
    }
  }

  /** Unlock fullscreen — allow user to exit. */
  function unlockFullscreen(): void {
    if (import.meta.server) return;
    fullscreenLocked = false;
    if (fullscreenChangeHandler) {
      document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
      fullscreenChangeHandler = null;
    }
    if (escKeyHandler) {
      document.removeEventListener("keydown", escKeyHandler, true);
      escKeyHandler = null;
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
    lockFullscreen,
    unlockFullscreen,
    powerOffScreen,
    wakeScreen,
    onDeviceModelTap,
  };
}
