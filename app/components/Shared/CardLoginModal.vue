<template>
  <m3e-dialog :open="visible" dismissible @closed="handleCancel" class="login-dialog-root" :data-manual="manualMode ? 'true' : 'false'">
    <div class="login-dialog">

      <!-- ===== State 1: Waiting for card ===== -->
      <template v-if="state === 'waiting' && !manualMode">
        <div class="login-card-graphic">
          <Icon name="material-symbols:nfc" class="nfc-icon" />
        </div>
        <div class="login-title">刷卡登录</div>
        <div class="login-hint">请将南方中学饭卡放在右下角读卡区域（请勿使用充电卡）</div>
        <div class="login-countdown">{{ countdown }}</div>
      </template>

      <!-- ===== Manual card input ===== -->
      <template v-if="state === 'waiting' && manualMode">
        <div class="login-card-graphic">
          <Icon name="material-symbols:keyboard" class="nfc-icon" />
        </div>
        <div class="login-title">手动输入卡号</div>
        <div class="manual-input-wrap">
          <input
            ref="manualInputRef"
            v-model="manualCardId"
            type="text"
            inputmode="none"
            class="manual-card-input"
            placeholder="请输入10位卡号"
            maxlength="10"
            @keydown.enter.prevent="submitManualCard()"
          />
        </div>
        <div class="manual-actions">
          <m3e-button variant="outlined" @click="closeManualInput">返回刷卡</m3e-button>
          <m3e-button variant="filled" :disabled="manualCardId.trim().length < 10" @click="submitManualCard">
            确认登录
          </m3e-button>
        </div>
      </template>

      <!-- ===== State 2: Loading ===== -->
      <template v-if="state === 'loading'">
        <m3e-linear-progress-indicator variant="wavy" />
        <div class="login-hint" style="margin-top:12px">正在验证...</div>
      </template>

      <!-- ===== State 3: Card valid — confirm ===== -->
      <template v-if="state === 'confirm' && pendingUser">
        <div class="confirm-avatar">
          <img v-if="pendingUser.avatar" :src="pendingUser.avatar" class="user-avatar-img" />
          <Icon v-else name="material-symbols:account-circle" class="user-avatar-icon" />
        </div>
        <div class="login-title">{{ pendingUser.name }}</div>
        <div class="login-role">{{ roleLabel(pendingUser.role) }}</div>
        <div class="confirm-question">是否以此身份登录？</div>
        <div class="confirm-buttons">
          <m3e-button variant="filled" @click="doConfirm(true)">永久登录</m3e-button>
          <m3e-button variant="outlined" @click="doConfirm(false)">临时登录</m3e-button>
        </div>
      </template>

      <!-- ===== State 4: Success ===== -->
      <template v-if="state === 'success'">
        <Icon name="material-symbols:check-circle" class="result-icon result-icon--ok" />
        <div class="login-title">登录成功</div>
        <div class="login-hint">{{ successMsg }}</div>
      </template>

      <!-- ===== State 5: Failed ===== -->
      <template v-if="state === 'failed'">
        <Icon name="material-symbols:error" class="result-icon result-icon--fail" />
        <div class="login-title">验证失败</div>
        <div class="login-hint">{{ failMsg }}</div>
        <div class="login-countdown">{{ countdown }}</div>
      </template>

    </div>
    <div slot="actions" end>
      <m3e-icon-button variant="standard" toggle :selected="muted" @click="toggleMute">
        <Icon :name="muted ? 'material-symbols:volume-off' : 'material-symbols:volume-up'" />
      </m3e-icon-button>
      <m3e-button v-if="state === 'waiting' && !manualMode" variant="text" @click="openManualInput">
        <Icon slot="icon" name="material-symbols:edit" />
        手动输入卡号
      </m3e-button>
      <m3e-button v-if="state === 'confirm'" variant="text" @click="backToWaiting">取消</m3e-button>
      <m3e-button v-else-if="state === 'success'" variant="text" @click="handleCancel">关闭</m3e-button>
      <m3e-button v-else variant="text" @click="handleCancel">取消</m3e-button>
    </div>
  </m3e-dialog>
