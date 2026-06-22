import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWeather, type WeatherParams } from '../api/weather'
import { getCachedWeather, putCachedWeather, cacheKey } from '../cache/weatherCache'
import { computeNormals, NORMAL_START, NORMAL_END, type DailyNormal } from '../lib/climate'
import type { Location } from '../lib/types'

/**
 * Fetches the 1991–2020 reference series for a location (cached permanently, like
 * any historical data) and computes smoothed day-of-year climate normals.
 */
export function useNormals(location: Location | null, enabled = true): UseQueryResult<Map<number, DailyNormal>> {
  const params: WeatherParams | null = location
    ? { latitude: location.latitude, longitude: location.longitude, startDate: NORMAL_START, endDate: NORMAL_END }
    : null

  return useQuery({
    queryKey: ['normals', params ? cacheKey(params) : 'none'],
    enabled: enabled && params !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const p = params as WeatherParams
      let series = await getCachedWeather(p)
      if (!series) {
        series = await fetchWeather(p)
        await putCachedWeather(p, series)
      }
      return computeNormals(series)
    },
  })
}
