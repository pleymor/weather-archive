import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { loadWeather } from '../api/loadWeather'
import { average } from '../lib/compare'
import { centroid, type GeoFeature } from '../lib/geo'

/** Average mean-temperature (°C) per feature code over [start,end], computed at each centroid. */
export function useChoropleth(
  features: GeoFeature[],
  start: string,
  end: string,
): UseQueryResult<Map<string, number | null>> {
  const codes = features.map((f) => f.properties.code).join(',')
  return useQuery({
    queryKey: ['choropleth', start, end, codes],
    enabled: features.length > 0 && Boolean(start && end),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const entries = await Promise.all(
        features.map(async (f) => {
          const [lon, lat] = centroid(f)
          const series = await loadWeather({ latitude: lat, longitude: lon, startDate: start, endDate: end })
          return [f.properties.code, average(series.days.map((d) => d.tempMean))] as const
        }),
      )
      return new Map(entries)
    },
  })
}
