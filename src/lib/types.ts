export interface Location {
  id?: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export interface WeatherDay {
  date: string // YYYY-MM-DD
  tempMax: number | null
  tempMin: number | null
  tempMean: number | null
  precipitation: number | null
  /** Daily max sustained wind speed. Optional: absent on older cached/test data. */
  windSpeedMax?: number | null
  windGust: number | null
}

export interface WeatherSeries {
  location: { latitude: number; longitude: number }
  startDate: string
  endDate: string
  days: WeatherDay[]
}

export function isWeatherSeries(value: unknown): value is WeatherSeries {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.startDate === 'string' &&
    typeof v.endDate === 'string' &&
    Array.isArray(v.days) &&
    typeof v.location === 'object' &&
    v.location !== null
  )
}
