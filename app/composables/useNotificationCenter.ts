// Notification center — Android-style pull-down shade
// Shared state between layout (gesture detection) and component (UI)

export interface QuickTile {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
  action: () => void;
}

const panelOpen = ref(false);
const dragProgress = ref(0); // 0-1 for smooth drag animation

const quickTiles = ref<QuickTile[]>([]);

export function useNotificationCenter() {
  function open(): void {
    panelOpen.value = true;
    dragProgress.value = 1;
  }

  function close(): void {
    panelOpen.value = false;
    dragProgress.value = 0;
  }

  function toggle(): void {
    panelOpen.value ? close() : open();
  }

  function setDragProgress(p: number): void {
    dragProgress.value = Math.max(0, Math.min(1, p));
  }

  function setTiles(tiles: QuickTile[]): void {
    quickTiles.value = tiles;
  }

  return {
    panelOpen,
    dragProgress,
    quickTiles,
    open,
    close,
    toggle,
    setDragProgress,
    setTiles,
  };
}
