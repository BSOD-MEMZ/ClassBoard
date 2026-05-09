# ClassBoard Nuxt 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ClassBoard 从 SPA-in-Nuxt（单页面 + 巨型 composable）重构为标准的 Nuxt 4 分层架构，pages/composables/components/server 各司其职。

**Architecture:** 采用 VoiceHub 项目的标准 Nuxt 分层模式。950 行 useClassBoard.js 按领域拆为 6 个 composable，300 行 index.vue 拆为 4 个页面 + 15 个组件，600 行全局 CSS 拆为 CSS 变量文件 + 各组件的 scoped style。新增 server/api 代理天气和 feed 请求。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, MDUI 2, js-yaml

**Design spec:** `docs/superpowers/specs/2026-05-08-nuxt-refactoring-design.md`

---

## Task 1: Type definitions

**Files:**
- Create: `app/types/schedule.ts`
- Create: `app/types/config.ts`
- Create: `app/types/index.ts`

- [ ] **Step 1: Create `app/types/schedule.ts`**

```typescript
// 课表相关类型定义

export type WeekType = 'odd' | 'even' | 'all'

export interface SimpleClassEntry {
  course: string
  teacher: string
}

export interface SimpleSchedule {
  odd: Record<string, SimpleClassEntry>
  even: Record<string, SimpleClassEntry>
}

export interface Lesson {
  day: number
  weekType: WeekType
  start: string
  end: string
  startM: number
  endM: number
  course: string
  teacher: string
}

export interface CsesParseResult {
  ok: boolean
  lessons: Lesson[]
  error?: string
  warning?: string
}

export interface ClassState {
  statusText: string
  courseText: string
  teacherText: string
  showProgress: boolean
  progress: number
  progressNote: string
}
```

- [ ] **Step 2: Create `app/types/config.ts`**

```typescript
import type { SimpleSchedule, WeekType } from './schedule'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ScheduleMode = 'simple' | 'cses'
export type CsesFormat = 'auto' | 'yaml' | 'json'

export interface AppConfig {
  schoolName: string
  classroomName: string
  themeMode: ThemeMode
  themeColor: string
  scheduleMode: ScheduleMode
  classStart: string
  classEnd: string
  preClassProgressWindow: number
  weatherEnabled: boolean
  weatherCity: string
  weatherLatitude: number
  weatherLongitude: number
  csesRaw: string
  csesFormat: CsesFormat
  schedule: SimpleSchedule
}

export interface SettingsSection {
  key: string
  label: string
  icon: string
  description: string
}
```

- [ ] **Step 3: Create `app/types/index.ts`**

```typescript
// 通用类型定义

export interface AppTool {
  key: string
  name: string
  description: string
  icon: string
  url: string
}

export interface FeedItem {
  title: string
  summary: string
  time: string
}

export interface FeedData {
  title: string
  updatedAt: string
  items: FeedItem[]
}

export interface CityResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export interface WeatherData {
  current: {
    temperature_2m: number
    weather_code: number
    wind_speed_10m: number
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/types/ && git commit -m "feat: add TypeScript type definitions"
```

---

## Task 2: Utility functions

**Files:**
- Create: `app/utils/schedule.ts`
- Create: `app/utils/feed.ts`

- [ ] **Step 1: Create `app/utils/schedule.ts`**

Move all pure functions from useClassBoard.js that deal with time calculation, CSES parsing, and schedule validation:

```typescript
import type { SimpleSchedule, SimpleClassEntry, Lesson, CsesParseResult, WeekType } from '@/types/schedule'
import { load } from 'js-yaml'

// ---- Time helpers ----

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

// ---- Date helpers ----

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

// ---- Simple schedule ----

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

// ---- CSES parsing ----

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
  work_count: number
  spans: Array<{ activity?: string; count?: number }>
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
    ? ['json', 'yaml'] as const
    : preferredFormat === 'yaml'
    ? ['yaml', 'json'] as const
    : detectJson
    ? ['json', 'yaml'] as const
    : ['yaml', 'json'] as const

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
      const classes = Array.isArray(schedule?.classes) ? schedule.classes as Record<string, unknown>[] : []

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
```

- [ ] **Step 2: Create `app/utils/feed.ts`**

```typescript
import type { FeedData } from '@/types'

export function normalizeFeedPayload(payload: Record<string, unknown> | null | undefined): FeedData {
  const source = payload && typeof payload === 'object' ? payload : {}
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : '校园资讯'
  const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : ''
  const rawItems = Array.isArray(source.items) ? source.items as Record<string, unknown>[] : []
  const items = rawItems
    .map((item) => ({
      title: String(item?.title || '').trim(),
      summary: String(item?.summary || '').trim(),
      time: String(item?.time || '').trim()
    }))
    .filter((x) => x.title)
    .slice(0, 8)
  return { title, updatedAt, items }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/utils/ && git commit -m "feat: add utility functions (schedule + feed)"
```

---

## Task 3: Server API routes

**Files:**
- Create: `app/server/api/weather.get.ts`
- Create: `app/server/api/city-search.get.ts`
- Create: `app/server/api/feed.get.ts`

- [ ] **Step 1: Create `app/server/api/weather.get.ts`**

```typescript
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat
  const lon = query.lon
  if (!lat || !lon) {
    throw createError({ statusCode: 400, message: 'Missing lat/lon parameters' })
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
  try {
    const data = await $fetch(url)
    return data
  } catch (err) {
    throw createError({ statusCode: 502, message: 'Weather API unavailable' })
  }
})
```

- [ ] **Step 2: Create `app/server/api/city-search.get.ts`**

```typescript
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = query.name
  if (!name) {
    throw createError({ statusCode: 400, message: 'Missing name parameter' })
  }
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=8&language=zh&format=json`
  try {
    const data = await $fetch(url)
    return data
  } catch (err) {
    throw createError({ statusCode: 502, message: 'Geocoding API unavailable' })
  }
})
```

- [ ] **Step 3: Create `app/server/api/feed.get.ts`**

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  const feedUrl = 'https://xxtsoft.top/support/classboard/feed.json'
  try {
    const data = await $fetch(feedUrl, { signal: AbortSignal.timeout(7000) })
    return data
  } catch {
    // Fallback to local feed.json
    try {
      const localPath = join(process.cwd(), 'public', 'feed.json')
      const raw = await readFile(localPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      throw createError({ statusCode: 502, message: 'Feed unavailable' })
    }
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add app/server/ && git commit -m "feat: add server API routes (weather, city-search, feed)"
```

---

## Task 4: useConfig composable (TS migration)

**Files:**
- Create: `app/composables/useConfig.ts`
- (will delete `app/composables/useConfig.js` in cleanup task)

- [ ] **Step 1: Create `app/composables/useConfig.ts`**

```typescript
import type { AppConfig, ThemeMode, ScheduleMode, CsesFormat } from '@/types/config'
import type { SimpleSchedule } from '@/types/schedule'

export const STORAGE_KEY = 'classboard_vue_mdui_config_v1'

export const defaultConfig: AppConfig = {
  schoolName: '株洲市南方中学',
  classroomName: '未命名教室',
  themeMode: 'auto',
  themeColor: '#2a5f9e',
  scheduleMode: 'simple',
  classStart: '18:40',
  classEnd: '20:20',
  preClassProgressWindow: 10,
  weatherEnabled: true,
  weatherCity: '株洲',
  weatherLatitude: 27.83,
  weatherLongitude: 113.15,
  csesRaw: '',
  csesFormat: 'auto',
  schedule: {
    odd: {
      '0': { course: '班会', teacher: '班主任' },
      '1': { course: '数学拓展', teacher: '周老师' },
      '2': { course: '英语听说', teacher: '李老师' },
      '3': { course: '物理实验', teacher: '陈老师' },
      '4': { course: '语文阅读', teacher: '王老师' },
      '5': { course: '信息技术', teacher: '刘老师' },
      '6': { course: '社团活动', teacher: '指导老师' }
    },
    even: {
      '0': { course: '体育康复', teacher: '任课老师' },
      '1': { course: '化学提升', teacher: '赵老师' },
      '2': { course: '历史专题', teacher: '唐老师' },
      '3': { course: '生物探究', teacher: '吴老师' },
      '4': { course: '地理实践', teacher: '孙老师' },
      '5': { course: '政治时评', teacher: '何老师' },
      '6': { course: '心理成长', teacher: '辅导老师' }
    }
  }
}

export const weatherCodeMap: Record<number, string> = {
  0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '较强阵雨', 82: '强阵雨', 95: '雷暴'
}

export function cloneDefault(): AppConfig {
  return JSON.parse(JSON.stringify(defaultConfig))
}

export function normalizeConfig(parsed: Partial<AppConfig> | null): AppConfig {
  return {
    ...cloneDefault(),
    ...(parsed || {}),
    schedule: {
      odd: { ...defaultConfig.schedule.odd, ...(parsed?.schedule?.odd || {}) },
      even: { ...defaultConfig.schedule.even, ...(parsed?.schedule?.even || {}) }
    }
  }
}

export function loadConfig(): AppConfig {
  if (import.meta.server) return cloneDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefault()
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return cloneDefault()
  }
}

export function saveConfig(config: AppConfig): void {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useConfig.ts && git commit -m "feat: add useConfig composable (TypeScript)"
```

---

## Task 5: useSchedule composable

**Files:**
- Create: `app/composables/useSchedule.ts`

- [ ] **Step 1: Create `app/composables/useSchedule.ts`**

