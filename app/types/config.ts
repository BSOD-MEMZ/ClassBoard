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
