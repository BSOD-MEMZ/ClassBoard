<template>
  <ClientOnly>
    <section class="view view-settings">
      <Transition :name="transitionName" appear>
        <SettingsMenu
          v-if="section === 'root'"
          :sections="sections"
          @select-section="openSection"
          @open-xxtsoft="xxtsoftDialogOpen = true"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <AppearancePanel
          v-if="section === 'appearance'"
          :model-value="{
            themeMode: draft.themeMode,
            themeColor: draft.themeColor,
            wallpaper: draft.wallpaper,
            widgetOpacity: draft.widgetOpacity,
            navStyle: draft.navStyle,
          }"
          :is-fullscreen="isFullscreen"
          @update:model-value="updateAppearance"
          @toggle-fullscreen="toggleFullscreen"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <BasicPanel
          v-if="section === 'basic'"
          :model-value="basicDraft"
          :schedule-file="draft.scheduleFile"
          @update:model-value="updateBasic"
          @update:schedule-file="draft.scheduleFile = $event"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <WeatherPanel
          v-if="section === 'weather'"
          :model-value="{
            weatherEnabled: draft.weatherEnabled,
            weatherCity: draft.weatherCity,
            weatherLatitude: draft.weatherLatitude,
            weatherLongitude: draft.weatherLongitude,
          }"
          :city-query="cityQuery"
          :city-results="cityResults"
          :city-loading="cityLoading"
          @update:model-value="updateWeather"
          @update:city-query="cityQuery = $event"
          @search-city="searchCity"
          @use-city="useCity"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <DevicePanel
          v-if="section === 'device'"
          :fake-dev-enabled="fakeDevEnabled"
          @model-tap="onDeviceModelTap"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <RssPanel
          v-if="section === 'rss'"
          :model-value="rssDraft"
          @update:model-value="updateRss"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <DataPanel
          v-if="section === 'data'"
          @export-settings="exportSettingsJson"
          @reset-settings="resetSettings"
        />
      </Transition>

      <Transition :name="transitionName" appear>
        <DeveloperPanel
          v-if="section === 'developer'"
        />
      </Transition>

      <XxtsoftDialog
        :open="xxtsoftDialogOpen"
        @close="xxtsoftDialogOpen = false"
      />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { AppConfig, SettingsSection } from "@/types/config";
import type { CityResult } from "@/types";
import {
  loadConfig,
  saveConfig,
  defaultConfig,
  cloneDefault,
} from "@/composables/useConfig";
import { useDisplay } from "@/composables/useDisplay";
import { useWeather } from "@/composables/useWeather";
import SettingsMenu from "@/components/Settings/SettingsMenu.vue";
import AppearancePanel from "@/components/Settings/AppearancePanel.vue";
import BasicPanel from "@/components/Settings/BasicPanel.vue";
import WeatherPanel from "@/components/Settings/WeatherPanel.vue";
import DevicePanel from "@/components/Settings/DevicePanel.vue";
import RssPanel from "@/components/Settings/RssPanel.vue";
import DataPanel from "@/components/Settings/DataPanel.vue";
import DeveloperPanel from "@/components/Settings/DeveloperPanel.vue";
import XxtsoftDialog from "@/components/Shared/XxtsoftDialog.vue";

const route = useRoute();
const router = useRouter();

const section = ref<string>("root");
const prevSection = ref<string>("root");
const slideDir = ref<"forward" | "back">("forward");
const xxtsoftDialogOpen = ref(false);

const transitionName = computed(() =>
  slideDir.value === "forward" ? "slide-forward" : "slide-back",
);

const cfg = ref<AppConfig>(loadConfig());
const {
  applyTheme,
  toggleFullscreen,
  isFullscreen,
  fakeDevEnabled,
  onDeviceModelTap,
  setupMediaListener,
  cleanupMediaListener,
} = useDisplay();

