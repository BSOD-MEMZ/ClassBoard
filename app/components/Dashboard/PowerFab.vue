<template>
  <m3e-fab extended size="small" class="power-fab" @click="$emit('click')">
    <Icon name="material-symbols:power-settings-new" class="icon-glyph" />
    <span slot="label">息屏</span>
  </m3e-fab>
</template>

<script setup lang="ts">
defineEmits<{ click: [] }>();
</script>

<style scoped>
.power-fab {
  position: fixed;
  right: calc(14px + env(safe-area-inset-right));
  bottom: calc(86px + env(safe-area-inset-bottom));
  z-index: 15;
}
</style>
