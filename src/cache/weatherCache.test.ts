import { describe, it, expect } from 'vitest'
import { cacheKey, getCachedWeather, putCachedWeather } from './weatherCache'
import type { WeatherSeries } from '../lib/types'

const PARAMS = { latitude: 45.7512, longitude: 4.8501, startDate: '2020-01-01', endDate: '2020-01-02' }

const SERIES: WeatherSeries = {
  location: { latitude: 45.7512, longitude: 4.8501 },
  startDate: '2020-01-01',
  endDate: '2020-01-02',
  days: [{ date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windMax: 12 }],
}

describe('weatherCache', () => {
  it('builds a stable rounded key', () => {
    expect(cacheKey(PARAMS)).toBe('45.7512|4.8501|2020-01-01|2020-01-02')
  })

  it('returns undefined when not cached', async () => {
    expect(await getCachedWeather({ ...PARAMS, startDate: '1999-01-01' })).toBeUndefined()
  })

  it('stores and retrieves a series', async () => {
    await putCachedWeather(PARAMS, SERIES)
    const got = await getCachedWeather(PARAMS)
    expect(got).toEqual(SERIES)
  })
})
