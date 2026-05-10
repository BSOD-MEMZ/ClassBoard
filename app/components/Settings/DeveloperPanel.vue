<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">开发者选项</div>
    <div class="dev-section">
      <p class="dev-desc">
        以下为开发者调试功能，请谨慎操作。
      </p>

      <div class="dev-item">
        <div class="dev-item-info">
          <span class="dev-item-label">上下课 Ripple 动画</span>
          <span class="dev-item-desc">测试上课/下课时触发的涟漪动画效果</span>
        </div>
        <m3e-button variant="outlined" @click="testRipple">
          测试动画
        </m3e-button>
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
function triggerRipple(): void {
  if (import.meta.server) return;

  let primary = getComputedStyle(document.documentElement)
    .getPropertyValue("--md-sys-color-primary")
    .trim();
  if (!primary || primary.length < 4) primary = "#39c5bb";

  const ripple = document.createElement("div");
  const size = Math.max(window.innerWidth, window.innerHeight) * 3;

  ripple.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    left: ${-size / 2}px;
    bottom: ${-size / 2}px;
    background: ${primary};
    opacity: 0.38;
    transform: scale(0);
  `;
  document.body.appendChild(ripple);

  ripple
    .animate(
      [
        { transform: "scale(0)", opacity: 0.45 },
        { transform: "scale(0.3)", opacity: 0.28, offset: 0.3 },
        { transform: "scale(1)", opacity: 0 },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
        fill: "forwards",
      },
    )
    .onfinish = () => ripple.remove();
}

function testRipple(): void {
  triggerRipple();
}
</script>

<style scoped>
.dev-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dev-desc {
  margin: 0;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
}

.dev-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.dev-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dev-item-label {
  font-size: 15px;
  font-weight: 500;
}

.dev-item-desc {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
}
</style>
