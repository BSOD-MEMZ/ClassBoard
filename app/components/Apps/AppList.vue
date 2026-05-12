<template>
  <m3e-card class="block apps-block" variant="elevated">
    <div slot="header" class="block-title">应用</div>
    <div slot="content">
      <div class="tip">
        在线工具非 xxtsoft 提供，若页面禁止嵌入，请点击标题栏返回并更换工具。
      </div>
      <m3e-action-list class="apps-list" variant="segmented">
        <m3e-list-action
          v-for="tool in tools"
          :key="tool.key"
          :disabled="!tool.enabled"
          @click="$emit('open-tool', tool)"
        >
          <Icon slot="leading" :name="`material-symbols:${tool.icon}`" />
          {{ tool.name }}
          <span slot="supporting-text">{{ tool.description }}</span>
          <Icon slot="trailing" name="material-symbols:open-in-new" />
        </m3e-list-action>
      </m3e-action-list>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import type { AppTool } from "@/types";
defineProps<{ tools: AppTool[] }>();
defineEmits<{ "open-tool": [tool: AppTool] }>();
</script>

<style scoped>
.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}

.apps-list {
  margin-top: 20px;
}
</style>
