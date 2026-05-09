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
        <Icon slot="icon" :name="`material-symbols:${item.icon.replace(/_/g, '-')}`" />
        {{ item.label }}
        <span slot="description">{{ item.description }}</span>
        <Icon slot="end-icon" name="material-symbols:chevron-right" />
      </mdui-list-item>
      <mdui-list-item rounded @click="$emit('open-xxtsoft')">
        <Icon slot="icon" name="material-symbols:cloud-sync" />
        连接到 xxtsoft
        <span slot="description">启用在线同步与公告分发能力</span>
        <Icon slot="end-icon" name="material-symbols:open-in-new" />
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
