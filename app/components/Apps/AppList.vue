<template>
  <mdui-card class="block apps-block">
    <div class="block-title">应用</div>
    <div class="tip">在线工具非 xxtsoft 提供，若页面禁止嵌入，请点击标题栏返回并更换工具。</div>
    <mdui-list class="apps-list">
      <mdui-list-item v-for="tool in tools" :key="tool.key" rounded @click="$emit('open-tool', tool)">
        <span slot="icon" class="material-symbols-outlined">{{ tool.icon }}</span>
        {{ tool.name }}
        <span slot="description">{{ tool.description }}</span>
        <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
      </mdui-list-item>
    </mdui-list>
  </mdui-card>
</template>

<script setup lang="ts">
import type { AppTool } from '@/types'
defineProps<{ tools: AppTool[] }>()
defineEmits<{ 'open-tool': [tool: AppTool] }>()
</script>

<style scoped>
.tip { margin-top: 8px; line-height: 1.45; color: rgb(var(--mdui-color-on-surface-variant)); font-size: var(--md3-body-medium); }
.apps-list { margin-top: 10px; margin-inline: -16px; }
</style>
