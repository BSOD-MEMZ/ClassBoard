<template>
  <m3e-card class="block settings-block settings-menu-card" variant="outlined">
    <div slot="header" class="block-title">设置</div>
    <m3e-action-list
      slot="content"
      variant="segmented"
      class="settings-category-list"
    >
      <m3e-list-action
        v-for="item in sections"
        :key="item.key"
        :disabled="!item.enabled"
        @click="$emit('select-section', item.key)"
      >
        <Icon
          slot="leading"
          :name="`material-symbols:${item.icon.replace(/_/g, '-')}`"
        />
        {{ item.label }}
        <span slot="supporting-text">{{ item.description }}</span>
        <Icon slot="trailing" name="material-symbols:chevron-right" />
      </m3e-list-action>
      <m3e-list-action @click="$emit('open-xxtsoft')">
        <Icon slot="leading" name="material-symbols:cloud-sync" />
        连接到 xxtsoft
        <span slot="supporting-text">启用在线同步与公告分发能力</span>
        <Icon slot="trailing" name="material-symbols:open-in-new" />
      </m3e-list-action>
    </m3e-action-list>
  </m3e-card>
</template>

<script setup lang="ts">
import type { SettingsSection } from "@/types/config";
import { M3eButtonGroupElement } from "@m3e/web/button-group";
defineProps<{ sections: SettingsSection[] }>();
defineEmits<{ "select-section": [key: string]; "open-xxtsoft": [] }>();
</script>

<style scoped>
.settings-category-list {
  margin-top: 20px;
}
</style>