</template>

<script setup lang="ts">
import type { AuthUser } from "@/composables/useAuth";
import { useAuth } from "@/composables/useAuth";
import { useVirtualKeyboard } from "@/composables/useVirtualKeyboard";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { lookupCard, confirmLogin } = useAuth();
const { showKeyboard, hideKeyboard } = useVirtualKeyboard();

type LoginState = "waiting" | "loading" | "confirm" | "success" | "failed";
const state = ref<LoginState>("waiting");
const pendingUser = ref<AuthUser | null>(null);
const successMsg = ref("");
const failMsg = ref("");

// ── Card reader ──
const cardDigits = ref("");
const countdown = ref(100);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// ── Manual card input ──
const manualMode = ref(false);
const manualCardId = ref("");
const manualInputRef = ref<HTMLInputElement | null>(null);

// Audio
let bgmAudio: HTMLAudioElement | null = null;
let readAudio: HTMLAudioElement | null = null;
const muted = ref(false);

function toggleMute(): void {
  muted.value = !muted.value;
  if (muted.value) {
    stopAllAudio();
  } else {
    // Re-enable: restart BGM if dialog is still in waiting state
    if (state.value === "waiting") playBgm();
  }
}

function stopAllAudio(): void {
  if (bgmAudio) { bgmAudio.pause(); bgmAudio.currentTime = 0; }
  if (readAudio) { readAudio.pause(); readAudio.currentTime = 0; readAudio = null; }
}

function roleLabel(role: string): string {
  const map: Record<string, string> = { admin: "管理员", teacher: "教师", student: "学生" };
  return map[role] || role;
}

function playBgm(): void {
  if (import.meta.server || muted.value) return;
  try {
    bgmAudio = new Audio(new URL("@/assets/prism-entry.mp3", import.meta.url).href);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.4;
    bgmAudio.play().catch(() => {});
  } catch { /* ignore */ }
}

function stopBgm(): void {
  stopAllAudio();
  bgmAudio = null;
}

function playReadSound(): void {
  if (import.meta.server || muted.value) return;
  try {
    readAudio = new Audio(new URL("@/assets/read.wav", import.meta.url).href);
    readAudio.volume = 0.6;
    readAudio.play().catch(() => {});
  } catch { /* ignore */ }
}

function startCountdown(): void {
  countdown.value = 100;
  stopCountdown();
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) handleCancel();
  }, 1000);
}

function stopCountdown(): void {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

// ── Keydown handler ──
function onKeyDown(e: KeyboardEvent): void {
  if (!props.visible) return;
  if (state.value !== "waiting" && state.value !== "failed") return;

  const target = e.target as HTMLElement;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA") && !target.hasAttribute("data-no-keyboard")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    const id = cardDigits.value.trim();
    if (id.length >= 10) { submitCard(id); }
    cardDigits.value = "";
    return;
  }

  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    cardDigits.value += e.key;
    if (cardDigits.value.length === 10) {
      const id = cardDigits.value;
      cardDigits.value = "";
      submitCard(id);
    }
  }
}

async function submitCard(cardId: string): Promise<void> {
  playReadSound();
  stopCountdown();
  state.value = "loading";

  const res = await lookupCard(cardId);

  if (res.ok && res.user) {
    pendingUser.value = res.user;
    state.value = "confirm";
  } else {
    failMsg.value = res.message || "未识别的卡号";
    state.value = "failed";
    startCountdown();
  }
}

function openManualInput(): void {
  manualMode.value = true;
  manualCardId.value = "";
  stopCountdown();
  nextTick(() => {
    if (manualInputRef.value) {
      manualInputRef.value.focus();
      showKeyboard(manualInputRef.value);
    }
  });
}

