<template>
  <Teleport to="body">
    <Transition name="kb-slide">
      <div v-if="keyboardVisible" class="vk-overlay" @click.self="hideKeyboard()">
        <div class="vk-container" @mousedown.prevent>

          <!-- Candidate bar: IME candidates + 联想 predictions for CN/JP -->
          <div v-if="showCandidateBar" class="vk-candidates">
            <button
              v-for="(c, idx) in candidates"
              :key="'c-' + idx"
              class="vk-candidate"
              @click.stop="commitComposition(c)"
            >{{ c }}</button>
            <span v-if="composing && !candidates.length" class="vk-composing">{{ composing }}</span>
          </div>
          <!-- 联想 prediction bar: shown when lastCommitted is set and not composing -->
          <div v-if="showPredictionBar" class="vk-candidates vk-candidates--predict">
            <span class="vk-predict-label">联想</span>
            <button
              v-for="(c, idx) in predictions"
              :key="'p-' + idx"
              class="vk-candidate vk-candidate--predict"
              @click.stop="commitPrediction(c)"
            >{{ c }}</button>
          </div>
          <!-- Number quick-access bar for CN/JP when not composing and no predictions -->
          <div v-if="showNumBar" class="vk-candidates">
            <button
              v-for="n in numKeys"
              :key="n"
              class="vk-candidate vk-candidate--num"
              @click.stop="insertAtCursor(n)"
            >{{ n }}</button>
          </div>

          <!-- ===== EN Letters Panel ===== -->
          <template v-if="keyboardMode === 'en'">
            <div class="vk-row">
              <button v-for="k in numKeys" :key="k" class="vk-key vk-key--num" @click.stop="insertText(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <button v-for="k in displayRow1" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <div class="vk-spacer" />
              <button v-for="k in displayRow2" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <div class="vk-spacer" />
            </div>
            <div class="vk-row">
              <button class="vk-key vk-key--action vk-key--shift" :class="{ 'vk-key--active': shiftLock }" @click.stop="toggleShift()">
                <Icon name="material-symbols:keyboard-capslock" class="vk-icon-lg" />
              </button>
              <button v-for="k in displayRow3" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <button class="vk-key vk-key--action vk-key--bs" @click.stop="backspace()">
                <Icon name="material-symbols:backspace" class="vk-icon-lg" />
              </button>
            </div>
            <div class="vk-row vk-row--bottom">
              <button class="vk-key vk-key--action vk-key--mode" @click.stop="setMode('num')">
                <span class="vk-mode-label">?123</span>
              </button>
              <button class="vk-key vk-key--action vk-key--lang" @click.stop="cycleMode()">
                <Icon name="material-symbols:language" class="vk-icon" />
              </button>
              <button class="vk-key vk-key--space" @click.stop="insertText(' ')">
                <span class="vk-space-hint">{{ spaceLabel }}</span>
              </button>
              <button class="vk-key vk-key--action vk-key--done" @click.stop="submit()">
                <Icon name="material-symbols:keyboard-return" class="vk-icon" />
              </button>
            </div>
          </template>

          <!-- ===== Symbols Panel ===== -->
          <template v-if="keyboardMode === 'num'">
            <div class="vk-row">
              <button v-for="k in numKeys" :key="k" class="vk-key vk-key--num" @click.stop="insertAtCursor(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <button v-for="k in symRow1" :key="k" class="vk-key vk-key--sym" @click.stop="insertAtCursor(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <button v-for="k in symRow2" :key="k" class="vk-key vk-key--sym" @click.stop="insertAtCursor(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <button class="vk-key vk-key--action vk-key--mode" style="max-width:56px" @click.stop="setMode(lastTextMode)">
                <span class="vk-mode-label">ABC</span>
              </button>
              <button v-for="k in symRow3" :key="k" class="vk-key vk-key--sym" @click.stop="insertAtCursor(k)">{{ k }}</button>
              <button class="vk-key vk-key--action vk-key--bs" @click.stop="backspace()">
                <Icon name="material-symbols:backspace" class="vk-icon-lg" />
              </button>
            </div>
            <div class="vk-row vk-row--bottom">
              <button class="vk-key vk-key--action vk-key--paste" @click.stop="pasteFromClipboard()">
                <Icon name="material-symbols:content-paste" class="vk-icon" />
                <span class="vk-key-label">粘贴</span>
              </button>
              <button class="vk-key vk-key--space" @click.stop="insertAtCursor(' ')">
                <span class="vk-space-hint">空格</span>
              </button>
              <button class="vk-key vk-key--action vk-key--done" @click.stop="submit()">
                <Icon name="material-symbols:keyboard-return" class="vk-icon" />
              </button>
            </div>
          </template>

          <!-- ===== Chinese Pinyin Panel ===== -->
          <template v-if="keyboardMode === 'cn'">
            <div class="vk-row">
              <button v-for="k in pinyinRow1" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <div class="vk-spacer" />
              <button v-for="k in pinyinRow2" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <div class="vk-spacer" />
            </div>
            <div class="vk-row">
              <button v-for="k in pinyinRow3" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <button class="vk-key vk-key--action vk-key--bs" style="max-width:52px" @click.stop="backspace()">
                <Icon name="material-symbols:backspace" class="vk-icon-lg" />
              </button>
            </div>
            <div class="vk-row vk-row--bottom">
              <button class="vk-key vk-key--action vk-key--mode" @click.stop="openSymbols()">
                <span class="vk-mode-label">?123</span>
              </button>
              <button class="vk-key vk-key--action vk-key--lang" @click.stop="cycleMode()">
                <Icon name="material-symbols:language" class="vk-icon" />
              </button>
              <button class="vk-key vk-key--space" @click.stop="insertText(' ')">
                <span class="vk-space-hint">{{ spaceLabel }}</span>
              </button>
              <button class="vk-key vk-key--action vk-key--done" @click.stop="submit()">
                <Icon name="material-symbols:keyboard-return" class="vk-icon" />
              </button>
            </div>
          </template>

          <!-- ===== Japanese Romaji Panel ===== -->
          <template v-if="keyboardMode === 'jp'">
            <div class="vk-row">
              <button v-for="k in jpRow1" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
            </div>
            <div class="vk-row">
              <div class="vk-spacer" />
              <button v-for="k in jpRow2" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <div class="vk-spacer" />
            </div>
            <div class="vk-row">
              <button v-for="k in jpRow3" :key="k" class="vk-key" @click.stop="insertText(k)">{{ k }}</button>
              <button class="vk-key vk-key--action vk-key--bs" style="max-width:52px" @click.stop="backspace()">
                <Icon name="material-symbols:backspace" class="vk-icon-lg" />
              </button>
            </div>
            <div class="vk-row vk-row--bottom">
              <button class="vk-key vk-key--action vk-key--mode" @click.stop="openSymbols()">
                <span class="vk-mode-label">?123</span>
              </button>
              <button class="vk-key vk-key--action vk-key--kana" @click.stop="toggleKanaMode()">
                <span class="vk-kana-label">{{ jpKanaMode === 'hiragana' ? 'あ' : 'ア' }}</span>
                <span class="vk-key-label">{{ jpKanaMode === 'hiragana' ? '平仮名' : '片仮名' }}</span>
              </button>
              <button class="vk-key vk-key--action vk-key--lang" @click.stop="cycleMode()">
                <Icon name="material-symbols:language" class="vk-icon" />
              </button>
              <button class="vk-key vk-key--space" @click.stop="insertText(' ')">
                <span class="vk-space-hint">{{ spaceLabel }}</span>
              </button>
              <button class="vk-key vk-key--action vk-key--done" @click.stop="submit()">
                <Icon name="material-symbols:keyboard-return" class="vk-icon" />
              </button>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useVirtualKeyboard } from "@/composables/useVirtualKeyboard";
