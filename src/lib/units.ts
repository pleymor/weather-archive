export type TempUnit = 'C' | 'F'
export type WindUnit = 'kmh' | 'ms' | 'mph'

export interface Units {
  temp: TempUnit
  wind: WindUnit
}

export const DEFAULT_UNITS: Units = { temp: 'C', wind: 'kmh' }

export function convertTemp(celsius: number, unit: TempUnit): number {
  return unit === 'F' ? celsius * 9 / 5 + 32 : celsius
}

export function tempUnitLabel(unit: TempUnit): string {
  return unit === 'F' ? '°F' : '°C'
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === 'ms') return kmh / 3.6
  if (unit === 'mph') return kmh / 1.609344
  return kmh
}

export function windUnitLabel(unit: WindUnit): string {
  return unit === 'ms' ? 'm/s' : unit === 'mph' ? 'mph' : 'km/h'
}

/** Rounds to a sensible number of decimals for display. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Converts a raw °C value to the chosen unit, rounded for display. Null-safe. */
export function displayTemp(celsius: number | null, unit: TempUnit): number | null {
  return celsius === null ? null : round1(convertTemp(celsius, unit))
}

/** Converts a temperature *difference* (no offset): °C delta to °F delta scales by 9/5. */
export function convertTempDelta(celsiusDelta: number, unit: TempUnit): number {
  return unit === 'F' ? celsiusDelta * 9 / 5 : celsiusDelta
}

/** Converts a temperature delta to the chosen unit, rounded. Null-safe. */
export function displayTempDelta(celsiusDelta: number | null, unit: TempUnit): number | null {
  return celsiusDelta === null ? null : round1(convertTempDelta(celsiusDelta, unit))
}

/** Converts a raw km/h value to the chosen unit, rounded for display. Null-safe. */
export function displayWind(kmh: number | null, unit: WindUnit): number | null {
  return kmh === null ? null : round1(convertWind(kmh, unit))
}

import type { WeatherDay } from './types'

/** Converts a raw series (°C, km/h) into the chosen display units. Precipitation stays in mm. */
export function convertDays(days: WeatherDay[], units: Units): WeatherDay[] {
  return days.map((d) => ({
    date: d.date,
    tempMax: displayTemp(d.tempMax, units.temp),
    tempMin: displayTemp(d.tempMin, units.temp),
    tempMean: displayTemp(d.tempMean, units.temp),
    precipitation: d.precipitation,
    windMax: displayWind(d.windMax, units.wind),
  }))
}
