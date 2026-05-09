import type { SimpleSchedule, SimpleClassEntry, Lesson, CsesParseResult, WeekType } from '@/types/schedule'
import { load } from 'js-yaml'

export function parseTimeToMinutes(timeText: string): number | null {
  const parts = String(timeText).split(':')
  if (parts.length !== 2 && parts.length !== 3) return null
  const h = Number(parts[0])
  const m = Number(parts[1])
  const s = parts.length === 3 ? Number(parts[2]) : 0
  if (!Number.isInteger(h) || !Number.isInteger(m) || !Number.isInteger(s) || h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null
  return h * 60 + m + (s / 60)
}

export function normalizeClockText(timeText: string): string {
  const t = String(timeText || '')
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5)
  if (/^\d{2}:\d{2}$/.test(t)) return t
  return t
}

export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}

export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekType(date: Date): WeekType {
  return getIsoWeek(date) % 2 === 0 ? 'even' : 'odd'
}

export function getSimpleClassInfo(schedule: SimpleSchedule, date: Date): SimpleClassEntry {
  const weekType = getWeekType(date)
  const day = date.getDay()
  return schedule[weekType]?.[String(day)] || { course: '晚自习', teacher: '' }
}

export function validateSimpleSchedule(schedule: unknown): schedule is SimpleSchedule {
  if (!schedule || typeof schedule !== 'object') return false
  const s = schedule as Record<string, unknown>
  for (const wt of ['odd', 'even']) {
    if (!s[wt] || typeof s[wt] !== 'object') return false
    const weekObj = s[wt] as Record<string, unknown>
    for (let day = 0; day <= 6; day += 1) {
      const e = (weekObj[String(day)] ?? weekObj[day]) as Record<string, unknown> | undefined
      if (!e || typeof e !== 'object') return false
      if (typeof e.course !== 'string' || typeof e.teacher !== 'string') return false
    }
  }
  return true
}

export function normalizeWeekType(input: unknown): WeekType {
  const val = String(input ?? '').trim().toLowerCase()
  if (!val || val === 'all' || val === 'both' || val === '0' || val === 'every') return 'all'
  if (['odd', 'single', 'dan', '1', '单', '单周'].includes(val)) return 'odd'
  if (['even', 'double', 'shuang', '2', '双', '双周'].includes(val)) return 'even'
  return 'all'
}

export function normalizeDay(rawDay: unknown): number | null {
  if (rawDay === undefined || rawDay === null || rawDay === '') return null
  const d = Number(rawDay)
  if (!Number.isFinite(d)) return null
  if (d >= 0 && d <= 6) return d
  if (d >= 1 && d <= 7) {
    const map: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 }
    return map[d]
  }
  return null
}

interface CsesCycle {
  work_count?: number
  spans?: Array<{ activity?: string; count?: number }>
}

export function buildWorkDayWeekdayMap(cycle: CsesCycle | undefined): Map<number, number> | null {
  if (!cycle || typeof cycle !== 'object') return null
  const workCount = Number(cycle.work_count)
  const spans = Array.isArray(cycle.spans) ? cycle.spans : []
  if (!Number.isInteger(workCount) || workCount < 1 || !spans.length) return null
  const map = new Map<number, number>()
  let weekday = 1
  let workSeen = 0
  for (const span of spans) {
    const activity = String(span?.activity || '').toLowerCase()
    const count = Number(span?.count || 0)
    if (!Number.isInteger(count) || count < 1) continue
    for (let i = 0; i < count; i += 1) {
      if (activity === 'work') {
        workSeen += 1
        if (workSeen <= workCount) map.set(workSeen, weekday)
      }
      weekday = (weekday % 7) + 1
      if (workSeen >= workCount) return map
    }
  }
  return map.size ? map : null
}

function pickFirst(obj: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj?.[key]
    if (val !== undefined && val !== null && val !== '') return String(val)
  }
  return undefined
}

