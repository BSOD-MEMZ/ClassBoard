<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <m3e-app-bar
        v-if="!screenOff"
        size="small"
        centered
        for="pageBody"
        class="app-top-bar"
        @click="openNotif"
      >
        <m3e-icon-button
          slot="leading"
          class="nav-back-btn"
          :class="{ 'nav-back-btn--hidden': !showBack }"
          @click.stop="handleBack"
        >
          <Icon name="material-symbols:arrow-back" class="icon-glyph" />
        </m3e-icon-button>
        <span slot="title" class="bar-title">{{ barTitle }}</span>

        <!-- 非首页时在标题栏右侧显示时间和课程信息；首页预留空间避免布局抖动 -->
        <div
          slot="trailing"
          class="bar-trailing"
          :class="{ 'bar-trailing--hidden': !isNotHome }"
          @click.stop
        >
          <span class="bar-time-chip">
            <Icon name="material-symbols:schedule" class="bar-schedule-icon" />
            <span class="bar-schedule-label">{{ barClock }}</span>
          </span>
          <span
            class="bar-schedule-chip"
            :class="[scheduleInfo.chipClass, { 'bar-schedule-chip--hidden': !scheduleInfo.text }]"
          >
            <Icon
              :name="scheduleInfo.icon"
              class="bar-schedule-icon"
            />
            <span class="bar-schedule-label">{{ scheduleInfo.text }}</span>
          </span>
        </div>
      </m3e-app-bar>

      <main id="pageBody" class="page-body">
        <slot />
      </main>

      <footer class="bottom-nav" :class="{ 'bottom-nav--pill': navStyle === 'pill' }">
        <m3e-nav-bar>
          <m3e-nav-item
            :selected="route.path === '/'"
            @click="router.push('/')"
          >
            主页
            <Icon slot="icon" name="material-symbols:home-outline" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:home"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/apps'"
            @click="router.push('/apps')"
          >
            应用
            <Icon slot="icon" name="material-symbols:apps" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:apps"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/settings'"
            @click="router.push('/settings')"
          >
            设置
            <Icon
              slot="icon"
              name="material-symbols:settings-outline"
              class="nav-icon"
            />
            <Icon
              slot="selected-icon"
              name="material-symbols:settings"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/about'"
            @click="router.push('/about')"
          >
            关于
            <Icon slot="icon" name="material-symbols:info-outline" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:info"
              class="nav-icon"
            />
          </m3e-nav-item>
        </m3e-nav-bar>
      </footer>

      <NotificationCenter />

      <!-- Screen filter overlays (pointer-events: none — don't block interaction) -->
      <div
        v-if="brightness < 1"
        class="screen-dim-overlay"
        :style="{ opacity: 1 - brightness }"
      ></div>
      <div
        v-if="eyeCare"
        class="screen-eyecare-overlay"
      ></div>

      <Transition name="screen-off-fade">
        <div
          v-if="screenOff"
          class="screen-off-overlay"
          @click="wakeScreen"
        ></div>
      </Transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useDisplay } from "@/composables/useDisplay";
import { useApps } from "@/composables/useApps";
import { loadConfig, saveConfig } from "@/composables/useConfig";
import { useNotificationCenter } from "@/composables/useNotificationCenter";
import { useScreenFilter } from "@/composables/useScreenFilter";
import { useAudioMute } from "@/composables/useAudioMute";
import { useAuth } from "@/composables/useAuth";
import NotificationCenter from "@/components/Shared/NotificationCenter.vue";

const route = useRoute();
const router = useRouter();

const cfg = ref(loadConfig());
const navStyle = computed(() => cfg.value.navStyle || "fixed");

// Apply nav style attribute to HTML for CSS targeting
watch(navStyle, (style) => {
  if (import.meta.client) {
    document.documentElement.setAttribute("data-nav-style", style);
  }
}, { immediate: true });

