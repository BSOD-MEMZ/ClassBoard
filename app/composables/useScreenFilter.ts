// Screen filter — brightness dimmer & eye-care (blue light) overlay
// Shared state, persisted to localStorage

const STORAGE_KEY = "classboard_screen_filter_v1";

interface ScreenFilterState {
  brightness: number;   // 0-1, 1 = full brightness (no dim), 0 = max dim
  eyeCare: boolean;     // warm color filter
}

function loadState(): ScreenFilterState {
  if (import.meta.server) return { brightness: 1, eyeCare: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ScreenFilterState;
  } catch { /* ignore */ }
  return { brightness: 1, eyeCare: false };
}

function saveState(state: ScreenFilterState): void {
  if (import.meta.server) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Module-level singletons
const brightness = ref(loadState().brightness);
const eyeCare = ref(loadState().eyeCare);

export function useScreenFilter() {
  function setBrightness(v: number): void {
    const val = Math.max(0.1, Math.min(1, v));
    brightness.value = val;
    saveState({ brightness: val, eyeCare: eyeCare.value });
  }

  function toggleEyeCare(): void {
    eyeCare.value = !eyeCare.value;
    saveState({ brightness: brightness.value, eyeCare: eyeCare.value });
  }

  return {
    brightness,
    eyeCare,
    setBrightness,
    toggleEyeCare,
  };
}
