import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { searchLocations } from '../api/geocoding'
import type { Location } from '../lib/types'

export function useGeocoding(query: string): UseQueryResult<Location[]> {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['geocoding', trimmed],
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 60,
    queryFn: () => searchLocations(trimmed),
  })
}
