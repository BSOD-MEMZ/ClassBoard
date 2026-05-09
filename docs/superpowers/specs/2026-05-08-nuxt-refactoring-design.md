# ClassBoard Nuxt 重构设计

## 概述

将 ClassBoard 从 SPA-in-Nuxt 的单页架构重构为标准的 Nuxt 4 分层架构，采用 VoiceHub 项目的组织模式。当前代码（单个 `index.vue` + 950 行 `useClassBoard.js` + 600 行全局 CSS）拆分为 pages/composables/components/server 的标准 Nuxt 分层。

## 目标目录结构

```
app/
├── app.vue
├── assets/css/
│   ├── variables.css                # CSS 变量（从 style.css 提取）
│   └── main.css                     # 全局 reset + WebView fallback
├── components/
│   ├── Dashboard/
│   │   ├── SchoolCard.vue           # 学校/教室名称卡片
│   │   ├── TimeCard.vue             # 时钟 + 日期 + 天气
│   │   ├── ClassStatusCard.vue      # 课程状态 + 进度条 + 今日课表
│   │   ├── FeedCard.vue             # 校园资讯
│   │   └── PowerFab.vue             # 熄屏 FAB
│   ├── Settings/
│   │   ├── SettingsMenu.vue         # 设置分类菜单
│   │   ├── AppearancePanel.vue      # 显示设置
│   │   ├── BasicPanel.vue           # 班牌与课表
│   │   ├── WeatherPanel.vue         # 天气设置
│   │   ├── DevicePanel.vue          # 关于设备
│   │   └── DataPanel.vue            # 数据导出/重置
│   ├── Apps/
│   │   ├── AppList.vue              # 工具列表
│   │   └── AppWebView.vue           # iframe 容器
│   └── Shared/
│       ├── XxtsoftDialog.vue        # 连接 xxtsoft 弹窗
│       └── ScreenOffOverlay.vue     # 熄屏遮罩
├── composables/
│   ├── useSchedule.ts               # CSES 解析 + 课程状态
│   ├── useWeather.ts                # 天气 API + 城市搜索
│   ├── useFeed.ts                   # 资讯抓取 + 缓存
│   ├── useConfig.ts                 # 配置读写（从 JS 迁移）
│   ├── useDisplay.ts                # 主题/全屏/熄屏
│   └── useApps.ts                   # 应用启动器
├── layouts/
│   └── default.vue                  # TopAppBar + BottomNav + slot
├── pages/
│   ├── index.vue                    # 主页仪表盘（路由 /）
│   ├── settings.vue                 # 设置（路由 /settings）
│   ├── apps.vue                     # 应用（路由 /apps）
│   └── about.vue                    # 关于（路由 /about）
├── plugins/
│   └── mdui.client.ts               # MDUI 注册
├── server/api/
│   ├── weather.get.ts               # 代理 open-meteo 天气
│   ├── feed.get.ts                  # 代理 xxtsoft feed
│   └── city-search.get.ts           # 代理 geocoding API
├── utils/
│   ├── schedule.ts                  # 纯函数：CSES 解析、时间计算
│   └── feed.ts                      # 纯函数：feed 标准化
├── types/
│   ├── schedule.ts                  # Lesson, CSES 类型
│   ├── config.ts                    # Config, SettingsDraft 类型
│   └── index.ts                     # 通用类型
└── public/
    ├── favicon.ico
    ├── feed.json
    └── robots.txt
```

## 页面路由映射

| 当前 v-if 值         | 新页面              | 路由          |
|----------------------|---------------------|---------------|
| `activeTab==='home'` | `pages/index.vue`   | `/`           |
| `activeTab==='settings'` | `pages/settings.vue` | `/settings` |
| `activeTab==='apps'` | `pages/apps.vue`    | `/apps`       |
| `activeTab==='about'` | `pages/about.vue`  | `/about`      |

底部导航栏的切换改为 `<NuxtLink>`，无刷新切换页面。设置页内的子面板（外观、课表、天气等）继续使用组件切换而非子路由，保持简单。

## Layout 职责

`layouts/default.vue` 承载：
- **TopAppBar**：动态标题 + 返回按钮（settings 子面板、apps webview 时显示）
- **`<slot />`**：NuxtPage 注入页面内容
- **BottomNav**：4 个 tab 的导航链接
- **全局覆盖层**：ScreenOffOverlay（熄屏遮罩）、XxtsoftDialog（连接弹窗）

Tab 切换时 TopAppBar 标题不变（所有页共享"株洲市南方中学电子班牌"标题），返回按钮和标题覆写通过 `useRoute()` 和页面级 `useHead` 控制。

## Composable 拆分

