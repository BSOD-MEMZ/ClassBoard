<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">关于设备</div>
    <m3e-list slot="content" class="device-list">
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>品牌</span><span class="device-value">ClassBoard</span>
        </div>
      </m3e-list-item>
      <m3e-list-item @click="$emit('model-tap')">
        <div slot="custom" class="device-row">
          <span>型号</span><span class="device-value">NFZX-EDU-01</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>ClassBoard 版本</span><span class="device-value">0.1.1</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>Android 版本</span><span class="device-value">5.1.1</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>WebView 版本</span
          ><span class="device-value">95.0.4638.74</span>
        </div>
      </m3e-list-item>
      <m3e-divider></m3e-divider>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>IMEI</span><span class="device-value">无</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>MEID</span><span class="device-value">无</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>处理器</span><span class="device-value">未知</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>运行内存</span><span class="device-value">2 GB</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>存储</span><span class="device-value">8 GB</span>
        </div>
      </m3e-list-item>
      <m3e-divider></m3e-divider>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>设备安全补丁</span><span class="device-value">2016-10-05</span>
        </div>
      </m3e-list-item>
      <m3e-list-item>
        <div slot="custom" class="device-row">
          <span>开发者模式</span
          ><span class="device-value">{{
            fakeDevEnabled ? "已开启" : "未开启"
          }}</span>
        </div>
      </m3e-list-item>
    </m3e-list>
  </m3e-card>
</template>

<script setup lang="ts">
defineProps<{ fakeDevEnabled: boolean }>();
defineEmits<{ "model-tap": [] }>();
</script>

<style scoped>
.device-list {
  margin-top: 8px;
  margin-inline: -16px;
}

.device-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  line-height: 1.7;
}

.device-value {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
