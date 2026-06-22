import { describe, it, expect } from 'vitest'
import { mergeMeanByDate, average } from './compare'
import type { WeatherDay } from './types'

function d(date: string, mean: number | null): WeatherDay {
  return { date, tempMax: null, tempMin: null, tempMean: mean, precipitation: null, windGust: null }
}

describe('compare', () => {
  it('merges two series by date on mean temperature', () => {
    const a = [d('2020-01-01', 5), d('2020-01-02', 6)]
    const b = [d('2020-01-01', 8), d('2020-01-03', 9)]
    expect(mergeMeanByDate(a, b)).toEqual([
      { date: '2020-01-01', a: 5, b: 8 },
      { date: '2020-01-02', a: 6, b: null },
    ])
  })

  it('averages non-null values', () => {
    expect(average([5, null, 7])).toBe(6)
    expect(average([null])).toBeNull()
  })
})
