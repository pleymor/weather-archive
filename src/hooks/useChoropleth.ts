import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { loadWeather } from '../api/loadWeather'
import { centroid, type GeoFeature } from '../lib/geo'
import { mapWithConcurrency } from '../lib/async'

/** Max simultaneous archive requests, to stay under Open-Meteo's rate limit. */
const MAP_CONCURRENCY = 4

export interface CellTemps { min: number | null; max: number | null }

/** Min & max temperature (°C) per feature code for a single day, at each centroid. */
export function useChoropleth(
  features: GeoFeature[],
  date: string,
): UseQueryResult<Map<string, CellTemps>> {
  const codes = features.map((f) => f.properties.code).join(',')
  return useQuery({
    queryKey: ['choropleth', date, codes],
    enabled: features.length > 0 && Boolean(date),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const entries = await mapWithConcurrency(features, MAP_CONCURRENCY, async (f) => {
        const [lon, lat] = centroid(f)
        const series = await loadWeather({ latitude: lat, longitude: lon, startDate: date, endDate: date })
        const d = series.days[0]
        return [f.properties.code, { min: d?.tempMin ?? null, max: d?.tempMax ?? null }] as const
      })
      return new Map(entries)
    },
  })
}
