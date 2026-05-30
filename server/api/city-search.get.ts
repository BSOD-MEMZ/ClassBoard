const cache = new Map<string, { data: any; ts: number }>()
const TTL = 30 * 60 * 1000 // 30 minutes — geocoding data rarely changes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = query.name
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name parameter' })
  }

  const key = String(name).trim()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < TTL) {
    setResponseHeader(event, "Cache-Control", "public, max-age=1800")
    return cached.data
  }

  try {
    const data = await $fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=8&language=zh&format=json`
    )
    cache.set(key, { data, ts: Date.now() })
    setResponseHeader(event, "Cache-Control", "public, max-age=1800")
    return data
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Geocoding API unavailable' })
  }
})
