// Main ClassBoard composable - migrated from src/main.js
import { load } from 'js-yaml'
import { snackbar, setColorScheme } from 'mdui'
import {
  defaultConfig, cloneDefault, normalizeConfig, loadConfig, saveConfig,
  weatherCodeMap, dayLabels
} from './useConfig'

// ---- Utility functions ----

function parseTimeToMinutes(timeText) {
  const parts = String(timeText).split(':')
  if (parts.length !== 2 && parts.length !== 3) return null
  const h = Number(parts[0])
  const m = Number(parts[1])
  const s = parts.length === 3 ? Number(parts[2]) : 0
  if (!Number.isInteger(h) || !Number.isInteger(m) || !Number.isInteger(s) || h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null
  return h * 60 + m + (s / 60)
}

function normalizeClockText(timeText) {
  const t = String(timeText || '')
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5)
  if (/^\d{2}:\d{2}$/.test(t)) return t
  return t
}

function formatDuration(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function getWeekType(date) {
  return getIsoWeek(date) % 2 === 0 ? 'even' : 'odd'
}

function getSimpleClassInfo(schedule, date) {
  const weekType = getWeekType(date)
  const day = date.getDay()
  return schedule[weekType]?.[day] || { course: '晚自习', teacher: '' }
}

function normalizeWeekType(input) {
  const val = String(input ?? '').trim().toLowerCase()
  if (!val || val === 'all' || val === 'both' || val === '0' || val === 'every') return 'all'
  if (['odd', 'single', 'dan', '1', '单', '单周'].includes(val)) return 'odd'
  if (['even', 'double', 'shuang', '2', '双', '双周'].includes(val)) return 'even'
  return 'all'
}

function normalizeDay(rawDay) {
  if (rawDay === undefined || rawDay === null || rawDay === '') return null
  const d = Number(rawDay)
  if (!Number.isFinite(d)) return null
  if (d >= 0 && d <= 6) return d
  if (d >= 1 && d <= 7) {
    const map = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 }
    return map[d]
  }
  return null
}

function buildWorkDayWeekdayMap(cycle) {
  if (!cycle || typeof cycle !== 'object') return null
  const workCount = Number(cycle.work_count)
  const spans = Array.isArray(cycle.spans) ? cycle.spans : []
  if (!Number.isInteger(workCount) || workCount < 1 || !spans.length) return null
  const map = new Map()
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

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return undefined
}