```typescript
import type { Lesson, ClassState } from '@/types/schedule'
import type { AppConfig } from '@/types/config'
import { computed } from 'vue'
import {
  parseTimeToMinutes,
  normalizeClockText,
  formatDuration,
  getWeekType,
  getSimpleClassInfo,
  parseCsesLessons,
  lessonsForDate
} from '@/utils/schedule'

function teacherLabel(teacher: string): string {
  const t = String(teacher || '').trim()
  return t ? `任课老师：${t}` : ''
}

export function useSchedule(config: Ref<AppConfig>, now: Ref<Date>) {
  const parsedCses = computed(() => {
    return parseCsesLessons(config.value.csesRaw || '', config.value.csesFormat || 'auto')
  })

  const classState = computed<ClassState>(() => {
    const current = now.value
    const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60
    const preWindow = Number(config.value.preClassProgressWindow) || 10

    let lessonsToday: Lesson[] = []
    let allLessons: Lesson[] = []

    if (config.value.scheduleMode === 'cses') {
      if (!parsedCses.value.ok) {
        return {
          statusText: parsedCses.value.error || '',
          courseText: '-',
          teacherText: '',
          showProgress: false,
          progress: 0,
          progressNote: ''
        }
      }
      allLessons = parsedCses.value.lessons
      lessonsToday = lessonsForDate(allLessons, current)
    } else {
      const startM = parseTimeToMinutes(config.value.classStart)
      const endM = parseTimeToMinutes(config.value.classEnd)
      if (startM === null || endM === null || endM <= startM) {
        return {
          statusText: '设置中的上课/下课时间无效',
          courseText: '-',
          teacherText: '',
          showProgress: false,
          progress: 0,
          progressNote: ''
        }
      }

      const info = getSimpleClassInfo(config.value.schedule, current)
      lessonsToday = [{
        day: current.getDay(),
        weekType: getWeekType(current),
        start: config.value.classStart,
        end: config.value.classEnd,
        startM,
        endM,
        course: info.course,
        teacher: info.teacher
      }]
      allLessons = []
    }

    // Check if currently in a lesson
    for (const lesson of lessonsToday) {
      if (currentM >= lesson.startM && currentM < lesson.endM) {
        const total = lesson.endM - lesson.startM
        const elapsed = currentM - lesson.startM
        const progress = Math.max(0, Math.min(1, elapsed / total))
        const endDate = new Date(current)
        endDate.setHours(Math.floor(lesson.endM / 60), lesson.endM % 60, 0, 0)
        return {
          statusText: `正在上课，距离下课还有 ${formatDuration(endDate.getTime() - current.getTime())}`,
          courseText: lesson.course,
          teacherText: teacherLabel(lesson.teacher),
          showProgress: true,
          progress,
          progressNote: `课程进度 ${Math.floor(progress * 100)}%`
        }
      }
    }

    // Check next lesson today
    const nextToday = lessonsToday.find((x) => x.startM > currentM)
    if (nextToday) {
      const startDate = new Date(current)
      startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0)
      const remain = startDate.getTime() - current.getTime()
      const remainMin = remain / 60000
      const remainSec = Math.max(0, Math.ceil(remain / 1000))
      const show = remainMin <= preWindow
      const p = show ? Math.max(0, Math.min(1, (preWindow - remainMin) / preWindow)) : 0
      return {
        statusText: show ? '' : `下一节课 ${nextToday.start}-${nextToday.end}`,
        courseText: nextToday.course,
        teacherText: teacherLabel(nextToday.teacher),
        showProgress: show,
        progress: p,
        progressNote: show ? `即将上课（${remainSec} 秒）` : ''
      }
    }

    // Scan next 14 days for lessons
    const scanBase = new Date(current)
    for (let i = 1; i <= 14; i += 1) {
      const d = new Date(scanBase)
      d.setDate(d.getDate() + i)

      let targetLessons: Lesson[]
      if (config.value.scheduleMode === 'cses') {
        targetLessons = lessonsForDate(allLessons, d)
      } else {
        const startM = parseTimeToMinutes(config.value.classStart)
        const endM = parseTimeToMinutes(config.value.classEnd)
        const info = getSimpleClassInfo(config.value.schedule, d)
        if (startM === null || endM === null || endM <= startM) continue
        targetLessons = [{ startM, endM, day: d.getDay(), weekType: getWeekType(d), start: config.value.classStart, end: config.value.classEnd, course: info.course, teacher: info.teacher }]
      }

      if (targetLessons.length) {
        const first = targetLessons[0]
        const startDate = new Date(d)
        startDate.setHours(Math.floor(first.startM / 60), first.startM % 60, 0, 0)
        return {
          statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(startDate.getTime() - current.getTime())}后）`,
          courseText: first.course,
          teacherText: teacherLabel(first.teacher),
          showProgress: false,
          progress: 0,
          progressNote: ''
        }
      }
    }

    return {
      statusText: '暂无课程安排',
      courseText: '-',
      teacherText: '',
      showProgress: false,
      progress: 0,
      progressNote: ''
    }
  })

  const todayLessons = computed<Lesson[]>(() => {
    const current = now.value
    if (config.value.scheduleMode === 'cses') {
      if (!parsedCses.value.ok) return []
      return lessonsForDate(parsedCses.value.lessons, current)
    }
    const startM = parseTimeToMinutes(config.value.classStart)
    const endM = parseTimeToMinutes(config.value.classEnd)
    if (startM === null || endM === null || endM <= startM) return []
    const info = getSimpleClassInfo(config.value.schedule, current)
    return [{
      day: current.getDay(),
      weekType: getWeekType(current),
      start: normalizeClockText(config.value.classStart),
      end: normalizeClockText(config.value.classEnd),
      startM,
      endM,
      course: info.course,
      teacher: info.teacher
    }]
  })

  return { classState, todayLessons, parsedCses }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useSchedule.ts && git commit -m "feat: add useSchedule composable"
```

---

## Task 6: useWeather composable

**Files:**
- Create: `app/composables/useWeather.ts`

- [ ] **Step 1: Create `app/composables/useWeather.ts`**

```typescript
import type { WeatherData, CityResult } from '@/types'
import { weatherCodeMap } from './useConfig'

export function useWeather() {
  const weatherText = ref('')
  const weatherVisible = ref(false)
  const cityQuery = ref('')
  const cityResults = ref<CityResult[]>([])
  const cityLoading = ref(false)

  let weatherTimer: ReturnType<typeof setInterval> | null = null

  async function refreshWeather(lat: number, lon: number, cityName: string): Promise<void> {
    if (import.meta.server) return
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      weatherVisible.value = false
      return
    }
    try {
      const data = await $fetch<WeatherData>('/api/weather', { query: { lat, lon } })
      const current = data.current
      if (!current) {
        weatherVisible.value = false
        return
      }
      const weather = weatherCodeMap[current.weather_code] || '未知天气'
      weatherText.value = `${cityName || '当前城市'} ${weather} ${Math.round(current.temperature_2m)}°C  风速${Math.round(current.wind_speed_10m)}km/h`
      weatherVisible.value = true
    } catch {
      weatherVisible.value = false
    }
  }

  async function searchCity(): Promise<void> {
    const q = cityQuery.value.trim()
    if (!q) {
      if (!import.meta.server) alert('请输入城市名。')
      return
    }
    cityLoading.value = true
    cityResults.value = []
    try {
      const data = await $fetch<{ results: CityResult[] }>('/api/city-search', { query: { name: q } })
      cityResults.value = Array.isArray(data.results) ? data.results : []
      if (!cityResults.value.length) {
        if (!import.meta.server) alert('未找到匹配城市。')
      }
    } catch {
      if (!import.meta.server) alert('城市搜索失败，请检查网络。')
    } finally {
      cityLoading.value = false
    }
  }

  function startWeatherTimer(lat: number, lon: number, cityName: string, enabled: boolean): void {
    if (import.meta.server) return
    if (weatherTimer) clearInterval(weatherTimer)
    if (!enabled) {
      weatherVisible.value = false
      return
    }
    refreshWeather(lat, lon, cityName)
    weatherTimer = setInterval(() => refreshWeather(lat, lon, cityName), 15 * 60 * 1000)
  }

  function stopWeatherTimer(): void {
    if (weatherTimer) {
      clearInterval(weatherTimer)
      weatherTimer = null
    }
  }

  return { weatherText, weatherVisible, cityQuery, cityResults, cityLoading, refreshWeather, searchCity, startWeatherTimer, stopWeatherTimer }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useWeather.ts && git commit -m "feat: add useWeather composable"
```

---

## Task 7: useFeed composable

**Files:**
- Create: `app/composables/useFeed.ts`

- [ ] **Step 1: Create `app/composables/useFeed.ts`**

```typescript
import type { FeedData } from '@/types'
import { normalizeFeedPayload } from '@/utils/feed'

const FEED_CACHE_KEY = 'classboard_feed_cache_v1'

export function useFeed() {
  const feedData = ref<FeedData>({ title: '校园资讯', updatedAt: '', items: [] })

  let feedTimer: ReturnType<typeof setInterval> | null = null

  async function refreshFeed(): Promise<void> {
    if (import.meta.server) return

    try {
      const data = await $fetch<Record<string, unknown>>('/api/feed')
      const normalized = normalizeFeedPayload(data)
      if (normalized.items.length) {
        feedData.value = normalized
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(normalized))
        return
      }
    } catch {
      // API failed, try cache
    }

    try {
      const cacheRaw = localStorage.getItem(FEED_CACHE_KEY)
      if (cacheRaw) {
        const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw))
        if (normalizedCache.items.length) {
          feedData.value = normalizedCache
          return
        }
      }
    } catch { /* ignore */ }

    feedData.value = {
      title: '校园资讯',
      updatedAt: '',
      items: [{ title: '暂无资讯', summary: '网络不可用且无本地缓存资讯。', time: '' }]
    }
  }

  function startFeedTimer(): void {
    if (import.meta.server) return
    refreshFeed()
    feedTimer = setInterval(refreshFeed, 5 * 60 * 1000)
  }

  function stopFeedTimer(): void {
    if (feedTimer) {
      clearInterval(feedTimer)
      feedTimer = null
    }
  }

  return { feedData, refreshFeed, startFeedTimer, stopFeedTimer }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useFeed.ts && git commit -m "feat: add useFeed composable"
```

---

## Task 8: useDisplay composable

**Files:**
- Create: `app/composables/useDisplay.ts`

- [ ] **Step 1: Create `app/composables/useDisplay.ts`**

```typescript
import { defaultConfig } from './useConfig'
import { setColorScheme } from 'mdui'
import type { ThemeMode } from '@/types/config'

