import { describe, it, expect, beforeEach } from 'vitest'
import { getFavorites, toggleFavorite, isFavorite, getRecents, addRecent, locationKey } from './storage'

const LYON = { name: 'Lyon', latitude: 45.7512, longitude: 4.8501 }
const PARIS = { name: 'Paris', latitude: 48.8566, longitude: 2.3522 }

beforeEach(() => { localStorage.clear() })

describe('storage', () => {
  it('toggles favorites on and off', () => {
    expect(getFavorites()).toEqual([])
    toggleFavorite(LYON)
    expect(isFavorite(LYON)).toBe(true)
    expect(getFavorites()).toHaveLength(1)
    toggleFavorite(LYON)
    expect(isFavorite(LYON)).toBe(false)
  })

  it('matches favorites by rounded coordinates', () => {
    toggleFavorite(LYON)
    expect(isFavorite({ ...LYON, latitude: 45.7514 })).toBe(true)
    expect(locationKey(LYON)).toBe('45.751,4.850')
  })

  it('records recents most-recent-first and dedupes', () => {
    addRecent(LYON)
    addRecent(PARIS)
    addRecent(LYON)
    const recents = getRecents()
    expect(recents).toHaveLength(2)
    expect(recents[0].name).toBe('Lyon')
  })

  it('caps recents at 8', () => {
    for (let i = 0; i < 12; i++) addRecent({ name: `V${i}`, latitude: i, longitude: i })
    expect(getRecents()).toHaveLength(8)
  })
})
