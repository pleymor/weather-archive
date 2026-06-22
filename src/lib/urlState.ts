import type { Location } from './types'

export type AppMode = 'charts' | 'day' | 'years' | 'map'

export interface AppState {
  mode: AppMode
  location: Location | null
  start: string
  end: string
  date: string
  /** Optional comparison location (comparison mode). */
  compare: Location | null
}

export const EMPTY_STATE: AppState = {
  mode: 'charts',
  location: null,
  start: '',
  end: '',
  date: '',
  compare: null,
}

const MODES: AppMode[] = ['charts', 'day', 'years', 'map']

function encodeLocation(prefix: string, loc: Location, p: URLSearchParams) {
  p.set(`${prefix}lat`, loc.latitude.toFixed(4))
  p.set(`${prefix}lon`, loc.longitude.toFixed(4))
  p.set(`${prefix}name`, loc.name)
  if (loc.admin1) p.set(`${prefix}admin1`, loc.admin1)
  if (loc.country) p.set(`${prefix}country`, loc.country)
}

function decodeLocation(prefix: string, p: URLSearchParams): Location | null {
  const lat = p.get(`${prefix}lat`)
  const lon = p.get(`${prefix}lon`)
  const name = p.get(`${prefix}name`)
  if (lat === null || lon === null || name === null) return null
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
  return {
    name,
    latitude,
    longitude,
    admin1: p.get(`${prefix}admin1`) ?? undefined,
    country: p.get(`${prefix}country`) ?? undefined,
  }
}

/** Serializes app state to a query string (without leading "?"). */
export function encodeState(state: AppState): string {
  const p = new URLSearchParams()
  if (state.mode !== 'charts') p.set('mode', state.mode)
  if (state.location) encodeLocation('', state.location, p)
  if (state.start) p.set('start', state.start)
  if (state.end) p.set('end', state.end)
  if (state.date) p.set('date', state.date)
  if (state.compare) encodeLocation('c_', state.compare, p)
  return p.toString()
}

/** Parses a query string (with or without leading "?") into app state. */
export function decodeState(search: string): AppState {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const rawMode = p.get('mode') as AppMode | null
  return {
    mode: rawMode && MODES.includes(rawMode) ? rawMode : 'charts',
    location: decodeLocation('', p),
    start: p.get('start') ?? '',
    end: p.get('end') ?? '',
    date: p.get('date') ?? '',
    compare: decodeLocation('c_', p),
  }
}
