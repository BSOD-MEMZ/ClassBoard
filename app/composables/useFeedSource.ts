// Shared fetch-with-cache-and-timer logic used by useFeed and useRss.
// Extracted to eliminate ~60 lines of duplicated code.

import type { FeedData } from "@/types";
import { normalizeFeedPayload } from "@/utils/feed";

export interface FeedSourceOptions {
  /** localStorage cache key */
  cacheKey: string;
  /** fallback title when network & cache both fail */
  fallbackTitle: string;
  /** refresh interval in ms */
  refreshIntervalMs: number;
  /** whether to show "no data" fallback items when everything fails */
  showFallbackItems: boolean;
}

export function createFeedSource(options: FeedSourceOptions) {
  const data = ref<FeedData>({
    title: options.fallbackTitle,
    updatedAt: "",
    items: [],
  });

  let timer: ReturnType<typeof setInterval> | null = null;

  async function fetchFromEndpoint(endpoint: string, query?: Record<string, string>): Promise<FeedData | null> {
    try {
      const raw = await $fetch<Record<string, unknown>>(endpoint, query ? { query } : {});
      const normalized = normalizeFeedPayload(raw);
      if (normalized.items.length) {
        localStorage.setItem(options.cacheKey, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      /* API failed, will try cache */
    }
    return null;
  }

  function loadFromCache(): FeedData | null {
    try {
      const raw = localStorage.getItem(options.cacheKey);
      if (raw) {
        const normalized = normalizeFeedPayload(JSON.parse(raw));
        if (normalized.items.length) return normalized;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function getFallback(): FeedData {
    if (!options.showFallbackItems) {
      return { title: options.fallbackTitle, updatedAt: "", items: [] };
    }
    return {
      title: options.fallbackTitle,
      updatedAt: "",
      items: [
        {
          title: "暂无资讯",
          summary: "网络不可用且无本地缓存资讯。",
          time: "",
        },
      ],
    };
  }

  async function refresh(endpoint: string, query?: Record<string, string>): Promise<void> {
    if (import.meta.server) return;

    const remote = await fetchFromEndpoint(endpoint, query);
    if (remote) {
      data.value = remote;
      return;
    }

    const cached = loadFromCache();
    if (cached) {
      data.value = cached;
      return;
    }

    data.value = getFallback();
  }

  function start(endpoint: string, query?: Record<string, string>): void {
    if (import.meta.server) return;
    refresh(endpoint, query);
    timer = setInterval(() => refresh(endpoint, query), options.refreshIntervalMs);
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { data, refresh, start, stop };
}
