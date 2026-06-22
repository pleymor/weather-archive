import type { Location } from './types'

const FAV_KEY = 'wa:favorites'
const RECENT_KEY = 'wa:recents'
const RECENT_MAX = 8

/** Stable identity for a place, rounded so near-identical coords match. */
export function locationKey(loc: Location): string {
  return `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`
}

function read(key: string): Location[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Location[]) : []
  } catch {
    return []
  }
}

function write(key: string, list: Location[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function getFavorites(): Location[] {
  return read(FAV_KEY)
}

export function isFavorite(loc: Location): boolean {
  const k = locationKey(loc)
  return getFavorites().some((f) => locationKey(f) === k)
}

/** Adds or removes a favorite; returns the updated list. */
export function toggleFavorite(loc: Location): Location[] {
  const k = locationKey(loc)
  const current = getFavorites()
  const next = current.some((f) => locationKey(f) === k)
    ? current.filter((f) => locationKey(f) !== k)
    : [...current, loc]
  write(FAV_KEY, next)
  return next
}

export function getRecents(): Location[] {
  return read(RECENT_KEY)
}

/** Records a recently-used place at the front, deduped, capped. */
export function addRecent(loc: Location): Location[] {
  const k = locationKey(loc)
  const next = [loc, ...getRecents().filter((r) => locationKey(r) !== k)].slice(0, RECENT_MAX)
  write(RECENT_KEY, next)
  return next
}
