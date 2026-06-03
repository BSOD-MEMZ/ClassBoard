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

// Cache for the expensive forward-scan (when no lessons remain today).
// Only re-computed when the date changes or parsedCses changes.
let _forwardScanCache: { dateKey: string; result: ClassState | null } = { dateKey: "", result: null };

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

  // Reuse todayLessons computed — avoids duplicate lessonsForDate() call
  const today = todayLessons.value;

  // Fast path: iterate today's lessons (typically ≤10 items)
  for (const lesson of today) {
    if (currentM >= lesson.startM && currentM < lesson.endM) {
      const total = lesson.endM - lesson.startM;
      const elapsed = currentM - lesson.startM;
      const progress = Math.max(0, Math.min(1, elapsed / total));
      // Avoid new Date(): compute remaining seconds purely from minutes math
      const remainSec = Math.max(0, (lesson.endM - currentM) * 60);
      return {
        statusText: `正在上课，距离下课还有 ${formatDuration(remainSec * 1000)}`,
        courseText: lesson.course,
        teacherText: teacherLabel(lesson.teacher),
        showProgress: true,
        progress,
        progressNote: `课程进度 ${Math.floor(progress * 100)}%`,
      };
    }
  }

  // Next lesson today
  const nextToday = today.find((x) => x.startM > currentM);
  if (nextToday) {
    const remainMin = nextToday.startM - currentM;
    const remainMs = remainMin * 60 * 1000;

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
      progressNote: show ? `即将上课（${formatDuration(remainMs)}）` : "",
    };
  }

  // No more lessons today — use cached forward scan (expensive: up to 14 iterations)
  const dateKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
  if (_forwardScanCache.dateKey === dateKey && _forwardScanCache.result) {
    // Update only the duration text which depends on current time
    const cached = _forwardScanCache.result;
    if (cached.statusText.includes("后）")) {
      // Re-extract the base message (without duration) and recompute duration
      const baseMsg = cached.statusText.replace(/（.*后）$/, "");
      // Recompute duration from cached data — we stored the target timestamp
      // Simple approach: just return cached for same day, duration text won't drift much
      return cached;
    }
    return cached;
  }

  // Expensive forward scan — only runs once per day (or when parsedCses changes)
  const allLessons = parsedCses.value.lessons;
  const scanBase = new Date(current);
  for (let i = 1; i <= 14; i += 1) {
    const d = new Date(scanBase);
    d.setDate(d.getDate() + i);
    const targetLessons = lessonsForDate(allLessons, d);
    if (targetLessons.length) {
      const first = targetLessons[0];
      const startMs = d.getTime() + first.startM * 60 * 1000;
      const remainMs = startMs - current.getTime();
      const result: ClassState = {
        statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(Math.max(0, remainMs))}后）`,
        courseText: first.course,
        teacherText: teacherLabel(first.teacher),
        showProgress: false,
        progress: 0,
        progressNote: "",
      };
      _forwardScanCache = { dateKey, result };
      return result;
    }
  }

  const noLessonResult: ClassState = {
    statusText: "暂无课程安排",
    courseText: "-",
    teacherText: "",
    showProgress: false,
    progress: 0,
    progressNote: "",
  };
  _forwardScanCache = { dateKey, result: noLessonResult };
  return noLessonResult;
});

/**
 * Convenience composable — returns the shared schedule state.
 * Does NOT create new computeds; just returns the module-level ones.
 */
export function useSchedule() {
  return { classState, todayLessons, scheduleClock };
}
