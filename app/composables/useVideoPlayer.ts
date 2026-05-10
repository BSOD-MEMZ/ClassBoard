// Module-level singletons — shared across all useVideoPlayer() calls
const videoPlayerOpen = ref(false);

export function useVideoPlayer() {
  function openVideoPlayer(): void {
    videoPlayerOpen.value = true;
  }

  function closeVideoPlayer(): void {
    videoPlayerOpen.value = false;
  }

  return { videoPlayerOpen, openVideoPlayer, closeVideoPlayer };
}
