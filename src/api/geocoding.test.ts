import { describe, it, expect, vi } from 'vitest'
import { searchLocations, reverseGeocode } from './geocoding'

describe('geocoding', () => {
  it('returns empty array for short queries without calling fetch', async () => {
    const f = vi.fn()
    expect(await searchLocations('a', f as unknown as typeof fetch)).toEqual([])
    expect(f).not.toHaveBeenCalled()
  })

  it('maps search results to Location[]', async () => {
    const raw = { results: [
      { id: 1, name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France', admin1: 'Auvergne-Rhône-Alpes' },
    ] }
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => raw })
    const out = await searchLocations('Lyon', f as unknown as typeof fetch)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France' })
    expect((f.mock.calls[0][0] as string)).toContain('geocoding-api.open-meteo.com/v1/search')
    expect((f.mock.calls[0][0] as string)).toContain('language=fr')
  })

  it('returns empty array when results is missing', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    expect(await searchLocations('Zzz', f as unknown as typeof fetch)).toEqual([])
  })

  it('reverseGeocode builds a Location from bigdatacloud response', async () => {
    const raw = { city: 'Lyon', countryName: 'France', principalSubdivision: 'Auvergne-Rhône-Alpes' }
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => raw })
    const loc = await reverseGeocode(45.75, 4.85, f as unknown as typeof fetch)
    expect(loc).toMatchObject({ name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France' })
  })

  it('reverseGeocode falls back to coordinates as name on failure', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const loc = await reverseGeocode(45.75, 4.85, f as unknown as typeof fetch)
    expect(loc.latitude).toBe(45.75)
    expect(loc.name).toContain('45.75')
  })
})
