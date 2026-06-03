<template>
  <ClientOnly>
    <section class="view view-home">
      <SchoolCard
        v-if="config.dashboardVisible.schoolCard"
        :school-name="config.schoolName"
        :classroom-name="config.classroomName"
      />
      <TimeCard
        v-if="config.dashboardVisible.timeCard"
        :time-text="timeText"
        :date-text="dateText"
        :weather-text="weatherText"
        :weather-visible="weatherVisible"
        :weather-loading="weatherLoading"
        :now-playing="nowPlaying"
      />
      <ClassStatusCard
        v-if="config.dashboardVisible.classStatusCard"
        :class-state="classState"
        :today-lessons="todayLessons"
        :today-lessons-visible="todayLessonsVisible"
        :has-more-today-lessons="hasMoreTodayLessons"
        :today-lessons-expanded="todayLessonsExpanded"
        @toggle-lessons="toggleTodayLessons"
      />
      <LazyDashboardVideoCard v-if="config.dashboardVisible.videoCard" />
      <LazyDashboardFeedCard v-if="config.dashboardVisible.feedCard" :feed-data="feedData" />
      <LazyDashboardRssCard v-if="config.dashboardVisible.rssCard" :rss-data="rssData" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import SchoolCard from "@/components/Dashboard/SchoolCard.vue";
import TimeCard from "@/components/Dashboard/TimeCard.vue";
import ClassStatusCard from "@/components/Dashboard/ClassStatusCard.vue";
import { loadConfig } from "@/composables/useConfig";
import { todayLessons, classState, scheduleClock } from "@/composables/useScheduleStore";
import { useWeather } from "@/composables/useWeather";
import { useFeed } from "@/composables/useFeed";
import { useRss } from "@/composables/useRss";
import { useDisplay } from "@/composables/useDisplay";
import { nowPlaying } from "@/composables/useNowPlaying";
import { useAuth } from "@/composables/useAuth";
import { useWallpaper } from "@/composables/useWallpaper";
import { useRipple } from "@/composables/useRipple";
import { dayLabels } from "@/utils/schedule";

const config = ref(loadConfig());
const todayLessonsExpanded = ref(false);

const {
  weatherText,
  weatherVisible,
  weatherLoading,
  startWeatherTimer,
  stopWeatherTimer,
} = useWeather();
const { feedData, startFeedTimer, stopFeedTimer } = useFeed();
const { rssData, startRssTimer, stopRssTimer } = useRss();
const { applyTheme, setupMediaListener, cleanupMediaListener, lockFullscreen, unlockFullscreen } = useDisplay();
const { isAdminOrTeacher } = useAuth();
const { wallpapers, wallpaperUrlForName, wallpaperThemeColor, applyWallpaper } = useWallpaper();
const { triggerRipple } = useRipple();

// Time display uses the shared clock (no separate setInterval needed!)
const timeText = computed(() => {
  const d = scheduleClock.value;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
});

const dateText = computed(() => {
  const d = scheduleClock.value;
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

// Watch class state transitions for ripple effect
let prevClassStatus = "";
watch(
  () => classState.value.statusText,
  (newVal) => {
    const isInClass = newVal.includes("正在上课");
    const wasInClass = prevClassStatus.includes("正在上课");
    if (prevClassStatus && isInClass !== wasInClass) {
      triggerRipple();
    }
    prevClassStatus = newVal;
  },
);

onMounted(() => {
  if (config.value.wallpaper) {
    const url = wallpaperUrlForName(config.value.wallpaper);
    applyWallpaper(url || "");
    const autoColor = wallpaperThemeColor(config.value.wallpaper);
    applyTheme(config.value.themeMode, autoColor || config.value.themeColor);
  } else {
    applyWallpaper("");
    applyTheme(config.value.themeMode, config.value.themeColor);
  }
  applyWidgetOpacity(config.value.widgetOpacity ?? 1);
  applyNavStyle(config.value.navStyle ?? "fixed");
  setupMediaListener(
    () => config.value.themeMode,
    () => config.value.themeColor,
  );

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

  // Kiosk mode: lock fullscreen unless admin/teacher is logged in
  applyKioskLock();
});

// Watch auth state to lock/unlock fullscreen when logging in/out
watch(isAdminOrTeacher, () => applyKioskLock());

function applyKioskLock(): void {
  if (config.value.kioskMode && !isAdminOrTeacher.value) {
    lockFullscreen();
  } else {
    unlockFullscreen();
  }
}

onBeforeUnmount(() => {
  stopWeatherTimer();
  stopFeedTimer();
  stopRssTimer();
  cleanupMediaListener();
  unlockFullscreen();
});
</script>

<style scoped>
.view {
  display: grid;
  gap: 20px;
  animation: rise-in 280ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
</style>
