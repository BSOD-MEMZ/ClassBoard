import { createFeedSource } from "./useFeedSource";

const feedSource = createFeedSource({
  cacheKey: "classboard_feed_cache_v1",
  fallbackTitle: "校园资讯",
  refreshIntervalMs: 5 * 60 * 1000,
  showFallbackItems: true,
});

export function useFeed() {
  return {
    feedData: feedSource.data,
    refreshFeed: () => feedSource.refresh("/api/feed"),
    startFeedTimer: () => feedSource.start("/api/feed"),
    stopFeedTimer: () => feedSource.stop(),
  };
}

