import { describe, it, expect } from 'vitest'
import { monthDay, thisDayAcrossYears, computeRecords, climateStats, linearFit, annualExtremes } from './insights'
import type { WeatherSeries, WeatherDay } from './types'

function mk(date: string, max: number, min: number, mean: number, precip: number, wind: number): WeatherDay {
  return { date, tempMax: max, tempMin: min, tempMean: mean, precipitation: precip, windGust: wind }
}

const SERIES: WeatherSeries = {
  location: { latitude: 0, longitude: 0 }, startDate: '2018-07-14', endDate: '2020-07-14',
  days: [
    mk('2018-07-14', 28, 15, 21, 0, 12),
    mk('2018-12-25', -2, -6, -4, 5, 40),
    mk('2019-07-14', 31, 18, 24, 2, 20),
    mk('2020-07-14', 35, 20, 27, 10, 55),
  ],
}

describe('insights', () => {
  it('extracts month-day', () => {
    expect(monthDay('2020-07-14')).toBe('07-14')
  })

  it('returns the same day across years', () => {
    const out = thisDayAcrossYears(SERIES, '07-14')
    expect(out.map((y) => y.year)).toEqual([2018, 2019, 2020])
    expect(out[2].tempMax).toBe(35)
  })

  it('computes records', () => {
    const r = computeRecords(SERIES)
    expect(r.hottest).toEqual({ date: '2020-07-14', value: 35 })
    expect(r.coldest).toEqual({ date: '2018-12-25', value: -6 })
    expect(r.wettest).toEqual({ date: '2020-07-14', value: 10 })
    expect(r.windiest).toEqual({ date: '2020-07-14', value: 55 })
  })

  it('computes per-year extremes', () => {
    const a = annualExtremes(SERIES)
    expect(a.map((y) => y.year)).toEqual([2018, 2019, 2020])
    // 2018 has two days: hottest 28, coldest -6, strongest gust 40, wettest 5
    expect(a[0]).toMatchObject({ year: 2018, hottest: 28, coldest: -6, windGust: 40, wettest: 5, windSpeedMax: null })
    expect(a[2]).toMatchObject({ year: 2020, hottest: 35, windGust: 55, wettest: 10 })
  })

  it('fits a line by least squares', () => {
    const fit = linearFit([[2000, 10], [2001, 12], [2002, 14]])
    expect(fit?.slope).toBeCloseTo(2, 5)
    expect(linearFit([[2000, 10]])).toBeNull()
  })

  it('computes climate stats', () => {
    const s = climateStats(SERIES)
    expect(s.years).toBe(3)
    expect(s.frostDaysPerYear).toBeCloseTo(1 / 3, 5) // one frost day over 3 years
    expect(s.hotDaysPerYear).toBeCloseTo(2 / 3, 5) // 31 and 35 are ≥30
    expect(s.avgTemp).toBeCloseTo((21 - 4 + 24 + 27) / 4, 5)
  })
})
