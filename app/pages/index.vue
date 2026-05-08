<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': activeTab === 'apps' && appsView === 'web' }">
      <!-- Top App Bar -->
      <mdui-top-app-bar v-if="!screenOff" variant="small" class="app-top-bar" scroll-target=".page-body">
        <mdui-button-icon v-if="showTopBack" slot="navigationIcon" @click="handleTopBack">
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title>{{ topBarTitle }}</mdui-top-app-bar-title>
        <mdui-top-app-bar-action v-if="activeTab === 'home'">
          <mdui-button-icon @click="activeTab = 'apps'; openAppTool({ key: 'xuexi', name: '学习强国', description: '学习强国官网', icon: 'book', url: 'https://xuexi.cn' })">
            <span class="material-symbols-rounded icon-glyph">book</span>
          </mdui-button-icon>
        </mdui-top-app-bar-action>
      </mdui-top-app-bar>

      <!-- Page Body -->
      <main class="page-body">
        <!-- Home Tab -->
        <section v-if="activeTab === 'home'" class="view view-home">
          <mdui-card class="block school-block">
            <div class="school-name">{{ config.schoolName }}</div>
            <div class="classroom-name">{{ config.classroomName }}</div>
          </mdui-card>

          <mdui-card class="block time-block">
            <div class="clock">{{ timeText }}</div>
            <div class="line"><span class="material-symbols-outlined">calendar_month</span><span>{{ dateText }}</span></div>
            <div v-if="weatherVisible" class="line"><span class="material-symbols-outlined">partly_cloudy_day</span><span>{{ weatherText }}</span></div>
          </mdui-card>

          <mdui-card class="block class-block">
            <div class="block-title">课程状态</div>
            <div v-if="classState.statusText" class="status">{{ classState.statusText }}</div>
            <div class="course">{{ classState.courseText }}</div>
            <div v-if="classState.teacherText" class="teacher">{{ classState.teacherText }}</div>
            <div v-if="classState.showProgress" class="progress-box">
              <mdui-linear-progress :value="classState.progress"></mdui-linear-progress>
              <div class="progress-note">{{ classState.progressNote }}</div>
            </div>
            <div class="today-lessons">
              <div class="tiny-label">今日课程安排</div>
              <mdui-list v-if="todayLessons.length" class="today-lesson-list">
                <mdui-list-item v-for="(lesson, idx) in todayLessonsVisible" :key="idx" @click="showLessonDetail(lesson)">
                  <div slot="custom" class="today-lesson-item">
                    <span>{{ lesson.start }} - {{ lesson.end }}</span>
                    <span>{{ lesson.course }}</span>
                  </div>
                </mdui-list-item>
              </mdui-list>
              <mdui-button v-if="hasMoreTodayLessons" variant="text" class="lesson-toggle-btn" @click="toggleTodayLessons">
                {{ todayLessonsExpanded ? '收起' : '展开全部' }}
              </mdui-button>
              <div v-else-if="!todayLessons.length" class="tip compact-tip">今日无课程</div>
            </div>
          </mdui-card>

          <mdui-card class="block feed-block">
            <div class="block-title">{{ feedData.title || '校园资讯' }}</div>
            <div v-if="feedData.updatedAt" class="tip">更新：{{ feedData.updatedAt }}</div>
            <div class="feed-list">
              <div v-for="(item, idx) in feedData.items.slice(0, 4)" :key="idx" class="feed-item">
                <div class="feed-title">{{ item.title }}</div>
                <div v-if="item.summary" class="feed-summary">{{ item.summary }}</div>
                <div v-if="item.time" class="feed-time">{{ item.time }}</div>
              </div>
              <div v-if="!feedData.items.length" class="tip">暂无资讯</div>
            </div>
          </mdui-card>

          <mdui-fab class="power-fab" variant="secondary" @click="powerOffScreen">
            <span slot="icon" class="material-symbols-rounded icon-glyph">power_settings_new</span>
          </mdui-fab>
        </section>

        <!-- Settings Tab -->
        <section v-else-if="activeTab === 'settings'" class="view view-settings">
          <template v-if="settingsSection === 'root'">
            <mdui-card class="block settings-block settings-menu-card">
              <div class="block-title">设置</div>
              <mdui-list class="settings-category-list">
                <mdui-list-item v-for="item in settingsSections" :key="item.key" rounded @click="openSettingsSection(item.key)">
                  <span slot="icon" class="material-symbols-outlined">{{ item.icon }}</span>
                  {{ item.label }}
                  <span slot="description">{{ item.description }}</span>
                  <span slot="end-icon" class="material-symbols-outlined">chevron_right</span>
                </mdui-list-item>
                <mdui-list-item rounded @click="openXxtsoftDialog">
                  <span slot="icon" class="material-symbols-outlined">cloud_sync</span>
                  连接到 xxtsoft
                  <span slot="description">启用在线同步与公告分发能力</span>
                  <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
                </mdui-list-item>
              </mdui-list>
            </mdui-card>
          </template>

          <template v-else>
            <mdui-card v-if="settingsSection === 'appearance'" class="block settings-block">
              <div class="block-title">外观</div>
              <div class="form-grid">
                <div class="mode-group">
                  <mdui-button :variant="settingsDraft.themeMode === 'light' ? 'filled' : 'tonal'" @click="setThemeMode('light')">浅色</mdui-button>
                  <mdui-button :variant="settingsDraft.themeMode === 'dark' ? 'filled' : 'tonal'" @click="setThemeMode('dark')">深色</mdui-button>
                  <mdui-button :variant="settingsDraft.themeMode === 'auto' ? 'filled' : 'tonal'" @click="setThemeMode('auto')">跟随系统</mdui-button>
                </div>
                <div class="color-row">
                  <label class="tiny-label" for="theme-color">主题色</label>
                  <input id="theme-color" class="color-input" type="color" :value="settingsDraft.themeColor" @input="setThemeColor($event.target.value)" />
                  <mdui-text-field label="主题色 HEX" :value="settingsDraft.themeColor" @input="setThemeColor($event.target.value)"></mdui-text-field>
                </div>
                <div class="actions">
                  <mdui-button :variant="isFullscreen ? 'filled' : 'outlined'" @click="toggleFullscreen">
                    <span slot="icon" class="material-symbols-outlined">{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</span>
                    {{ isFullscreen ? '退出全屏' : '全屏显示' }}
                  </mdui-button>
                </div>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'basic'" class="block settings-block">
              <div class="block-title">班牌与课表</div>
              <div class="form-grid">
                <mdui-text-field label="学校名称" :value="settingsDraft.schoolName" @input="settingsDraft.schoolName = $event.target.value"></mdui-text-field>
                <mdui-text-field label="教室名称" :value="settingsDraft.classroomName" @input="settingsDraft.classroomName = $event.target.value"></mdui-text-field>
                <div class="switch-row">
                  <span>课表模式</span>
                  <mdui-select :value="settingsDraft.scheduleMode" @change="settingsDraft.scheduleMode = $event.target.value" style="min-width: 180px;">
                    <mdui-menu-item value="simple">简单模式（单节课）</mdui-menu-item>
                    <mdui-menu-item value="cses">CSES 模式（多课程）</mdui-menu-item>
                  </mdui-select>
                </div>
                <template v-if="settingsDraft.scheduleMode === 'simple'">
                  <div class="split-2">
                    <mdui-text-field label="上课时间" type="time" :value="settingsDraft.classStart" @input="settingsDraft.classStart = $event.target.value"></mdui-text-field>
                    <mdui-text-field label="下课时间" type="time" :value="settingsDraft.classEnd" @input="settingsDraft.classEnd = $event.target.value"></mdui-text-field>
                  </div>
                  <mdui-text-field class="json-field" textarea autosize rows="10" :value="settingsDraft.scheduleText" @input="settingsDraft.scheduleText = $event.target.value"></mdui-text-field>
                </template>
                <template v-else>
                  <div class="switch-row">
                    <span>CSES 输入格式</span>
                    <mdui-select :value="settingsDraft.csesFormat" @change="settingsDraft.csesFormat = $event.target.value" style="min-width: 140px;">
                      <mdui-menu-item value="auto">自动识别</mdui-menu-item>
                      <mdui-menu-item value="yaml">YAML</mdui-menu-item>
                      <mdui-menu-item value="json">JSON</mdui-menu-item>
                    </mdui-select>
                  </div>
                  <mdui-text-field class="json-field" textarea autosize rows="12" placeholder="粘贴 CSES JSON/YAML" :value="settingsDraft.csesRaw" @input="settingsDraft.csesRaw = $event.target.value"></mdui-text-field>
                </template>
                <mdui-text-field label="课前进度条分钟数" type="number" min="1" max="180" :value="settingsDraft.preClassProgressWindow" @input="settingsDraft.preClassProgressWindow = $event.target.value"></mdui-text-field>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'weather'" class="block settings-block">
              <div class="block-title">天气</div>
              <div class="form-grid">
                <div class="switch-row">
                  <span>启用天气</span>
                  <mdui-switch :checked="settingsDraft.weatherEnabled" @change="settingsDraft.weatherEnabled = $event.target.checked"></mdui-switch>
                </div>
                <mdui-text-field label="城市名称" :value="settingsDraft.weatherCity" @input="settingsDraft.weatherCity = $event.target.value"></mdui-text-field>
                <div class="split-2">
                  <mdui-text-field label="纬度" type="number" step="0.0001" :value="settingsDraft.weatherLatitude" @input="settingsDraft.weatherLatitude = $event.target.value"></mdui-text-field>
                  <mdui-text-field label="经度" type="number" step="0.0001" :value="settingsDraft.weatherLongitude" @input="settingsDraft.weatherLongitude = $event.target.value"></mdui-text-field>
                </div>
                <div class="city-search">
                  <mdui-text-field label="搜索城市自动填经纬度" :value="cityQuery" @input="cityQuery = $event.target.value"></mdui-text-field>
                  <mdui-button variant="outlined" @click="searchCity">搜索</mdui-button>
                </div>
                <div v-if="cityLoading" class="tip">搜索中...</div>
                <div v-if="cityResults.length" class="city-results">
                  <button v-for="city in cityResults" :key="city.id" type="button" class="city-item" @click="useCity(city)">
                    <div class="city-name">{{ city.name }}</div>
                    <div class="city-meta">{{ city.admin1 || city.country || '' }} · {{ Number(city.latitude).toFixed(2) }}, {{ Number(city.longitude).toFixed(2) }}</div>
                  </button>
                </div>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'device'" class="block settings-block">
              <div class="block-title">关于设备</div>
              <mdui-list class="device-list">
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>品牌</span><span class="device-value">ClassBoard</span></div>
                </mdui-list-item>
                <mdui-list-item @click="onDeviceModelTap">
                  <div slot="custom" class="device-row"><span>型号</span><span class="device-value">NFZX-EDU-01</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>ClassBoard 版本</span><span class="device-value">0.1.1</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>Android 版本</span><span class="device-value">5.1.1</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>WebView 版本</span><span class="device-value">95.0.4638.74</span></div>
                </mdui-list-item>
                <mdui-divider></mdui-divider>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>IMEI</span><span class="device-value">无</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>MEID</span><span class="device-value">无</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>处理器</span><span class="device-value">未知</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>运行内存</span><span class="device-value">2 GB</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>存储</span><span class="device-value">8 GB</span></div>
                </mdui-list-item>
                <mdui-divider></mdui-divider>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>设备安全补丁</span><span class="device-value">2016-10-05</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>开发者模式</span><span class="device-value">{{ fakeDevEnabled ? '已开启' : '未开启' }}</span></div>
                </mdui-list-item>
              </mdui-list>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'data'" class="block settings-block">
              <div class="block-title">数据与维护</div>
              <div class="actions">
                <mdui-button variant="outlined" @click="exportSettingsJson">导出设置 JSON</mdui-button>
                <mdui-button variant="text" @click="resetSettings">恢复默认</mdui-button>
              </div>
            </mdui-card>
          </template>
        </section>

        <!-- Apps Tab -->
        <section v-else-if="activeTab === 'apps'" class="view view-apps">
          <mdui-card v-if="appsView === 'list'" class="block apps-block">
            <div class="block-title">应用</div>
            <div class="tip">在线工具非 xxtsoft 提供，若页面禁止嵌入，请点击标题栏返回并更换工具。</div>
            <mdui-list class="apps-list">
              <mdui-list-item v-for="tool in appTools" :key="tool.key" rounded @click="openAppTool(tool)">
                <span slot="icon" class="material-symbols-outlined">{{ tool.icon }}</span>
                {{ tool.name }}
                <span slot="description">{{ tool.description }}</span>
                <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
              </mdui-list-item>
            </mdui-list>
          </mdui-card>
          <div v-else class="app-web-shell">
            <iframe :src="activeApp && activeApp.url ? activeApp.url : 'about:blank'" class="app-web-frame" referrerpolicy="no-referrer"></iframe>
          </div>
        </section>

        <!-- About Tab -->
        <section v-else class="view view-about">
          <mdui-card class="block">
            <div class="block-title">关于</div>
            <div class="tip">学校一堆废弃的班牌，摆在那里插着电又不用，遂 Vibe 此项目。使用 Vue 前端技术 + MDUI2 组件库</div>
            <div class="tip">想 folk 本项目吗？联系 xxt8582753@126.com，我会指导你</div>
            <div class="tip">目前已具有课表编辑，天气查询，校园资讯功能，后续我还会加入其它功能，比如调用班牌摄像头进行 AI 解题，查看希沃白板课件等（2524 @Cookie 开发的程序给了我灵感，目前有想法在做）</div>
            <div class="tip">by xxtsoft · 南方中学信息拓展社</div>
          </mdui-card>
        </section>
      </main>

      <!-- Bottom Navigation -->
      <footer class="bottom-nav">
        <mdui-navigation-bar :value="activeTab" @change="onTabChange">
          <mdui-navigation-bar-item value="home">
            主页
            <span slot="icon" class="material-symbols-outlined nav-icon">home</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">home</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="apps">
            应用
            <span slot="icon" class="material-symbols-outlined nav-icon">apps</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">apps</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="settings">
            设置
            <span slot="icon" class="material-symbols-outlined nav-icon">settings</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">settings</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="about">
            关于
            <span slot="icon" class="material-symbols-outlined nav-icon">info</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">info</span>
          </mdui-navigation-bar-item>
        </mdui-navigation-bar>
      </footer>

      <!-- Screen Off Overlay -->
      <div v-if="screenOff" class="screen-off-overlay" @click="wakeScreen"></div>

      <!-- xxtsoft Dialog -->
      <mdui-dialog :open="xxtsoftDialogOpen" @close="xxtsoftDialogOpen = false" close-on-overlay-click close-on-esc>
        <div class="xxtsoft-dialog">
          <img class="xxtsoft-logo" src="/assets/xxtsoft.png" alt="xxtsoft" />
          <div class="xxtsoft-title">连接到 xxtsoft</div>
          <div class="xxtsoft-desc">连接后可使用我们提供的在线服务，包括资讯下发、统一配置同步与远程维护支持。</div>
        </div>
        <mdui-button slot="action" variant="text" @click="xxtsoftDialogOpen = false">关闭</mdui-button>
      </mdui-dialog>
    </div>
  </ClientOnly>
</template>

<script setup>
import '@/assets/css/style.css'
import { useClassBoard } from '@/composables/useClassBoard'

const {
  config, activeTab, timeText, dateText, weatherText, weatherVisible, feedData,
  classState, todayLessons, todayLessonsVisible, hasMoreTodayLessons,
  settingsDraft, cityQuery, cityResults, cityLoading,
  settingsSection, settingsSections,
  xxtsoftDialogOpen, screenOff, todayLessonsExpanded,
  appsView, activeApp, appTools,
  fakeDevEnabled, isFullscreen,
  onTabChange, setThemeMode, setThemeColor, toggleTodayLessons, showLessonDetail,
  searchCity, useCity, resetSettings, exportSettingsJson,
  openSettingsSection, backToSettingsMenu,
  openXxtsoftDialog, powerOffScreen, wakeScreen,
  openAppTool,
  onDeviceModelTap, toggleFullscreen,
  showTopBack, topBarTitle, handleTopBack
} = useClassBoard()

useHead({
  title: '株洲市南方中学电子班牌',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/assets/xxtsoft.png' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&family=Material+Symbols+Rounded' }
  ]
})
</script>