// ── Composables (must be called before any usage) ──
const { screenOff, wakeScreen, powerOffScreen, toggleFullscreen, isFullscreen, applyTheme } = useDisplay();
const { appsView, closeAppTool, activeApp } = useApps();
const { panelOpen, dragProgress, open: openNotif, close: closeNotif, setTiles, setDragProgress, finishDrag } = useNotificationCenter();
const { brightness, eyeCare } = useScreenFilter();
const { toggleEyeCare } = useScreenFilter();
const { audioMuted, toggleMute } = useAudioMute();
const { isAdminOrTeacher } = useAuth();

// ── Notification Center: quick tiles (reactive to fullscreen state) ──
function buildTiles() {
  const cfg = loadConfig();
  const tiles: any[] = [];

  // Fullscreen tile only when admin/teacher is logged in (or kiosk mode disabled)
  if (isAdminOrTeacher.value || !cfg.kioskMode) {
    tiles.push({
      key: "fullscreen",
      label: isFullscreen.value ? "退出全屏" : "全屏",
      icon: isFullscreen.value ? "material-symbols:fullscreen-exit" : "material-symbols:fullscreen",
      active: isFullscreen.value,
      action: () => toggleFullscreen(),
    });
  }

  tiles.push(
    {
      key: "theme",
      label: cfg.themeMode === "dark" ? "深色模式" : "浅色模式",
      icon: cfg.themeMode === "dark" ? "material-symbols:dark-mode" : "material-symbols:light-mode",
      active: cfg.themeMode !== "auto",
      action: () => {
        const c = loadConfig();
        const next = c.themeMode === "dark" ? "light" : "dark";
        applyTheme(next, c.themeColor);
      },
    },
    {
      key: "screenoff",
      label: "熄屏",
      icon: "material-symbols:power-settings-new",
      action: () => powerOffScreen(),
    },
    {
      key: "sandbox",
      label: cfg.webViewSandbox ? "正在保护" : "启用ClassDefender",
      icon: "material-symbols:shield-lock",
      active: cfg.webViewSandbox,
      action: () => {
        const c = loadConfig();
        c.webViewSandbox = !c.webViewSandbox;
        saveConfig(c);
        location.reload();
      },
    },
    {
      key: "eyecare",
      label: "护眼模式",
      icon: "material-symbols:visibility",
      active: eyeCare.value,
      action: () => toggleEyeCare(),
    },
    {
      key: "mute",
      label: audioMuted.value ? "已静音" : "静音",
      icon: audioMuted.value ? "material-symbols:volume-off" : "material-symbols:volume-up",
      active: audioMuted.value,
      action: () => toggleMute(),
    },
    {
      key: "refresh",
      label: "刷新",
      icon: "material-symbols:refresh",
      action: () => location.reload(),
    },
  );
  setTiles(tiles);
}
buildTiles();
// Rebuild tiles whenever fullscreen state or auth state changes
watch(isFullscreen, () => buildTiles());
watch(isAdminOrTeacher, () => buildTiles());

// ── Gesture: swipe/pull down from top to open notification center ──
if (import.meta.client) {
  let startY = 0;
  let startTime = 0;
  let active = false;

  function onPointerDown(e: PointerEvent) {
    if (panelOpen.value) return;
    // Wider touch zone: top 80px (easier on touch screens)
    if (e.clientY < 80) {
      startY = e.clientY;
      startTime = Date.now();
      active = true;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!active || panelOpen.value) return;
    const dy = e.clientY - startY;
    if (dy > 10) {
      e.preventDefault();
      // Lighter resistance for easier pulling
      const progress = Math.min(dy / 180, 1);
      setDragProgress(progress);
    }
  }

  function onPointerUp(_e: PointerEvent) {
    if (!active) return;
    active = false;
    const elapsed = Date.now() - startTime;
    const dy = dragProgress.value * 180;
    // Fast swipe (quick flick) or dragged far enough → open
    const isFastSwipe = elapsed < 300 && dy > 30;
    finishDrag(isFastSwipe || dragProgress.value > 0.25);
  }

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
}

// ---- Schedule info for app bar trailing slot ----
// Uses shared schedule store — no separate clock or parsing
import { todayLessons, scheduleClock } from "@/composables/useScheduleStore";

