<template>
  <ClientOnly>
    <section class="view view-settings">
      <SettingsMenu
        v-if="section === 'root'"
        :sections="sections"
        @select-section="openSection"
        @open-xxtsoft="xxtsoftDialogOpen = true"
      />

      <AppearancePanel
        v-if="section === 'appearance'"
        :model-value="{ themeMode: draft.themeMode, themeColor: draft.themeColor }"
        :is-fullscreen="isFullscreen"
        @update:model-value="updateAppearance"
        @toggle-fullscreen="toggleFullscreen"
      />

      <BasicPanel
        v-if="section === 'basic'"
        :model-value="basicDraft"
        @update:model-value="updateBasic"
      />

      <WeatherPanel
        v-if="section === 'weather'"
        :model-value="{ weatherEnabled: draft.weatherEnabled, weatherCity: draft.weatherCity, weatherLatitude: draft.weatherLatitude, weatherLongitude: draft.weatherLongitude }"
        :city-query="cityQuery"
        :city-results="cityResults"
        :city-loading="cityLoading"
        @update:model-value="updateWeather"
        @update:city-query="cityQuery = $event"
        @search-city="searchCity"
        @use-city="useCity"
      />

      <DevicePanel
        v-if="section === 'device'"
        :fake-dev-enabled="fakeDevEnabled"
        @model-tap="onDeviceModelTap"
      />

      <DataPanel
        v-if="section === 'data'"
        @export-settings="exportSettingsJson"
        @reset-settings="resetSettings"
      />

      <XxtsoftDialog :open="xxtsoftDialogOpen" @close="xxtsoftDialogOpen = false" />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { snackbar } from 'mdui'
import type { AppConfig, SettingsSection } from '@/types/config'
import type { CityResult } from '@/types'
import { loadConfig, saveConfig, defaultConfig, cloneDefault } from '@/composables/useConfig'
import { useDisplay } from '@/composables/useDisplay'
import { useWeather } from '@/composables/useWeather'
import SettingsMenu from '@/components/Settings/SettingsMenu.vue'
import AppearancePanel from '@/components/Settings/AppearancePanel.vue'
import BasicPanel from '@/components/Settings/BasicPanel.vue'
import WeatherPanel from '@/components/Settings/WeatherPanel.vue'
import DevicePanel from '@/components/Settings/DevicePanel.vue'
import DataPanel from '@/components/Settings/DataPanel.vue'
import XxtsoftDialog from '@/components/Shared/XxtsoftDialog.vue'
import { parseTimeToMinutes, validateSimpleSchedule } from '@/utils/schedule'

const route = useRoute()
const router = useRouter()

const section = ref<string>('root')
const xxtsoftDialogOpen = ref(false)

const sections: SettingsSection[] = [
  { key: 'wlan', label: 'WLAN', icon: 'wifi', description: '暂无权限 - 以太网' },
  { key: 'bluetooth', label: '蓝牙', icon: 'bluetooth', description: '暂无权限' },
  { key: 'appearance', label: '显示', icon: 'palette', description: '深色主题、动态主题色' },
  { key: 'basic', label: '课表', icon: 'dashboard', description: '学校信息、课表与进度' },
  { key: 'weather', label: '天气', icon: 'partly_cloudy_day', description: '' },
  { key: 'device', label: '关于设备', icon: 'memory', description: '' },
  { key: 'data', label: '数据与维护', icon: 'tune', description: '导出、恢复默认' }
]

const cfg = ref<AppConfig>(loadConfig())
const { applyTheme, toggleFullscreen, isFullscreen, fakeDevEnabled, onDeviceModelTap, setupMediaListener, cleanupMediaListener } = useDisplay()
const { cityQuery, cityResults, cityLoading, searchCity: doSearchCity, scheduleWeatherRefresh, refreshWeather } = useWeather()

const draft = reactive({
  schoolName: cfg.value.schoolName,
  classroomName: cfg.value.classroomName,
  themeMode: cfg.value.themeMode,
  themeColor: cfg.value.themeColor,
  scheduleMode: cfg.value.scheduleMode || 'simple',
  classStart: cfg.value.classStart,
  classEnd: cfg.value.classEnd,
  preClassProgressWindow: String(cfg.value.preClassProgressWindow),
  weatherEnabled: cfg.value.weatherEnabled,
  weatherCity: cfg.value.weatherCity,
  weatherLatitude: String(cfg.value.weatherLatitude),
  weatherLongitude: String(cfg.value.weatherLongitude),
  scheduleText: JSON.stringify(cfg.value.schedule, null, 2),
  csesRaw: cfg.value.csesRaw || '',
  csesFormat: cfg.value.csesFormat || 'auto'
})

