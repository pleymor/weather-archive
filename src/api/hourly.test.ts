import { describe, it, expect, vi } from 'vitest'
import { buildHourlyUrl, normalizeHourly, fetchHourly } from './hourly'

const PARAMS = { latitude: 48.85, longitude: 2.35, date: '2020-01-15' }

const RAW = {
  hourly: {
    time: ['2020-01-15T00:00', '2020-01-15T01:00', '2020-01-15T14:00'],
    temperature_2m: [9.9, 10.7, 12.3],
    weather_code: [3, 0, 61],
    is_day: [0, 0, 1],
    precipitation: [0, 0, 1.2],
    wind_speed_10m: [12, 14, 20],
  },
}

describe('hourly api', () => {
  it('builds a single-day archive url with hourly vars', () => {
    const url = buildHourlyUrl(PARAMS)
    expect(url).toContain('/api/archive')
    expect(url).toContain('start_date=2020-01-15')
    expect(url).toContain('end_date=2020-01-15')
    expect(url).toContain('weather_code')
    expect(url).toContain('is_day')
  })

  it('normalizes hourly points', () => {
    const pts = normalizeHourly(RAW)
    expect(pts).toHaveLength(3)
    expect(pts[0]).toEqual({ time: '2020-01-15T00:00', hour: 0, temp: 9.9, code: 3, isDay: false, precip: 0, wind: 12 })
    expect(pts[2]).toMatchObject({ hour: 14, code: 61, isDay: true })
  })

  it('fetchHourly calls fetch and returns points', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => RAW })
    const pts = await fetchHourly(PARAMS, fakeFetch as unknown as typeof fetch)
    expect(pts).toHaveLength(3)
  })

  it('throws on non-ok response', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchHourly(PARAMS, fakeFetch as unknown as typeof fetch)).rejects.toThrow()
  })
})
