// Global audio mute — shared across the app
// Mutes all HTMLAudioElement instances on the page

const audioMuted = ref(false);

export function useAudioMute() {
  function toggleMute(): void {
    audioMuted.value = !audioMuted.value;
    if (audioMuted.value) {
      // Pause all currently playing audio elements
      document.querySelectorAll("audio").forEach((a) => {
        a.pause();
      });
    }
  }

  return {
    audioMuted,
    toggleMute,
  };
}
