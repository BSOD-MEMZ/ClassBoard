<template>
  <div class="app-web-shell">
    <iframe
      :src="url"
      class="app-web-frame"
      referrerpolicy="no-referrer"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
defineProps<{ url: string }>();
</script>

<style scoped>
.app-web-shell {
  width: 100%;
  height: calc(100vh - 66px - 88px - env(safe-area-inset-bottom));
}

.app-web-frame {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  background: var(--md-sys-color-surface);
}
</style>
