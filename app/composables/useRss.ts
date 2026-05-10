import type { FeedData } from "@/types";
import { normalizeFeedPayload } from "@/utils/feed";
import { loadConfig } from "./useConfig";

const RSS_CACHE_KEY = "classboard_rss_cache_v1";

export function useRss() {
  const rssData = ref<FeedData>({
    title: "RSS 资讯",
    updatedAt: "",
    items: [],
  });

  let rssTimer: ReturnType<typeof setInterval> | null = null;

  async function refreshRss(): Promise<void> {
    if (import.meta.server) return;
    const config = loadConfig();
    if (!config.rssEnabled) return;

    const rssUrl = config.rssUrl || "https://www.chinanews.com.cn/rss/china.xml";

    try {
      const data = await $fetch<Record<string, unknown>>("/api/rss", {
        query: { url: rssUrl },
      });
      const normalized = normalizeFeedPayload(data);
      if (normalized.items.length) {
        rssData.value = normalized;
        localStorage.setItem(RSS_CACHE_KEY, JSON.stringify(normalized));
        return;
      }
    } catch {
      /* API failed, try cache */
    }

    try {
      const cacheRaw = localStorage.getItem(RSS_CACHE_KEY);
      if (cacheRaw) {
        const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw));
        if (normalizedCache.items.length) {
          rssData.value = normalizedCache;
          return;
        }
      }
    } catch {
      /* ignore */
    }

    rssData.value = {
      title: "RSS 资讯",
      updatedAt: "",
      items: [],
    };
  }

  function startRssTimer(): void {
    if (import.meta.server) return;
    refreshRss();
    rssTimer = setInterval(refreshRss, 10 * 60 * 1000);
  }

  function stopRssTimer(): void {
    if (rssTimer) {
      clearInterval(rssTimer);
      rssTimer = null;
    }
  }

  return { rssData, refreshRss, startRssTimer, stopRssTimer };
}
