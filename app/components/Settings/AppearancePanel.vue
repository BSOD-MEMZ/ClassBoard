<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">外观</div>
    <div slot="content" class="form-grid">

      <!-- 主题模式 -->
      <m3e-button-group variant="connected">
        <m3e-button
          :variant="modelValue.themeMode === 'light' ? 'filled' : 'tonal'"
          @click="$emit('update:modelValue', { ...modelValue, themeMode: 'light' })"
        >
          <Icon slot="icon" name="material-symbols:light-mode" />
          浅色
        </m3e-button>
        <m3e-button
          :variant="modelValue.themeMode === 'dark' ? 'filled' : 'tonal'"
          @click="$emit('update:modelValue', { ...modelValue, themeMode: 'dark' })"
        >
          <Icon slot="icon" name="material-symbols:dark-mode" />
          深色
        </m3e-button>
        <m3e-button
          :variant="modelValue.themeMode === 'auto' ? 'filled' : 'tonal'"
          @click="$emit('update:modelValue', { ...modelValue, themeMode: 'auto' })"
        >
          <Icon slot="icon" name="material-symbols:brightness-auto" />
          跟随系统
        </m3e-button>
      </m3e-button-group>

      <!-- 主题色 -->
      <div class="color-row">
        <label class="tiny-label">
          <Icon name="material-symbols:palette-outline" class="label-icon" />
          主题色
        </label>
        <div class="color-pick-row">
          <input
            id="theme-color"
            class="color-input"
            type="color"
            :value="modelValue.themeColor"
            @input="$emit('update:modelValue', { ...modelValue, themeColor: ($event.target as HTMLInputElement).value })"
          />
          <input
            id="theme-hex"
            class="text-input hex-input"
            :value="modelValue.themeColor"
            @input="$emit('update:modelValue', { ...modelValue, themeColor: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>

      <!-- 小组件透明度 -->
      <div class="slider-row">
        <label class="tiny-label">
          <Icon name="material-symbols:opacity" class="label-icon" />
          小组件透明度
        </label>
        <div class="slider-wrap">
          <input
            type="range"
            class="opacity-slider"
            min="15"
            max="100"
            :value="Math.round(modelValue.widgetOpacity * 100)"
            @input="$emit('update:modelValue', { ...modelValue, widgetOpacity: Number(($event.target as HTMLInputElement).value) / 100 })"
          />
          <span class="slider-val">{{ Math.round(modelValue.widgetOpacity * 100) }}%</span>
        </div>
      </div>

      <!-- 全屏按钮 -->
      <div class="actions">
        <m3e-button variant="elevated" toggle @click="$emit('toggle-fullscreen')">
          <Icon slot="icon" :name="`material-symbols:${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}`" />
          {{ isFullscreen ? "退出全屏" : "全屏显示" }}
        </m3e-button>
      </div>

      <!-- Kiosk 模式 -->
      <div class="row">
        <span class="row-label">
          <Icon name="material-symbols:captive-portal" class="label-icon" />
          Kiosk 模式
        </span>
        <m3e-switch
          :selected="modelValue.kioskMode"
          @click="$emit('update:modelValue', { ...modelValue, kioskMode: !modelValue.kioskMode })"
        />
      </div>
      <div v-if="modelValue.kioskMode" class="kiosk-hint">
        <Icon name="material-symbols:info" class="hint-icon" />
        启动时自动进入全屏，适合班牌长期展示
      </div>

      <!-- WebView 沙盒 -->
      <div class="section-divider">
        <span class="section-title">应用内浏览器</span>
      </div>

      <div class="row">
        <span class="row-label">
          <Icon name="material-symbols:shield-lock-outline" class="label-icon" />
          WebView 沙盒
        </span>
        <m3e-switch
          :selected="modelValue.webViewSandbox"
          @click="$emit('update:modelValue', { ...modelValue, webViewSandbox: !modelValue.webViewSandbox })"
        />
      </div>
      <div class="kiosk-hint">
        <Icon name="material-symbols:info" class="hint-icon" />
        启用后阻止内嵌网页弹出新标签页，避免跳出班牌界面
      </div>

      <!-- 导航栏样式 -->
      <div class="section-divider">
        <span class="section-title">导航栏</span>
      </div>

      <m3e-button-group variant="connected">
        <m3e-button
          :variant="modelValue.navStyle === 'fixed' ? 'filled' : 'tonal'"
          @click="$emit('update:modelValue', { ...modelValue, navStyle: 'fixed' })"
        >
          <Icon slot="icon" name="material-symbols:tab" />
          固定
        </m3e-button>
        <m3e-button
          :variant="modelValue.navStyle === 'pill' ? 'filled' : 'tonal'"
          @click="$emit('update:modelValue', { ...modelValue, navStyle: 'pill' })"
        >
          <Icon slot="icon" name="material-symbols:rounded-corner" />
          胶囊浮动
        </m3e-button>
      </m3e-button-group>

      <!-- 壁纸 -->
      <div class="section-divider">
        <span class="section-title">壁纸</span>
      </div>

      <div class="wallpaper-grid">
        <div
          class="wallpaper-item wallpaper-item--none"
          :class="{ 'wallpaper-item--active': !modelValue.wallpaper }"
          @click="$emit('update:modelValue', { ...modelValue, wallpaper: '' })"
        >
          <span class="wallpaper-label">无壁纸</span>
        </div>
        <div
          v-for="wp in wallpapers"
          :key="wp.name"
          class="wallpaper-item"
          :class="{ 'wallpaper-item--active': modelValue.wallpaper === wp.name }"
          :style="{ backgroundImage: `url(${wp.url})` }"
          :title="wp.name"
          @click="selectWallpaper(wp.name)"
        />
      </div>

      <!-- 主界面组件显示 -->
      <div class="section-divider">
        <span class="section-title">主界面组件</span>
      </div>

      <div v-for="item in dashboardToggles" :key="item.key" class="row">
        <span class="row-label">
          <Icon :name="item.icon" class="label-icon" />
          {{ item.label }}
        </span>
        <m3e-switch
          :selected="modelValue.dashboardVisible[item.key]"
          @click="$emit('update:modelValue', { ...modelValue, dashboardVisible: { ...modelValue.dashboardVisible, [item.key]: !modelValue.dashboardVisible[item.key] } })"
        />
      </div>

    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import { useWallpaper } from "@/composables/useWallpaper";
