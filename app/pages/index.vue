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
        :now-playing="nowPlaying"
      />
      <ClassStatusCard
        :class-state="classState"
        :today-lessons="todayLessons"
        :today-lessons-visible="todayLessonsVisible"
        :has-more-today-lessons="hasMoreTodayLessons"
        :today-lessons-expanded="todayLessonsExpanded"
        @toggle-lessons="toggleTodayLessons"
      />
      <VideoCard />
      <FeedCard :feed-data="feedData" />
      <RssCard :rss-data="rssData" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import SchoolCard from "@/components/Dashboard/SchoolCard.vue";
import TimeCard from "@/components/Dashboard/TimeCard.vue";
import ClassStatusCard from "@/components/Dashboard/ClassStatusCard.vue";
import VideoCard from "@/components/Dashboard/VideoCard.vue";
import FeedCard from "@/components/Dashboard/FeedCard.vue";
import RssCard from "@/components/Dashboard/RssCard.vue";
import { loadConfig } from "@/composables/useConfig";
import { useSchedule } from "@/composables/useSchedule";
import { useWeather } from "@/composables/useWeather";
import { useFeed } from "@/composables/useFeed";
import { useRss } from "@/composables/useRss";
import { useDisplay } from "@/composables/useDisplay";
import { nowPlaying } from "@/composables/useNowPlaying";
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

  // Read theme primary color from :root, with fallback
  let primary = getComputedStyle(document.documentElement)
    .getPropertyValue("--md-sys-color-primary")
    .trim();
  if (!primary || primary.length < 4) primary = "#39c5bb";

  const ripple = document.createElement("div");
  const size = Math.max(window.innerWidth, window.innerHeight) * 3;

  // Solid filled circle — much more visible than a radial gradient
  ripple.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    left: ${-size / 2}px;
    bottom: ${-size / 2}px;
    background: ${primary};
    opacity: 0.38;
    transform: scale(0);
  `;
  document.body.appendChild(ripple);

  ripple
    .animate(
      [
        { transform: "scale(0)", opacity: 0.45 },
        { transform: "scale(0.3)", opacity: 0.28, offset: 0.3 },
        { transform: "scale(1)", opacity: 0 },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
        fill: "forwards",
      },
    )
    .onfinish = () => ripple.remove();
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
  animation: rise-in 280ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
</style>