import { getCandidates } from "@/utils/pinyin";
import { getPredictions } from "@/utils/predict";
import { romajiToHiraganaWithSokuon, romajiToKatakana } from "@/utils/kana";

const {
  keyboardVisible, keyboardMode, shiftLock, jpKanaMode, composing, lastCommitted,
  hideKeyboard, insertText, insertAtCursor, commitComposition, commitPrediction,
  backspace, pasteFromClipboard, submit,
  toggleShift, toggleKanaMode, setMode, cycleMode,
} = useVirtualKeyboard();

// Track last text mode so symbols panel ABC returns to the right mode
const lastTextMode = ref<"en" | "cn" | "jp">("en");
watch(keyboardMode, (m) => {
  if (m !== "num") lastTextMode.value = m as "en" | "cn" | "jp";
});

function openSymbols() {
  setMode("num");
}

// ── Key layouts ──
const numKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const row3 = ["Z", "X", "C", "V", "B", "N", "M"];

const displayRow1 = computed(() => shiftLock.value ? row1 : row1.map(k => k.toLowerCase()));
const displayRow2 = computed(() => shiftLock.value ? row2 : row2.map(k => k.toLowerCase()));
const displayRow3 = computed(() => shiftLock.value ? row3 : row3.map(k => k.toLowerCase()));