function syncFromConfig() {
  draft.schoolName = cfg.value.schoolName
  draft.classroomName = cfg.value.classroomName
  draft.themeMode = cfg.value.themeMode
  draft.themeColor = cfg.value.themeColor
  draft.scheduleMode = cfg.value.scheduleMode || 'simple'
  draft.classStart = cfg.value.classStart
  draft.classEnd = cfg.value.classEnd
  draft.preClassProgressWindow = String(cfg.value.preClassProgressWindow)
  draft.weatherEnabled = cfg.value.weatherEnabled
  draft.weatherCity = cfg.value.weatherCity
  draft.weatherLatitude = String(cfg.value.weatherLatitude)
  draft.weatherLongitude = String(cfg.value.weatherLongitude)
  draft.scheduleText = JSON.stringify(cfg.value.schedule, null, 2)
  draft.csesRaw = cfg.value.csesRaw || ''
  draft.csesFormat = cfg.value.csesFormat || 'auto'
  cityQuery.value = ''
  cityResults.value = []
}

const basicDraft = computed(() => ({
  schoolName: draft.schoolName,
  classroomName: draft.classroomName,
  scheduleMode: draft.scheduleMode,
  classStart: draft.classStart,
  classEnd: draft.classEnd,
  scheduleText: draft.scheduleText,
  csesFormat: draft.csesFormat,
  csesRaw: draft.csesRaw,
  preClassProgressWindow: draft.preClassProgressWindow
}))

function updateAppearance(val: { themeMode: string; themeColor: string }) {
  draft.themeMode = val.themeMode
  draft.themeColor = val.themeColor
}

function updateBasic(val: Record<string, string>) {
  Object.assign(draft, val)
}

function updateWeather(val: Record<string, string | boolean>) {
  Object.assign(draft, val)
}

function openSection(key: string) {
  section.value = key
  router.replace({ query: { section: key } })
}

function applyDraftToConfig() {
  cfg.value.schoolName = draft.schoolName.trim() || defaultConfig.schoolName
  cfg.value.classroomName = draft.classroomName.trim() || defaultConfig.classroomName
  cfg.value.themeMode = draft.themeMode as AppConfig['themeMode']
  cfg.value.themeColor = draft.themeColor || defaultConfig.themeColor
  cfg.value.scheduleMode = draft.scheduleMode as AppConfig['scheduleMode']
  cfg.value.classStart = draft.classStart
  cfg.value.classEnd = draft.classEnd
  cfg.value.weatherEnabled = draft.weatherEnabled
  cfg.value.weatherCity = draft.weatherCity.trim() || '当前城市'
  cfg.value.csesRaw = draft.csesRaw
  cfg.value.csesFormat = draft.csesFormat as AppConfig['csesFormat']

  const preMins = Number(draft.preClassProgressWindow)
  if (Number.isFinite(preMins) && preMins >= 1 && preMins <= 180) {
    cfg.value.preClassProgressWindow = Math.floor(preMins)
  }

  const lat = Number(draft.weatherLatitude)
  const lon = Number(draft.weatherLongitude)
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    cfg.value.weatherLatitude = lat
    cfg.value.weatherLongitude = lon
  }

  if (cfg.value.scheduleMode === 'simple') {
    const s = parseTimeToMinutes(draft.classStart)
    const e = parseTimeToMinutes(draft.classEnd)
    if (s !== null && e !== null && e > s) {
      cfg.value.classStart = draft.classStart
      cfg.value.classEnd = draft.classEnd
    }
    try {
      const schedule = JSON.parse(draft.scheduleText)
      if (validateSimpleSchedule(schedule)) cfg.value.schedule = schedule
    } catch { /* keep previous */ }
  }

  saveConfig(cfg.value)
  applyTheme(cfg.value.themeMode, cfg.value.themeColor)
  scheduleWeatherRefresh(cfg.value.weatherLatitude, cfg.value.weatherLongitude, cfg.value.weatherCity)
}

async function searchCity() { await doSearchCity() }

function useCity(city: CityResult) {
  draft.weatherCity = city.name || ''
  draft.weatherLatitude = String(city.latitude ?? '')
  draft.weatherLongitude = String(city.longitude ?? '')
  cityResults.value = []
  try { snackbar({ message: `已选择 ${city.name}` }) } catch { /* ignore */ }
}

function exportSettingsJson() {
  if (import.meta.server) return
  const exportObj = { ...cfg.value, exportedAt: new Date().toISOString() }
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
  Object.assign(cfg.value, cloneDefault())
  saveConfig(cfg.value)
  syncFromConfig()
  applyTheme(cfg.value.themeMode, cfg.value.themeColor)
  refreshWeather(cfg.value.weatherLatitude, cfg.value.weatherLongitude, cfg.value.weatherCity)
  try { snackbar({ message: '已恢复默认设置。' }) } catch { /* ignore */ }
}

watch(() => route.path, (newPath) => {
  if (newPath === '/settings') {
    syncFromConfig()
    section.value = 'root'
  }
})

onMounted(() => {
  applyTheme(cfg.value.themeMode, cfg.value.themeColor)
  setupMediaListener(() => cfg.value.themeMode as 'light' | 'dark' | 'auto', () => cfg.value.themeColor)

  watch(draft, () => { applyDraftToConfig() }, { deep: true })

  const qSection = route.query.section
  if (qSection && typeof qSection === 'string' && sections.some(s => s.key === qSection)) {
    section.value = qSection
  }
})

onBeforeUnmount(() => { cleanupMediaListener() })
</script>

<style scoped>
.view-settings { display: grid; gap: 12px; animation: rise-in 180ms ease; padding-bottom: 120px; }
</style>
