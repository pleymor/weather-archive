import { describe, it, expect, vi } from 'vitest'
import { buildWeatherUrl, normalizeArchiveResponse, fetchWeather } from './weather'

const PARAMS = { latitude: 45.75, longitude: 4.85, startDate: '2020-01-01', endDate: '2020-01-02' }

const RAW = {
  latitude: 45.75,
  longitude: 4.85,
  daily: {
    time: ['2020-01-01', '2020-01-02'],
    temperature_2m_max: [6.1, 7.2],
    temperature_2m_min: [1.0, 2.0],
    temperature_2m_mean: [3.5, 4.6],
    precipitation_sum: [0.0, 1.2],
    wind_speed_10m_max: [22.0, 30.0],
    wind_gusts_10m_max: [12.0, 18.5],
  },
}

describe('weather api', () => {
  it('builds an archive url with all daily vars', () => {
    const url = buildWeatherUrl(PARAMS)
    expect(url).toContain('archive-api.open-meteo.com/v1/archive')
    expect(url).toContain('latitude=45.75')
    expect(url).toContain('start_date=2020-01-01')
    expect(url).toContain('temperature_2m_mean')
    expect(url).toContain('precipitation_sum')
    expect(url).toContain('wind_speed_10m_max')
    expect(url).toContain('wind_gusts_10m_max')
    expect(url).toContain('timezone=auto')
  })

  it('normalizes raw response into WeatherSeries', () => {
    const series = normalizeArchiveResponse(RAW, PARAMS)
    expect(series.days).toHaveLength(2)
    expect(series.days[0]).toEqual({
      date: '2020-01-01', tempMax: 6.1, tempMin: 1.0, tempMean: 3.5, precipitation: 0.0, windSpeedMax: 22.0, windGust: 12.0,
    })
    expect(series.startDate).toBe('2020-01-01')
  })

  it('maps missing values to null', () => {
    const raw = { daily: { time: ['2020-01-01'], temperature_2m_max: [null], temperature_2m_min: [null], temperature_2m_mean: [null], precipitation_sum: [null], wind_gusts_10m_max: [null] } }
    const series = normalizeArchiveResponse(raw, PARAMS)
    expect(series.days[0].tempMax).toBeNull()
  })

  it('fetchWeather calls fetch and returns normalized data', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => RAW })
    const series = await fetchWeather(PARAMS, fakeFetch as unknown as typeof fetch)
    expect(fakeFetch).toHaveBeenCalledOnce()
    expect(series.days).toHaveLength(2)
  })

  it('fetchWeather throws on non-ok response', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchWeather(PARAMS, fakeFetch as unknown as typeof fetch)).rejects.toThrow()
  })
})
