import { describe, it, expect } from 'vitest'
import { dayOfYear, computeNormals, enrichWithNormals, meanAnomaly } from './climate'
import type { WeatherSeries, WeatherDay } from './types'

function day(date: string, mean: number): WeatherDay {
  return { date, tempMax: mean + 5, tempMin: mean - 5, tempMean: mean, precipitation: 0, windMax: 10 }
}

describe('climate', () => {
  it('computes a leap-independent day-of-year', () => {
    expect(dayOfYear('2020-01-01')).toBe(1)
    expect(dayOfYear('2020-12-31')).toBe(365)
    expect(dayOfYear('2021-12-31')).toBe(365) // same index regardless of leap year
    expect(dayOfYear('2020-06-15')).toBe(dayOfYear('2019-06-15'))
  })

  it('averages a day-of-year across years (with smoothing window 0)', () => {
    const series: WeatherSeries = {
      location: { latitude: 0, longitude: 0 }, startDate: '2018-06-15', endDate: '2020-06-15',
      days: [day('2018-06-15', 18), day('2019-06-15', 20), day('2020-06-15', 22)],
    }
    const normals = computeNormals(series, 0)
    const doy = dayOfYear('2020-06-15')
    expect(normals.get(doy)?.tempMean).toBeCloseTo(20, 5)
  })

  it('enriches days with normal and anomaly', () => {
    const series: WeatherSeries = {
      location: { latitude: 0, longitude: 0 }, startDate: '2018-06-15', endDate: '2020-06-15',
      days: [day('2018-06-15', 18), day('2019-06-15', 20), day('2020-06-15', 22)],
    }
    const normals = computeNormals(series, 0)
    const enriched = enrichWithNormals([day('2023-06-15', 25)], normals)
    expect(enriched[0].normalMean).toBeCloseTo(20, 5)
    expect(enriched[0].anomaly).toBeCloseTo(5, 5)
    expect(meanAnomaly(enriched)).toBeCloseTo(5, 5)
  })

  it('returns null anomaly when no normal exists for the day', () => {
    const enriched = enrichWithNormals([day('2023-03-03', 10)], new Map())
    expect(enriched[0].anomaly).toBeNull()
    expect(meanAnomaly(enriched)).toBeNull()
  })
})
