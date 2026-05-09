import type { FeedData } from '@/types'
import { normalizeFeedPayload } from '@/utils/feed'

const FEED_CACHE_KEY = 'classboard_feed_cache_v1'

export function useFeed() {
  const feedData = ref<FeedData>({ title: '校园资讯', updatedAt: '', items: [] })

  let feedTimer: ReturnType<typeof setInterval> | null = null

  async function refreshFeed(): Promise<void> {
    if (import.meta.server) return
    try {
      const data = await $fetch<Record<string, unknown>>('/api/feed')
      const normalized = normalizeFeedPayload(data)
      if (normalized.items.length) {
        feedData.value = normalized
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(normalized))
        return
      }
    } catch { /* API failed, try cache */ }

    try {
      const cacheRaw = localStorage.getItem(FEED_CACHE_KEY)
      if (cacheRaw) {
        const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw))
        if (normalizedCache.items.length) {
          feedData.value = normalizedCache
          return
        }
      }
    } catch { /* ignore */ }

    feedData.value = {
      title: '校园资讯',
      updatedAt: '',
      items: [{ title: '暂无资讯', summary: '网络不可用且无本地缓存资讯。', time: '' }]
    }
  }

  function startFeedTimer(): void {
    if (import.meta.server) return
    refreshFeed()
    feedTimer = setInterval(refreshFeed, 5 * 60 * 1000)
  }

  function stopFeedTimer(): void {
    if (feedTimer) { clearInterval(feedTimer); feedTimer = null }
  }

  return { feedData, refreshFeed, startFeedTimer, stopFeedTimer }
}
