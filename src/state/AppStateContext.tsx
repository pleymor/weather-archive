import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Location } from '../lib/types'
import { EMPTY_STATE, encodeState, decodeState, type AppState, type AppMode } from '../lib/urlState'

interface AppStateValue {
  state: AppState
  setMode: (mode: AppMode) => void
  setLocation: (location: Location | null) => void
  setRange: (start: string, end: string) => void
  setDate: (date: string) => void
  setCompare: (location: Location | null) => void
}

const Ctx = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children, syncUrl = false }: { children: ReactNode; syncUrl?: boolean }) {
  const [state, setState] = useState<AppState>(() =>
    syncUrl && typeof window !== 'undefined' ? decodeState(window.location.search) : EMPTY_STATE,
  )
  const syncing = useRef(false)

  // Reflect state into the URL (shareable deep links) without adding history entries.
  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return
    if (syncing.current) { syncing.current = false; return }
    const qs = encodeState(state)
    const target = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', target)
  }, [state, syncUrl])

  // React to back/forward navigation.
  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return
    const onPop = () => { syncing.current = true; setState(decodeState(window.location.search)) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [syncUrl])

  const setMode = useCallback((mode: AppMode) => setState((s) => ({ ...s, mode })), [])
  const setLocation = useCallback((location: Location | null) => setState((s) => ({ ...s, location })), [])
  const setRange = useCallback((start: string, end: string) => setState((s) => ({ ...s, start, end })), [])
  const setDate = useCallback((date: string) => setState((s) => ({ ...s, date })), [])
  const setCompare = useCallback((compare: Location | null) => setState((s) => ({ ...s, compare })), [])

  const value = useMemo(
    () => ({ state, setMode, setLocation, setRange, setDate, setCompare }),
    [state, setMode, setLocation, setRange, setDate, setCompare],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState(): AppStateValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