const symRow1 = ["@", "#", "$", "%", "&", "*", "-", "+", "(", ")"];
const symRow2 = ["!", "\"", "'", ":", ";", ",", ".", "?", "/"];
const symRow3 = ["~", "`", "|", "\\", "<", ">", "{", "}", "[", "]"];

const pinyinRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const pinyinRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const pinyinRow3 = ["z", "x", "c", "v", "b", "n", "m"];

const jpRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const jpRow2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const jpRow3 = ["z", "x", "c", "v", "b", "n", "m"];

// ── Candidate logic ──
const candidates = computed<string[]>(() => {
  if (!composing.value) return [];
  if (keyboardMode.value === "cn") return getCandidates(composing.value);
  if (keyboardMode.value === "jp") {
    const fn = jpKanaMode.value === "katakana" ? romajiToKatakana : romajiToHiraganaWithSokuon;
    const kana = fn(composing.value);
    return kana ? [kana] : [];
  }
  return [];
});

// ── 联想 prediction logic ──
const predictions = computed<string[]>(() => {
  if (keyboardMode.value !== "cn") return [];
  if (composing.value) return []; // Don't show predictions while typing pinyin
  if (!lastCommitted.value) return [];
  return getPredictions(lastCommitted.value);
});

const showCandidateBar = computed(() =>
  (keyboardMode.value === "cn" || keyboardMode.value === "jp") && composing.value.length > 0
);

const showPredictionBar = computed(() =>
  keyboardMode.value === "cn" && !composing.value && predictions.value.length > 0
);

// Show number quick bar when CN/JP mode, not composing, and no predictions
const showNumBar = computed(() =>
  (keyboardMode.value === "cn" || keyboardMode.value === "jp") && !composing.value && !showPredictionBar.value
);

// Auto-commit JP kana when input completes
watch(composing, (val) => {
  if (keyboardMode.value === "jp" && val) {
    const fn = jpKanaMode.value === "katakana" ? romajiToKatakana : romajiToHiraganaWithSokuon;
    const kana = fn(val);
    if (kana && kana !== val && !/[a-z]$/.test(val)) {
      commitComposition(kana);
    }
  }
});

const spaceLabel = computed(() => {
  if (keyboardMode.value === "cn") return "拼音";
  if (keyboardMode.value === "jp") return "空白";
  return "空格";
});

watch(keyboardMode, () => { shiftLock.value = false; });
</script>

