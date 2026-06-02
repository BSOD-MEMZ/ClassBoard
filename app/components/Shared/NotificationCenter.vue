<template>
  <Teleport to="body">
    <Transition name="shade-slide">
      <div v-if="panelOpen || dragProgress > 0" class="notif-overlay" @click.self="close">
        <div
          class="notif-panel"
          :class="{ 'notif-panel--sliding': !isDragging }"
          :style="{ transform: `translateY(${(1 - dragProgress) * -100}%)` }"
          @click.stop
        >
          <!-- Header: compact time & date (top-left) -->
          <div class="notif-header">
            <div class="notif-time">{{ timeText }}</div>
            <div class="notif-date">{{ dateText }}</div>
          </div>

          <!-- Brightness slider -->
          <div class="notif-slider-row">
            <m3e-slider :min="10" :max="100" step="1" class="notif-bright-slider">
              <m3e-slider-thumb :value="Math.round(bright * 100)" @change="onBrightnessChange"></m3e-slider-thumb>
            </m3e-slider>
          </div>

          <!-- Quick settings tiles grid -->
          <div class="notif-tiles">
            <button
              v-for="tile in visibleTiles"
              :key="tile.key"
              class="notif-tile"
              :class="{ 'notif-tile--active': tile.active }"
              @click="runTile(tile)"
            >
              <Icon :name="tile.icon" class="notif-tile-icon" />
              <span class="notif-tile-label">{{ tile.label }}</span>
            </button>
          </div>

          <!-- Drag handle -->
          <div
            class="notif-handle"
            @pointerdown="startDrag"
          >
            <div class="notif-handle-bar"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotificationCenter } from "@/composables/useNotificationCenter";
import { useDisplay } from "@/composables/useDisplay";
import { useScreenFilter } from "@/composables/useScreenFilter";
import { scheduleClock } from "@/composables/useScheduleStore";
import { dayLabels } from "@/utils/schedule";

const { panelOpen, dragProgress, isDragging, quickTiles, close, setDragProgress, finishDrag } = useNotificationCenter();
const { toggleFullscreen, isFullscreen, powerOffScreen } = useDisplay();
const { brightness: bright, setBrightness } = useScreenFilter();

function onBrightnessChange(e: CustomEvent) {
  const val = Number((e as any).detail?.value ?? e.target?.value ?? 100) / 100;
  setBrightness(val);
}

// Only show first 6 tiles (2 rows of 3)
const visibleTiles = computed(() => quickTiles.value.slice(0, 8));

const timeText = computed(() => {
  const d = scheduleClock.value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
});

const dateText = computed(() => {
  const d = scheduleClock.value;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${dayLabels[d.getDay()]}`;
});

function runTile(tile: { action: () => void }): void {
  close();
  setTimeout(() => tile.action(), 200);
}

// ── Drag-to-close on the handle ──
let dragStartY = 0;
let dragging = false;

function startDrag(e: PointerEvent): void {
  dragging = true;
  dragStartY = e.clientY;
  document.addEventListener("pointermove", onDrag);
  document.addEventListener("pointerup", endDrag);
}

function onDrag(e: PointerEvent): void {
  if (!dragging) return;
  const dy = dragStartY - e.clientY; // positive when dragging UP
  if (dy > 0) {
    const panelHeight = 320;
    const progress = Math.max(0, 1 - dy / panelHeight);
    setDragProgress(progress);
  }
}

function endDrag(): void {
  dragging = false;
  document.removeEventListener("pointermove", onDrag);
  document.removeEventListener("pointerup", endDrag);
  if (dragProgress.value < 0.6) {
    finishDrag(false);
  } else {
    finishDrag(true);
  }
}
</script>

<style scoped>
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  /* GPU layer */
  will-change: opacity;
}

.notif-panel {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background: var(--md-sys-color-surface-container-high, #ece6f0);
  border-radius: 0 0 24px 24px;
  padding: 16px 16px 12px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.25);
  touch-action: none;
  will-change: transform;
}

/* Smooth slide transition when NOT dragging */
.notif-panel--sliding {
  transition: transform 320ms cubic-bezier(0.2, 0.0, 0.0, 1.0);
}

.notif-header {
  text-align: left;
  margin-bottom: 12px;
  padding: 0 4px;
}

.notif-time {
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.2;
  color: var(--md-sys-color-on-surface);
}

.notif-date {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 1px;
}

/* ── Brightness slider (m3e) ── */
.notif-slider-row {
  display: flex;
  align-items: center;
  padding: 4px 4px 12px;
}

.notif-bright-slider {
  flex: 1;
  --m3e-slider-active-track-color: var(--md-sys-color-primary, #39c5bb);
  --m3e-slider-inactive-track-color: var(--md-sys-color-surface-container-highest, #e6e0eb);
  --m3e-slider-thumb-color: var(--md-sys-color-primary, #39c5bb);
}

.notif-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 0 4px 16px;
}

.notif-tile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container, #f0edf6);
  cursor: pointer;
  transition: background 150ms ease;
  color: var(--md-sys-color-on-surface);
  text-align: left;
}

.notif-tile:active {
  background: var(--md-sys-color-surface-container-highest, #e6e0eb);
}

.notif-tile--active {
  background: var(--md-sys-color-primary-container, #d0bcff);
  color: var(--md-sys-color-on-primary-container, #381e72);
}

.notif-tile--active:active {
  background: var(--md-sys-color-primary-container);
  filter: brightness(0.92);
}

.notif-tile-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notif-tile-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  cursor: grab;
  touch-action: none;
}

.notif-handle-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--md-sys-color-outline-variant, #cac4d0);
}

/* ── Transition ── */
.shade-slide-enter-active {
  transition: opacity 220ms ease-out;
}
.shade-slide-leave-active {
  transition: opacity 200ms ease-in;
}
.shade-slide-enter-from,
.shade-slide-leave-to {
  opacity: 0;
}

/* Panel slide: enter from top, leave to top */
.shade-slide-enter-active .notif-panel {
  transition: transform 260ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
.shade-slide-leave-active .notif-panel {
  transition: transform 200ms cubic-bezier(0.4, 0.0, 1, 1);
}
.shade-slide-enter-from .notif-panel {
  transform: translateY(-100%);
}
.shade-slide-leave-to .notif-panel {
  transform: translateY(-100%);
}
</style>
