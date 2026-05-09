<template>
  <mdui-fab class="power-fab" variant="secondary" @click="$emit('click')">
    <span slot="icon" class="material-symbols-rounded icon-glyph">power_settings_new</span>
  </mdui-fab>
</template>

<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>

<style scoped>
.power-fab {
  position: fixed;
  right: calc(14px + env(safe-area-inset-right));
  bottom: calc(86px + env(safe-area-inset-bottom));
  z-index: 15;
}
</style>
