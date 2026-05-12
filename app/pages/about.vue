<template>
  <ClientOnly>
    <section class="view view-about">
      <m3e-card class="block" variant="outlined">
        <div slot="header" class="block-title">关于</div>
        <div slot="content">
          <span class="tip">
            学校一堆废弃的班牌，摆在那里插着电又不用，遂 Vibe 此项目。使用 Vue
            前端技术 + m3e 组件库
          </span>
          <span class="tip">
            目前已具有课表编辑，天气查询，校园资讯功能，后续我还会加入其它功能，比如调用班牌摄像头进行
            AI 解题，查看希沃白板课件等（2524 @Cookie
            开发的程序给了我灵感，目前有想法在做）
          </span>
        </div>
        <div class="tip">by xxtsoft · 南方中学信息拓展社</div>
        <div slot="actions">
          <m3e-button
            variant="filled"
            href="https://github.com/BSOD-MEMZ/ClassBoard"
            disabled
          >
            <Icon slot="icon" name="mdi:github" />
            Github 仓库
          </m3e-button>
        </div>
      </m3e-card>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { M3eButtonElement } from "@m3e/web/button";
</script>

<style scoped>
.view {
  display: grid;
  gap: 12px;
  animation: rise-in 180ms ease;
}

.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}
</style>