const sections = computed<SettingsSection[]>(() => [
  {
    key: "wlan",
    label: "WLAN",
    icon: "wifi",
    description: "暂无权限 - 以太网",
    enabled: false,
  },
  {
    key: "bluetooth",
    label: "蓝牙",
    icon: "bluetooth",
    description: "暂无权限",
    enabled: false,
  },
  {
    key: "appearance",
    label: "显示",
    icon: "palette",
    description: "主题、透明度、壁纸",
    enabled: true,
  },
  {
    key: "basic",
    label: "课表",
    icon: "dashboard",
    description: "学校信息、课表与进度",
    enabled: true,
  },
  {
    key: "weather",
    label: "天气",
    icon: "partly_cloudy_day",
    description: "城市地理位置",
    enabled: true,
  },
  {
    key: "rss",
    label: "RSS 订阅",
    icon: "rss_feed",
    description: "RSS 新闻源配置",
    enabled: true,
  },
  {
    key: "device",
    label: "关于设备",
    icon: "memory",
    description: "设备信息与参数",
    enabled: true,
  },
  {
    key: "data",
    label: "数据与维护",
    icon: "tune",
    description: "导出、恢复默认",
    enabled: true,
  },
  ...(fakeDevEnabled.value
    ? [
        {
          key: "developer" as const,
          label: "开发者选项",
          icon: "code",
          description: "调试与测试工具",
          enabled: true,
        },
      ]
    : []),
]);

const {
  cityQuery,
  cityResults,
  cityLoading,
  searchCity: doSearchCity,
  scheduleWeatherRefresh,
  refreshWeather,
} = useWeather();

const draft = reactive({
  schoolName: cfg.value.schoolName,
  classroomName: cfg.value.classroomName,
  themeMode: cfg.value.themeMode,
  themeColor: cfg.value.themeColor,
  weatherEnabled: cfg.value.weatherEnabled,
  weatherCity: cfg.value.weatherCity,
  weatherLatitude: String(cfg.value.weatherLatitude),
  weatherLongitude: String(cfg.value.weatherLongitude),
  csesRaw: cfg.value.csesRaw || "",
  scheduleFile: cfg.value.scheduleFile || "",
  wallpaper: cfg.value.wallpaper || "",
  widgetOpacity: cfg.value.widgetOpacity ?? 1,
  navStyle: cfg.value.navStyle || ("fixed" as AppConfig["navStyle"]),
  rssEnabled: cfg.value.rssEnabled,
  rssUrl: cfg.value.rssUrl || "",
});

// Fields that map 1:1 between config and draft (same type)
const DIRECT_FIELDS = [
  "schoolName", "classroomName", "themeMode", "themeColor",
  "weatherEnabled", "weatherCity", "csesRaw", "scheduleFile",
  "wallpaper", "widgetOpacity", "navStyle", "rssEnabled", "rssUrl",
] as const;

function syncFromConfig() {
  for (const f of DIRECT_FIELDS) {
    (draft as Record<string, unknown>)[f] = cfg.value[f] ?? "";
  }
  draft.weatherLatitude = String(cfg.value.weatherLatitude);
  draft.weatherLongitude = String(cfg.value.weatherLongitude);
  draft.widgetOpacity = cfg.value.widgetOpacity ?? 1;
  draft.navStyle = cfg.value.navStyle || "fixed";
  draft.rssUrl = cfg.value.rssUrl || "";
  cityQuery.value = "";
  cityResults.value = [];
}

const basicDraft = computed(() => ({
  schoolName: draft.schoolName,
  classroomName: draft.classroomName,
  csesRaw: draft.csesRaw,
}));

const rssDraft = computed(() => ({
  rssEnabled: draft.rssEnabled,
  rssUrl: draft.rssUrl,
}));

function updateAppearance(val: {
  themeMode: string;
  themeColor: string;
  wallpaper?: string;
  widgetOpacity?: number;
  navStyle?: string;
}) {
  draft.themeMode = val.themeMode as AppConfig["themeMode"];
  draft.themeColor = val.themeColor;
  if (val.wallpaper !== undefined) draft.wallpaper = val.wallpaper;
  if (val.widgetOpacity !== undefined) draft.widgetOpacity = val.widgetOpacity;
  if (val.navStyle !== undefined) draft.navStyle = val.navStyle as AppConfig["navStyle"];
}

function updateBasic(val: {
  schoolName: string;
  classroomName: string;
  csesRaw: string;
}) {
  Object.assign(draft, val);
}

function updateWeather(val: {
  weatherEnabled: boolean;
  weatherCity: string;
  weatherLatitude: string;
  weatherLongitude: string;
}) {
  Object.assign(draft, val);
}

function updateRss(val: { rssEnabled: boolean; rssUrl: string }) {
  Object.assign(draft, val);
}

function openSection(key: string) {
  prevSection.value = section.value;
  slideDir.value = "forward";
  section.value = key;
  router.replace({ query: { section: key } });
}