function closeManualInput(): void {
  manualMode.value = false;
  manualCardId.value = "";
  hideKeyboard();
  startCountdown();
}

function submitManualCard(): void {
  const id = manualCardId.value.trim();
  if (id.length < 10) return;
  hideKeyboard();
  manualMode.value = false;
  submitCard(id);
}

function backToWaiting(): void {
  pendingUser.value = null;
  state.value = "waiting";
  startCountdown();
}

function doConfirm(permanent: boolean): void {
  if (!pendingUser.value) return;
  confirmLogin(pendingUser.value, permanent);
  stopBgm();
  stopCountdown();
  successMsg.value = permanent
    ? `已永久登录，欢迎 ${pendingUser.value.name}`
    : `已临时登录，欢迎 ${pendingUser.value.name}`;
  state.value = "success";
  setTimeout(() => {
    emit("close");
    setTimeout(resetState, 300);
  }, 2000);
}

function handleCancel(): void {
  stopBgm();
  stopCountdown();
  emit("close");
  setTimeout(resetState, 300);
}

function resetState(): void {
  cardDigits.value = "";
  manualMode.value = false;
  manualCardId.value = "";
  hideKeyboard();
  pendingUser.value = null;
  successMsg.value = "";
  failMsg.value = "";
  muted.value = false;
  state.value = "waiting";
}

// Lifecycle
watch(() => props.visible, (v) => {
  if (v) {
    resetState();
    document.addEventListener("keydown", onKeyDown);
    playBgm();
    startCountdown();
  } else {
    document.removeEventListener("keydown", onKeyDown);
    stopBgm();
    stopCountdown();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyDown);
  stopBgm();
  stopCountdown();
});
</script>

<style scoped>
/* Make the dialog taller to prevent scrollbar */
.login-dialog-root {
  --m3e-dialog-container-min-height: 340px;
  --m3e-dialog-container-max-height: 440px;
  --m3e-dialog-container-min-width: 320px;
  max-height: 440px !important;
  min-height: 340px !important;
}

/* When manual card input is open, lower dialog so keyboard can overlay it */
.login-dialog-root[data-manual="true"] {
  z-index: 100;
  position: relative;
}

.login-dialog {
  text-align: center;
  padding: 4px 2px 0;
}

.login-card-graphic {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  animation: pulse-ring 2s ease-in-out infinite;
}

.nfc-icon {
  font-size: 36px;
  color: var(--md-sys-color-on-primary-container);
}

.login-title {
  margin-top: 8px;
  font-size: var(--md3-title-medium);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.login-hint {
  margin-top: 4px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
}

.login-countdown {
  margin-top: 6px;
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-outline);
}

.login-role {
  margin-top: 2px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

/* ── Confirm screen ── */
.confirm-avatar {
  margin-bottom: 2px;
}

.user-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-icon {
  font-size: 44px;
  color: var(--md-sys-color-on-surface-variant);
}

.confirm-question {
  margin-top: 6px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 8px;
}

/* ── Result icons ── */
.result-icon {
  font-size: 40px;
}

.result-icon--ok {
  color: var(--md-sys-color-primary);
}

.result-icon--fail {
  color: var(--md-sys-color-error);
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent); }
  50% { box-shadow: 0 0 0 14px transparent; }
}

/* ── Manual card input ── */
.manual-input-wrap {
  margin: 16px 0 8px;
}

.manual-card-input {
  width: 100%;
  max-width: 240px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font: inherit;
  font-size: var(--md3-title-medium);
  text-align: center;
  letter-spacing: 2px;
  outline: none;
  transition: border-color 200ms ease;
}

.manual-card-input:focus {
  border-color: var(--md-sys-color-primary);
}

.manual-card-input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0;
  font-size: var(--md3-body-medium);
}

.manual-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
</style>
