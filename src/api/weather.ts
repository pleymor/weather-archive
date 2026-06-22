import type { WeatherDay, WeatherSeries } from '../lib/types'

export const WEATHER_DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
] as const

export interface WeatherParams {
  latitude: number
  longitude: number
  startDate: string
  endDate: string
}

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

/** Error carrying the HTTP status, so callers (and react-query retry) can react to 429. */
export class WeatherApiError extends Error {
  constructor(public readonly status: number) {
    super(`Erreur API météo (${status})`)
    this.name = 'WeatherApiError'
  }
}

export function buildWeatherUrl(p: WeatherParams): string {
  const q = new URLSearchParams({
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    start_date: p.startDate,
    end_date: p.endDate,
    daily: WEATHER_DAILY_VARS.join(','),
    timezone: 'auto',
  })
  return `${ARCHIVE_URL}?${q.toString()}`
}

function num(arr: unknown, i: number): number | null {
  if (!Array.isArray(arr)) return null
  const v = arr[i]
  return typeof v === 'number' ? v : null
}

export function normalizeArchiveResponse(raw: unknown, p: WeatherParams): WeatherSeries {
  const daily = (raw as { daily?: Record<string, unknown> })?.daily ?? {}
  const time = Array.isArray(daily.time) ? (daily.time as string[]) : []
  const days: WeatherDay[] = time.map((date, i) => ({
    date,
    tempMax: num(daily.temperature_2m_max, i),
    tempMin: num(daily.temperature_2m_min, i),
    tempMean: num(daily.temperature_2m_mean, i),
    precipitation: num(daily.precipitation_sum, i),
    windSpeedMax: num(daily.wind_speed_10m_max, i), // daily max sustained wind speed
    windGust: num(daily.wind_gusts_10m_max, i), // daily max wind gust (rafales)
  }))
  return {
    location: { latitude: p.latitude, longitude: p.longitude },
    startDate: p.startDate,
    endDate: p.endDate,
    days,
  }
}

export async function fetchWeather(
  p: WeatherParams,
  fetchFn: typeof fetch = fetch,
): Promise<WeatherSeries> {
  const res = await fetchFn(buildWeatherUrl(p))
  if (!res.ok) throw new WeatherApiError(res.status)
  const raw = await res.json()
  return normalizeArchiveResponse(raw, p)
}
