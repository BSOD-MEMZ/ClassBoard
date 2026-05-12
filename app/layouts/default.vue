<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <m3e-app-bar
        v-if="!screenOff"
        size="small"
        centered
        for="pageBody"
        class="app-top-bar"
      >
        <m3e-icon-button
          slot="leading"
          class="nav-back-btn"
          :class="{ 'nav-back-btn--hidden': !showBack }"
          @click="handleBack"
        >
          <Icon name="material-symbols:arrow-back" class="icon-glyph" />
        </m3e-icon-button>
        <span slot="title">{{ barTitle }}</span>
      </m3e-app-bar>

      <main id="pageBody" class="page-body">
        <slot />
      </main>

      <footer class="bottom-nav">
        <m3e-nav-bar>
          <m3e-nav-item
            :selected="route.path === '/'"
            @click="router.push('/')"
          >
            主页
            <Icon slot="icon" name="material-symbols:home" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:home"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/apps'"
            @click="router.push('/apps')"
          >
            应用
            <Icon slot="icon" name="material-symbols:apps" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:apps"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/settings'"
            @click="router.push('/settings')"
          >
            设置
            <Icon
              slot="icon"
              name="material-symbols:settings"
              class="nav-icon"
            />
            <Icon
              slot="selected-icon"
              name="material-symbols:settings"
              class="nav-icon"
            />
          </m3e-nav-item>
          <m3e-nav-item
            :selected="route.path === '/about'"
            @click="router.push('/about')"
          >
            关于
            <Icon slot="icon" name="material-symbols:info" class="nav-icon" />
            <Icon
              slot="selected-icon"
              name="material-symbols:info"
              class="nav-icon"
            />
          </m3e-nav-item>
        </m3e-nav-bar>
      </footer>

      <PowerFab @click="powerOffScreen" />

      <div
        v-if="screenOff"
        class="screen-off-overlay"
        @click="wakeScreen"
      ></div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useDisplay } from "@/composables/useDisplay";
import { useApps } from "@/composables/useApps";
import PowerFab from "@/components/Dashboard/PowerFab.vue";

const route = useRoute();
const router = useRouter();

const { screenOff, wakeScreen, powerOffScreen } = useDisplay();
const { appsView, closeAppTool, activeApp } = useApps();

const showBack = computed(() => {
  return (
    (route.path === "/settings" && !!route.query.section) ||
    (route.path === "/apps" && appsView.value === "web")
  );
});

const isWebView = computed(
  () => route.path === "/apps" && appsView.value === "web",
);

const barTitle = computed(() => {
  if (route.path === "/apps" && appsView.value === "web" && activeApp.value)
    return activeApp.value.name;
  return "ClassBoard";
});

function handleBack() {
  if (route.path === "/apps" && appsView.value === "web") {
    closeAppTool();
  } else if (route.path === "/settings") {
    router.push("/settings");
  }
}

useHead({
  title: "ClassBoard",
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  ],
  link: [{ rel: "icon", type: "image/png", href: "assets/xxtsoft.png" }],
});
</script>

<style scoped>
.app-shell {
  width: min(100%, 800px);
  min-width: 0;
  height: 100vh;
  margin: 0 auto;
  padding: 12px 4px 0;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.app-shell.webview-mode {
  width: 100%;
  max-width: none;
  padding: 0;
  gap: 0;
}

.app-top-bar {
  --m3e-app-bar-container-color: color-mix(
    in srgb,
    var(--md-sys-color-primary-container) 72%,
    var(--md-sys-color-surface) 28%
  );
  --m3e-app-bar-title-text-color: var(--md-sys-color-on-primary-container);
  --m3e-app-bar-container-elevation: var(--md-sys-elevation-level1);
  --m3e-app-bar-container-elevation-on-scroll: var(--md-sys-elevation-level2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 28;
  border-radius: 0;
}

.nav-back-btn {
  transition:
    opacity 250ms cubic-bezier(0.2, 0, 0, 1),
    transform 250ms cubic-bezier(0.2, 0, 0, 1);
}

.nav-back-btn--hidden {
  opacity: 0;
  transform: translateX(12px);
  pointer-events: none;
}

.page-body {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-top: 66px;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-body::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  z-index: 30;
  border-top: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline-variant) 32%, transparent 68%);
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface) 60%,
    transparent 40%
  );
  backdrop-filter: blur(8px);
  padding: 2px 6px max(2px, env(safe-area-inset-bottom));
}

.screen-off-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
  animation: screen-off-fade-in 0.3s ease-out forwards;
}

@keyframes screen-off-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
