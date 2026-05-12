import type { AppConfig } from "@/types/config";
import type { Lesson, ClassState } from "@/types/schedule";
import { formatDuration, parseCsesLessons, lessonsForDate } from "@/utils/schedule";

function teacherLabel(teacher: string): string {
  const t = String(teacher || "").trim();
  return t ? `任课老师：${t}` : "";
}

export function useSchedule(config: Ref<AppConfig>, now: Ref<Date>) {
  const parsedCses = computed(() => {
    return parseCsesLessons(config.value.csesRaw || "", "yaml");
  });

  const classState = computed<ClassState>(() => {
    const current = now.value;
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
    const lessonsToday = lessonsForDate(allLessons, current);

    for (const lesson of lessonsToday) {
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

    const nextToday = lessonsToday.find((x) => x.startM > currentM);
    if (nextToday) {
      const startDate = new Date(current);
      startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0);
      const remain = startDate.getTime() - current.getTime();
      const remainMin = remain / 60000;
      const remainSec = Math.max(0, Math.ceil(remain / 1000));

      // Dynamic pre-class window: gap between consecutive lessons, capped at 60 min
      const prevEnds = lessonsToday.filter((x) => x.endM <= currentM).map((x) => x.endM);
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
        progressNote: show ? `即将上课（${remainSec} 秒）` : "",
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

  const todayLessons = computed<Lesson[]>(() => {
    if (!parsedCses.value.ok) return [];
    return lessonsForDate(parsedCses.value.lessons, now.value);
  });

  return { classState, todayLessons, parsedCses };
}
