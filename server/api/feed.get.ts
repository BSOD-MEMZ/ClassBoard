import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default defineEventHandler(async (event) => {
  const cacheKey = "feed";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    setResponseHeader(event, "Cache-Control", "public, max-age=300");
    return cached.data;
  }

  const feedUrl = 'https://xxtsoft.top/support/classboard/feed.json'
  try {
    const data = await $fetch(feedUrl, { signal: AbortSignal.timeout(7000) });
    cache.set(cacheKey, { data, ts: Date.now() });
    setResponseHeader(event, "Cache-Control", "public, max-age=300");
    return data;
  } catch {
    try {
      const localPath = join(process.cwd(), 'public', 'feed.json')
      const raw = await readFile(localPath, 'utf-8')
      const data = JSON.parse(raw);
      cache.set(cacheKey, { data, ts: Date.now() });
      setResponseHeader(event, "Cache-Control", "public, max-age=60");
      return data;
    } catch {
      throw createError({ statusCode: 502, statusMessage: 'Feed unavailable' })
    }
  }
})
