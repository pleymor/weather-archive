import type { WeatherDay, WeatherSeries } from '../lib/types'
import { toISODate } from '../lib/dates'

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

// Same-origin proxy paths (nginx caches these → scalable, no per-client rate limit).
// In dev, Vite proxies them to Open-Meteo (see vite.config.ts).
const ARCHIVE_PATH = '/api/archive'
const FORECAST_PATH = '/api/forecast'

/** The forecast endpoint covers ~the last 90 days (separate upstream quota from the archive). */
const FORECAST_WINDOW_DAYS = 90

/**
 * Picks the endpoint for a range starting at `startISO`. Recent ranges go to the forecast
 * endpoint (includes provisional current-day data); older ranges use the historical archive.
 */
export function weatherApiBase(startISO: string): string {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - FORECAST_WINDOW_DAYS)
  return startISO >= toISODate(cutoff) ? FORECAST_PATH : ARCHIVE_PATH
}

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
  return `${weatherApiBase(p.startDate)}?${q.toString()}`
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
