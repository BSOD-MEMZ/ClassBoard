export interface WallpaperItem {
  name: string;
  url: string;
  themeColor: string;
}

import { ref, computed } from "vue";

// Hardcoded wallpaper list with matched accent colors
const WALLPAPER_ENTRIES: { name: string; themeColor: string }[] = [
  { name: "android13.png", themeColor: "#D0BCFF" },
  { name: "wp1.png", themeColor: "#FEC9CD" },
  { name: "wp2.png", themeColor: "#4450A0" },
];

// Standard Vite glob — image imports return { default: assetUrl }.
// eager:false → URLs resolved lazily, images only fetched when CSS references them.
// This avoids ~3 wallpaper URL resolutions blocking the initial module graph.
const _globModules = import.meta.glob<{ default: string }>(
  "../assets/wallpaper/*.{png,jpg,jpeg}",
  { eager: false },
);

// Resolved wallpaper list — populated on first access
let _wallpapers: WallpaperItem[] | null = null;

async function resolveWallpapers(): Promise<WallpaperItem[]> {
  if (_wallpapers) return _wallpapers;

  const promises = WALLPAPER_ENTRIES.map(async (entry) => {
    for (const [key, modFn] of Object.entries(_globModules)) {
      const k = key.replace(/\\/g, "/");
      if (k.endsWith("/" + entry.name)) {
        const mod = await modFn();
        return {
          name: entry.name,
          url: String(mod?.default || ""),
          themeColor: entry.themeColor,
        };
      }
    }
    return null;
  });

  const results = (await Promise.all(promises)).filter((wp): wp is WallpaperItem => wp !== null && !!wp.url);

  // Fallback: if glob matching fails, use all discovered files
  if (results.length <= 2) {
    const fromGlob: WallpaperItem[] = [];
    for (const [key, modFn] of Object.entries(_globModules)) {
      const name = key.replace(/\\/g, "/").split("/").pop() || "";
      const mod = await modFn();
      const url = String(mod?.default || "");
      if (!name || !url) continue;
      const matched = WALLPAPER_ENTRIES.find((e) => e.name === name);
      fromGlob.push({ name, url, themeColor: matched?.themeColor || "#39c5bb" });
    }
    _wallpapers = fromGlob.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    _wallpapers = results;
  }

  return _wallpapers;
}

// Reactive wallpaper list — starts empty, fills on first async resolution
const _wallpapersRef = ref<WallpaperItem[]>([]);
let _wallpapersLoaded = false;

/** Trigger async wallpaper resolution (idempotent, starts on first call). */
async function ensureWallpapers(): Promise<WallpaperItem[]> {
  if (_wallpapersLoaded) return _wallpapersRef.value;
  _wallpapersLoaded = true;
  _wallpapersRef.value = await resolveWallpapers();
  return _wallpapersRef.value;
}

// Start loading immediately (non-blocking)
if (!import.meta.server) ensureWallpapers();

export function useWallpaper() {
  const wallpapers = computed<WallpaperItem[]>(() => _wallpapersRef.value);

  function wallpaperForName(name: string): WallpaperItem | undefined {
    return _wallpapersRef.value.find((w) => w.name === name);
  }

  function wallpaperUrlForName(name: string): string {
    return wallpaperForName(name)?.url || "";
  }

  function wallpaperThemeColor(name: string): string {
    return wallpaperForName(name)?.themeColor || "";
  }

  function applyWallpaper(url: string): void {
    if (import.meta.server) return;
    if (url) {
      document.body.style.backgroundImage = `url(${url})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
    }
  }

  return {
    wallpapers,
    wallpaperForName,
    wallpaperUrlForName,
    wallpaperThemeColor,
    applyWallpaper,
  };
}

