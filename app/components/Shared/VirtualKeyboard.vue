<template>
  <Teleport to="body">
    <Transition name="kb-slide">
      <div v-if="keyboardVisible" class="vk-overlay" @click.self="hideKeyboard()">
        <div class="vk-container" @mousedown.prevent>
          <!-- Number row -->
          <div class="vk-row">
            <button
              v-for="key in numKeys"
              :key="key"
              class="vk-key vk-key--num"
              @click.stop="insertText(key)"
            >{{ key }}</button>
          </div>

          <!-- Letter row 1 -->
          <div class="vk-row">
            <button
              v-for="key in row1"
              :key="key"
              class="vk-key"
              @click.stop="insertText(key)"
            >{{ key }}</button>
          </div>

          <!-- Letter row 2 -->
          <div class="vk-row">
            <div class="vk-spacer" />
            <button
              v-for="key in row2"
              :key="key"
              class="vk-key"
              @click.stop="insertText(key)"
            >{{ key }}</button>
            <div class="vk-spacer" />
          </div>

          <!-- Letter row 3 + backspace -->
          <div class="vk-row">
            <button
              v-for="key in row3"
              :key="key"
              class="vk-key"
              @click.stop="insertText(key)"
            >{{ key }}</button>
            <button class="vk-key vk-key--action vk-key--bs" @click.stop="backspace()">
              <Icon name="material-symbols:backspace" class="vk-icon-lg" />
            </button>
          </div>

          <!-- Bottom row: paste, space, done -->
          <div class="vk-row vk-row--bottom">
            <button class="vk-key vk-key--action vk-key--paste" @click.stop="pasteFromClipboard()">
              <Icon name="material-symbols:content-paste" class="vk-icon" />
              <span class="vk-key-label">粘贴</span>
            </button>
            <button class="vk-key vk-key--space" @click.stop="insertText(' ')">
              <span class="vk-space-hint">空格</span>
            </button>
            <button class="vk-key vk-key--action vk-key--done" @click.stop="submit()">
              <Icon name="material-symbols:keyboard-return" class="vk-icon" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useVirtualKeyboard } from "@/composables/useVirtualKeyboard";

const {
  keyboardVisible,
  hideKeyboard,
  insertText,
  backspace,
  pasteFromClipboard,
  submit,
} = useVirtualKeyboard();

const numKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const row3 = ["Z", "X", "C", "V", "B", "N", "M"];
</script>

<style scoped>
.vk-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.vk-container {
  width: 100%;
  max-width: 800px;
  padding: 8px 6px 12px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: grid;
  gap: 6px;
  user-select: none;
  -webkit-user-select: none;
}

.vk-row {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.vk-row--bottom {
  gap: 8px;
}

.vk-spacer {
  flex: 0.5;
}

.vk-key {
  flex: 1;
  min-width: 0;
  max-width: 48px;
  height: 46px;
  border: none;
  border-radius: 8px;
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font-size: 17px;
  font-weight: 500;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 120ms ease, transform 80ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.vk-key:active {
  background: color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent);
  transform: scale(0.94);
}

.vk-key--num {
  max-width: 46px;
  height: 36px;
  font-size: 15px;
  background: var(--md-sys-color-surface-container-low);
  box-shadow: none;
}

.vk-key--action {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.vk-key--bs {
  max-width: 52px;
}

.vk-key--paste {
  flex: 0 0 auto;
  min-width: 64px;
  max-width: 80px;
  gap: 4px;
  font-size: 13px;
}

.vk-key--done {
  flex: 0 0 auto;
  min-width: 56px;
  max-width: 64px;
}

.vk-key--space {
  flex: 3;
  max-width: none;
  height: 46px;
  border-radius: 24px;
}

.vk-key-label {
  font-size: 12px;
  line-height: 1;
}

.vk-space-hint {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.03em;
}

.vk-icon {
  font-size: 20px;
}

.vk-icon-lg {
  font-size: 22px;
}

/* Slide-up transition */
.kb-slide-enter-active,
.kb-slide-leave-active {
  transition: all 220ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
.kb-slide-enter-active .vk-container,
.kb-slide-leave-active .vk-container {
  transition: transform 220ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

.kb-slide-enter-from,
.kb-slide-leave-to {
  opacity: 0;
}
.kb-slide-enter-from .vk-container,
.kb-slide-leave-to .vk-container {
  transform: translateY(100%);
}
</style>
