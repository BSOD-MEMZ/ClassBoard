const cache = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat
  const lon = query.lon
  if (!lat || !lon) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lat/lon parameters' })
  }

  const key = `${lat},${lon}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < TTL) {
    return cached.data
  }

  try {
    const data = await $fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
    )
    cache.set(key, { data, ts: Date.now() })
    return data
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Weather API unavailable' })
  }
})
