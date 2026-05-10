<template>
  <ClientOnly>
    <section class="view view-about">
      <m3e-card class="block" variant="elevated">
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
        <div slot="actions" class="about-actions">
          <m3e-button
            variant="filled"
            href="https://github.com/BSOD-MEMZ/ClassBoard"
            disabled
          >
            <Icon slot="icon" name="mdi:github" />
            Github 仓库
          </m3e-button>
          <m3e-button variant="tonal" @click="authorDialogOpen = true">
            <Icon slot="icon" name="material-symbols:person" />
            查看作者信息
          </m3e-button>
        </div>
      </m3e-card>

      <m3e-dialog :open="authorDialogOpen" dismissible @closed="authorDialogOpen = false">
        <div class="author-dialog">
          <div class="author-title">作者信息</div>
          <div class="author-item">
            <span class="author-label">开发者</span>
            <span class="author-value">2523 @xxt8582753<br>2509 @AbCd</span>
          </div>
          <div class="author-item">
            <span class="author-label">技术栈</span>
            <span class="author-value">Nuxt 3 · Vue 3 · M3E</span>
          </div>
          <div class="author-item">
            <span class="author-label">版本</span>
            <span class="author-value">0.1.1 [20260510]</span>
          </div>
        </div>
        <div slot="actions" end>
          <m3e-button variant="text" @click="authorDialogOpen = false">关闭</m3e-button>
        </div>
      </m3e-dialog>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { M3eButtonElement } from "@m3e/web/button";

const authorDialogOpen = ref(false);
</script>

<style scoped>
.view {
  display: grid;
  gap: 12px;
  animation: rise-in 280ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}

.about-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.author-dialog {
  padding: 4px 2px 2px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.author-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.author-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.author-label {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
}

.author-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}
</style>
