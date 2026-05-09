<template>
  <ClientOnly>
    <div class="app-shell" :class="{ 'webview-mode': isWebView }">
      <mdui-top-app-bar
        v-if="!screenOff"
        variant="small"
        class="app-top-bar"
        scroll-target=".page-body"
      >
        <mdui-button-icon
          class="nav-back-btn"
          :class="{ 'nav-back-btn--hidden': !showBack }"
          @click="handleBack"
        >
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title>{{ barTitle }}</mdui-top-app-bar-title>
      </mdui-top-app-bar>

      <main class="page-body">
        <slot />
      </main>

      <footer class="bottom-nav">
        <mdui-navigation-bar :value="route.path" @change="onNavChange">
          <mdui-navigation-bar-item value="/"
            >主页
            <span slot="icon" class="material-symbols-outlined nav-icon"
              >home</span
            >
            <span slot="active-icon" class="material-symbols-rounded nav-icon"
              >home</span
            >
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/apps"
            >应用
            <span slot="icon" class="material-symbols-outlined nav-icon"
              >apps</span
            >
            <span slot="active-icon" class="material-symbols-rounded nav-icon"
              >apps</span
            >
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/settings"
            >设置
            <span slot="icon" class="material-symbols-outlined nav-icon"
              >settings</span
            >
            <span slot="active-icon" class="material-symbols-rounded nav-icon"
              >settings</span
            >
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="/about"
            >关于
            <span slot="icon" class="material-symbols-outlined nav-icon"
              >info</span
            >
            <span slot="active-icon" class="material-symbols-rounded nav-icon"
              >info</span
            >
          </mdui-navigation-bar-item>
        </mdui-navigation-bar>
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
  return "株洲市南方中学电子班牌";
});

function onNavChange(event: any) {
  const value = event?.target?.value || event?.detail?.value;
  if (value && value !== route.path) router.push(value);
}

function handleBack() {
  if (route.path === "/apps" && appsView.value === "web") {
    closeAppTool();
  } else if (route.path === "/settings") {
    router.push("/settings");
  }
}

useHead({
  title: "株洲市南方中学电子班牌",
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  ],
  link: [
    { rel: "icon", type: "image/png", href: "assets/xxtsoft.png" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&family=Material+Symbols+Rounded",
    },
  ],
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 28;
  border-radius: 0;
  background: color-mix(
    in srgb,
    rgb(var(--mdui-color-primary-container)) 72%,
    rgb(var(--mdui-color-surface)) 28%
  );
  color: rgb(var(--mdui-color-on-primary-container));
  border-bottom: 1px solid
    color-mix(
      in srgb,
      rgb(var(--mdui-color-outline-variant)) 46%,
      transparent 54%
    );
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
    color-mix(
      in srgb,
      rgb(var(--mdui-color-outline-variant)) 32%,
      transparent 68%
    );
  background: color-mix(
    in srgb,
    rgb(var(--mdui-color-surface)) 60%,
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
