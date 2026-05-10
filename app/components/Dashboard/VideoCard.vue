<template>
  <m3e-card class="block video-card-block" variant="elevated">
    <div slot="header" class="block-title">
      <span>校园宣传片</span>
      <span class="video-subtitle">{{ currentName }}</span>
    </div>
    <div slot="content" class="video-card-content">
      <div class="video-wrapper" :class="{ 'video-wrapper--playing': isPlaying }">
        <video
          ref="videoEl"
          :src="videoSrc"
          class="video-el"
          playsinline
          @play="onPlay"
          @pause="onPause"
          @ended="onEnded"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoaded"
        ></video>

        <!-- Play overlay -->
        <div v-if="!isPlaying" class="video-overlay" @click="togglePlay">
          <m3e-button variant="filled" class="overlay-btn">
            <Icon slot="icon" name="material-symbols:play-arrow" />
            播放
          </m3e-button>
        </div>

        <!-- Controls bar -->
        <div v-if="isPlaying" class="video-controls">
          <m3e-icon-button
            variant="filled"
            class="ctrl-icon-btn"
            @click="togglePlay"
          >
            <Icon :name="isPaused ? 'material-symbols:play-arrow' : 'material-symbols:pause'" />
          </m3e-icon-button>

          <m3e-slider
            ref="sliderRef"
            :min="0"
            :max="duration || 100"
            step="0.1"
            class="ctrl-slider"
          >
            <m3e-slider-thumb :value="sliderValue" @change="onSliderChange"></m3e-slider-thumb>
          </m3e-slider>

          <span class="ctrl-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

          <m3e-icon-button
            v-if="playlist.length > 1"
            variant="standard"
            class="ctrl-icon-btn"
            @click="playNext"
          >
            <Icon name="material-symbols:skip-next" />
          </m3e-icon-button>
          <m3e-icon-button
            variant="standard"
            class="ctrl-icon-btn"
            @click="toggleFullscreen"
          >
            <Icon :name="isFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'" />
          </m3e-icon-button>
        </div>
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import { nowPlaying } from "@/composables/useNowPlaying";

interface VideoEntry {
  name: string;
  src: string;
}

const videoEl = ref<HTMLVideoElement | null>(null);
const sliderRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const isPaused = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const sliderValue = ref(0);
const isFullscreen = ref(false);
const currentIndex = ref(0);
let userSeeking = false;

const videoFiles = [
  "因为热爱所以闪耀.mp4",
  "筑梦振翼——奋进中的南方中学.mp4",
];

const playlist = computed<VideoEntry[]>(() =>
  videoFiles.map((filename) => ({
    name: filename.replace(/\.mp4$/i, ""),
    src: new URL(`../../assets/video/${filename}`, import.meta.url).href,
  })),
);

const currentVideo = computed(() => playlist.value[currentIndex.value] ?? playlist.value[0]);
const videoSrc = computed(() => currentVideo.value?.src ?? "");
const currentName = computed(() => currentVideo.value?.name ?? "");

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function togglePlay(): void {
  const v = videoEl.value;
  if (!v) return;
  if (v.paused) {
    v.play().catch(() => {});
  } else {
    v.pause();
  }
}

function onPlay(): void {
  isPlaying.value = true;
  isPaused.value = false;
  nowPlaying.value = currentName.value;
}

function onPause(): void {
  isPaused.value = true;
  nowPlaying.value = "";
}

function onEnded(): void {
  isPlaying.value = false;
  isPaused.value = false;
  currentTime.value = 0;
  sliderValue.value = 0;
  nowPlaying.value = "";
  // Auto-play next if available
  if (currentIndex.value < playlist.value.length - 1) {
    nextTick(() => playNext());
  }
}

function onTimeUpdate(): void {
  if (!videoEl.value) return;
  currentTime.value = videoEl.value.currentTime;
  if (!userSeeking) {
    sliderValue.value = videoEl.value.currentTime;
  }
}

function onLoaded(): void {
  if (videoEl.value) duration.value = videoEl.value.duration;
}

function onSliderChange(e: Event): void {
  const thumb = e.target as HTMLElement & { value?: number };
  if (thumb.value != null && videoEl.value) {
    videoEl.value.currentTime = thumb.value;
    sliderValue.value = thumb.value;
  }
}

function playNext(): void {
  const wasPlaying = !videoEl.value?.paused;
  currentIndex.value = (currentIndex.value + 1) % playlist.value.length;
  nextTick(() => {
    if (wasPlaying) {
      videoEl.value?.play().catch(() => {});
    }
  });
}

function toggleFullscreen(): void {
  const wrapper = videoEl.value?.parentElement;
  if (!wrapper) return;
  if (!document.fullscreenElement) {
    wrapper.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(() => {});
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(() => {});
  }
}

function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement;
}

function onSliderPointerDown(): void { userSeeking = true; }
function onSliderPointerUp(): void {
  userSeeking = false;
  if (videoEl.value) sliderValue.value = videoEl.value.currentTime;
}

onMounted(() => {
  document.addEventListener("fullscreenchange", onFullscreenChange);
  const slider = sliderRef.value;
  if (slider) {
    slider.addEventListener("pointerdown", onSliderPointerDown);
    slider.addEventListener("pointerup", onSliderPointerUp);
    slider.addEventListener("pointerleave", onSliderPointerUp);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  const slider = sliderRef.value;
  if (slider) {
    slider.removeEventListener("pointerdown", onSliderPointerDown);
    slider.removeEventListener("pointerup", onSliderPointerUp);
    slider.removeEventListener("pointerleave", onSliderPointerUp);
  }
});
</script>

<style scoped>
.video-card-content {
  display: flex;
  flex-direction: column;
}

.video-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant);
  margin-left: 8px;
  opacity: 0.7;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.video-wrapper--playing {
  aspect-ratio: auto;
}

.video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* ---- overlay ---- */
.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  background: rgba(0, 0, 0, 0.4);
  transition: background 200ms ease;
}

.video-overlay:hover {
  background: rgba(0, 0, 0, 0.55);
}

.overlay-btn {
  pointer-events: none;
}

/* ---- controls bar ---- */
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.ctrl-icon-btn {
  --m3e-icon-button-icon-color: #fff;
  flex-shrink: 0;
}

.ctrl-slider {
  flex: 1;
  min-width: 0;
  --m3e-slider-active-track-color: var(--md-sys-color-primary, #39c5bb);
  --m3e-slider-inactive-track-color: rgba(255, 255, 255, 0.3);
  --m3e-slider-thumb-color: var(--md-sys-color-primary, #39c5bb);
}

.ctrl-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #fff;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