<style scoped>
/* ── Overlay & Container ── */
.vk-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.vk-container {
  width: 100%;
  max-width: 800px;
  padding: 6px 5px 10px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 24px 24px 0 0;
  display: grid;
  gap: 5px;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: var(--md-sys-elevation-3);
}

/* ── Candidate bar ── */
.vk-candidates {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 4px 8px;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 40px;
  align-items: center;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  margin-bottom: 2px;
  /* M3E scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant) transparent;
}

.vk-candidates::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.vk-candidates::-webkit-scrollbar-track {
  background: transparent;
}

.vk-candidates::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant);
  border-radius: 2px;
}

.vk-candidate {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-size: 18px;
  font-family: "Noto Sans SC", "Noto Sans CJK SC", sans-serif;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.vk-candidate:active {
  background: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-secondary-container));
}

.vk-candidate--num {
  font-size: 16px;
  min-width: 36px;
  padding: 6px 12px;
  background: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
}

.vk-candidate--num:active {
  background: color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent);
}

/* ── Prediction (联想) bar ── */
.vk-candidates--predict {
  border-bottom: 1px solid var(--md-sys-color-tertiary-container, var(--md-sys-color-outline-variant));
}

.vk-predict-label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--md-sys-color-tertiary, var(--md-sys-color-primary));
  font-weight: 600;
  padding: 4px 6px;
  opacity: 0.7;
}

.vk-candidate--predict {
  background: var(--md-sys-color-tertiary-container, var(--md-sys-color-surface-container-high));
  color: var(--md-sys-color-on-tertiary-container, var(--md-sys-color-on-surface));
}

.vk-candidate--predict:active {
  background: color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 40%, transparent);
}

.vk-composing {
  font-size: 15px;
  color: var(--md-sys-color-on-surface-variant);
  padding: 4px 8px;
  letter-spacing: 0.04em;
}

/* ── Rows ── */
.vk-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.vk-row--bottom {
  gap: 6px;
}

.vk-spacer {
  flex: 0.5;
}

/* ── Keys ── */
.vk-key {
  flex: 1;
  min-width: 0;
  max-width: 46px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font-size: 16px;
  font-weight: 500;
  font-family: "Roboto", "Noto Sans SC", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 140ms ease, transform 80ms ease;
}

.vk-key:active {
  background: color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent);
  transform: scale(0.93);
}

.vk-key--num {
  max-width: 44px;
  height: 32px;
  font-size: 14px;
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 6px;
}

.vk-key--sym {
  font-size: 18px;
  font-family: monospace;
}

/* ── Action keys ── */
.vk-key--action {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  font-weight: 600;
}

.vk-key--active {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.vk-key--bs {
  max-width: 50px;
}

.vk-key--shift {
  max-width: 50px;
}

.vk-key--mode {
  flex: 0 0 auto;
  min-width: 52px;
  max-width: 60px;
}

.vk-key--lang {
  flex: 0 0 auto;
  min-width: 44px;
  max-width: 50px;
}

.vk-key--kana {
  flex: 0 0 auto;
  min-width: 56px;
  max-width: 68px;
  flex-direction: column;
  gap: 1px;
  font-size: 11px;
}

.vk-kana-label {
  font-size: 16px;
  line-height: 1;
}

.vk-key--paste {
  flex: 0 0 auto;
  min-width: 64px;
  max-width: 80px;
  gap: 3px;
  font-size: 13px;
}

.vk-key--done {
  flex: 0 0 auto;
  min-width: 52px;
  max-width: 60px;
}

.vk-key--space {
  flex: 3;
  max-width: none;
  height: 44px;
  border-radius: 22px;
}

.vk-key-label {
  font-size: 11px;
  line-height: 1;
}

.vk-mode-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.vk-space-hint {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.03em;
}

/* ── Icons ── */
.vk-icon {
  font-size: 20px;
}

.vk-icon-lg {
  font-size: 22px;
}

/* ── Slide transition ── */
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
