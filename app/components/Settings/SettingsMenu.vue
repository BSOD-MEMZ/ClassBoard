<template>
  <mdui-card class="block settings-block settings-menu-card">
    <div class="block-title">设置</div>
    <mdui-list class="settings-category-list">
      <mdui-list-item
        v-for="item in sections"
        :key="item.key"
        rounded
        @click="$emit('select-section', item.key)"
      >
        <span slot="icon" class="material-symbols-outlined">{{
          item.icon
        }}</span>
        {{ item.label }}
        <span slot="description">{{ item.description }}</span>
        <span slot="end-icon" class="material-symbols-outlined"
          >chevron_right</span
        >
      </mdui-list-item>
      <mdui-list-item rounded @click="$emit('open-xxtsoft')">
        <span slot="icon" class="material-symbols-outlined">cloud_sync</span>
        连接到 xxtsoft
        <span slot="description">启用在线同步与公告分发能力</span>
        <span slot="end-icon" class="material-symbols-outlined"
          >open_in_new</span
        >
      </mdui-list-item>
    </mdui-list>
  </mdui-card>
</template>

<script setup lang="ts">
import type { SettingsSection } from "@/types/config";
defineProps<{ sections: SettingsSection[] }>();
defineEmits<{ "select-section": [key: string]; "open-xxtsoft": [] }>();
</script>

<style scoped>
.settings-category-list {
  margin-top: 10px;
  margin-inline: -16px;
}
</style>