function parseCsesLessons(rawText, preferredFormat = 'auto') {
  const text = String(rawText || '').trim()
  if (!text) return { ok: true, lessons: [], warning: '未提供 CSES 内容，当前无课程。' }

  let root
  const detectJson = text.startsWith('{') || text.startsWith('[')
  const parserPlan = preferredFormat === 'json'
    ? ['json', 'yaml']
    : preferredFormat === 'yaml'
    ? ['yaml', 'json']
    : detectJson
    ? ['json', 'yaml']
    : ['yaml', 'json']

  for (const fmt of parserPlan) {
    try {
      root = fmt === 'json' ? JSON.parse(text) : load(text)
      if (root && typeof root === 'object') break
    } catch {
      // try next parser
    }
  }
  if (!root || typeof root !== 'object') {
    return { ok: false, error: 'CSES 内容解析失败（JSON/YAML）。' }
  }

  const subjectMap = new Map()
  const subjects = Array.isArray(root?.subjects) ? root.subjects : []
  const workDayWeekdayMap = buildWorkDayWeekdayMap(root?.configuration?.cycle)
  for (const s of subjects) {
    const name = pickFirst(s, ['name', 'subject', 'course', 'title'])
    const short = pickFirst(s, ['simplified_name', 'short_name'])
    const teacher = String(pickFirst(s, ['teacher', 'teacher_name']) || '')
    if (name) subjectMap.set(String(name), { course: String(name), teacher })
    if (short) subjectMap.set(String(short), { course: String(name || short), teacher })
  }

  const lessons = []
  const addLesson = (day, weekType, start, end, course, teacher) => {
    const dayN = normalizeDay(day)
    const startM = parseTimeToMinutes(start)
    const endM = parseTimeToMinutes(end)
    if (dayN === null || startM === null || endM === null || endM <= startM) return
    lessons.push({
      day: dayN,
      weekType: normalizeWeekType(weekType),
      start: normalizeClockText(start),
      end: normalizeClockText(end),
      startM,
      endM,
      course: String(course || '未命名课程'),
      teacher: String(teacher || '')
    })
  }

  if (Array.isArray(root?.schedules)) {
    for (const schedule of root.schedules) {
      const rawDays = Array.isArray(schedule?.enable_day)
        ? schedule.enable_day
        : [pickFirst(schedule, ['enable_day', 'day', 'weekday', 'week_day'])]
      const days = rawDays.map((d) => {
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
      const classes = Array.isArray(schedule?.classes) ? schedule.classes : []

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
    return { ok: false, error: '未从 CSES 内容解析出课程。请检查 schedules.enable_day、classes.start_time、classes.end_time 等字段。' }
  }
  return { ok: true, lessons }
}

function isLessonInWeek(lesson, weekType) {
  return lesson.weekType === 'all' || lesson.weekType === weekType
}

function lessonsForDate(allLessons, date) {
  const day = date.getDay()
  const weekType = getWeekType(date)
  return allLessons.filter((x) => x.day === day && isLessonInWeek(x, weekType)).sort((a, b) => a.startM - b.startM)
}

function validateSimpleSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return false
  for (const wt of ['odd', 'even']) {
    if (!schedule[wt] || typeof schedule[wt] !== 'object') return false
    for (let day = 0; day <= 6; day += 1) {
      const e = schedule[wt][String(day)] ?? schedule[wt][day]
      if (!e || typeof e !== 'object') return false
      if (typeof e.course !== 'string' || typeof e.teacher !== 'string') return false
    }
  }
  return true
}

function normalizeFeedPayload(payload) {
  const source = payload && typeof payload === 'object' ? payload : {}
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : '校园资讯'
  const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : ''
  const rawItems = Array.isArray(source.items) ? source.items : []
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

// ---- Feed URLs ----
const FEED_URL = 'https://xxtsoft.top/support/ClassBoard/feed.json'
const FEED_PROXY_URLS = [
  FEED_URL,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(FEED_URL)}`,
  `https://cors.isomorphic-git.org/${FEED_URL}`
]
const FEED_CACHE_KEY = 'classboard_feed_cache_v1'

// ---- Main composable ----
export function useClassBoard() {
  const config = ref(loadConfig())
  const activeTab = ref('home')
  const now = ref(new Date())
  const weatherText = ref('')
  const weatherVisible = ref(false)
  const feedData = ref({ title: '校园资讯', updatedAt: '', items: [] })
  const cityQuery = ref('')
  const cityResults = ref([])
  const cityLoading = ref(false)

  const settingsDraft = reactive({
    schoolName: config.value.schoolName,
    classroomName: config.value.classroomName,
    themeMode: config.value.themeMode,
    themeColor: config.value.themeColor,
    scheduleMode: config.value.scheduleMode || 'simple',
    classStart: config.value.classStart,
    classEnd: config.value.classEnd,
    preClassProgressWindow: String(config.value.preClassProgressWindow),
    weatherEnabled: config.value.weatherEnabled,
    weatherCity: config.value.weatherCity,
    weatherLatitude: String(config.value.weatherLatitude),
    weatherLongitude: String(config.value.weatherLongitude),
    scheduleText: JSON.stringify(config.value.schedule, null, 2),
    csesRaw: config.value.csesRaw || '',
    csesFormat: config.value.csesFormat || 'auto'
  })

  const settingsSection = ref('root')
  const settingsSections = [
    { key: 'wlan', label: 'WLAN', icon: 'wifi', description: '暂无权限 - 以太网' },
    { key: 'bluetooth', label: '蓝牙', icon: 'bluetooth', description: '暂无权限' },
    { key: 'appearance', label: '显示', icon: 'palette', description: '深色主题、动态主题色' },
    { key: 'basic', label: '课表', icon: 'dashboard', description: '学校信息、课表与进度' },
    { key: 'weather', label: '天气', icon: 'partly_cloudy_day', description: '' },
    { key: 'device', label: '关于设备', icon: 'memory', description: '' },
    { key: 'data', label: '数据与维护', icon: 'tune', description: '导出、恢复默认' }
  ]

  const xxtsoftDialogOpen = ref(false)
  const screenOff = ref(false)
  const todayLessonsExpanded = ref(false)
  const appsView = ref('list')
  const activeApp = ref(null)
  const appTools = [
    { key: 'xuexi', name: '学习强国', description: '学习强国官网', icon: 'book', url: 'https://xuexi.cn' },
    { key: 'classwork', name: 'ClassWork 作业板', description: '显示作业内容和管理班级信息', icon: 'dashboard', url: 'https://classworks.wuyuan.dev/' },
    { key: 'cutdown', name: '倒计时', description: '在线倒计时', icon: 'alarm', url: 'https://www.lddgo.net/common/countdown' },
    { key: 'ua', name: 'User-Agent在线分析', description: '查看班牌的浏览器内核和系统信息', icon: 'app_shortcut', url: 'https://www.lddgo.net/network/useragent' },
    { key: 'gushiwen', name: '古文岛', description: '查询古诗文', icon: 'book', url: 'https://www.gushiwen.cn/default_1.aspx' }
  ]
  const modelTapCount = ref(0)
  const fakeDevEnabled = ref(false)
  const isFullscreen = ref(false)

  let weatherRefreshTimer = null
  let clockTimer = null
  let weatherTimer = null
  let feedTimer = null
  let mediaQuery = null
  let mediaHandler = null

  // ---- Theme ----
  function applyTheme(modeOverride, colorOverride) {
    if (import.meta.server) return
    const root = document.documentElement
    const mode = modeOverride || config.value.themeMode || 'auto'
    const seed = colorOverride || config.value.themeColor || defaultConfig.themeColor
    root.classList.remove('mdui-theme-light', 'mdui-theme-dark')
    if (mode === 'dark') {
      root.classList.add('mdui-theme-dark')
    } else if (mode === 'light') {
      root.classList.add('mdui-theme-light')
    } else {
      const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(dark ? 'mdui-theme-dark' : 'mdui-theme-light')
    }
    root.style.setProperty('--app-seed-color', seed)
    try {
      if (typeof setColorScheme === 'function') setColorScheme(seed)
    } catch {
      // ignore color scheme errors on unsupported environments
    }
  }

  // ---- Computed ----
  const timeText = computed(() => {
    const d = now.value
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  })

  const dateText = computed(() => {
    const d = now.value
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${dayLabels[d.getDay()]}`
  })

  const parsedCses = computed(() => {
    return parseCsesLessons(config.value.csesRaw || '', config.value.csesFormat || 'auto')
  })

  const teacherLabel = (teacher) => {
    const t = String(teacher || '').trim()
    return t ? `任课老师：${t}` : ''
  }

  const classState = computed(() => {
    const current = now.value
    const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60
    const preWindow = Number(config.value.preClassProgressWindow) || 10

    let lessonsToday = []
    let allLessons = []

    if (config.value.scheduleMode === 'cses') {
      if (!parsedCses.value.ok) {
        return {
          statusText: parsedCses.value.error,
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

    for (const lesson of lessonsToday) {
      if (currentM >= lesson.startM && currentM < lesson.endM) {
        const total = lesson.endM - lesson.startM
        const elapsed = currentM - lesson.startM
        const progress = Math.max(0, Math.min(1, elapsed / total))
        const endDate = new Date(current)
        endDate.setHours(Math.floor(lesson.endM / 60), lesson.endM % 60, 0, 0)
        return {
          statusText: `正在上课，距离下课还有 ${formatDuration(endDate - current)}`,
          courseText: lesson.course,
          teacherText: teacherLabel(lesson.teacher),
          showProgress: true,
          progress,
          progressNote: `课程进度 ${Math.floor(progress * 100)}%`
        }
      }
    }

    const nextToday = lessonsToday.find((x) => x.startM > currentM)
    if (nextToday) {
      const startDate = new Date(current)
      startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0)
      const remain = startDate - current
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

    const scanBase = new Date(current)
    for (let i = 1; i <= 14; i += 1) {
      const d = new Date(scanBase)
      d.setDate(d.getDate() + i)

      let targetLessons
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
        return {
          statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(startDate - current)}后）`,
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

  const todayLessons = computed(() => {
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
      start: normalizeClockText(config.value.classStart),
      end: normalizeClockText(config.value.classEnd),
      course: info.course,
      teacher: info.teacher
    }]
  })

  const todayLessonsVisible = computed(() => {
    if (todayLessonsExpanded.value) return todayLessons.value
    return todayLessons.value.slice(0, 4)
  })

  const hasMoreTodayLessons = computed(() => todayLessons.value.length > 4)

  // ---- Actions ----
  function toggleTodayLessons() {
    todayLessonsExpanded.value = !todayLessonsExpanded.value
  }

  function showLessonDetail(lesson) {
    if (!lesson) return
    const course = String(lesson.course || '未命名课程')
    const time = `${lesson.start || '--:--'}-${lesson.end || '--:--'}`
    const teacher = String(lesson.teacher || '').trim()
    const teacherPart = teacher ? `｜任课老师：${teacher}` : ''
    try {
      snackbar({ message: `${course}｜${time}${teacherPart}` })
    } catch {
      alert(`${course}｜${time}${teacherPart}`)
    }
  }

  function openAppTool(tool) {
    activeApp.value = tool
    appsView.value = 'web'
  }

  function closeAppTool() {
    activeApp.value = null
    appsView.value = 'list'
  }

  // ---- Weather ----
  async function refreshWeather() {
    if (import.meta.server) return
    if (!config.value.weatherEnabled) {
      weatherVisible.value = false
      return
    }
    try {
      const lat = Number(config.value.weatherLatitude)
      const lon = Number(config.value.weatherLongitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        weatherVisible.value = false
        return
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const current = data.current
      if (!current) throw new Error('missing current weather')

      const weather = weatherCodeMap[current.weather_code] || '未知天气'
      weatherText.value = `${config.value.weatherCity || '当前城市'} ${weather} ${Math.round(current.temperature_2m)}°C  风速${Math.round(current.wind_speed_10m)}km/h`
      weatherVisible.value = true
    } catch {
      weatherVisible.value = false
    }
  }

  // ---- Feed ----
  async function loadFeedFallbackLocal() {
    if (import.meta.server) return
    try {
      const res = await fetch('/feed.json', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      feedData.value = normalizeFeedPayload(json)
    } catch {
      feedData.value = {
        title: '校园资讯',
        updatedAt: '',
        items: [{ title: '暂无资讯', summary: '网络不可用且无本地缓存资讯。', time: '' }]
      }
    }
  }

  async function refreshFeed() {
    if (import.meta.server) return

    const decodeFeedResponse = async (res) => {
      const text = await res.text()
      const trimmed = String(text || '').trim()
      if (!trimmed) return null
      let parsed
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        return null
      }
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.items)) return parsed
        if (typeof parsed.contents === 'string') {
          try { return JSON.parse(parsed.contents) } catch { return null }
        }
        if (typeof parsed.data === 'string') {
          try { return JSON.parse(parsed.data) } catch { return null }
        }
      }
      return null
    }

    const fetchFeedFromNetwork = async () => {
      for (const url of FEED_PROXY_URLS) {
        let timeout = null
        try {
          const ctrl = new AbortController()
          timeout = setTimeout(() => ctrl.abort(), 7000)
          const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
          clearTimeout(timeout)
          if (!res.ok) continue
          const json = await decodeFeedResponse(res)
          if (!json) continue
          const normalized = normalizeFeedPayload(json)
          if (!normalized.items.length) continue
          feedData.value = normalized
          localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(normalized))
          return true
        } catch {
          // try next
        } finally {
          if (timeout) clearTimeout(timeout)
        }
      }
      return false
    }

    const ok = await fetchFeedFromNetwork()
    if (ok) return

    try {
      const cacheRaw = localStorage.getItem(FEED_CACHE_KEY)
      if (cacheRaw) {
        const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw))
        if (normalizedCache.items.length) {
          feedData.value = normalizedCache
          return
        }
      }
    } catch {
      // ignore
    }

    await loadFeedFallbackLocal()
  }

  // ---- Settings ----
  function syncDraftFromConfig() {
    settingsDraft.schoolName = config.value.schoolName
    settingsDraft.classroomName = config.value.classroomName
    settingsDraft.themeMode = config.value.themeMode
    settingsDraft.themeColor = config.value.themeColor
    settingsDraft.scheduleMode = config.value.scheduleMode || 'simple'
    settingsDraft.classStart = config.value.classStart
    settingsDraft.classEnd = config.value.classEnd
    settingsDraft.preClassProgressWindow = String(config.value.preClassProgressWindow)
    settingsDraft.weatherEnabled = config.value.weatherEnabled
    settingsDraft.weatherCity = config.value.weatherCity
    settingsDraft.weatherLatitude = String(config.value.weatherLatitude)
    settingsDraft.weatherLongitude = String(config.value.weatherLongitude)
    settingsDraft.scheduleText = JSON.stringify(config.value.schedule, null, 2)
    settingsDraft.csesRaw = config.value.csesRaw || ''
    settingsDraft.csesFormat = config.value.csesFormat || 'auto'
    cityQuery.value = ''
    cityResults.value = []
  }

  function onTabChange(event) {
    activeTab.value = event.target.value
    if (activeTab.value === 'settings') {
      syncDraftFromConfig()
      settingsSection.value = 'root'
    } else if (activeTab.value === 'home') {
      todayLessonsExpanded.value = false
    }
    if (activeTab.value !== 'apps' && appsView.value === 'web') {
      closeAppTool()
    }
  }

  function openSettingsSection(sectionKey) {
    settingsSection.value = sectionKey
  }

  function backToSettingsMenu() {
    settingsSection.value = 'root'
  }

  function toggleFullscreen() {
    if (import.meta.server) return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true
        try {
          snackbar({ message: '已进入全屏模式，按 ESC 退出' })
        } catch { /* ignore */ }
      }).catch(() => {
        try {
          snackbar({ message: '全屏模式不可用' })
        } catch { /* ignore */ }
      })
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
        try {
          snackbar({ message: '已退出全屏模式' })
        } catch { /* ignore */ }
      }).catch(() => {
        isFullscreen.value = false
      })
    }
  }

  function powerOffScreen() { screenOff.value = true }
  function wakeScreen() { screenOff.value = false }
  function openXxtsoftDialog() { xxtsoftDialogOpen.value = true }

  function onDeviceModelTap() {
    if (fakeDevEnabled.value) {
      try {
        snackbar({ message: '开发者模式已开启' })
      } catch { /* ignore */ }
      return
    }
    modelTapCount.value += 1
    const remain = 7 - modelTapCount.value
    if (remain > 0) {
      try {
        snackbar({ message: `现在只需要再执行 ${remain} 步操作即可进入开发者模式。` })
      } catch { alert(`现在只需要再执行 ${remain} 步操作即可进入开发者模式。`) }
    } else {
      fakeDevEnabled.value = true
      try {
        snackbar({ message: '您现在处于开发者模式！' })
      } catch { alert('您现在处于开发者模式！') }
    }
  }

  function scheduleWeatherRefresh() {
    if (import.meta.server) return
    if (weatherRefreshTimer) clearTimeout(weatherRefreshTimer)
    weatherRefreshTimer = setTimeout(() => {
      refreshWeather()
    }, 400)
  }

  function applyDraftLive() {
    config.value.schoolName = settingsDraft.schoolName.trim() || defaultConfig.schoolName
    config.value.classroomName = settingsDraft.classroomName.trim() || defaultConfig.classroomName
    config.value.themeMode = settingsDraft.themeMode
    config.value.themeColor = settingsDraft.themeColor || defaultConfig.themeColor
    config.value.scheduleMode = settingsDraft.scheduleMode
    config.value.classStart = settingsDraft.classStart
    config.value.classEnd = settingsDraft.classEnd
    config.value.weatherEnabled = settingsDraft.weatherEnabled
    config.value.weatherCity = settingsDraft.weatherCity.trim() || '当前城市'
    config.value.csesFormat = settingsDraft.csesFormat || 'auto'

    const preMins = Number(settingsDraft.preClassProgressWindow)
    if (Number.isFinite(preMins) && preMins >= 1 && preMins <= 180) {
      config.value.preClassProgressWindow = Math.floor(preMins)
    }

    const lat = Number(settingsDraft.weatherLatitude)
    const lon = Number(settingsDraft.weatherLongitude)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      config.value.weatherLatitude = lat
      config.value.weatherLongitude = lon
    }

    if (config.value.scheduleMode === 'simple') {
      const s = parseTimeToMinutes(settingsDraft.classStart)
      const e = parseTimeToMinutes(settingsDraft.classEnd)
      if (s !== null && e !== null && e > s) {
        config.value.classStart = settingsDraft.classStart
        config.value.classEnd = settingsDraft.classEnd
      }
      try {
        const schedule = JSON.parse(settingsDraft.scheduleText)
        if (validateSimpleSchedule(schedule)) {
          config.value.schedule = schedule
        }
      } catch {
        // keep previous
      }
    } else {
      config.value.csesRaw = settingsDraft.csesRaw
    }

    saveConfig(config.value)
    applyTheme()
    scheduleWeatherRefresh()
  }

  function setThemeMode(mode) { settingsDraft.themeMode = mode }
  function setThemeColor(color) { settingsDraft.themeColor = color }

  async function searchCity() {
    const q = cityQuery.value.trim()
    if (!q) {
      try {
        snackbar({ message: '请输入城市名。' })
      } catch { alert('请输入城市名。') }
      return
    }
    cityLoading.value = true
    cityResults.value = []
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=zh&format=json`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      cityResults.value = Array.isArray(data.results) ? data.results : []
      if (!cityResults.value.length) {
        try {
          snackbar({ message: '未找到匹配城市。' })
        } catch { /* ignore */ }
      }
    } catch {
      try {
        snackbar({ message: '城市搜索失败，请检查网络。' })
      } catch { /* ignore */ }
    } finally {
      cityLoading.value = false
    }
  }

  function useCity(city) {
    settingsDraft.weatherCity = city.name || ''
    settingsDraft.weatherLatitude = String(city.latitude ?? '')
    settingsDraft.weatherLongitude = String(city.longitude ?? '')
    cityResults.value = []
    cityQuery.value = city.name || ''
    try {
      snackbar({ message: `已选择 ${settingsDraft.weatherCity}` })
    } catch { /* ignore */ }
  }

  function exportSettingsJson() {
    if (import.meta.server) return
    const exportObj = { ...config.value, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `classboard-settings-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function resetSettings() {
    const next = cloneDefault()
    Object.assign(config.value, next)
    saveConfig(config.value)
    syncDraftFromConfig()
    applyTheme()
    refreshWeather()
    try {
      snackbar({ message: '已恢复默认设置。' })
    } catch { /* ignore */ }
  }

  // ---- Lifecycle ----
  onMounted(() => {
    applyTheme()

    watch(settingsDraft, () => {
      applyDraftLive()
    }, { deep: true })

    mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    if (mediaQuery) {
      mediaHandler = () => {
        if ((config.value.themeMode || 'auto') === 'auto') {
          applyTheme('auto', config.value.themeColor)
        }
      }
      if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaHandler)
      else if (mediaQuery.addListener) mediaQuery.addListener(mediaHandler)
    }

    clockTimer = setInterval(() => {
      now.value = new Date()
    }, 1000)

    refreshWeather()
    refreshFeed()
    weatherTimer = setInterval(refreshWeather, 15 * 60 * 1000)
    feedTimer = setInterval(refreshFeed, 5 * 60 * 1000)
  })

  onBeforeUnmount(() => {
    if (clockTimer) clearInterval(clockTimer)
    if (weatherTimer) clearInterval(weatherTimer)
    if (feedTimer) clearInterval(feedTimer)
    if (weatherRefreshTimer) clearTimeout(weatherRefreshTimer)
    if (mediaQuery && mediaHandler) {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaHandler)
      else if (mediaQuery.removeListener) mediaQuery.removeListener(mediaHandler)
    }
  })

  // ---- Computed UI ----
  const currentSettingsTitle = computed(() => {
    return settingsSections.find((x) => x.key === settingsSection.value)?.label || '设置'
  })

  const showTopBack = computed(() => {
    return (activeTab.value === 'settings' && settingsSection.value !== 'root')
      || (activeTab.value === 'apps' && appsView.value === 'web')
  })

  const topBarTitle = computed(() => {
    if (activeTab.value === 'settings' && settingsSection.value !== 'root') return currentSettingsTitle.value
    if (activeTab.value === 'apps' && appsView.value === 'web' && activeApp.value) return activeApp.value.name
    return '株洲市南方中学电子班牌'
  })

  function handleTopBack() {
    if (activeTab.value === 'settings' && settingsSection.value !== 'root') {
      backToSettingsMenu()
      return
    }
    if (activeTab.value === 'apps' && appsView.value === 'web') {
      closeAppTool()
    }
  }

  return {
    // State
    config, activeTab, timeText, dateText, weatherText, weatherVisible, feedData,
    classState, todayLessons, todayLessonsVisible, hasMoreTodayLessons,
    settingsDraft, cityQuery, cityResults, cityLoading,
    settingsSection, settingsSections,
    xxtsoftDialogOpen, screenOff, todayLessonsExpanded,
    appsView, activeApp, appTools,
    modelTapCount, fakeDevEnabled, isFullscreen,
    // Actions
    onTabChange, setThemeMode, setThemeColor, toggleTodayLessons, showLessonDetail,
    searchCity, useCity, resetSettings, exportSettingsJson,
    openSettingsSection, backToSettingsMenu,
    openXxtsoftDialog, powerOffScreen, wakeScreen,
    openAppTool, closeAppTool,
    onDeviceModelTap, toggleFullscreen,
    // Computed UI
    showTopBack, topBarTitle, handleTopBack, currentSettingsTitle
  }
}
