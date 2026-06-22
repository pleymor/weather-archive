import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_UNITS, type Units } from '../lib/units'

interface SettingsValue {
  units: Units
  setUnits: (u: Units) => void
}

const Ctx = createContext<SettingsValue | null>(null)
const KEY = 'wa:units'

function load(): Units {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const u = JSON.parse(raw) as Units
      if (u && (u.temp === 'C' || u.temp === 'F')) return u
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_UNITS
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Units>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(units)) } catch { /* ignore */ }
  }, [units])

  const value = useMemo(() => ({ units, setUnits }), [units])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
