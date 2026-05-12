<template>
  <m3e-dialog :open="open" dismissible @closed="$emit('close')">
    <div class="xxtsoft-dialog">
      <img class="xxtsoft-logo" src="assets/xxtsoft.png" alt="xxtsoft" />
      <div class="xxtsoft-title">连接到 xxtsoft</div>
      <div class="xxtsoft-desc">
        连接后可使用我们提供的在线服务，包括资讯下发、统一配置同步与远程维护支持。
      </div>
    </div>
    <div slot="actions" end>
      <m3e-button variant="text" @click="$emit('close')">关闭</m3e-button>
    </div>
  </m3e-dialog>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();
</script>

<style scoped>
.xxtsoft-dialog {
  text-align: center;
  padding: 8px 2px 2px;
}

.xxtsoft-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 14px;
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container-high) 80%,
    transparent 20%
  );
  padding: 8px;
}

.xxtsoft-title {
  margin-top: 12px;
  font-size: var(--md3-title-medium);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.xxtsoft-desc {
  margin-top: 8px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
}
</style>
