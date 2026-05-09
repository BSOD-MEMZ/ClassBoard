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
        @show-lesson-detail="showLessonDetail"
        @toggle-lessons="toggleTodayLessons"
      />
      <FeedCard :feed-data="feedData" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import SchoolCard from "@/components/Dashboard/SchoolCard.vue";
import TimeCard from "@/components/Dashboard/TimeCard.vue";
import ClassStatusCard from "@/components/Dashboard/ClassStatusCard.vue";
import FeedCard from "@/components/Dashboard/FeedCard.vue";
import { loadConfig } from "@/composables/useConfig";
import { useSchedule } from "@/composables/useSchedule";
import { useWeather } from "@/composables/useWeather";
import { useFeed } from "@/composables/useFeed";
import { useDisplay } from "@/composables/useDisplay";
import { dayLabels } from "@/utils/schedule";
import { snackbar } from "mdui";
import type { Lesson } from "@/types/schedule";

const config = ref(loadConfig());
const now = ref(new Date());
const todayLessonsExpanded = ref(false);

const { classState, todayLessons } = useSchedule(config, now);
const { weatherText, weatherVisible, weatherLoading, startWeatherTimer, stopWeatherTimer } =
  useWeather();
const { feedData, startFeedTimer, stopFeedTimer } = useFeed();
const { applyTheme, setupMediaListener, cleanupMediaListener } =
  useDisplay();

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

function showLessonDetail(lesson: Lesson) {
  const course = String(lesson.course || "未命名课程");
  const time = `${lesson.start || "--:--"}-${lesson.end || "--:--"}`;
  const teacher = String(lesson.teacher || "").trim();
  const teacherPart = teacher ? `｜任课老师：${teacher}` : "";
  try {
    snackbar({ message: `${course}｜${time}${teacherPart}` });
  } catch {
    alert(`${course}｜${time}${teacherPart}`);
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  applyTheme(config.value.themeMode, config.value.themeColor);
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
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
  stopWeatherTimer();
  stopFeedTimer();
  cleanupMediaListener();
});
</script>

<style scoped>
.view {
  display: grid;
  gap: 12px;
  animation: rise-in 180ms ease;
}
</style>
