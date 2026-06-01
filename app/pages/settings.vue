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
            dashboardVisible: draft.dashboardVisible,
            kioskMode: draft.kioskMode,
            webViewSandbox: draft.webViewSandbox,
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

      <!-- Profile panel (shown when logged in and clicking the login option) -->
      <Transition :name="transitionName" appear>
        <m3e-card v-if="section === 'profile'" class="block profile-card" variant="elevated">
          <div slot="header" class="block-title">账号管理</div>
          <div slot="content" class="profile-content">
            <div class="profile-avatar">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" class="profile-avatar-img" />
              <Icon v-else name="material-symbols:account-circle" class="profile-avatar-icon" />
            </div>
            <div class="profile-name">{{ currentUser?.name || "" }}</div>
            <div class="profile-role">{{ roleLabel(currentUser?.role || "") }}</div>
            <div class="profile-type">登录方式：{{ isPermanent() ? "永久登录" : "临时登录（关闭浏览器后退出）" }}</div>
          </div>
          <div slot="actions" class="profile-actions">
            <m3e-button variant="outlined" @click="switchAccount">切换账号</m3e-button>
            <m3e-button variant="filled" @click="doLogout">退出登录</m3e-button>
          </div>
        </m3e-card>
      </Transition>

      <XxtsoftDialog
        :open="xxtsoftDialogOpen"
        @close="xxtsoftDialogOpen = false"
      />

      <CardLoginModal
        :visible="loginModalOpen"
        @close="loginModalOpen = false"
      />
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { AppConfig, SettingsSection, DashboardVisibility } from "@/types/config";
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
import CardLoginModal from "@/components/Shared/CardLoginModal.vue";
import { useAuth } from "@/composables/useAuth";

const route = useRoute();
const router = useRouter();

const section = ref<string>("root");
const prevSection = ref<string>("root");
const slideDir = ref<"forward" | "back">("forward");
const xxtsoftDialogOpen = ref(false);
const loginModalOpen = ref(false);
const { loggedIn, currentUser, isPermanent, logout } = useAuth();

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
    key: "login",
    label: loggedIn.value ? (currentUser.value?.name || "已登录") : "登录",
    icon: loggedIn.value ? "account_circle" : "login",
    description: loggedIn.value
      ? `当前${isPermanent() ? "永久" : "临时"}登录 · 点击管理账号`
      : "刷卡登录以管理班牌",
    enabled: true,
  },
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
  dashboardVisible: { ...cfg.value.dashboardVisible },
  kioskMode: cfg.value.kioskMode ?? false,
  webViewSandbox: cfg.value.webViewSandbox ?? false,
});

// Fields that map 1:1 between config and draft (same type)
const DIRECT_FIELDS = [
  "schoolName", "classroomName", "themeMode", "themeColor",
  "weatherEnabled", "weatherCity", "csesRaw", "scheduleFile",
  "wallpaper", "widgetOpacity", "navStyle", "rssEnabled", "rssUrl",
  "kioskMode", "webViewSandbox",
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
  draft.dashboardVisible = { ...cfg.value.dashboardVisible };
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
  dashboardVisible?: Record<string, boolean>;
  kioskMode?: boolean;
  webViewSandbox?: boolean;
}) {
  draft.themeMode = val.themeMode as AppConfig["themeMode"];
  draft.themeColor = val.themeColor;
  if (val.wallpaper !== undefined) draft.wallpaper = val.wallpaper;
  if (val.widgetOpacity !== undefined) draft.widgetOpacity = val.widgetOpacity;
  if (val.navStyle !== undefined) draft.navStyle = val.navStyle as AppConfig["navStyle"];
  if (val.dashboardVisible !== undefined) draft.dashboardVisible = val.dashboardVisible as AppConfig["dashboardVisible"];
  if (val.kioskMode !== undefined) draft.kioskMode = val.kioskMode;
  if (val.webViewSandbox !== undefined) draft.webViewSandbox = val.webViewSandbox;
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
  if (key === "login") {
    if (loggedIn.value) {
      // Already logged in → go to profile page
      prevSection.value = section.value;
      slideDir.value = "forward";
      section.value = "profile";
      router.replace({ query: { section: "profile" } });
    } else {
      // Not logged in → open card login modal
      loginModalOpen.value = true;
    }
    return;
  }
  prevSection.value = section.value;
  slideDir.value = "forward";
  section.value = key;
  router.replace({ query: { section: key } });
}

function roleLabel(role: string): string {
  const map: Record<string, string> = { admin: "管理员", teacher: "教师", student: "学生" };
  return map[role] || role;
}

function switchAccount(): void {
  loginModalOpen.value = true;
}

function doLogout(): void {
  logout();
  // Go back to root settings menu
  prevSection.value = section.value;
  slideDir.value = "back";
  section.value = "root";
  router.replace({ query: {} });
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
  cfg.value.dashboardVisible = { ...draft.dashboardVisible };

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
      if (qs && typeof qs === "string" && (sections.value.some((s) => s.key === qs) || qs === "profile")) {
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
    (sections.value.some((s) => s.key === qSection) || qSection === "profile")
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

/* ── Profile card ── */
.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 8px;
  gap: 6px;
}

.profile-avatar {
  margin-bottom: 4px;
}

.profile-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-avatar-icon {
  font-size: 80px;
  color: var(--md-sys-color-on-surface-variant);
}

.profile-name {
  font-size: var(--md3-title-large);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.profile-role {
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.profile-type {
  margin-top: 4px;
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-outline);
}

.profile-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;
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
