export type ThemeMode = "light" | "dark" | "auto";
export type NavStyle = "fixed" | "pill";

export interface RssPreset {
  label: string;
  url: string;
}

export interface AppConfig {
  schoolName: string;
  classroomName: string;
  themeMode: ThemeMode;
  themeColor: string;
  weatherEnabled: boolean;
  weatherCity: string;
  weatherLatitude: number;
  weatherLongitude: number;
  csesRaw: string;
  wallpaper: string;
  widgetOpacity: number;
  navStyle: NavStyle;
  rssEnabled: boolean;
  rssUrl: string;
}

export interface SettingsSection {
  key: string;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
}
