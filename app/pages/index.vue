<template>
  <ClientOnly>
    <section class="view view-home">
      <SchoolCard
        :school-name="config.schoolName"
        :classroom-name="config.classroomName"
      />
      <TimeCard
        :time-text="timeText"
        :date-text="dateText"
        :weather-text="weatherText"
        :weather-visible="weatherVisible"
        :weather-loading="weatherLoading"
      />
      <ClassStatusCard
        :class-state="classState"
        :today-lessons="todayLessons"
        :today-lessons-visible="todayLessonsVisible"
        :has-more-today-lessons="hasMoreTodayLessons"
        :today-lessons-expanded="todayLessonsExpanded"
        @toggle-lessons="toggleTodayLessons"
      />
      <FeedCard :feed-data="feedData" />
      <RssCard :rss-data="rssData" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import SchoolCard from "@/components/Dashboard/SchoolCard.vue";
import TimeCard from "@/components/Dashboard/TimeCard.vue";
import ClassStatusCard from "@/components/Dashboard/ClassStatusCard.vue";
import FeedCard from "@/components/Dashboard/FeedCard.vue";
import RssCard from "@/components/Dashboard/RssCard.vue";
import { loadConfig } from "@/composables/useConfig";
import { useSchedule } from "@/composables/useSchedule";
import { useWeather } from "@/composables/useWeather";
import { useFeed } from "@/composables/useFeed";
import { useRss } from "@/composables/useRss";
import { useDisplay } from "@/composables/useDisplay";
import { useWallpaper } from "@/composables/useWallpaper";
import { dayLabels } from "@/utils/schedule";
import type { Lesson } from "@/types/schedule";

const config = ref(loadConfig());
const now = ref(new Date());
const todayLessonsExpanded = ref(false);

const { classState, todayLessons } = useSchedule(config, now);
const {
  weatherText,
  weatherVisible,
  weatherLoading,
  startWeatherTimer,
  stopWeatherTimer,
} = useWeather();
const { feedData, startFeedTimer, stopFeedTimer } = useFeed();
const { rssData, startRssTimer, stopRssTimer } = useRss();
const { applyTheme, setupMediaListener, cleanupMediaListener } = useDisplay();
const { wallpapers, wallpaperUrlForName, wallpaperThemeColor, applyWallpaper } = useWallpaper();

const timeText = computed(() => {
  const d = now.value;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
});

const dateText = computed(() => {
  const d = now.value;
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日 ${dayLabels[d.getDay()]}`;
});

const todayLessonsVisible = computed(() => {
  if (todayLessonsExpanded.value) return todayLessons.value;
  return todayLessons.value.slice(0, 4);
});

const hasMoreTodayLessons = computed(() => todayLessons.value.length > 4);

function toggleTodayLessons() {
  todayLessonsExpanded.value = !todayLessonsExpanded.value;
}

function applyWidgetOpacity(opacity: number): void {
  if (import.meta.server) return;
  document.documentElement.style.setProperty(
    "--widget-opacity",
    String(Math.max(0.15, Math.min(1, opacity))),
  );
}

function applyNavStyle(style: string): void {
  if (import.meta.server) return;
  document.documentElement.setAttribute("data-nav-style", style);
}

// Android-style ripple on class state change
let prevClassStatus = "";
function triggerRipple(): void {
  if (import.meta.server) return;
  const ripple = document.createElement("div");
  ripple.className = "class-ripple";
  const size = Math.max(window.innerWidth, window.innerHeight) * 2;
  ripple.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    margin-left: ${-size / 2}px;
    margin-top: ${-size / 2}px;
    left: 50%;
    top: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent 82%), transparent);
    transform: scale(0);
    animation: class-ripple-in 600ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  `;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

watch(
  () => classState.value.statusText,
  (newVal) => {
    // Detect meaningful class state transitions
    const isInClass = newVal.includes("正在上课");
    const wasInClass = prevClassStatus.includes("正在上课");
    if (prevClassStatus && isInClass !== wasInClass) {
      triggerRipple();
    }
    prevClassStatus = newVal;
  },
);

let clockTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Apply wallpaper first (sets bg), then theme color can come from wallpaper
  if (config.value.wallpaper) {
    const url = wallpaperUrlForName(config.value.wallpaper);
    applyWallpaper(url || "");
    // Auto-pick theme color from wallpaper if available
    const autoColor = wallpaperThemeColor(config.value.wallpaper);
    applyTheme(config.value.themeMode, autoColor || config.value.themeColor);
  } else {
    applyWallpaper("");
    applyTheme(config.value.themeMode, config.value.themeColor);
  }
  // Apply widget opacity (card bg only)
  applyWidgetOpacity(config.value.widgetOpacity ?? 1);
  // Apply nav style
  applyNavStyle(config.value.navStyle ?? "fixed");
  setupMediaListener(
    () => config.value.themeMode,
    () => config.value.themeColor,
  );
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
  startWeatherTimer(
    config.value.weatherLatitude,
    config.value.weatherLongitude,
    config.value.weatherCity,
    config.value.weatherEnabled,
  );
  startFeedTimer();
  if (config.value.rssEnabled) {
    startRssTimer();
  }
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
  stopWeatherTimer();
  stopFeedTimer();
  stopRssTimer();
  cleanupMediaListener();
});
</script>

<style scoped>
.view {
  display: grid;
  gap: 20px;
  animation: rise-in 180ms ease;
}
</style>
