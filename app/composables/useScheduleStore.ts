// Shared schedule clock and computed state — single source of truth
// Eliminates duplicate parsing between index.vue and layouts/default.vue.
// Both consumers read from the same module-level refs, computed only once per tick.

import type { AppConfig } from "@/types/config";
import type { Lesson, ClassState } from "@/types/schedule";
import { formatDuration, parseCsesLessons, lessonsForDate } from "@/utils/schedule";

export const scheduleClock = shallowRef(new Date());

let _clockTimer: ReturnType<typeof setInterval> | null = null;

/** Start the shared clock. Idempotent — safe to call multiple times. */
export function startScheduleClock(): void {
  if (import.meta.server || _clockTimer) return;
  _clockTimer = setInterval(() => {
    scheduleClock.value = new Date();
  }, 1000);
}

/** Stop the shared clock. Safe to call even if not running. */
export function stopScheduleClock(): void {
  if (_clockTimer) {
    clearInterval(_clockTimer);
    _clockTimer = null;
  }
}

function teacherLabel(teacher: string): string {
  const t = String(teacher || "").trim();
  return t ? `任课老师：${t}` : "";
}

// ---- Shared schedule computed state ----
// These are computed lazily from the shared clock and a config getter.
// The config getter allows the consumer to update CSES data without recreating computeds.

let _configGetter: (() => AppConfig) | null = null;

export function bindScheduleConfig(getter: () => AppConfig): void {
  _configGetter = getter;
}

function getConfig(): AppConfig {
  return _configGetter?.() ?? ({} as AppConfig);
}

const parsedCses = computed(() => {
  return parseCsesLessons(getConfig().csesRaw || "", "yaml");
});

export const todayLessons = computed<Lesson[]>(() => {
  if (!parsedCses.value.ok) return [];
  return lessonsForDate(parsedCses.value.lessons, scheduleClock.value);
});

export const classState = computed<ClassState>(() => {
  const current = scheduleClock.value;
  const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;

  if (!parsedCses.value.ok) {
    return {
      statusText: parsedCses.value.error || "",
      courseText: "-",
      teacherText: "",
      showProgress: false,
      progress: 0,
      progressNote: "",
    };
  }

  const allLessons = parsedCses.value.lessons;
  const today = lessonsForDate(allLessons, current);

  for (const lesson of today) {
    if (currentM >= lesson.startM && currentM < lesson.endM) {
      const total = lesson.endM - lesson.startM;
      const elapsed = currentM - lesson.startM;
      const progress = Math.max(0, Math.min(1, elapsed / total));
      const endDate = new Date(current);
      endDate.setHours(Math.floor(lesson.endM / 60), lesson.endM % 60, 0, 0);
      return {
        statusText: `正在上课，距离下课还有 ${formatDuration(endDate.getTime() - current.getTime())}`,
        courseText: lesson.course,
        teacherText: teacherLabel(lesson.teacher),
        showProgress: true,
        progress,
        progressNote: `课程进度 ${Math.floor(progress * 100)}%`,
      };
    }
  }

  const nextToday = today.find((x) => x.startM > currentM);
  if (nextToday) {
    const startDate = new Date(current);
    startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0);
    const remain = startDate.getTime() - current.getTime();
    const remainMin = remain / 60000;
    const remainSec = Math.max(0, Math.ceil(remain / 1000));

    const prevEnds = today.filter((x) => x.endM <= currentM).map((x) => x.endM);
    const gap = prevEnds.length > 0 ? nextToday.startM - Math.max(...prevEnds) : remainMin;
    const windowMins = Math.min(gap, 60);
    const show = remainMin <= windowMins;
    const p = show ? Math.max(0, Math.min(1, (windowMins - remainMin) / windowMins)) : 0;
    return {
      statusText: show ? "" : `下一节课 ${nextToday.start}-${nextToday.end}`,
      courseText: nextToday.course,
      teacherText: teacherLabel(nextToday.teacher),
      showProgress: show,
      progress: p,
      progressNote: show ? `即将上课（${formatDuration(remain)}）` : "",
    };
  }

  const scanBase = new Date(current);
  for (let i = 1; i <= 14; i += 1) {
    const d = new Date(scanBase);
    d.setDate(d.getDate() + i);
    const targetLessons = lessonsForDate(allLessons, d);
    if (targetLessons.length) {
      const first = targetLessons[0];
      const startDate = new Date(d);
      startDate.setHours(Math.floor(first.startM / 60), first.startM % 60, 0, 0);
      return {
        statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(startDate.getTime() - current.getTime())}后）`,
        courseText: first.course,
        teacherText: teacherLabel(first.teacher),
        showProgress: false,
        progress: 0,
        progressNote: "",
      };
    }
  }

  return {
    statusText: "暂无课程安排",
    courseText: "-",
    teacherText: "",
    showProgress: false,
    progress: 0,
    progressNote: "",
  };
});

/**
 * Convenience composable — returns the shared schedule state.
 * Does NOT create new computeds; just returns the module-level ones.
 */
export function useSchedule() {
  return { classState, todayLessons, scheduleClock };
}
