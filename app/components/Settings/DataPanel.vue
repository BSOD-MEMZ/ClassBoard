<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">数据与维护</div>
    <div slot="actions" end>
      <m3e-button variant="outlined" @click="$emit('export-settings')"
        >导出设置 JSON</m3e-button
      >
      <m3e-button variant="text" @click="$emit('reset-settings')"
        >恢复默认</m3e-button
      >
      <m3e-button variant="text" @click="refreshPage"
        >刷新网页</m3e-button
      >
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
defineEmits<{ "export-settings": []; "reset-settings": [] }>();

function refreshPage() {
  location.reload();
}
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}
</style>