const isNotHome = computed(() => route.path !== "/");

/** 标题栏紧凑时钟 */
const barClock = computed(() => {
  const d = scheduleClock.value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
});

/** 紧凑格式化剩余时间（用于标题栏） */
function compactRemain(ms: number): string {
  if (ms <= 0) return "0秒";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return s > 0 ? `${m}分${s}秒` : `${m}分钟`;
  return `${s}秒`;
}

interface ScheduleChipInfo {
  text: string;
  icon: string;
  chipClass: string;
}

const scheduleInfo = computed<ScheduleChipInfo>(() => {
  const current = scheduleClock.value;
  const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;

  if (!todayLessons.value.length) {
    return { text: "", icon: "", chipClass: "" };
  }

  const currentLesson = todayLessons.value.find(
    (l) => currentM >= l.startM && currentM < l.endM,
  );
  if (currentLesson) {
    const endDate = new Date(current);
    endDate.setHours(
      Math.floor(currentLesson.endM / 60),
      currentLesson.endM % 60,
      0,
      0,
    );
    const remainMs = endDate.getTime() - current.getTime();
    return {
      text: `${currentLesson.course} 剩${compactRemain(Math.max(0, remainMs))}`,
      icon: "material-symbols:school",
      chipClass: "chip--in-class",
    };
  }

  const nextLesson = todayLessons.value.find((l) => l.startM > currentM);
  if (nextLesson) {
    const startDate = new Date(current);
    startDate.setHours(
      Math.floor(nextLesson.startM / 60),
      nextLesson.startM % 60,
      0,
      0,
    );
    const remainMs = startDate.getTime() - current.getTime();
    const remainMin = remainMs / 60000;

    if (remainMin <= 60) {
      return {
        text: `还有${compactRemain(Math.max(0, remainMs))}上${nextLesson.course}`,
        icon: "material-symbols:notifications-active",
        chipClass: "chip--upcoming",
      };
    }

    return {
      text: `下节 ${nextLesson.course} ${nextLesson.start}`,
      icon: "material-symbols:schedule",
      chipClass: "chip--next",
    };
  }

  return { text: "", icon: "", chipClass: "" };
});

// ---- End schedule info ----

const showBack = computed(() => {
  return (
    (route.path === "/settings" && !!route.query.section) ||
    (route.path === "/apps" && appsView.value === "web")
  );
});

const isWebView = computed(
  () => route.path === "/apps" && appsView.value === "web",
);

const barTitle = computed(() => {
  if (route.path === "/apps" && appsView.value === "web" && activeApp.value)
    return activeApp.value.name;
  return "ClassBoard";
});

function handleBack() {
  if (route.path === "/apps" && appsView.value === "web") {
    closeAppTool();
  } else if (route.path === "/settings") {
    router.push("/settings");
  }
}

useHead({
  title: "ClassBoard",
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  ],
  link: [{ rel: "icon", type: "image/png", href: "assets/xxtsoft.png" }],
});

// Kiosk mode: re-request fullscreen on every route change
watch(() => route.fullPath, () => {
  if (import.meta.server) return;
  const config = loadConfig();
  if (config.kioskMode && !document.fullscreenElement) {
    requestAnimationFrame(() => {
      document.documentElement.requestFullscreen().catch(() => {});
    });
  }
}, { immediate: true });

// ── Chrome < 140 mobile compatibility fixes ──
// Chrome 137 on mobile has bugs with content-visibility + Shadow DOM,
// and mix-blend-mode can cause rendering corruption.
if (import.meta.client) {
  const ua = navigator.userAgent;
  const m = ua.match(/Chrom(?:e|ium)\/(\d+)/);
  const chromeVer = m?.[1] ? parseInt(m[1], 10) : 0;
  const isMobile = /Mobi|Android/.test(ua);
  if (chromeVer > 0 && chromeVer < 140 && isMobile) {
    document.documentElement.setAttribute("data-chrome-legacy", "");
  }
}
</script>

