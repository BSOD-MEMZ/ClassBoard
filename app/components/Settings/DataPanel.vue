<template>
  <mdui-card class="block settings-block">
    <div class="block-title">数据与维护</div>
    <div class="actions">
      <mdui-button variant="outlined" @click="$emit('export-settings')"
        >导出设置 JSON</mdui-button
      >
      <mdui-button variant="text" @click="$emit('reset-settings')"
        >恢复默认</mdui-button
      >
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
defineEmits<{ "export-settings": []; "reset-settings": [] }>();
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}
</style>
