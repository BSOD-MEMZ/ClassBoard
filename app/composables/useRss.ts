import { createFeedSource } from "./useFeedSource";
import { loadConfig } from "./useConfig";

const rssSource = createFeedSource({
  cacheKey: "classboard_rss_cache_v1",
  fallbackTitle: "RSS 资讯",
  refreshIntervalMs: 10 * 60 * 1000,
  showFallbackItems: false,
});

function getRssUrl(): string {
  const config = loadConfig();
  return config.rssUrl || "https://www.chinanews.com.cn/rss/china.xml";
}

export function useRss() {
  return {
    rssData: rssSource.data,
    refreshRss: () => {
      const config = loadConfig();
      if (!config.rssEnabled) return;
      return rssSource.refresh("/api/rss", { url: getRssUrl() });
    },
    startRssTimer: () => {
      const config = loadConfig();
      if (!config.rssEnabled) return;
      rssSource.start("/api/rss", { url: getRssUrl() });
    },
    stopRssTimer: () => rssSource.stop(),
  };
}

