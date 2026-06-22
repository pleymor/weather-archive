import type { Location } from '../lib/types'
import { AppStateProvider, useAppState } from './AppStateContext'

/**
 * Backwards-compatible location API layered over the unified app state.
 * `LocationProvider` is an alias for `AppStateProvider` (no URL sync by default).
 */
export const LocationProvider = AppStateProvider

export function useLocation(): { location: Location | null; setLocation: (l: Location | null) => void } {
  const { state, setLocation } = useAppState()
  return { location: state.location, setLocation }
}