export function useDisplay() {
  const screenOff = ref(false)
  const isFullscreen = ref(false)
  const fakeDevEnabled = ref(false)
  const modelTapCount = ref(0)

  let mediaQuery: MediaQueryList | null = null
  let mediaHandler: (() => void) | null = null

  function applyTheme(mode?: ThemeMode | string, color?: string): void {
    if (import.meta.server) return
    const root = document.documentElement
    const themeMode = mode || 'auto'
    const seed = color || defaultConfig.themeColor
    root.classList.remove('mdui-theme-light', 'mdui-theme-dark')
    if (themeMode === 'dark') {
      root.classList.add('mdui-theme-dark')
    } else if (themeMode === 'light') {
      root.classList.add('mdui-theme-light')
    } else {
      const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(dark ? 'mdui-theme-dark' : 'mdui-theme-light')
    }
    root.style.setProperty('--app-seed-color', seed)
    try {
      if (typeof setColorScheme === 'function') setColorScheme(seed)
    } catch { /* ignore */ }
  }

  function setupMediaListener(getMode: () => ThemeMode, getColor: () => string): void {
    if (import.meta.server) return
    mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    if (mediaQuery) {
      mediaHandler = () => {
        if ((getMode() || 'auto') === 'auto') {
          applyTheme('auto', getColor())
        }
      }
      if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaHandler)
      else if (mediaQuery.addListener) mediaQuery.addListener(mediaHandler)
    }
  }

  function cleanupMediaListener(): void {
    if (mediaQuery && mediaHandler) {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaHandler)
      else if (mediaQuery.removeListener) mediaQuery.removeListener(mediaHandler)
    }
  }

  function toggleFullscreen(): void {
    if (import.meta.server) return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true
      }).catch(() => { /* ignore */ })
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
      }).catch(() => {
        isFullscreen.value = false
      })
    }
  }

  function powerOffScreen(): void { screenOff.value = true }
  function wakeScreen(): void { screenOff.value = false }

  function onDeviceModelTap(): void {
    if (fakeDevEnabled.value) return
    modelTapCount.value += 1
    const remain = 7 - modelTapCount.value
    if (remain <= 0) {
      fakeDevEnabled.value = true
    }
  }

  return {
    screenOff, isFullscreen, fakeDevEnabled, modelTapCount,
    applyTheme, setupMediaListener, cleanupMediaListener,
    toggleFullscreen, powerOffScreen, wakeScreen, onDeviceModelTap
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useDisplay.ts && git commit -m "feat: add useDisplay composable"
```

---

## Task 9: useApps composable

**Files:**
- Create: `app/composables/useApps.ts`

- [ ] **Step 1: Create `app/composables/useApps.ts`**

```typescript
import type { AppTool } from '@/types'

export function useApps() {
  const appsView = ref<'list' | 'web'>('list')
  const activeApp = ref<AppTool | null>(null)

  const appTools: AppTool[] = [
    { key: 'xuexi', name: '学习强国', description: '学习强国官网', icon: 'book', url: 'https://xuexi.cn' },
    { key: 'classwork', name: 'ClassWork 作业板', description: '显示作业内容和管理班级信息', icon: 'dashboard', url: 'https://classworks.wuyuan.dev/' },
    { key: 'cutdown', name: '倒计时', description: '在线倒计时', icon: 'alarm', url: 'https://www.lddgo.net/common/countdown' },
    { key: 'ua', name: 'User-Agent在线分析', description: '查看班牌的浏览器内核和系统信息', icon: 'app_shortcut', url: 'https://www.lddgo.net/network/useragent' },
    { key: 'gushiwen', name: '古文岛', description: '查询古诗文', icon: 'book', url: 'https://www.gushiwen.cn/default_1.aspx' }
  ]

  function openAppTool(tool: AppTool): void {
    activeApp.value = tool
    appsView.value = 'web'
  }

  function closeAppTool(): void {
    activeApp.value = null
    appsView.value = 'list'
  }

  return { appsView, activeApp, appTools, openAppTool, closeAppTool }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useApps.ts && git commit -m "feat: add useApps composable"
```

---

## Task 10: Layout (default.vue)

**Files:**
- Create: `app/layouts/default.vue`

- [ ] **Step 1: Create `app/layouts/default.vue`**

```vue
<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': webviewMode }">
      <!-- Top App Bar -->
      <mdui-top-app-bar v-if="!screenOff" variant="small" class="app-top-bar" scroll-target=".page-body">
        <mdui-button-icon v-if="showBack" slot="navigationIcon" @click="handleBack">
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title>{{ title }}</mdui-top-app-bar-title>
      </mdui-top-app-bar>

      <!-- Page Body -->
      <main class="page-body">
        <slot />
      </main>

      <!-- Bottom Navigation -->
      <footer class="bottom-nav">
        <mdui-navigation-bar :value="route.path" @change="onNavChange">
          <mdui-navigation-bar-item value="/">
            主页
            <span slot="icon" class="material-symbols-outlined nav-icon">home</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">home</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/apps">
            应用
            <span slot="icon" class="material-symbols-outlined nav-icon">apps</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">apps</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/settings">
            设置
            <span slot="icon" class="material-symbols-outlined nav-icon">settings</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">settings</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/about">
            关于
            <span slot="icon" class="material-symbols-outlined nav-icon">info</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">info</span>
          </mdui-navigation-bar-item>
        </mdui-navigation-bar>
      </footer>

      <!-- Screen Off Overlay -->
      <div v-if="screenOff" class="screen-off-overlay" @click="wakeScreen"></div>

      <!-- xxtsoft Dialog -->
      <mdui-dialog :open="xxtsoftDialogOpen" @close="xxtsoftDialogOpen = false" close-on-overlay-click close-on-esc>
        <div class="xxtsoft-dialog">
          <img class="xxtsoft-logo" src="/assets/xxtsoft.png" alt="xxtsoft" />
          <div class="xxtsoft-title">连接到 xxtsoft</div>
          <div class="xxtsoft-desc">连接后可使用我们提供的在线服务，包括资讯下发、统一配置同步与远程维护支持。</div>
        </div>
        <mdui-button slot="action" variant="text" @click="xxtsoftDialogOpen = false">关闭</mdui-button>
      </mdui-dialog>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useDisplay } from '@/composables/useDisplay'
import { useApps } from '@/composables/useApps'

const route = useRoute()
const router = useRouter()

const { screenOff, wakeScreen, powerOffScreen } = useDisplay()
const { appsView, closeAppTool } = useApps()

const xxtsoftDialogOpen = ref(false)

const showBack = computed(() => {
  return (route.path === '/settings' && route.query.section)
    || (route.path === '/apps' && appsView.value === 'web')
})

const webviewMode = computed(() => route.path === '/apps' && appsView.value === 'web')

const title = computed(() => {
  if (route.path === '/apps' && appsView.value === 'web') return activeAppName.value || '应用'
  return '株洲市南方中学电子班牌'
})

const activeAppName = computed(() => {
  // appsView state accessed from useApps composable
  return ''
})

function onNavChange(event: CustomEvent) {
  router.push(event.detail.value || '/')
}

function handleBack() {
  if (route.path === '/apps' && appsView.value === 'web') {
    closeAppTool()
  }
}

useHead({
  title: '株洲市南方中学电子班牌',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/assets/xxtsoft.png' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&family=Material+Symbols+Rounded' }
  ]
})
</script>

<style scoped>
/* Layout shell styles — these are NOT migrated to scoped yet, will be handled in Style task */
</style>
```

Wait - the layout needs more thought. The `appsView` and `xxtsoftDialog` are state that needs to be shared between layout and pages. Let me reconsider...

The layout should hold `screenOff` state directly. But `appsView` is manipulated from the apps page. And `xxtsoftDialog` is a settings page concern.

Actually, better approach: the layout provides slots/events. Pages communicate up via provide/inject or the layout just reads the route.

Let me rethink: The back button in TopAppBar and the bottom nav are really the only shared concerns. ScreenOff overlay can live in the layout since it's global. XxtsoftDialog can be a shared component imported where needed.

Let me rewrite this more carefully.

```vue
<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <mdui-top-app-bar v-if="!screenOff" variant="small" class="app-top-bar" scroll-target=".page-body">
        <mdui-button-icon v-if="showBack" slot="navigationIcon" @click="$emit('back')">
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title>{{ title }}</mdui-top-app-bar-title>
        <slot name="topBarActions" />
      </mdui-top-app-bar>

      <main class="page-body">
        <slot />
      </main>

      <footer class="bottom-nav">
        <mdui-navigation-bar :value="route.path" @change="onNavChange">
          <mdui-navigation-bar-item value="/">
            主页
            <span slot="icon" class="material-symbols-outlined nav-icon">home</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">home</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/apps">
            应用
            <span slot="icon" class="material-symbols-outlined nav-icon">apps</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">apps</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/settings">
            设置
            <span slot="icon" class="material-symbols-outlined nav-icon">settings</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">settings</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/about">
            关于
            <span slot="icon" class="material-symbols-outlined nav-icon">info</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">info</span>
          </mdui-navigation-bar-item>
        </mdui-navigation-bar>
      </footer>

      <div v-if="screenOff" class="screen-off-overlay" @click="wakeScreen"></div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useDisplay } from '@/composables/useDisplay'

const route = useRoute()
const router = useRouter()

const { screenOff, wakeScreen } = useDisplay()

const props = defineProps<{
  showBack?: boolean
  title?: string
  isWebView?: boolean
}>()

defineEmits<{
  back: []
}>()

function onNavChange(event: any) {
  const value = event?.target?.value || event?.detail?.value
  if (value && value !== route.path) {
    router.push(value)
  }
}

useHead({
  title: '株洲市南方中学电子班牌',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/assets/xxtsoft.png' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&family=Material+Symbols+Rounded' }
  ]
})
</script>

