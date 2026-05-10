export interface WallpaperItem {
  name: string;
  url: string;
  themeColor: string;
}

// Hardcoded wallpaper list with matched accent colors
const WALLPAPER_ENTRIES: { name: string; themeColor: string }[] = [
  { name: "android13.png", themeColor: "#D0BCFF" },
  { name: "wp1.png", themeColor: "#FEC9CD" },
  { name: "wp2.png", themeColor: "#4450A0" },
];

// Standard Vite glob — image imports return { default: assetUrl }
const _globModules = import.meta.glob<{ default: string }>(
  "../assets/wallpaper/*.{png,jpg,jpeg}",
  { eager: true },
);

// Match a hardcoded filename to its glob-resolved URL
function resolveUrl(filename: string): string {
  const target = filename.replace(/\\/g, "/");
  for (const [key, mod] of Object.entries(_globModules)) {
    const k = key.replace(/\\/g, "/");
    if (k.endsWith("/" + target)) {
      return String(mod?.default || "");
    }
  }
  return "";
}

// Build final list: first try by matching hardcoded names to glob URLs.
// If that yields too few, fallback to using all glob-discovered files.
const _wallpapers: WallpaperItem[] = (() => {
  const fromEntries = WALLPAPER_ENTRIES.map((entry) => ({
    name: entry.name,
    url: resolveUrl(entry.name),
    themeColor: entry.themeColor,
  })).filter((wp) => wp.url);

  // If glob-based matching worked, use it
  if (fromEntries.length > 2) return fromEntries;

  // Fallback: build directly from glob keys
  const fromGlob: WallpaperItem[] = [];
  for (const [key, mod] of Object.entries(_globModules)) {
    const name = key.replace(/\\/g, "/").split("/").pop() || "";
    const url = String(mod?.default || "");
    if (!name || !url) continue;
    const matched = WALLPAPER_ENTRIES.find((e) => e.name === name);
    fromGlob.push({
      name,
      url,
      themeColor: matched?.themeColor || "#39c5bb",
    });
  }
  return fromGlob.sort((a, b) => a.name.localeCompare(b.name));
})();

export function useWallpaper() {
  const wallpapers = computed<WallpaperItem[]>(() => _wallpapers);

  function wallpaperForName(name: string): WallpaperItem | undefined {
    return _wallpapers.find((w) => w.name === name);
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

