export type ThemeMode = "light" | "dark" | "auto";

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
}

export interface SettingsSection {
  key: string;
  label: string;
  icon: string;
  description: string;
}
