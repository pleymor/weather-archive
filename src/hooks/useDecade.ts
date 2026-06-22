import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWeather, type WeatherParams } from '../api/weather'
import { getCachedWeather, putCachedWeather, cacheKey } from '../cache/weatherCache'
import { MIN_DATE, maxDate } from '../lib/dates'
import type { WeatherSeries, Location } from '../lib/types'

/** Clamped [start, end] ISO range for a decade (e.g. 2020 → 2020-01-01..2029-12-31). */
export function decadeRange(decadeStart: number): { start: string; end: string } {
  const rawStart = `${decadeStart}-01-01`
  const rawEnd = `${decadeStart + 9}-12-31`
  const max = maxDate()
  return {
    start: rawStart < MIN_DATE ? MIN_DATE : rawStart,
    end: rawEnd > max ? max : rawEnd,
  }
}

/**
 * Fetches a single decade of daily data for a location (cached permanently per
 * decade). Far lighter than one 1940→today request, which avoids API rate limits.
 */
export function useDecade(location: Location | null, decadeStart: number): UseQueryResult<WeatherSeries> {
  const { start, end } = decadeRange(decadeStart)
  const params: WeatherParams | null = location
    ? { latitude: location.latitude, longitude: location.longitude, startDate: start, endDate: end }
    : null

  return useQuery({
    queryKey: ['decade', params ? cacheKey(params) : 'none'],
    enabled: params !== null,
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
