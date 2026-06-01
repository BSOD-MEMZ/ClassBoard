export type ThemeMode = "light" | "dark" | "auto";
export type NavStyle = "fixed" | "pill";

export interface RssPreset {
  label: string;
  url: string;
}

export interface DashboardVisibility {
  schoolCard: boolean;
  timeCard: boolean;
  classStatusCard: boolean;
  videoCard: boolean;
  feedCard: boolean;
  rssCard: boolean;
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
  scheduleFile: string;
  wallpaper: string;
  widgetOpacity: number;
  navStyle: NavStyle;
  rssEnabled: boolean;
  rssUrl: string;
  dashboardVisible: DashboardVisibility;
  kioskMode: boolean;
  /** 启用 WebView 沙盒，阻止内嵌网页弹出新标签页 */
  webViewSandbox: boolean;
}

export interface SettingsSection {
  key: string;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
}
