export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = query.name
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name parameter' })
  }
  try {
    return await $fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=8&language=zh&format=json`
    )
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Geocoding API unavailable' })
  }
})
