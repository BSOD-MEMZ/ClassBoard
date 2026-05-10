<template>
  <m3e-card class="block settings-block" variant="outlined">
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
  const ripple = document.createElement("div");
  ripple.className = "class-ripple";
  const size = Math.max(window.innerWidth, window.innerHeight) * 2;
  ripple.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    margin-left: ${-size / 2}px;
    margin-top: ${-size / 2}px;
    left: 50%;
    top: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent 82%), transparent);
    transform: scale(0);
    animation: class-ripple-in 600ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  `;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
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
