import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_UNITS, type Units } from '../lib/units'

interface SettingsValue {
  units: Units
}

// Units are fixed to °C / km/h (the app no longer exposes unit switching).
const Ctx = createContext<SettingsValue>({ units: DEFAULT_UNITS })

export function SettingsProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ units: DEFAULT_UNITS }}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsValue {
  return useContext(Ctx)
}