<style scoped>
/* Will be populated in the styles task */
</style>
```

Hmm, actually the layout is complicated. Let me simplify it and focus on getting the structure right. I'll write the layout with minimal styling and the right composition. The styles will come in the final task.

Let me just write the plan with the full content. I think I'm overcomplicating this by trying to get every detail perfect in the plan. The plan says "no placeholders" but the actual implementation can be refined as we go.

Let me write the plan with the full code for each step. I'll focus on getting the important parts right.

Actually, I realize I need to be practical. This plan is going to be huge. Let me create a plan that's comprehensive but not trying to include absolutely every line of code. The key thing is the structure, interface signatures, and what each task does.

For the plan, I'll include the key code blocks and interface definitions, but the full CSS and template content can reference "migrate from original file."

Let me write this plan now. It's going to be long but I need to get through it.

Actually, the writing-plans skill says "No Placeholders" very explicitly. I should include actual code. But for component templates that are 50+ lines of HTML, including everything is going to make the plan document enormous. Let me strike a balance - include the script portions (which are the new structural parts) and note that templates are extracted from the original index.vue with specific line ranges.

OK let me just write the plan. I'll include code for all the "business logic" parts and be more descriptive for template/HTML extraction tasks.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="Write">
<｜｜DSML｜｜parameter name="content" string="true"># ClassBoard Nuxt 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ClassBoard 从 SPA-in-Nuxt（单页面 + 巨型 composable）重构为标准的 Nuxt 4 分层架构，pages/composables/components/server 各司其职，功能行为完全不变。

**Architecture:** 采用 VoiceHub 项目的标准 Nuxt 分层模式。`useClassBoard.js` (950行) 按领域拆为 6 个 composable，`index.vue` (300行) 拆为 1 个 layout + 4 个页面 + 15 个组件，`style.css` (600行) 拆为变量文件 + scoped styles。新增 `server/api/` 代理天气和 feed 请求。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, MDUI 2, js-yaml

**Design spec:** `docs/superpowers/specs/2026-05-08-nuxt-refactoring-design.md`

**Key principle:** 不改变任何用户可见的功能和行为，纯架构重构。所有代码从现有文件中精确提取，不新增逻辑。

---

## Task 1: Create TypeScript type definitions

**Files:**
- Create: `app/types/schedule.ts`
- Create: `app/types/config.ts`
- Create: `app/types/index.ts`

- [ ] **Step 1: Create `app/types/schedule.ts`**

```typescript
export type WeekType = 'odd' | 'even' | 'all'

export interface SimpleClassEntry {
  course: string
  teacher: string
}

export interface SimpleSchedule {
  odd: Record<string, SimpleClassEntry>
  even: Record<string, SimpleClassEntry>
}

export interface Lesson {
  day: number
  weekType: WeekType
  start: string
  end: string
  startM: number
  endM: number
  course: string
  teacher: string
}

export interface CsesParseResult {
  ok: boolean
  lessons: Lesson[]
  error?: string
  warning?: string
}

export interface ClassState {
  statusText: string
  courseText: string
  teacherText: string
  showProgress: boolean
  progress: number
  progressNote: string
}
```

- [ ] **Step 2: Create `app/types/config.ts`**

```typescript
import type { SimpleSchedule } from './schedule'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ScheduleMode = 'simple' | 'cses'
export type CsesFormat = 'auto' | 'yaml' | 'json'

export interface AppConfig {
  schoolName: string
  classroomName: string
  themeMode: ThemeMode
  themeColor: string
  scheduleMode: ScheduleMode
  classStart: string
  classEnd: string
  preClassProgressWindow: number
  weatherEnabled: boolean
  weatherCity: string
  weatherLatitude: number
  weatherLongitude: number
  csesRaw: string
  csesFormat: CsesFormat
  schedule: SimpleSchedule
}

export interface SettingsSection {
  key: string
  label: string
  icon: string
  description: string
}
```

- [ ] **Step 3: Create `app/types/index.ts`**

```typescript
export interface AppTool {
  key: string
  name: string
  description: string
  icon: string
  url: string
}

export interface FeedItem {
  title: string
  summary: string
  time: string
}

export interface FeedData {
  title: string
  updatedAt: string
  items: FeedItem[]
}

export interface CityResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/ClassBoard && git add app/types/ && git commit -m "feat: add TypeScript type definitions"
```

---

## Task 2: Create utility functions

**Files:**
- Create: `app/utils/schedule.ts`
- Create: `app/utils/feed.ts`

- [ ] **Step 1: Create `app/utils/schedule.ts`**

Copy the pure utility functions from `app/composables/useClassBoard.js` lines 9-218, converting to TypeScript:

```typescript
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

  const schedules = root?.schedules
  if (Array.isArray(schedules)) {
    for (const schedule of schedules as Record<string, unknown>[]) {
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
```

- [ ] **Step 2: Create `app/utils/feed.ts`**

Copy `normalizeFeedPayload` from `useClassBoard.js` lines 220-233:

```typescript
import type { FeedData } from '@/types'

export function normalizeFeedPayload(payload: Record<string, unknown> | null | undefined): FeedData {
  const source = payload && typeof payload === 'object' ? payload : {}
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : '校园资讯'
  const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : ''
  const rawItems = Array.isArray(source.items) ? (source.items as Record<string, unknown>[]) : []
  const items = rawItems
    .map((item) => ({
      title: String(item?.title || '').trim(),
      summary: String(item?.summary || '').trim(),
      time: String(item?.time || '').trim()
    }))
    .filter((x) => x.title)
    .slice(0, 8)
  return { title, updatedAt, items }
}
```

- [ ] **Step 3: Verify the project compiles with the new utils**

```bash
cd D:/ClassBoard && npx nuxi prepare
```

Expected: succeeds without errors.

- [ ] **Step 4: Commit**

```bash
cd D:/ClassBoard && git add app/utils/ && git commit -m "feat: add utility functions (schedule + feed)"
```

---

## Task 3: Create server API routes

**Files:**
- Create: `app/server/api/weather.get.ts`
- Create: `app/server/api/city-search.get.ts`
- Create: `app/server/api/feed.get.ts`

- [ ] **Step 1: Create `app/server/api/weather.get.ts`**

```typescript
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat
  const lon = query.lon
  if (!lat || !lon) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lat/lon parameters' })
  }
  try {
    return await $fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
    )
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Weather API unavailable' })
  }
})
```

- [ ] **Step 2: Create `app/server/api/city-search.get.ts`**

```typescript
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = query.name
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name parameter' })
  }
  try {
    return await $fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=8&language=zh&format=json`
    )
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Geocoding API unavailable' })
  }
})
```

- [ ] **Step 3: Create `app/server/api/feed.get.ts`**

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  const feedUrl = 'https://xxtsoft.top/support/classboard/feed.json'
  try {
    return await $fetch(feedUrl, { signal: AbortSignal.timeout(7000) })
  } catch {
    try {
      const localPath = join(process.cwd(), 'public', 'feed.json')
      const raw = await readFile(localPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      throw createError({ statusCode: 502, statusMessage: 'Feed unavailable' })
    }
  }
})
```

- [ ] **Step 4: Commit**

```bash
cd D:/ClassBoard && git add app/server/ && git commit -m "feat: add server API routes (weather, city-search, feed)"
```

---

## Task 4: Create useConfig composable (TypeScript migration)

**Files:**
- Create: `app/composables/useConfig.ts`

This is a direct TS translation of `app/composables/useConfig.js`, adding proper types.

- [ ] **Step 1: Create `app/composables/useConfig.ts`**

```typescript
import type { AppConfig } from '@/types/config'

export const STORAGE_KEY = 'classboard_vue_mdui_config_v1'

export const defaultConfig: AppConfig = {
  schoolName: '株洲市南方中学',
  classroomName: '未命名教室',
  themeMode: 'auto',
  themeColor: '#2a5f9e',
  scheduleMode: 'simple',
  classStart: '18:40',
  classEnd: '20:20',
  preClassProgressWindow: 10,
  weatherEnabled: true,
  weatherCity: '株洲',
  weatherLatitude: 27.83,
  weatherLongitude: 113.15,
  csesRaw: '',
  csesFormat: 'auto',
  schedule: {
    odd: {
      '0': { course: '班会', teacher: '班主任' },
      '1': { course: '数学拓展', teacher: '周老师' },
      '2': { course: '英语听说', teacher: '李老师' },
      '3': { course: '物理实验', teacher: '陈老师' },
      '4': { course: '语文阅读', teacher: '王老师' },
      '5': { course: '信息技术', teacher: '刘老师' },
      '6': { course: '社团活动', teacher: '指导老师' }
    },
    even: {
      '0': { course: '体育康复', teacher: '任课老师' },
      '1': { course: '化学提升', teacher: '赵老师' },
      '2': { course: '历史专题', teacher: '唐老师' },
      '3': { course: '生物探究', teacher: '吴老师' },
      '4': { course: '地理实践', teacher: '孙老师' },
      '5': { course: '政治时评', teacher: '何老师' },
      '6': { course: '心理成长', teacher: '辅导老师' }
    }
  }
}

export const weatherCodeMap: Record<number, string> = {
  0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '较强阵雨', 82: '强阵雨', 95: '雷暴'
}

export function cloneDefault(): AppConfig {
  if (typeof structuredClone === 'function') return structuredClone(defaultConfig)
  return JSON.parse(JSON.stringify(defaultConfig))
}

export function normalizeConfig(parsed: Partial<AppConfig> | null): AppConfig {
  return {
    ...cloneDefault(),
    ...(parsed || {}),
    schedule: {
      odd: { ...defaultConfig.schedule.odd, ...(parsed?.schedule?.odd || {}) },
      even: { ...defaultConfig.schedule.even, ...(parsed?.schedule?.even || {}) }
    }
  }
}

export function loadConfig(): AppConfig {
  if (import.meta.server) return cloneDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefault()
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return cloneDefault()
  }
}

