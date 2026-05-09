import type { AppConfig } from "@/types/config";
import type { Lesson, ClassState } from "@/types/schedule";
import {
  parseTimeToMinutes,
  normalizeClockText,
  formatDuration,
  getWeekType,
  getSimpleClassInfo,
  parseCsesLessons,
  lessonsForDate,
} from "@/utils/schedule";

function teacherLabel(teacher: string): string {
  const t = String(teacher || "").trim();
  return t ? `任课老师：${t}` : "";
}

export function useSchedule(config: Ref<AppConfig>, now: Ref<Date>) {
  const parsedCses = computed(() => {
    return parseCsesLessons(
      config.value.csesRaw || "",
      config.value.csesFormat || "auto",
    );
  });

  const classState = computed<ClassState>(() => {
    const current = now.value;
    const currentM =
      current.getHours() * 60 +
      current.getMinutes() +
      current.getSeconds() / 60;
    const preWindow = Number(config.value.preClassProgressWindow) || 10;

    let lessonsToday: Array<{
      day: number;
      weekType: string;
      start: string;
      end: string;
      startM: number;
      endM: number;
      course: string;
      teacher: string;
    }> = [];
    let allLessons: Lesson[] = [];

    if (config.value.scheduleMode === "cses") {
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
      allLessons = parsedCses.value.lessons;
      lessonsToday = lessonsForDate(allLessons, current);
    } else {
      const startM = parseTimeToMinutes(config.value.classStart);
      const endM = parseTimeToMinutes(config.value.classEnd);
      if (startM === null || endM === null || endM <= startM) {
        return {
          statusText: "设置中的上课/下课时间无效",
          courseText: "-",
          teacherText: "",
          showProgress: false,
          progress: 0,
          progressNote: "",
        };
      }
      const info = getSimpleClassInfo(config.value.schedule, current);
      lessonsToday = [
        {
          day: current.getDay(),
          weekType: getWeekType(current),
          start: config.value.classStart,
          end: config.value.classEnd,
          startM,
          endM,
          course: info.course,
          teacher: info.teacher,
        },
      ];
      allLessons = [];
    }

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
      startDate.setHours(
        Math.floor(nextToday.startM / 60),
        nextToday.startM % 60,
        0,
        0,
      );
      const remain = startDate.getTime() - current.getTime();
      const remainMin = remain / 60000;
      const remainSec = Math.max(0, Math.ceil(remain / 1000));
      const show = remainMin <= preWindow;
      const p = show
        ? Math.max(0, Math.min(1, (preWindow - remainMin) / preWindow))
        : 0;
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
      let targetLessons: Array<{
        startM: number;
        endM: number;
        start: string;
        end: string;
        course: string;
        teacher: string;
      }> = [];
      if (config.value.scheduleMode === "cses") {
        targetLessons = lessonsForDate(allLessons, d);
      } else {
        const startM = parseTimeToMinutes(config.value.classStart);
        const endM = parseTimeToMinutes(config.value.classEnd);
        const info = getSimpleClassInfo(config.value.schedule, d);
        if (startM === null || endM === null || endM <= startM) continue;
        targetLessons = [
          {
            startM,
            endM,
            start: config.value.classStart,
            end: config.value.classEnd,
            course: info.course,
            teacher: info.teacher,
          },
        ];
      }
      if (targetLessons.length) {
        const first = targetLessons[0];
        const startDate = new Date(d);
        startDate.setHours(
          Math.floor(first.startM / 60),
          first.startM % 60,
          0,
          0,
        );
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
    const current = now.value;
    if (config.value.scheduleMode === "cses") {
      if (!parsedCses.value.ok) return [];
      return lessonsForDate(parsedCses.value.lessons, current);
    }
    const startM = parseTimeToMinutes(config.value.classStart);
    const endM = parseTimeToMinutes(config.value.classEnd);
    if (startM === null || endM === null || endM <= startM) return [];
    const info = getSimpleClassInfo(config.value.schedule, current);
    return [
      {
        day: current.getDay(),
        weekType: getWeekType(current),
        start: normalizeClockText(config.value.classStart),
        end: normalizeClockText(config.value.classEnd),
        startM,
        endM,
        course: info.course,
        teacher: info.teacher,
      },
    ];
  });

  return { classState, todayLessons, parsedCses };
}
