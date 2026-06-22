import { WeatherApiError } from './weather'

export const HOURLY_VARS = [
  'temperature_2m',
  'weather_code',
  'is_day',
  'precipitation',
  'wind_speed_10m',
] as const

export interface HourlyParams {
  latitude: number
  longitude: number
  date: string // YYYY-MM-DD
}

export interface HourlyPoint {
  time: string // ISO local hour, e.g. "2020-01-15T14:00"
  hour: number // 0–23
  temp: number | null
  code: number | null
  isDay: boolean
  precip: number | null
  wind: number | null
}

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

export function buildHourlyUrl(p: HourlyParams): string {
  const q = new URLSearchParams({
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    start_date: p.date,
    end_date: p.date,
    hourly: HOURLY_VARS.join(','),
    timezone: 'auto',
  })
  return `${ARCHIVE_URL}?${q.toString()}`
}

function num(arr: unknown, i: number): number | null {
  if (!Array.isArray(arr)) return null
  const v = arr[i]
  return typeof v === 'number' ? v : null
}

export function normalizeHourly(raw: unknown): HourlyPoint[] {
  const hourly = (raw as { hourly?: Record<string, unknown> })?.hourly ?? {}
  const time = Array.isArray(hourly.time) ? (hourly.time as string[]) : []
  return time.map((t, i) => ({
    time: t,
    hour: Number(t.slice(11, 13)),
    temp: num(hourly.temperature_2m, i),
    code: num(hourly.weather_code, i),
    isDay: num(hourly.is_day, i) === 1,
    precip: num(hourly.precipitation, i),
    wind: num(hourly.wind_speed_10m, i),
  }))
}

export async function fetchHourly(p: HourlyParams, fetchFn: typeof fetch = fetch): Promise<HourlyPoint[]> {
  const res = await fetchFn(buildHourlyUrl(p))
  if (!res.ok) throw new WeatherApiError(res.status)
  return normalizeHourly(await res.json())
}