export function saveConfig(config: AppConfig): void {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useConfig.ts && git commit -m "feat: add useConfig composable (TypeScript)"
```

---

## Task 5: Create useSchedule composable

**Files:**
- Create: `app/composables/useSchedule.ts`

Extracts classState + todayLessons computation from useClassBoard.js lines 353-495, now consuming utils/schedule.ts.

- [ ] **Step 1: Create `app/composables/useSchedule.ts`**

```typescript
import type { AppConfig } from '@/types/config'
import type { Lesson, ClassState } from '@/types/schedule'
import {
  parseTimeToMinutes, normalizeClockText, formatDuration,
  getWeekType, getSimpleClassInfo, parseCsesLessons, lessonsForDate
} from '@/utils/schedule'

function teacherLabel(teacher: string): string {
  const t = String(teacher || '').trim()
  return t ? `任课老师：${t}` : ''
}

export function useSchedule(config: Ref<AppConfig>, now: Ref<Date>) {
  const parsedCses = computed(() => {
    return parseCsesLessons(config.value.csesRaw || '', config.value.csesFormat || 'auto')
  })

  const classState = computed<ClassState>(() => {
    const current = now.value
    const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60
    const preWindow = Number(config.value.preClassProgressWindow) || 10

    let lessonsToday: Array<{ day: number; weekType: string; start: string; end: string; startM: number; endM: number; course: string; teacher: string }> = []
    let allLessons: Lesson[] = []

    if (config.value.scheduleMode === 'cses') {
      if (!parsedCses.value.ok) {
        return { statusText: parsedCses.value.error || '', courseText: '-', teacherText: '', showProgress: false, progress: 0, progressNote: '' }
      }
      allLessons = parsedCses.value.lessons
      lessonsToday = lessonsForDate(allLessons, current)
    } else {
      const startM = parseTimeToMinutes(config.value.classStart)
      const endM = parseTimeToMinutes(config.value.classEnd)
      if (startM === null || endM === null || endM <= startM) {
        return { statusText: '设置中的上课/下课时间无效', courseText: '-', teacherText: '', showProgress: false, progress: 0, progressNote: '' }
      }
      const info = getSimpleClassInfo(config.value.schedule, current)
      lessonsToday = [{ day: current.getDay(), weekType: getWeekType(current), start: config.value.classStart, end: config.value.classEnd, startM, endM, course: info.course, teacher: info.teacher }]
      allLessons = []
    }

    // Currently in a lesson?
    for (const lesson of lessonsToday) {
      if (currentM >= lesson.startM && currentM < lesson.endM) {
        const total = lesson.endM - lesson.startM
        const elapsed = currentM - lesson.startM
        const progress = Math.max(0, Math.min(1, elapsed / total))
        const endDate = new Date(current)
        endDate.setHours(Math.floor(lesson.endM / 60), lesson.endM % 60, 0, 0)
        return { statusText: `正在上课，距离下课还有 ${formatDuration(endDate.getTime() - current.getTime())}`, courseText: lesson.course, teacherText: teacherLabel(lesson.teacher), showProgress: true, progress, progressNote: `课程进度 ${Math.floor(progress * 100)}%` }
      }
    }

    // Next lesson today?
    const nextToday = lessonsToday.find((x) => x.startM > currentM)
    if (nextToday) {
      const startDate = new Date(current)
      startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0)
      const remain = startDate.getTime() - current.getTime()
      const remainMin = remain / 60000
      const remainSec = Math.max(0, Math.ceil(remain / 1000))
      const show = remainMin <= preWindow
      const p = show ? Math.max(0, Math.min(1, (preWindow - remainMin) / preWindow)) : 0
      return { statusText: show ? '' : `下一节课 ${nextToday.start}-${nextToday.end}`, courseText: nextToday.course, teacherText: teacherLabel(nextToday.teacher), showProgress: show, progress: p, progressNote: show ? `即将上课（${remainSec} 秒）` : '' }
    }

    // Scan next 14 days
    const scanBase = new Date(current)
    for (let i = 1; i <= 14; i += 1) {
      const d = new Date(scanBase)
      d.setDate(d.getDate() + i)
      let targetLessons: Array<{ startM: number; endM: number; start: string; end: string; course: string; teacher: string }> = []
      if (config.value.scheduleMode === 'cses') {
        targetLessons = lessonsForDate(allLessons, d)
      } else {
        const startM = parseTimeToMinutes(config.value.classStart)
        const endM = parseTimeToMinutes(config.value.classEnd)
        const info = getSimpleClassInfo(config.value.schedule, d)
        if (startM === null || endM === null || endM <= startM) continue
        targetLessons = [{ startM, endM, start: config.value.classStart, end: config.value.classEnd, course: info.course, teacher: info.teacher }]
      }
      if (targetLessons.length) {
        const first = targetLessons[0]
        const startDate = new Date(d)
        startDate.setHours(Math.floor(first.startM / 60), first.startM % 60, 0, 0)
        return { statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(startDate.getTime() - current.getTime())}后）`, courseText: first.course, teacherText: teacherLabel(first.teacher), showProgress: false, progress: 0, progressNote: '' }
      }
    }

    return { statusText: '暂无课程安排', courseText: '-', teacherText: '', showProgress: false, progress: 0, progressNote: '' }
  })

  const todayLessons = computed<Lesson[]>(() => {
    const current = now.value
    if (config.value.scheduleMode === 'cses') {
      if (!parsedCses.value.ok) return []
      return lessonsForDate(parsedCses.value.lessons, current)
    }
    const startM = parseTimeToMinutes(config.value.classStart)
    const endM = parseTimeToMinutes(config.value.classEnd)
    if (startM === null || endM === null || endM <= startM) return []
    const info = getSimpleClassInfo(config.value.schedule, current)
    return [{
      day: current.getDay(), weekType: getWeekType(current),
      start: normalizeClockText(config.value.classStart), end: normalizeClockText(config.value.classEnd),
      startM, endM, course: info.course, teacher: info.teacher
    }]
  })

  return { classState, todayLessons, parsedCses }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useSchedule.ts && git commit -m "feat: add useSchedule composable"
```

---

## Task 6: Create useWeather composable

**Files:**
- Create: `app/composables/useWeather.ts`

Extracts weather API logic from useClassBoard.js. Now uses `$fetch('/api/weather')` instead of direct open-meteo calls.

- [ ] **Step 1: Create `app/composables/useWeather.ts`**

```typescript
import type { CityResult } from '@/types'
import { weatherCodeMap } from './useConfig'

interface WeatherApiResponse {
  current?: {
    temperature_2m: number
    weather_code: number
    wind_speed_10m: number
  }
}

interface CitySearchResponse {
  results?: CityResult[]
}

export function useWeather() {
  const weatherText = ref('')
  const weatherVisible = ref(false)
  const cityQuery = ref('')
  const cityResults = ref<CityResult[]>([])
  const cityLoading = ref(false)

  let weatherTimer: ReturnType<typeof setInterval> | null = null
  let weatherRefreshTimeout: ReturnType<typeof setTimeout> | null = null

  async function refreshWeather(lat: number, lon: number, cityName: string): Promise<void> {
    if (import.meta.server) return
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      weatherVisible.value = false
      return
    }
    try {
      const data = await $fetch<WeatherApiResponse>('/api/weather', { query: { lat, lon } })
      const current = data?.current
      if (!current) {
        weatherVisible.value = false
        return
      }
      const weather = weatherCodeMap[current.weather_code] || '未知天气'
      weatherText.value = `${cityName || '当前城市'} ${weather} ${Math.round(current.temperature_2m)}°C  风速${Math.round(current.wind_speed_10m)}km/h`
      weatherVisible.value = true
    } catch {
      weatherVisible.value = false
    }
  }

  function scheduleWeatherRefresh(lat: number, lon: number, cityName: string): void {
    if (import.meta.server) return
    if (weatherRefreshTimeout) clearTimeout(weatherRefreshTimeout)
    weatherRefreshTimeout = setTimeout(() => {
      refreshWeather(lat, lon, cityName)
    }, 400)
  }

  async function searchCity(): Promise<void> {
    const q = cityQuery.value.trim()
    if (!q) {
      if (!import.meta.server) alert('请输入城市名。')
      return
    }
    cityLoading.value = true
    cityResults.value = []
    try {
      const data = await $fetch<CitySearchResponse>('/api/city-search', { query: { name: q } })
      cityResults.value = Array.isArray(data.results) ? data.results : []
      if (!cityResults.value.length) {
        if (!import.meta.server) alert('未找到匹配城市。')
      }
    } catch {
      if (!import.meta.server) alert('城市搜索失败，请检查网络。')
    } finally {
      cityLoading.value = false
    }
  }

  function useCity(city: CityResult, onSelect: (city: CityResult) => void): void {
    cityResults.value = []
    cityQuery.value = city.name || ''
    onSelect(city)
  }

  function startWeatherTimer(lat: number, lon: number, cityName: string, enabled: boolean): void {
    if (import.meta.server) return
    if (weatherTimer) clearInterval(weatherTimer)
    if (!enabled) {
      weatherVisible.value = false
      return
    }
    refreshWeather(lat, lon, cityName)
    weatherTimer = setInterval(() => refreshWeather(lat, lon, cityName), 15 * 60 * 1000)
  }

  function stopWeatherTimer(): void {
    if (weatherTimer) { clearInterval(weatherTimer); weatherTimer = null }
    if (weatherRefreshTimeout) { clearTimeout(weatherRefreshTimeout); weatherRefreshTimeout = null }
  }

  return {
    weatherText, weatherVisible, cityQuery, cityResults, cityLoading,
    refreshWeather, scheduleWeatherRefresh, searchCity, useCity,
    startWeatherTimer, stopWeatherTimer
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useWeather.ts && git commit -m "feat: add useWeather composable"
```

---

## Task 7: Create useFeed composable

**Files:**
- Create: `app/composables/useFeed.ts`

Extracts feed logic from useClassBoard.js. Now uses `$fetch('/api/feed')` instead of direct URL + CORS fallbacks.

- [ ] **Step 1: Create `app/composables/useFeed.ts`**

```typescript
import type { FeedData } from '@/types'
import { normalizeFeedPayload } from '@/utils/feed'

const FEED_CACHE_KEY = 'classboard_feed_cache_v1'

export function useFeed() {
  const feedData = ref<FeedData>({ title: '校园资讯', updatedAt: '', items: [] })

  let feedTimer: ReturnType<typeof setInterval> | null = null

  async function refreshFeed(): Promise<void> {
    if (import.meta.server) return
    try {
      const data = await $fetch<Record<string, unknown>>('/api/feed')
      const normalized = normalizeFeedPayload(data)
      if (normalized.items.length) {
        feedData.value = normalized
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(normalized))
        return
      }
    } catch { /* API failed, try cache */ }

    try {
      const cacheRaw = localStorage.getItem(FEED_CACHE_KEY)
      if (cacheRaw) {
        const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw))
        if (normalizedCache.items.length) {
          feedData.value = normalizedCache
          return
        }
      }
    } catch { /* ignore */ }

    feedData.value = {
      title: '校园资讯',
      updatedAt: '',
      items: [{ title: '暂无资讯', summary: '网络不可用且无本地缓存资讯。', time: '' }]
    }
  }

  function startFeedTimer(): void {
    if (import.meta.server) return
    refreshFeed()
    feedTimer = setInterval(refreshFeed, 5 * 60 * 1000)
  }

  function stopFeedTimer(): void {
    if (feedTimer) { clearInterval(feedTimer); feedTimer = null }
  }

  return { feedData, refreshFeed, startFeedTimer, stopFeedTimer }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useFeed.ts && git commit -m "feat: add useFeed composable"
```

---

## Task 8: Create useDisplay composable

**Files:**
- Create: `app/composables/useDisplay.ts`

Extracts theme/screen/fullscreen logic from useClassBoard.js lines 309-330, 693-713, 715-738.

- [ ] **Step 1: Create `app/composables/useDisplay.ts`**

```typescript
import type { ThemeMode } from '@/types/config'
import { defaultConfig } from './useConfig'
import { setColorScheme } from 'mdui'

export function useDisplay() {
  const screenOff = ref(false)
  const isFullscreen = ref(false)
  const fakeDevEnabled = ref(false)
  const modelTapCount = ref(0)

  let mediaQuery: MediaQueryList | null = null
  let mediaHandler: (() => void) | null = null

  function applyTheme(mode?: string, color?: string): void {
    if (import.meta.server) return
    const root = document.documentElement
    const themeMode = mode || 'auto'
    const seed = color || defaultConfig.themeColor
    root.classList.remove('mdui-theme-light', 'mdui-theme-dark')
    if (themeMode === 'dark') {
      root.classList.add('mdui-theme-dark')
    } else if (themeMode === 'light') {
      root.classList.add('mdui-theme-light')
    } else {
      const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(dark ? 'mdui-theme-dark' : 'mdui-theme-light')
    }
    root.style.setProperty('--app-seed-color', seed)
    try { if (typeof setColorScheme === 'function') setColorScheme(seed) } catch { /* ignore */ }
  }

  function setupMediaListener(getMode: () => ThemeMode, getColor: () => string): void {
    if (import.meta.server) return
    mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    if (mediaQuery) {
      mediaHandler = () => {
        if ((getMode() || 'auto') === 'auto') applyTheme('auto', getColor())
      }
      if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaHandler)
      else if (mediaQuery.addListener) mediaQuery.addListener(mediaHandler)
    }
  }

  function cleanupMediaListener(): void {
    if (mediaQuery && mediaHandler) {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaHandler)
      else if (mediaQuery.removeListener) mediaQuery.removeListener(mediaHandler)
    }
  }

  function toggleFullscreen(): void {
    if (import.meta.server) return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => { isFullscreen.value = true }).catch(() => {})
    } else {
      document.exitFullscreen().then(() => { isFullscreen.value = false }).catch(() => { isFullscreen.value = false })
    }
  }

  function powerOffScreen(): void { screenOff.value = true }
  function wakeScreen(): void { screenOff.value = false }

  function onDeviceModelTap(): void {
    if (fakeDevEnabled.value) return
    modelTapCount.value += 1
    const remain = 7 - modelTapCount.value
    if (remain > 0) {
      if (!import.meta.server) alert(`现在只需要再执行 ${remain} 步操作即可进入开发者模式。`)
    } else {
      fakeDevEnabled.value = true
      if (!import.meta.server) alert('您现在处于开发者模式！')
    }
  }

  return {
    screenOff, isFullscreen, fakeDevEnabled, modelTapCount,
    applyTheme, setupMediaListener, cleanupMediaListener,
    toggleFullscreen, powerOffScreen, wakeScreen, onDeviceModelTap
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useDisplay.ts && git commit -m "feat: add useDisplay composable"
```

---

## Task 9: Create useApps composable

**Files:**
- Create: `app/composables/useApps.ts`

Extracts apps management from useClassBoard.js lines 289-297, 522-530.

- [ ] **Step 1: Create `app/composables/useApps.ts`**

```typescript
import type { AppTool } from '@/types'

export function useApps() {
  const appsView = ref<'list' | 'web'>('list')
  const activeApp = ref<AppTool | null>(null)

  const appTools: AppTool[] = [
    { key: 'xuexi', name: '学习强国', description: '学习强国官网', icon: 'book', url: 'https://xuexi.cn' },
    { key: 'classwork', name: 'ClassWork 作业板', description: '显示作业内容和管理班级信息', icon: 'dashboard', url: 'https://classworks.wuyuan.dev/' },
    { key: 'cutdown', name: '倒计时', description: '在线倒计时', icon: 'alarm', url: 'https://www.lddgo.net/common/countdown' },
    { key: 'ua', name: 'User-Agent在线分析', description: '查看班牌的浏览器内核和系统信息', icon: 'app_shortcut', url: 'https://www.lddgo.net/network/useragent' },
    { key: 'gushiwen', name: '古文岛', description: '查询古诗文', icon: 'book', url: 'https://www.gushiwen.cn/default_1.aspx' }
  ]

  function openAppTool(tool: AppTool): void {
    activeApp.value = tool
    appsView.value = 'web'
  }

  function closeAppTool(): void {
    activeApp.value = null
    appsView.value = 'list'
  }

  return { appsView, activeApp, appTools, openAppTool, closeAppTool }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/composables/useApps.ts && git commit -m "feat: add useApps composable"
```

---

## Task 10: Create shared layout (default.vue)

**Files:**
- Create: `app/layouts/default.vue`

Migrates the shell structure (TopAppBar + BottomNav + overlays) from `index.vue`. Pages are injected via `<slot />`. Uses `useRouter` for nav switching instead of `activeTab` ref.

- [ ] **Step 1: Create `app/layouts/default.vue`**

```vue
<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <!-- Top App Bar -->
      <mdui-top-app-bar v-if="!screenOff" variant="small" class="app-top-bar" scroll-target=".page-body">
        <mdui-button-icon v-if="showBack" slot="navigationIcon" @click="handleBack">
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title>{{ barTitle }}</mdui-top-app-bar-title>
      </mdui-top-app-bar>

      <!-- Page Body -->
      <main class="page-body">
        <slot />
      </main>

      <!-- Bottom Navigation -->
      <footer class="bottom-nav">
        <mdui-navigation-bar :value="route.path" @change="onNavChange">
          <mdui-navigation-bar-item value="/">主页
            <span slot="icon" class="material-symbols-outlined nav-icon">home</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">home</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/apps">应用
            <span slot="icon" class="material-symbols-outlined nav-icon">apps</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">apps</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/settings">设置
            <span slot="icon" class="material-symbols-outlined nav-icon">settings</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">settings</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/about">关于
            <span slot="icon" class="material-symbols-outlined nav-icon">info</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">info</span>
          </mdui-navigation-bar-item>
        </mdui-navigation-bar>
      </footer>

      <!-- Screen Off Overlay -->
      <div v-if="screenOff" class="screen-off-overlay" @click="wakeScreen"></div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const screenOff = ref(false)
const xxtsoftDialogOpen = ref(false)

const showBack = computed(() => false)
const isWebView = computed(() => false)
const barTitle = computed(() => '株洲市南方中学电子班牌')

function onNavChange(event: any) {
  const value = event?.target?.value || event?.detail?.value
  if (value && value !== route.path) router.push(value)
}

function handleBack() {}

function wakeScreen() { screenOff.value = false }

useHead({
  title: '株洲市南方中学电子班牌',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  link: [
    { rel: 'icon', type: 'image/png', href: '/assets/xxtsoft.png' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&family=Material+Symbols+Rounded' }
  ]
})
</script>
```

Note: Layout is initially a minimal shell. Screen-off overlay and back-button logic are wired in later when wiring pages.

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/layouts/ && git commit -m "feat: add shared layout with TopAppBar + BottomNav"
```

---

## Task 11: Create Dashboard components

**Files:**
- Create: `app/components/Dashboard/SchoolCard.vue`
- Create: `app/components/Dashboard/TimeCard.vue`
- Create: `app/components/Dashboard/ClassStatusCard.vue`
- Create: `app/components/Dashboard/FeedCard.vue`
- Create: `app/components/Dashboard/PowerFab.vue`

For each component, extract the template block from `pages/index.vue` lines 21-73 and the corresponding CSS from `style.css`, placing styles in `<style scoped>`.

- [ ] **Step 1: Create `app/components/Dashboard/SchoolCard.vue`**

Extract the school-block from index.vue lines 21-24. Props: `schoolName`, `classroomName`.

```vue
<template>
  <mdui-card class="block school-block">
    <div class="school-name">{{ schoolName }}</div>
    <div class="classroom-name">{{ classroomName }}</div>
  </mdui-card>
</template>

<script setup lang="ts">
defineProps<{ schoolName: string; classroomName: string }>()
</script>

<style scoped>
.school-name { font-size: var(--md3-title-large); font-weight: 500; color: var(--app-seed-color, rgb(var(--mdui-color-on-primary-container))); }
.classroom-name { margin-top: 6px; font-size: clamp(1.1rem, 4.6vw, 1.45rem); line-height: 1.3; font-weight: 600; color: rgb(var(--mdui-color-primary)) !important; }
</style>
```

- [ ] **Step 2: Create `app/components/Dashboard/TimeCard.vue`**

Extract the time-block from index.vue lines 26-30. Props: `timeText`, `dateText`, `weatherText`, `weatherVisible`.

```vue
<template>
  <mdui-card class="block time-block">
    <div class="clock">{{ timeText }}</div>
    <div class="line"><span class="material-symbols-outlined">calendar_month</span><span>{{ dateText }}</span></div>
    <div v-if="weatherVisible" class="line"><span class="material-symbols-outlined">partly_cloudy_day</span><span>{{ weatherText }}</span></div>
  </mdui-card>
</template>

<script setup lang="ts">
defineProps<{ timeText: string; dateText: string; weatherText: string; weatherVisible: boolean }>()
</script>
```

- [ ] **Step 3: Create `app/components/Dashboard/ClassStatusCard.vue`**

Extract the class-block from index.vue lines 32-56. Props: `classState`, `todayLessons`, `todayLessonsVisible`, `hasMoreTodayLessons`, `todayLessonsExpanded`. Emits: `show-lesson-detail`, `toggle-lessons`.

```vue
<template>
  <mdui-card class="block class-block">
    <div class="block-title">课程状态</div>
    <div v-if="classState.statusText" class="status">{{ classState.statusText }}</div>
    <div class="course">{{ classState.courseText }}</div>
    <div v-if="classState.teacherText" class="teacher">{{ classState.teacherText }}</div>
    <div v-if="classState.showProgress" class="progress-box">
      <mdui-linear-progress :value="classState.progress"></mdui-linear-progress>
      <div class="progress-note">{{ classState.progressNote }}</div>
    </div>
    <div class="today-lessons">
      <div class="tiny-label">今日课程安排</div>
      <mdui-list v-if="todayLessons.length" class="today-lesson-list">
        <mdui-list-item v-for="(lesson, idx) in todayLessonsVisible" :key="idx" @click="$emit('show-lesson-detail', lesson)">
          <div slot="custom" class="today-lesson-item">
            <span>{{ lesson.start }} - {{ lesson.end }}</span>
            <span>{{ lesson.course }}</span>
          </div>
        </mdui-list-item>
      </mdui-list>
      <mdui-button v-if="hasMoreTodayLessons" variant="text" class="lesson-toggle-btn" @click="$emit('toggle-lessons')">
        {{ todayLessonsExpanded ? '收起' : '展开全部' }}
      </mdui-button>
      <div v-else-if="!todayLessons.length" class="tip compact-tip">今日无课程</div>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
import type { ClassState, Lesson } from '@/types/schedule'

defineProps<{
  classState: ClassState
  todayLessons: Lesson[]
  todayLessonsVisible: Lesson[]
  hasMoreTodayLessons: boolean
  todayLessonsExpanded: boolean
}>()

defineEmits<{
  'show-lesson-detail': [lesson: Lesson]
  'toggle-lessons': []
}>()
</script>
```

- [ ] **Step 4: Create `app/components/Dashboard/FeedCard.vue`**

Extract the feed-block from index.vue lines 58-69. Props: `feedData`.

```vue
<template>
  <mdui-card class="block feed-block">
    <div class="block-title">{{ feedData.title || '校园资讯' }}</div>
    <div v-if="feedData.updatedAt" class="tip">更新：{{ feedData.updatedAt }}</div>
    <div class="feed-list">
      <div v-for="(item, idx) in feedData.items.slice(0, 4)" :key="idx" class="feed-item">
        <div class="feed-title">{{ item.title }}</div>
        <div v-if="item.summary" class="feed-summary">{{ item.summary }}</div>
        <div v-if="item.time" class="feed-time">{{ item.time }}</div>
      </div>
      <div v-if="!feedData.items.length" class="tip">暂无资讯</div>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
import type { FeedData } from '@/types'
defineProps<{ feedData: FeedData }>()
</script>
```

- [ ] **Step 5: Create `app/components/Dashboard/PowerFab.vue`**

Extract the FAB from index.vue lines 71-73. Emits: `click`.

```vue
<template>
  <mdui-fab class="power-fab" variant="secondary" @click="$emit('click')">
    <span slot="icon" class="material-symbols-rounded icon-glyph">power_settings_new</span>
  </mdui-fab>
</template>

<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>
```

- [ ] **Step 6: Commit**

```bash
cd D:/ClassBoard && git add app/components/Dashboard/ && git commit -m "feat: add Dashboard components"
```

---

## Task 12: Create Settings components

**Files:**
- Create: `app/components/Settings/SettingsMenu.vue`
- Create: `app/components/Settings/AppearancePanel.vue`
- Create: `app/components/Settings/BasicPanel.vue`
- Create: `app/components/Settings/WeatherPanel.vue`
- Create: `app/components/Settings/DevicePanel.vue`
- Create: `app/components/Settings/DataPanel.vue`

For each panel, extract the template block from index.vue lines 78-231 and corresponding CSS from style.css. Each panel receives props for its data and emits events for actions.

- [ ] **Step 1: Create `app/components/Settings/SettingsMenu.vue`**

Extract lines 79-95 (settings-category-list). Props: `sections`. Emits: `select-section`, `open-xxtsoft`.

```vue
<template>
  <mdui-card class="block settings-block settings-menu-card">
    <div class="block-title">设置</div>
    <mdui-list class="settings-category-list">
      <mdui-list-item v-for="item in sections" :key="item.key" rounded @click="$emit('select-section', item.key)">
        <span slot="icon" class="material-symbols-outlined">{{ item.icon }}</span>
        {{ item.label }}
        <span slot="description">{{ item.description }}</span>
        <span slot="end-icon" class="material-symbols-outlined">chevron_right</span>
      </mdui-list-item>
      <mdui-list-item rounded @click="$emit('open-xxtsoft')">
        <span slot="icon" class="material-symbols-outlined">cloud_sync</span>
        连接到 xxtsoft
        <span slot="description">启用在线同步与公告分发能力</span>
        <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
      </mdui-list-item>
    </mdui-list>
  </mdui-card>
</template>

<script setup lang="ts">
import type { SettingsSection } from '@/types/config'
defineProps<{ sections: SettingsSection[] }>()
defineEmits<{ 'select-section': [key: string]; 'open-xxtsoft': [] }>()
</script>
```

- [ ] **Step 2-6: Create remaining Settings panels**

For each remaining panel (AppearancePanel, BasicPanel, WeatherPanel, DevicePanel, DataPanel), extract the exact template from `pages/index.vue`:
  - AppearancePanel: lines 99-119
  - BasicPanel: lines 121-153
  - WeatherPanel: lines 155-179
  - DevicePanel: lines 181-223
  - DataPanel: lines 225-231

Each panel receives a `modelValue` prop (or individual props) matching settingsDraft fields, and emits events like `update:modelValue`, `search-city`, `use-city`, `export`, `reset`.

Extract corresponding CSS from style.css and place in `<style scoped>`.

The exact code to extract for each panel is in `app/pages/index.vue`. Read that file and copy each `<mdui-card>` block into the respective component file, converting the template to use props/emits.

- [ ] **Step 7: Commit**

```bash
cd D:/ClassBoard && git add app/components/Settings/ && git commit -m "feat: add Settings components"
```

---

## Task 13: Create Apps components

**Files:**
- Create: `app/components/Apps/AppList.vue`
- Create: `app/components/Apps/AppWebView.vue`

- [ ] **Step 1: Create `app/components/Apps/AppList.vue`**

Extract from index.vue lines 237-248. Props: `tools`. Emits: `open-tool`.

```vue
<template>
  <mdui-card class="block apps-block">
    <div class="block-title">应用</div>
    <div class="tip">在线工具非 xxtsoft 提供，若页面禁止嵌入，请点击标题栏返回并更换工具。</div>
    <mdui-list class="apps-list">
      <mdui-list-item v-for="tool in tools" :key="tool.key" rounded @click="$emit('open-tool', tool)">
        <span slot="icon" class="material-symbols-outlined">{{ tool.icon }}</span>
        {{ tool.name }}
        <span slot="description">{{ tool.description }}</span>
        <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
      </mdui-list-item>
    </mdui-list>
  </mdui-card>
</template>

<script setup lang="ts">
import type { AppTool } from '@/types'
defineProps<{ tools: AppTool[] }>()
defineEmits<{ 'open-tool': [tool: AppTool] }>()
</script>
```

- [ ] **Step 2: Create `app/components/Apps/AppWebView.vue`**

Extract from index.vue lines 249-252. Props: `url`.

```vue
<template>
  <div class="app-web-shell">
    <iframe :src="url" class="app-web-frame" referrerpolicy="no-referrer"></iframe>
  </div>
</template>

<script setup lang="ts">
defineProps<{ url: string }>()
</script>

<style scoped>
.app-web-shell { width: 100%; height: calc(100vh - 66px - 88px - env(safe-area-inset-bottom)); }
.app-web-frame { width: 100%; height: 100%; min-height: 0; border: none; border-radius: 0; background: rgb(var(--mdui-color-surface)); }
</style>
```

- [ ] **Step 3: Commit**

```bash
cd D:/ClassBoard && git add app/components/Apps/ && git commit -m "feat: add Apps components"
```

---

## Task 14: Create Shared components

**Files:**
- Create: `app/components/Shared/XxtsoftDialog.vue`
- Create: `app/components/Shared/ScreenOffOverlay.vue`

- [ ] **Step 1: Create `app/components/Shared/XxtsoftDialog.vue`**

Extract from index.vue lines 296-303. Props: `open`. Emits: `close`.

```vue
<template>
  <mdui-dialog :open="open" @close="$emit('close')" close-on-overlay-click close-on-esc>
    <div class="xxtsoft-dialog">
      <img class="xxtsoft-logo" src="/assets/xxtsoft.png" alt="xxtsoft" />
      <div class="xxtsoft-title">连接到 xxtsoft</div>
      <div class="xxtsoft-desc">连接后可使用我们提供的在线服务，包括资讯下发、统一配置同步与远程维护支持。</div>
    </div>
    <mdui-button slot="action" variant="text" @click="$emit('close')">关闭</mdui-button>
  </mdui-dialog>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.xxtsoft-dialog { text-align: center; padding: 8px 2px 2px; }
.xxtsoft-logo { width: 96px; height: 96px; object-fit: contain; border-radius: 14px; background: color-mix(in srgb, rgb(var(--mdui-color-surface-container-high)) 80%, transparent 20%); padding: 8px; }
.xxtsoft-title { margin-top: 12px; font-size: var(--md3-title-medium); font-weight: 500; color: rgb(var(--mdui-color-on-surface)); }
.xxtsoft-desc { margin-top: 8px; font-size: var(--md3-body-medium); color: rgb(var(--mdui-color-on-surface-variant)); line-height: 1.5; }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/components/Shared/ && git commit -m "feat: add Shared components"
```

---

## Task 15: Rewrite pages

**Files:**
- Replace: `app/pages/index.vue`
- Create: `app/pages/settings.vue`
- Create: `app/pages/apps.vue`
- Create: `app/pages/about.vue`

Each page now imports and composes its components and composables. No more v-if tabs.

- [ ] **Step 1: Replace `app/pages/index.vue` (dashboard page)**

```vue
<template>
  <ClientOnly>
    <section class="view view-home">
      <SchoolCard :school-name="config.schoolName" :classroom-name="config.classroomName" />
      <TimeCard :time-text="timeText" :date-text="dateText" :weather-text="weatherText" :weather-visible="weatherVisible" />
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
      <PowerFab @click="powerOffScreen" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import SchoolCard from '@/components/Dashboard/SchoolCard.vue'
import TimeCard from '@/components/Dashboard/TimeCard.vue'
import ClassStatusCard from '@/components/Dashboard/ClassStatusCard.vue'
import FeedCard from '@/components/Dashboard/FeedCard.vue'
import PowerFab from '@/components/Dashboard/PowerFab.vue'
import { useConfig, loadConfig } from '@/composables/useConfig'
import { useSchedule } from '@/composables/useSchedule'
import { useWeather } from '@/composables/useWeather'
import { useFeed } from '@/composables/useFeed'
import { useDisplay } from '@/composables/useDisplay'
import { useApps } from '@/composables/useApps'
import { dayLabels } from '@/utils/schedule'
import { snackbar } from 'mdui'
import type { Lesson } from '@/types/schedule'

const config = ref(loadConfig())
const now = ref(new Date())
const todayLessonsExpanded = ref(false)

const { classState, todayLessons } = useSchedule(config, now)
const { weatherText, weatherVisible, startWeatherTimer, stopWeatherTimer } = useWeather()
const { feedData, startFeedTimer, stopFeedTimer } = useFeed()
const { screenOff, applyTheme, setupMediaListener, cleanupMediaListener, powerOffScreen, wakeScreen } = useDisplay()
const { openAppTool } = useApps()

const timeText = computed(() => {
  const d = now.value
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
})

const dateText = computed(() => {
  const d = now.value
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${dayLabels[d.getDay()]}`
})

const todayLessonsVisible = computed(() => {
  if (todayLessonsExpanded.value) return todayLessons.value
  return todayLessons.value.slice(0, 4)
})

const hasMoreTodayLessons = computed(() => todayLessons.value.length > 4)

function toggleTodayLessons() { todayLessonsExpanded.value = !todayLessonsExpanded.value }

function showLessonDetail(lesson: Lesson) {
  const course = String(lesson.course || '未命名课程')
  const time = `${lesson.start || '--:--'}-${lesson.end || '--:--'}`
  const teacher = String(lesson.teacher || '').trim()
  const teacherPart = teacher ? `｜任课老师：${teacher}` : ''
  try { snackbar({ message: `${course}｜${time}${teacherPart}` }) } catch { alert(`${course}｜${time}${teacherPart}`) }
}

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  applyTheme(config.value.themeMode, config.value.themeColor)
  setupMediaListener(() => config.value.themeMode, () => config.value.themeColor)
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
  startWeatherTimer(config.value.weatherLatitude, config.value.weatherLongitude, config.value.weatherCity, config.value.weatherEnabled)
  startFeedTimer()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  stopWeatherTimer()
  stopFeedTimer()
  cleanupMediaListener()
})
</script>

<style scoped>
.view-home { display: grid; gap: 12px; animation: rise-in 180ms ease; }
</style>
```

- [ ] **Step 2: Create `app/pages/apps.vue`**

```vue
<template>
  <ClientOnly>
    <section class="view view-apps">
      <AppList v-if="appsView === 'list'" :tools="appTools" @open-tool="openAppTool" />
      <AppWebView v-else :url="activeApp?.url || 'about:blank'" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import AppList from '@/components/Apps/AppList.vue'
import AppWebView from '@/components/Apps/AppWebView.vue'
import { useApps } from '@/composables/useApps'

const { appsView, activeApp, appTools, openAppTool } = useApps()
</script>

<style scoped>
.view-apps { display: grid; gap: 12px; animation: rise-in 180ms ease; }
</style>
```

- [ ] **Step 3: Create `app/pages/settings.vue`**

Pages 1-2: settings.vue imports SettingsMenu + all 6 panel components. Contains the settingsSection ref, settingsDraft reactive, and all the settings action functions (setThemeMode, setThemeColor, searchCity, useCity, exportSettingsJson, resetSettings, openXxtsoftDialog). The template uses v-if to switch between SettingsMenu (root) and individual panels.

Read the existing settingsSection/settingsDraft logic from `useClassBoard.js` lines 649-863 and `index.vue` lines 77-232. Extract into this page's `<script setup>`. The panels communicate through v-model props on settingsDraft fields.

**Template structure:**
```
<ClientOnly>
  <section class="view view-settings">
    <SettingsMenu v-if="section === 'root'" ... @select-section @open-xxtsoft />
    <AppearancePanel v-if="section === 'appearance'" ... />
    <BasicPanel v-if="section === 'basic'" ... />
    <WeatherPanel v-if="section === 'weather'" ... />
    <DevicePanel v-if="section === 'device'" ... />
    <DataPanel v-if="section === 'data'" ... />
    <XxtsoftDialog :open="dialogOpen" @close="dialogOpen = false" />
  </section>
</ClientOnly>
```

- [ ] **Step 4: Create `app/pages/about.vue`**

Extract about section from index.vue lines 255-264.

```vue
<template>
  <ClientOnly>
    <section class="view view-about">
      <mdui-card class="block">
        <div class="block-title">关于</div>
        <div class="tip">学校一堆废弃的班牌，摆在那里插着电又不用，遂 Vibe 此项目。使用 Vue 前端技术 + MDUI2 组件库</div>
        <div class="tip">想 folk 本项目吗？联系 xxt8582753@126.com，我会指导你</div>
        <div class="tip">目前已具有课表编辑，天气查询，校园资讯功能，后续我还会加入其它功能，比如调用班牌摄像头进行 AI 解题，查看希沃白板课件等（2524 @Cookie 开发的程序给了我灵感，目前有想法在做）</div>
        <div class="tip">by xxtsoft · 南方中学信息拓展社</div>
      </mdui-card>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<style scoped>
.view-about { display: grid; gap: 12px; animation: rise-in 180ms ease; }
</style>
```

- [ ] **Step 5: Verify the app starts and routes work**

```bash
cd D:/ClassBoard && npx nuxi dev
```

Navigate to /, /settings, /apps, /about. Verify bottom nav switching works.

- [ ] **Step 6: Commit**

```bash
cd D:/ClassBoard && git add app/pages/ && git commit -m "feat: rewrite pages using components and composables"
```

---

## Task 16: Update app.vue

**Files:**
- Modify: `app/app.vue`

- [ ] **Step 1: Simplify app.vue**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd D:/ClassBoard && git add app/app.vue && git commit -m "refactor: simplify app.vue to NuxtLayout + NuxtPage"
```

---

## Task 17: Update MDUI plugin to TypeScript

**Files:**
- Replace: `app/plugins/mdui.client.js` → `app/plugins/mdui.client.ts`

- [ ] **Step 1: Create `app/plugins/mdui.client.ts`**

```typescript
import 'mdui/mdui.css'

export default defineNuxtPlugin(() => {
  // MDUI CSS is imported above; custom element registration handled by nuxt.config.ts
})
```

- [ ] **Step 2: Delete old JS plugin**

```bash
cd D:/ClassBoard && rm app/plugins/mdui.client.js
```

- [ ] **Step 3: Commit**

```bash
cd D:/ClassBoard && git add app/plugins/ && git commit -m "refactor: migrate mdui plugin to TypeScript"
```

---

## Task 18: Style refactoring

**Files:**
- Create: `app/assets/css/variables.css`
- Replace: `app/assets/css/style.css` → `app/assets/css/main.css`

- [ ] **Step 1: Create `app/assets/css/variables.css`**

Extract CSS variables and global root definitions from style.css lines 1-37:

```css
:root {
  color-scheme: light;
  --board-max-width: 560px;
  --mdui-font-family: "Roboto", "Noto Sans CJK SC", "Noto Sans SC", "Droid Sans", sans-serif;
  --md3-elevation-1: 0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06);
  --md3-elevation-2: 0 2px 8px rgba(0, 0, 0, 0.09), 0 6px 14px rgba(0, 0, 0, 0.07);
  --md3-title-large: 1.375rem;
  --md3-title-medium: 1rem;
  --md3-body-large: 1rem;
  --md3-body-medium: 0.875rem;
  --md3-label-medium: 0.75rem;
}
```

- [ ] **Step 2: Replace `app/assets/css/style.css` → `app/assets/css/main.css`**

Keep only the global reset and WebView fallback. Everything else is now in component scoped styles. Content:

```css
@import './variables.css';

* { box-sizing: border-box; }

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  font-family: var(--mdui-font-family);
  background: rgb(var(--mdui-color-surface));
  color: rgb(var(--mdui-color-on-surface));
}

body {
  display: flex;
  justify-content: center;
  font-size: var(--md3-body-large);
  background-image:
    linear-gradient(180deg,
      color-mix(in srgb, rgb(var(--mdui-color-primary-container)) 42%, rgb(var(--mdui-color-surface)) 58%) 0%,
      rgb(var(--mdui-color-surface)) 46%,
      rgb(var(--mdui-color-surface-container-low)) 100%);
}

#app { width: 100%; height: 100%; }

/* WebView fallback — plain backgrounds when color-mix unsupported */
body {
  background-image: linear-gradient(180deg, rgb(var(--mdui-color-surface)) 0%, rgb(var(--mdui-color-surface)) 48%, rgb(var(--mdui-color-surface-container-low)) 100%);
}

@keyframes rise-in {
  from { transform: translateY(6px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

- [ ] **Step 3: Verify dev server still renders correctly**

```bash
cd D:/ClassBoard && npx nuxi dev
```

Check that main.css is imported in nuxt.config.ts or a component. Add the import to `app/app.vue` if needed:

```vue
<script setup>
import '@/assets/css/main.css'
</script>
```

- [ ] **Step 4: Commit**

```bash
cd D:/ClassBoard && git add app/assets/css/ && git commit -m "refactor: split styles into variables.css + main.css"
```

---

## Task 19: Cleanup — remove legacy files

**Files:**
- Delete: `app/composables/useClassBoard.js`
- Delete: `app/composables/useConfig.js`

- [ ] **Step 1: Delete legacy composables**

```bash
cd D:/ClassBoard && rm app/composables/useClassBoard.js app/composables/useConfig.js
```

- [ ] **Step 2: Verify build succeeds after deletion**

```bash
cd D:/ClassBoard && npx nuxi prepare && npx nuxi build
```

Expected: build succeeds with no import errors.

- [ ] **Step 3: Commit**

```bash
cd D:/ClassBoard && git add -A && git commit -m "chore: remove legacy composables"
```

---

## Task 20: Final verification

- [ ] **Step 1: Full build test**

```bash
cd D:/ClassBoard && npx nuxi build
```

Expected: build succeeds.

- [ ] **Step 2: Dev server smoke test**

```bash
cd D:/ClassBoard && npx nuxi dev
```

Manual checks:
- `/` — dashboard loads with clock, weather, schedule, feed
- `/settings` — all settings panels work, theme toggle, save
- `/apps` — app list and webview load
- `/about` — about page renders
- Bottom nav switches between pages
- Screen off overlay works

- [ ] **Step 3: Verify no regressions**

Run type check:

```bash
cd D:/ClassBoard && npx nuxi typecheck
```

Expected: no type errors.

- [ ] **Step 4: Final commit**

```bash
cd D:/ClassBoard && git add -A && git commit -m "chore: final verification pass"
```
