import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  const feedUrl = 'https://xxtsoft.top/support/classboard/feed.json'
  try {
    return await $fetch(feedUrl, { signal: AbortSignal.timeout(7000) })
  } catch {
    try {
      const localPath = join(process.cwd(), 'public', 'feed.json')
      const raw = await readFile(localPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      throw createError({ statusCode: 502, statusMessage: 'Feed unavailable' })
    }
  }
})