export function parseCsesLessons(rawText: string, preferredFormat: 'auto' | 'yaml' | 'json' = 'auto'): CsesParseResult {
  const text = String(rawText || '').trim()
  if (!text) return { ok: true, lessons: [], warning: '未提供 CSES 内容，当前无课程。' }

  let root: Record<string, unknown> | undefined
  const detectJson = text.startsWith('{') || text.startsWith('[')
  const parserPlan = preferredFormat === 'json'
    ? (['json', 'yaml'] as const)
    : preferredFormat === 'yaml'
    ? (['yaml', 'json'] as const)
    : detectJson
    ? (['json', 'yaml'] as const)
    : (['yaml', 'json'] as const)

  for (const fmt of parserPlan) {
    try {
      root = (fmt === 'json' ? JSON.parse(text) : load(text)) as Record<string, unknown>
      if (root && typeof root === 'object') break
    } catch { /* try next parser */ }
  }
  if (!root || typeof root !== 'object') {
    return { ok: false, lessons: [], error: 'CSES 内容解析失败（JSON/YAML）。' }
  }

  const subjectMap = new Map<string, { course: string; teacher: string }>()
  const subjects = Array.isArray(root?.subjects) ? (root.subjects as Record<string, unknown>[]) : []
  const cycleConfig = (root?.configuration as Record<string, unknown>)?.cycle as CsesCycle | undefined
  const workDayWeekdayMap = buildWorkDayWeekdayMap(cycleConfig)

  for (const s of subjects) {
    const name = pickFirst(s, ['name', 'subject', 'course', 'title'])
    const short = pickFirst(s, ['simplified_name', 'short_name'])
    const teacher = String(pickFirst(s, ['teacher', 'teacher_name']) || '')
    if (name) subjectMap.set(String(name), { course: String(name), teacher })
    if (short) subjectMap.set(String(short), { course: String(name || short), teacher })
  }

  const lessons: Lesson[] = []
  const addLesson = (day: unknown, weekType: unknown, start: unknown, end: unknown, course: unknown, teacher: unknown) => {
    const dayN = normalizeDay(day)
    const startM = parseTimeToMinutes(String(start))
    const endM = parseTimeToMinutes(String(end))
    if (dayN === null || startM === null || endM === null || endM <= startM) return
    lessons.push({
      day: dayN,
      weekType: normalizeWeekType(weekType),
      start: normalizeClockText(String(start)),
      end: normalizeClockText(String(end)),
      startM,
      endM,
      course: String(course || '未命名课程'),
      teacher: String(teacher || '')
    })
  }

  if (Array.isArray(root?.schedules)) {
    for (const schedule of root.schedules as Record<string, unknown>[]) {
      const rawDays = Array.isArray(schedule?.enable_day)
        ? schedule.enable_day
        : [pickFirst(schedule, ['enable_day', 'day', 'weekday', 'week_day'])]
      const days = rawDays.map((d: unknown) => {
        const n = Number(d)
        if (workDayWeekdayMap && Number.isInteger(n) && workDayWeekdayMap.has(n)) return workDayWeekdayMap.get(n)
        if (workDayWeekdayMap && Number.isInteger(n) && n > 0) {
          const size = workDayWeekdayMap.size
          const idx = ((n - 1) % size) + 1
          if (workDayWeekdayMap.has(idx)) return workDayWeekdayMap.get(idx)
        }
        return d
      })
      const weekType = pickFirst(schedule, ['weeks', 'week_type', 'weekType', 'week', 'type']) || 'all'
      const classes = Array.isArray(schedule?.classes) ? (schedule.classes as Record<string, unknown>[]) : []

      for (const day of days) {
        for (const cls of classes) {
          const subjectText = pickFirst(cls, ['subject', 'name', 'course', 'title'])
          const mapped = subjectMap.get(String(subjectText))
          const start = pickFirst(cls, ['start_time', 'start', 'startTime'])
          const end = pickFirst(cls, ['end_time', 'end', 'endTime'])
          const teacher = pickFirst(cls, ['teacher', 'teacher_name', 'instructor']) || mapped?.teacher
          addLesson(day, weekType, start, end, mapped?.course || subjectText, teacher)
        }
      }
    }
  }

  lessons.sort((a, b) => (a.day - b.day) || (a.startM - b.startM))
  if (!lessons.length) {
    return { ok: false, lessons: [], error: '未从 CSES 内容解析出课程。请检查 schedules.enable_day、classes.start_time、classes.end_time 等字段。' }
  }
  return { ok: true, lessons }
}

export function isLessonInWeek(lesson: Lesson, weekType: WeekType): boolean {
  return lesson.weekType === 'all' || lesson.weekType === weekType
}

export function lessonsForDate(allLessons: Lesson[], date: Date): Lesson[] {
  const day = date.getDay()
  const weekType = getWeekType(date)
  return allLessons.filter((x) => x.day === day && isLessonInWeek(x, weekType)).sort((a, b) => a.startM - b.startM)
}

export const dayLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
