import type { ThemeMode } from '@/types/config'
import { defaultConfig } from './useConfig'
import { setColorScheme } from 'mdui'

// Module-level singletons — shared across all useDisplay() calls
const screenOff = ref(false)
const isFullscreen = ref(false)
const fakeDevEnabled = ref(false)
const modelTapCount = ref(0)

let mediaQuery: MediaQueryList | null = null
let mediaHandler: (() => void) | null = null

export function useDisplay() {

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
