<template>
  <ClientOnly>
    <section class="view view-about">
      <mdui-card class="block">
        <div class="block-title">关于</div>
        <div class="tip">学校一堆废弃的班牌，摆在那里插着电又不用，遂 Vibe 此项目。使用 Vue 前端技术 + MDUI2 组件库</div>
        <div class="tip">想 folk 本项目吗？联系 xxt8582753@126.com，我会指导你</div>
        <div class="tip">目前已具有课表编辑，天气查询，校园资讯功能，后续我还会加入其它功能，比如调用班牌摄像头进行 AI 解题，查看希沃白板课件等（2524 @Cookie 开发的程序给了我灵感，目前有想法在做）</div>
        <div class="tip">by xxtsoft · 南方中学信息拓展社</div>
      </mdui-card>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
</script>

<style scoped>
.view { display: grid; gap: 12px; animation: rise-in 180ms ease; }
.block-title { font-size: var(--md3-title-large); line-height: 3rem; font-weight: 500; color: rgb(var(--mdui-color-on-surface)); }
.tip { margin-top: 8px; line-height: 1.45; color: rgb(var(--mdui-color-on-surface-variant)); font-size: var(--md3-body-medium); }
</style>
