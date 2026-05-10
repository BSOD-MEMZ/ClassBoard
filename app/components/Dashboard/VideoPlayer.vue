<template>
  <div class="video-player-shell">
    <video
      ref="videoEl"
      :src="videoSrc"
      class="video-player"
      controls
      autoplay
      playsinline
    ></video>
  </div>
</template>

<script setup lang="ts">
const videoEl = ref<HTMLVideoElement | null>(null);

const videoModules = import.meta.glob<{ default: string }>(
  "../assets/video/*.mp4",
  { eager: true },
);

const videoSrc = computed(() => {
  for (const mod of Object.values(videoModules)) {
    const url = String(mod?.default || "");
    if (url) return url;
  }
  return "";
});

onMounted(() => {
  videoEl.value?.play().catch(() => {
    // Autoplay may be blocked, user can use controls
  });
});
</script>

<style scoped>
.video-player-shell {
  width: 100%;
  height: calc(100vh - 66px - 12px - env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-player {
  width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: contain;
  outline: none;
}
</style>
