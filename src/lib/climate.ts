import type { WeatherSeries, WeatherDay } from './types'

/** Standard WMO reference period. */
export const NORMAL_START = '1991-01-01'
export const NORMAL_END = '2020-12-31'

export interface DailyNormal {
  doy: number
  tempMean: number | null
  tempMax: number | null
  tempMin: number | null
  precip: number | null
}

export interface EnrichedDay extends WeatherDay {
  normalMean: number | null
  anomaly: number | null // actual mean − normal mean, in °C
}

// Cumulative day counts for a non-leap year, so the same calendar date maps to the
// same index every year (Feb 29 collapses onto Mar 1 — fine for climatology).
const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

/** Leap-independent day-of-year (1–365) for an ISO date. */
export function dayOfYear(iso: string): number {
  const [, m, d] = iso.split('-').map(Number)
  return CUM[m - 1] + d
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Computes smoothed day-of-year climate normals from a multi-year series.
 * Each day-of-year is averaged across years, then smoothed over a ±windowDays band.
 */
export function computeNormals(series: WeatherSeries, windowDays = 7): Map<number, DailyNormal> {
  const buckets = new Map<number, { mean: number[]; max: number[]; min: number[]; precip: number[] }>()
  for (const d of series.days) {
    const doy = dayOfYear(d.date)
    let b = buckets.get(doy)
    if (!b) { b = { mean: [], max: [], min: [], precip: [] }; buckets.set(doy, b) }
    if (d.tempMean !== null) b.mean.push(d.tempMean)
    if (d.tempMax !== null) b.max.push(d.tempMax)
    if (d.tempMin !== null) b.min.push(d.tempMin)
    if (d.precipitation !== null) b.precip.push(d.precipitation)
  }

  const raw = new Map<number, DailyNormal>()
  for (const [doy, b] of buckets) {
    raw.set(doy, { doy, tempMean: avg(b.mean), tempMax: avg(b.max), tempMin: avg(b.min), precip: avg(b.precip) })
  }

  const result = new Map<number, DailyNormal>()
  for (let doy = 1; doy <= 365; doy++) {
    const mean: number[] = [], max: number[] = [], min: number[] = [], precip: number[] = []
    for (let off = -windowDays; off <= windowDays; off++) {
      let nd = doy + off
      if (nd < 1) nd += 365
      if (nd > 365) nd -= 365
      const r = raw.get(nd)
      if (!r) continue
      if (r.tempMean !== null) mean.push(r.tempMean)
      if (r.tempMax !== null) max.push(r.tempMax)
      if (r.tempMin !== null) min.push(r.tempMin)
      if (r.precip !== null) precip.push(r.precip)
    }
    if (mean.length || max.length || min.length || precip.length) {
      result.set(doy, { doy, tempMean: avg(mean), tempMax: avg(max), tempMin: avg(min), precip: avg(precip) })
    }
  }
  return result
}

/** Attaches the matching normal and the temperature anomaly to each day of a series. */
export function enrichWithNormals(days: WeatherDay[], normals: Map<number, DailyNormal>): EnrichedDay[] {
  return days.map((d) => {
    const n = normals.get(dayOfYear(d.date))
    const normalMean = n?.tempMean ?? null
    const anomaly = d.tempMean !== null && normalMean !== null ? d.tempMean - normalMean : null
    return { ...d, normalMean, anomaly }
  })
}

/** Mean temperature anomaly over the enriched period (°C), or null if none. */
export function meanAnomaly(days: EnrichedDay[]): number | null {
  const vals = days.map((d) => d.anomaly).filter((a): a is number => a !== null)
  return avg(vals)
}