<style scoped>
.app-shell {
  width: min(100%, 800px);
  min-width: 0;
  height: 100vh;
  margin: 0 auto;
  padding: 12px 4px 0;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.app-shell.webview-mode {
  width: 100%;
  max-width: none;
  padding: 0;
  gap: 0;
}

.app-top-bar {
  --m3e-app-bar-container-color: var(--md-sys-color-primary-container);
  --m3e-app-bar-title-text-color: var(--md-sys-color-on-primary-container);
  --m3e-app-bar-container-elevation: var(--md-sys-elevation-level1);
  --m3e-app-bar-container-elevation-on-scroll: var(--md-sys-elevation-level2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 28;
  border-radius: 0;
}

.bar-title {
  cursor: default;
  user-select: none;
}

.nav-back-btn {
  transition:
    opacity 250ms cubic-bezier(0.2, 0, 0, 1),
    transform 250ms cubic-bezier(0.2, 0, 0, 1);
}

.nav-back-btn--hidden {
  opacity: 0;
  transform: translateX(12px);
  pointer-events: none;
}

/* ---- App bar trailing info (time + schedule) ---- */
.bar-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}

/* Hide on home page but keep reserved space to prevent layout shift */
.bar-trailing--hidden {
  visibility: hidden;
}

.bar-time-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  background: var(--md-sys-color-surface-container-high, #ece6f0);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  flex-shrink: 0;
  /* Stable width: HH:MM format is always 5 chars */
  min-width: 54px;
  text-align: center;
}

.bar-schedule-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  max-width: 200px;
  min-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 200ms ease, color 200ms ease;
  flex-shrink: 0;
}

.bar-schedule-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.bar-schedule-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Keep chip space reserved even when empty — prevents layout shift */
.bar-schedule-chip--hidden {
  visibility: hidden;
}

/* 正在上课 — 温暖高亮 */
.chip--in-class {
  background: var(--md-sys-color-tertiary-container, #e8def8);
  color: var(--md-sys-color-on-tertiary-container, #1d192b);
}

/* 即将上课 — 柔和提示 */
.chip--upcoming {
  background: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* 下一节（较远） — 标准色调 */
.chip--next {
  background: var(--md-sys-color-surface-container-high, #ece6f0);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.page-body {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-top: 66px;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Pill navbar needs less bottom padding */
html[data-nav-style="pill"] .page-body {
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
}

.page-body::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  z-index: 30;
  border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  /* Solid fallback for older browsers where color-mix or tokens may not be ready */
  background: var(--md-sys-color-surface, #faf9ff);
  padding: 2px 6px max(2px, env(safe-area-inset-bottom));
}

/* Pill / floating navbar */
.bottom-nav--pill {
  left: 50%;
  right: auto;
  bottom: 20px;
  width: auto;
  min-width: 260px;
  max-width: calc(100vw - 32px);
  transform: translateX(-50%);
  border-radius: 28px;
  border-top: none;
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  background: var(--md-sys-color-surface-container, #f0edf6);
  box-shadow: 0px 2px 8px 1px rgba(0, 0, 0, 0.12),
              0px 1px 3px 0px rgba(0, 0, 0, 0.08);
  padding: 4px 6px calc(4px + env(safe-area-inset-bottom));
}

.bottom-nav--pill m3e-nav-bar {
  border-radius: 28px;
  overflow: hidden;
}

.screen-off-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

/* Screen-off transition */
.screen-off-fade-enter-active {
  animation: screen-off-fade-in 0.3s ease-out forwards;
}
.screen-off-fade-leave-active {
  animation: screen-off-fade-out 0.5s ease-in forwards;
}

@keyframes screen-off-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes screen-off-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* ── Screen filter overlays (brightness dim + eye-care warm) ── */
.screen-dim-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #000;
  pointer-events: none;
  transition: opacity 300ms ease;
}

.screen-eyecare-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(255, 180, 80, 0.18);
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* Chrome < 140 mobile: mix-blend-mode can corrupt rendering.
   Fall back to a plain warm overlay. */
html[data-chrome-legacy] .screen-eyecare-overlay {
  mix-blend-mode: normal;
  background: rgba(255, 160, 60, 0.22);
}
</style>