| 新 Composable    | 来源（useClassBoard.js）               | 职责                      | 预估行数 |
|------------------|----------------------------------------|---------------------------|---------|
| `useSchedule`    | classState, todayLessons, parsedCses   | 课程状态计算、CSES 解析    | ~200    |
| `useWeather`     | refreshWeather, searchCity, useCity    | 天气获取、城市搜索          | ~100    |
| `useFeed`        | refreshFeed, loadFeedFallbackLocal     | 资讯抓取、localStorage 缓存 | ~100    |
| `useDisplay`     | applyTheme, screenOff, isFullscreen    | 主题管理、全屏、熄屏        | ~100    |
| `useConfig`      | useConfig.js 迁移到 TS                 | localStorage 读写           | ~80     |
| `useApps`        | openAppTool, closeAppTool, appTools    | 应用启动器状态管理          | ~50     |

页面级别的协调状态（如 settingsDraft）留在各自的页面 `<script setup>` 中。

## Server Routes

当前天气和 feed 请求直接从浏览器发往第三方 API，存在 CORS 问题且暴露 API 地址。迁移到 Nuxt server：

| 路由                           | 代理目标                                     | 说明                       |
|-------------------------------|----------------------------------------------|----------------------------|
| `GET /api/weather`            | `api.open-meteo.com/v1/forecast`             | 天气查询，传 lat/lon 参数  |
| `GET /api/city-search`        | `geocoding-api.open-meteo.com/v1/search`     | 城市搜索，传 name 参数     |
| `GET /api/feed`               | `xxtsoft.top/support/classboard/feed.json`   | 资讯获取，回退到本地       |

客户端改用 `useFetch('/api/weather?lat=...&lon=...')`，不再需要 CORS fallback URL 链。

## 工具函数迁移

`useClassBoard.js` 中的纯函数移至 `utils/`：
- `utils/schedule.ts`：parseTimeToMinutes, normalizeClockText, formatDuration, getIsoWeek, getWeekType, normalizeWeekType, normalizeDay, buildWorkDayWeekdayMap, parseCsesLessons, validateSimpleSchedule
- `utils/feed.ts`：normalizeFeedPayload

这些纯函数不依赖 Vue/Nuxt API，可直接导入。

## 样式重构

600 行 `style.css` 拆分为：
- `assets/css/variables.css`：CSS 变量、:root 定义
- 各 `.vue` 文件中的 `<style scoped>`：组件专属样式
- `assets/css/main.css`：仅保留 html/body reset 和 WebView fallback，约 50 行

## 类型定义

`types/` 目录新增 TypeScript 类型：
- `types/schedule.ts`：Lesson, CSES, ScheduleConfig, WeekType 等
- `types/config.ts`：AppConfig, SettingsDraft, SettingsSection 等
- `types/index.ts`：WeatherData, FeedItem, AppTool 等通用类型

## 实施步骤

### Phase 1：骨架搭建
1. 创建 `layouts/default.vue`，迁移 TopAppBar + BottomNav
2. 创建 `app.vue`（NuxtLayout + NuxtPage）
3. 创建 4 个页面文件（index, settings, apps, about）作为空壳
4. 配置路由导航替换 `activeTab` 切换
5. nuxt.config.ts 保留 vue compilerOptions（mdui-* 是自定义元素，需告知 Vue）

### Phase 2：工具函数 + 类型
1. 创建 `types/` 下的类型定义
2. 将纯函数从 useClassBoard.js 移入 `utils/schedule.ts`、`utils/feed.ts`

### Phase 3：Server Routes
1. 创建 `server/api/weather.get.ts`
2. 创建 `server/api/city-search.get.ts`
3. 创建 `server/api/feed.get.ts`
4. 修改 useWeather/useFeed 使用 useFetch 调用内部 API

### Phase 4：Composable 拆分
1. 创建 `composables/useConfig.ts`（从 JS 迁移）
2. 创建 `composables/useSchedule.ts`
3. 创建 `composables/useWeather.ts`
4. 创建 `composables/useFeed.ts`
5. 创建 `composables/useDisplay.ts`
6. 创建 `composables/useApps.ts`
7. 删除 `useClassBoard.js`

### Phase 5：组件提取
1. 提取 Dashboard 系列组件（SchoolCard, TimeCard, ClassStatusCard, FeedCard, PowerFab）
2. 提取 Settings 系列组件（SettingsMenu, AppearancePanel, BasicPanel, WeatherPanel, DevicePanel, DataPanel）
3. 提取 Apps 系列组件（AppList, AppWebView）
4. 提取 Shared 组件（XxtsoftDialog, ScreenOffOverlay）

### Phase 6：样式收尾
1. 创建 `assets/css/variables.css`
2. 精简 `assets/css/main.css`（仅保留 reset + WebView fallback）
3. 迁移各组件对应的样式到 scoped
4. 删除原 `style.css`

## 注意事项

- 熄屏（screenOff）和 XxtsoftDialog 是全局状态，保持在 layout 级别通过 useDisplay 管理
- settingsDraft 是页面级临时状态，留在 settings.vue 的 script setup 中，不提升为全局
- 全屏 API 调用在 useDisplay 中封装，页面/组件通过 composable 调用
- 所有 composable 改为 TypeScript，用户配置接口需定义完整类型
- 不改变任何用户可见的功能和行为，纯架构重构
