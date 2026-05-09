export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat
  const lon = query.lon
  if (!lat || !lon) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lat/lon parameters' })
  }
  try {
    return await $fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
    )
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Weather API unavailable' })
  }
})
