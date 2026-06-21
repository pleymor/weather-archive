import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWeather, type WeatherParams } from '../api/weather'
import { getCachedWeather, putCachedWeather, cacheKey } from '../cache/weatherCache'
import type { WeatherSeries } from '../lib/types'

export function useWeather(params: WeatherParams | null): UseQueryResult<WeatherSeries> {
  return useQuery({
    queryKey: ['weather', params ? cacheKey(params) : 'none'],
    enabled: params !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const p = params as WeatherParams
      const cached = await getCachedWeather(p)
      if (cached) return cached
      const series = await fetchWeather(p)
      await putCachedWeather(p, series)
      return series
    },
  })
}
