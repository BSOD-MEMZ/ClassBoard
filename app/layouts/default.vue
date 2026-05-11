<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <m3e-app-bar
        v-if="!screenOff"
        size="small"
        centered
        for="pageBody"
        class="app-top-bar"
      >
        <m3e-icon-button
          slot="leading"
          class="nav-back-btn"
          :class="{ 'nav-back-btn--hidden': !showBack }"
          @click="handleBack"
        >
          <Icon name="material-symbols:arrow-back" class="icon-glyph" />
        </m3e-icon-button>
        <span slot="title">{{ barTitle }}</span>

        <!-- 非首页时在标题栏右侧显示课程信息 -->
        <div
          v-if="isNotHome && scheduleInfo.text"
          slot="trailing"
          class="bar-schedule-info"
        >
          <span class="bar-schedule-chip" :class="scheduleInfo.chipClass">
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

      <PowerFab @click="powerOffScreen" />

      <div
        v-if="screenOff"
        class="screen-off-overlay"
        @click="wakeScreen"
      ></div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useDisplay } from "@/composables/useDisplay";
import { useApps } from "@/composables/useApps";
import { loadConfig } from "@/composables/useConfig";
import { useSchedule } from "@/composables/useSchedule";
import PowerFab from "@/components/Dashboard/PowerFab.vue";

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

const { screenOff, wakeScreen, powerOffScreen } = useDisplay();
const { appsView, closeAppTool, activeApp } = useApps();

// ---- Schedule info for app bar trailing slot ----
const now = ref(new Date());
const { todayLessons } = useSchedule(cfg, now);

const isNotHome = computed(() => route.path !== "/");

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
  const current = now.value;
  const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;

  // 没有今日课程
  if (!todayLessons.value.length) {
    return { text: "", icon: "", chipClass: "" };
  }

  // 正在上课 — 从 todayLessons 精确计算剩余时间
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

  // 即将上课 — 下节课在 60 分钟内开始
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

    // 60分钟内有下节课 → 显示倒计时
    if (remainMin <= 60) {
      return {
        text: `还有${compactRemain(Math.max(0, remainMs))}上${nextLesson.course}`,
        icon: "material-symbols:notifications-active",
        chipClass: "chip--upcoming",
      };
    }

    // 较远的下一节
    return {
      text: `下节 ${nextLesson.course} ${nextLesson.start}`,
      icon: "material-symbols:schedule",
      chipClass: "chip--next",
    };
  }

  return { text: "", icon: "", chipClass: "" };
});

let scheduleTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  scheduleTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (scheduleTimer) clearInterval(scheduleTimer);
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
  --m3e-app-bar-container-color: color-mix(
    in srgb,
    var(--md-sys-color-primary-container) 72%,
    var(--md-sys-color-surface) 28%
  );
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

/* ---- App bar schedule info chip ---- */
.bar-schedule-info {
  display: flex;
  align-items: center;
  margin-right: 4px;
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
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 200ms ease, color 200ms ease;
}

.bar-schedule-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.bar-schedule-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 正在上课 — 温暖高亮 */
.chip--in-class {
  background: color-mix(in srgb, var(--md-sys-color-tertiary-container, #e8def8) 72%, transparent);
  color: var(--md-sys-color-on-tertiary-container, #1d192b);
}

/* 即将上课 — 柔和提示 */
.chip--upcoming {
  background: color-mix(in srgb, var(--md-sys-color-secondary-container, #e8def8) 72%, transparent);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

/* 下一节（较远） — 标准色调 */
.chip--next {
  background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 72%, transparent);
  color: var(--md-sys-color-on-surface-variant);
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
  border-top: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline-variant) 32%, transparent 68%);
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface) 60%,
    transparent 40%
  );
  backdrop-filter: blur(8px);
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
  border: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline-variant) 28%, transparent 72%);
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container) 72%,
    transparent 28%
  );
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
  animation: screen-off-fade-in 0.3s ease-out forwards;
}

@keyframes screen-off-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