import type { DashboardVisibility } from "@/types/config";

const { wallpapers, wallpaperThemeColor } = useWallpaper();

interface AppearanceDraft {
  themeMode: string;
  themeColor: string;
  wallpaper: string;
  widgetOpacity: number;
  navStyle: string;
  dashboardVisible: DashboardVisibility;
  kioskMode: boolean;
  webViewSandbox: boolean;
}
const props = defineProps<{ modelValue: AppearanceDraft; isFullscreen: boolean }>();
const emit = defineEmits<{
  "update:modelValue": [value: AppearanceDraft];
  "toggle-fullscreen": [];
}>();

const dashboardToggles = [
  { key: "schoolCard" as const, label: "学校信息", icon: "material-symbols:school" },
  { key: "timeCard" as const, label: "时间与天气", icon: "material-symbols:schedule" },
  { key: "classStatusCard" as const, label: "课程状态", icon: "material-symbols:class" },
  { key: "videoCard" as const, label: "校园宣传片", icon: "material-symbols:play-circle" },
  { key: "feedCard" as const, label: "校园资讯", icon: "material-symbols:article" },
  { key: "rssCard" as const, label: "RSS 资讯", icon: "material-symbols:rss-feed" },
];

function selectWallpaper(name: string): void {
  const autoColor = wallpaperThemeColor(name);
  emit("update:modelValue", {
    ...props.modelValue,
    wallpaper: name,
    ...(autoColor ? { themeColor: autoColor } : {}),
  });
}
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.color-row {
  display: grid;
  gap: 4px;
}

.color-pick-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tiny-label {
  font-size: var(--md3-label-medium);
  letter-spacing: 0.02em;
  color: var(--md-sys-color-on-surface-variant);
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.color-input {
  width: 42px;
  height: 38px;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 35%, transparent 65%);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font: inherit;
  font-size: var(--md3-body-medium);
  outline: none;
  transition: border-color 200ms ease;
}

.hex-input:focus {
  border-color: var(--md-sys-color-primary);
}

/* Opacity slider */
.slider-row {
  display: grid;
  gap: 4px;
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opacity-slider {
  flex: 1;
  height: 6px;
  accent-color: var(--md-sys-color-primary);
  cursor: pointer;
}

.slider-val {
  min-width: 38px;
  text-align: right;
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  flex-wrap: wrap;
}

/* Kiosk hint */
.kiosk-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.4;
}

.hint-icon {
  font-size: 18px;
  color: var(--md-sys-color-primary);
  flex-shrink: 0;
}

/* Section divider */
.section-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.section-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--md-sys-color-outline-variant) 36%, transparent 64%);
}

.section-title {
  font-size: var(--md3-title-medium);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

/* Toggle rows */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.row-label {
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Wallpaper grid */
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  padding: 2px;
}

.wallpaper-item {
  aspect-ratio: 9 / 16;
  border-radius: 10px;
  border: 3px solid transparent;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: border-color 200ms ease, transform 150ms ease;
  overflow: hidden;
}

.wallpaper-item:hover {
  transform: scale(1.05);
}

.wallpaper-item--active {
  border-color: var(--md-sys-color-primary);
}

.wallpaper-item--none {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container-highest) 72%,
    transparent 28%
  );
  border: 2px dashed color-mix(in srgb, var(--md-sys-color-outline-variant) 48%, transparent 52%);
}

.wallpaper-label {
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
