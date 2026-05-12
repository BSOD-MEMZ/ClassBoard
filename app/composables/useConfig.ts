import type { AppConfig } from "@/types/config";

export const STORAGE_KEY = "classboard_vue_m3e_config_v1";

export const defaultConfig: AppConfig = {
  schoolName: "株洲市南方中学",
  classroomName: "未命名教室",
  themeMode: "auto",
  themeColor: "#39c5bb",
  weatherEnabled: true,
  weatherCity: "株洲",
  weatherLatitude: 27.83,
  weatherLongitude: 113.15,
  csesRaw: "",
};

export const weatherCodeMap: Record<number, string> = {
  0: "晴",
  1: "大部晴朗",
  2: "多云",
  3: "阴",
  45: "有雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "较强阵雨",
  82: "强阵雨",
  95: "雷暴",
};

export function cloneDefault(): AppConfig {
  if (typeof structuredClone === "function") return structuredClone(defaultConfig);
  return JSON.parse(JSON.stringify(defaultConfig));
}

export function normalizeConfig(parsed: Partial<AppConfig> | null): AppConfig {
  return {
    ...cloneDefault(),
    ...(parsed || {}),
  };
}

export function loadConfig(): AppConfig {
  if (import.meta.server) return cloneDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

export function saveConfig(config: AppConfig): void {
  if (import.meta.server) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
