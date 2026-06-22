import { describe, it, expect } from 'vitest'
import type { Location, WeatherDay, WeatherSeries } from './types'
import { isWeatherSeries } from './types'

describe('types', () => {
  it('isWeatherSeries narrows a valid object', () => {
    const series: WeatherSeries = {
      location: { latitude: 45.75, longitude: 4.85 },
      startDate: '2020-01-01',
      endDate: '2020-01-02',
      days: [
        { date: '2020-01-01', tempMax: 5, tempMin: 1, tempMean: 3, precipitation: 0, windGust: 10 },
      ],
    }
    expect(isWeatherSeries(series)).toBe(true)
    expect(isWeatherSeries({})).toBe(false)
  })

  it('Location and WeatherDay shapes compile', () => {
    const loc: Location = { name: 'Lyon', latitude: 45.75, longitude: 4.85 }
    const day: WeatherDay = { date: '2020-01-01', tempMax: null, tempMin: null, tempMean: null, precipitation: null, windGust: null }
    expect(loc.name).toBe('Lyon')
    expect(day.date).toBe('2020-01-01')
  })
})
