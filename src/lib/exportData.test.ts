import { describe, it, expect } from 'vitest'
import { toCSV } from './exportData'
import type { WeatherSeries } from './types'

const SERIES: WeatherSeries = {
  location: { latitude: 45.75, longitude: 4.85 },
  startDate: '2020-01-01',
  endDate: '2020-01-02',
  days: [
    { date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3.5, precipitation: 0, windGust: 12 },
    { date: '2020-01-02', tempMax: 7, tempMin: null, tempMean: 4, precipitation: 1.2, windGust: 18 },
  ],
}

describe('toCSV', () => {
  it('produces a header and a row per day in metric units', () => {
    const csv = toCSV(SERIES, { temp: 'C', wind: 'kmh' })
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('Temp max (°C)')
    expect(lines[0]).toContain('Rafales (km/h)')
    expect(lines[1]).toBe('2020-01-01;6;1;3.5;0;12')
  })

  it('leaves blanks for null values', () => {
    const csv = toCSV(SERIES, { temp: 'C', wind: 'kmh' })
    expect(csv.split('\n')[2]).toBe('2020-01-02;7;;4;1.2;18')
  })

  it('converts to imperial units', () => {
    const csv = toCSV(SERIES, { temp: 'F', wind: 'mph' })
    expect(csv.split('\n')[0]).toContain('(°F)')
    expect(csv.split('\n')[1]).toContain('42.8') // 6°C -> 42.8°F
  })
})