function applyDraftToConfig() {
  for (const f of DIRECT_FIELDS) {
    (cfg.value as Record<string, unknown>)[f] = (draft as Record<string, unknown>)[f];
  }
  cfg.value.schoolName = draft.schoolName.trim() || defaultConfig.schoolName;
  cfg.value.classroomName = draft.classroomName.trim() || defaultConfig.classroomName;
  cfg.value.themeColor = draft.themeColor || defaultConfig.themeColor;
  cfg.value.weatherCity = draft.weatherCity.trim() || "当前城市";
  cfg.value.rssUrl = draft.rssUrl.trim() || defaultConfig.rssUrl;

  const lat = Number(draft.weatherLatitude);
  const lon = Number(draft.weatherLongitude);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    cfg.value.weatherLatitude = lat;
    cfg.value.weatherLongitude = lon;
  }

  saveConfig(cfg.value);
  applyTheme(cfg.value.themeMode, cfg.value.themeColor);
  if (import.meta.client) {
    document.documentElement.setAttribute("data-nav-style", cfg.value.navStyle || "fixed");
  }
  scheduleWeatherRefresh(
    cfg.value.weatherLatitude,
    cfg.value.weatherLongitude,
    cfg.value.weatherCity,
  );
}

async function searchCity() {
  await doSearchCity();
}

function useCity(city: CityResult) {
  draft.weatherCity = city.name || "";
  draft.weatherLatitude = String(city.latitude ?? "");
  draft.weatherLongitude = String(city.longitude ?? "");
  cityResults.value = [];
  try {
    M3eSnackbar.open(`已选择 ${city.name}`);
  } catch {
    /* ignore */
  }
}

function exportSettingsJson() {
  if (import.meta.server) return;
  const exportObj = { ...cfg.value, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `classboard-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetSettings() {
  Object.assign(cfg.value, cloneDefault());
  saveConfig(cfg.value);
  syncFromConfig();
  applyTheme(cfg.value.themeMode, cfg.value.themeColor);
  refreshWeather(
    cfg.value.weatherLatitude,
    cfg.value.weatherLongitude,
    cfg.value.weatherCity,
  );
  try {
    M3eSnackbar.open("已恢复默认设置。");
  } catch {
    /* ignore */
  }
}

watch(
  () => route.path,
  (newPath) => {
    if (newPath === "/settings") {
      syncFromConfig();
      const qs = route.query.section;
      if (qs && typeof qs === "string" && sections.value.some((s) => s.key === qs)) {
        section.value = qs;
      } else {
        section.value = "root";
      }
    }
  },
);

watch(
  () => route.query.section,
  (qSection) => {
    if (!qSection) {
      prevSection.value = section.value;
      slideDir.value = "back";
      section.value = "root";
    }
  },
);

onMounted(() => {
  applyTheme(cfg.value.themeMode, cfg.value.themeColor);
  setupMediaListener(
    () => cfg.value.themeMode as "light" | "dark" | "auto",
    () => cfg.value.themeColor,
  );

  watch(
    draft,
    () => {
      applyDraftToConfig();
    },
    { deep: true },
  );

  const qSection = route.query.section;
  if (
    qSection &&
    typeof qSection === "string" &&
    sections.value.some((s) => s.key === qSection)
  ) {
    section.value = qSection;
  }
});

onBeforeUnmount(() => {
  cleanupMediaListener();
});
</script>

<style scoped>
.view-settings {
  display: grid;
  gap: 12px;
  padding-bottom: 120px;
}

/* Panel transitions — horizontal slide (internal nav) */
.slide-forward-enter-active {
  animation: slide-fw-enter 300ms cubic-bezier(0.2, 0.0, 0.0, 1.0) both;
}
.slide-forward-leave-active {
  animation: slide-fw-leave 220ms cubic-bezier(0.4, 0.0, 1.0, 1.0) both;
}
.slide-back-enter-active {
  animation: slide-bk-enter 300ms cubic-bezier(0.2, 0.0, 0.0, 1.0) both;
}
.slide-back-leave-active {
  animation: slide-bk-leave 220ms cubic-bezier(0.4, 0.0, 1.0, 1.0) both;
}

@keyframes slide-fw-enter {
  from { opacity: 0; transform: translateX(48px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slide-fw-leave {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-48px); }
}
@keyframes slide-bk-enter {
  from { opacity: 0; transform: translateX(-48px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slide-bk-leave {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(48px); }
}
</style>
