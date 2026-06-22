import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchHourly, type HourlyPoint } from '../api/hourly'
import { validateSingleDate } from '../lib/dates'
import type { Location } from '../lib/types'

/** Hourly weather for a single day at a location. */
export function useHourly(location: Location | null, date: string): UseQueryResult<HourlyPoint[]> {
  const enabled = Boolean(location) && Boolean(date) && validateSingleDate(date).ok
  return useQuery({
    queryKey: ['hourly', location?.latitude, location?.longitude, date],
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () => fetchHourly({ latitude: location!.latitude, longitude: location!.longitude, date }),
  })
}
