import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Location } from '../lib/types'

interface LocationContextValue {
  location: Location | null
  setLocation: (l: Location | null) => void
}

const Ctx = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const value = useMemo(() => ({ location, setLocation }), [location])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
