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
const isDragging = ref(false); // true during touch drag, disables CSS transition

const quickTiles = ref<QuickTile[]>([]);

export function useNotificationCenter() {
  function open(): void {
    panelOpen.value = true;
    dragProgress.value = 0;
    isDragging.value = false;
    // Two-frame delay ensures the DOM is painted at 0 before animating to 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dragProgress.value = 1;
      });
    });
  }

  function close(): void {
    isDragging.value = false;
    dragProgress.value = 0;
    // Delay hiding the overlay until transition completes
    setTimeout(() => {
      if (dragProgress.value === 0) panelOpen.value = false;
    }, 320);
  }

  function toggle(): void {
    panelOpen.value ? close() : open();
  }

  function setDragProgress(p: number): void {
    isDragging.value = true;
    dragProgress.value = Math.max(0, Math.min(1, p));
  }

  function finishDrag(shouldOpen: boolean): void {
    isDragging.value = false;
    if (shouldOpen) {
      panelOpen.value = true;
      dragProgress.value = 1;
    } else {
      dragProgress.value = 0;
      setTimeout(() => {
        if (dragProgress.value === 0) panelOpen.value = false;
      }, 320);
    }
  }

  function setTiles(tiles: QuickTile[]): void {
    quickTiles.value = tiles;
  }

  return {
    panelOpen,
    dragProgress,
    isDragging,
    quickTiles,
    open,
    close,
    toggle,
    setDragProgress,
    finishDrag,
    setTiles,
  };
}
