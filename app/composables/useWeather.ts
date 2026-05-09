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
    if (!import.meta.server) alert(`已选择 ${city.name}`)
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
