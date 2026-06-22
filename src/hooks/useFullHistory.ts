import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWeather, type WeatherParams } from '../api/weather'
import { getCachedWeather, putCachedWeather, cacheKey } from '../cache/weatherCache'
import { MIN_DATE, maxDate } from '../lib/dates'
import type { WeatherSeries, Location } from '../lib/types'

/**
 * Fetches the full available history (1940 → yesterday) for a location, cached
 * permanently. This single dataset powers records, this-day-across-years, etc.
 */
export function useFullHistory(location: Location | null, enabled = true): UseQueryResult<WeatherSeries> {
  const params: WeatherParams | null = location
    ? { latitude: location.latitude, longitude: location.longitude, startDate: MIN_DATE, endDate: maxDate() }
    : null

  return useQuery({
    queryKey: ['fullHistory', params ? cacheKey(params) : 'none'],
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
      return series
    },
  })
}
