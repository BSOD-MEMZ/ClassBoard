<template>
  <div class="app-web-shell">
    <!-- 沙盒警告条 -->
    <div v-if="sandbox && !warningDismissed" class="sandbox-warning">
      <Icon name="material-symbols:shield-lock-outline" class="sandbox-warn-icon" />
      <span class="sandbox-warn-text">沙盒已启用 — 弹窗和新标签页将被拦截</span>
      <m3e-icon-button class="sandbox-warn-close" @click="dismissWarning">
        <Icon name="material-symbols:close" />
      </m3e-icon-button>
    </div>
    <iframe
      ref="iframeEl"
      :src="url"
      class="app-web-frame"
      referrerpolicy="no-referrer"
      :sandbox="sandbox ? 'allow-scripts allow-same-origin allow-forms allow-modals allow-top-navigation-by-user-activation' : undefined"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ url: string; sandbox?: boolean }>();

const iframeEl = ref<HTMLIFrameElement | null>(null);
const warningDismissed = ref(false);

function dismissWarning() {
  warningDismissed.value = true;
}

// 每次切换 URL 或 sandbox 状态时，重新显示警告
watch(() => props.url, () => { warningDismissed.value = false; });
watch(() => props.sandbox, () => { warningDismissed.value = false; });
</script>

<style scoped>
.app-web-shell {
  width: 100%;
  height: calc(100vh - 66px - 88px - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}

/* ── Sandbox warning banner ── */
.sandbox-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--md-sys-color-tertiary-container, #e8def8) 70%, transparent);
  color: var(--md-sys-color-on-tertiary-container, #1d192b);
  font-size: 13px;
  line-height: 1.4;
  flex-shrink: 0;
  border-radius: 8px 8px 0 0;
}

.sandbox-warn-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sandbox-warn-text {
  flex: 1;
}

.sandbox-warn-close {
  flex-shrink: 0;
}

.app-web-frame {
  width: 100%;
  flex: 1;
  min-height: 0;
  border: none;
  border-radius: 0;
  background: var(--md-sys-color-surface);
}
</style>
