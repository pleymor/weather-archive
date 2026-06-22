import { describe, it, expect } from 'vitest'
import { encodeState, decodeState, EMPTY_STATE, type AppState } from './urlState'

const LYON = { name: 'Lyon', latitude: 45.7512, longitude: 4.8501, admin1: 'Rhône-Alpes', country: 'France' }

describe('urlState', () => {
  it('round-trips a full charts state', () => {
    const state: AppState = { ...EMPTY_STATE, mode: 'charts', location: LYON, start: '2020-01-01', end: '2020-12-31' }
    const decoded = decodeState(encodeState(state))
    expect(decoded.mode).toBe('charts')
    expect(decoded.location).toMatchObject({ name: 'Lyon', latitude: 45.7512, longitude: 4.8501 })
    expect(decoded.start).toBe('2020-01-01')
    expect(decoded.end).toBe('2020-12-31')
  })

  it('omits default mode and empty fields from the query', () => {
    expect(encodeState(EMPTY_STATE)).toBe('')
    const q = encodeState({ ...EMPTY_STATE, mode: 'day', date: '2021-07-14' })
    expect(q).toContain('mode=day')
    expect(q).toContain('date=2021-07-14')
    expect(q).not.toContain('start=')
  })

  it('decodes a comparison location', () => {
    const state: AppState = { ...EMPTY_STATE, location: LYON, compare: { name: 'Paris', latitude: 48.85, longitude: 2.35 } }
    const decoded = decodeState(encodeState(state))
    expect(decoded.compare).toMatchObject({ name: 'Paris', latitude: 48.85 })
  })

  it('falls back to defaults on garbage input', () => {
    const decoded = decodeState('?mode=nonsense&lat=abc')
    expect(decoded.mode).toBe('charts')
    expect(decoded.location).toBeNull()
  })

  it('tolerates a leading question mark', () => {
    expect(decodeState('?date=2020-05-05').date).toBe('2020-05-05')
  })
})
