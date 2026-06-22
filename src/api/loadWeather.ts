import { fetchWeather, type WeatherParams } from './weather'
import { getCachedWeather, putCachedWeather } from '../cache/weatherCache'
import type { WeatherSeries } from '../lib/types'

/** Cache-first single fetch, shared by hooks and bulk loaders (e.g. the map). */
export async function loadWeather(params: WeatherParams): Promise<WeatherSeries> {
  const cached = await getCachedWeather(params)
  if (cached) return cached
  const series = await fetchWeather(params)
  await putCachedWeather(params, series)
  return series
}
