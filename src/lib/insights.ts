import type { WeatherSeries } from './types'

/** "MM-DD" of an ISO date. */
export function monthDay(iso: string): string {
  return iso.slice(5)
}

export interface YearValue {
  year: number
  tempMean: number | null
  tempMax: number | null
  tempMin: number | null
  precipitation: number | null
}

/** Returns the same calendar day (MM-DD) for every year present in the series. */
export function thisDayAcrossYears(series: WeatherSeries, md: string): YearValue[] {
  return series.days
    .filter((d) => monthDay(d.date) === md)
    .map((d) => ({
      year: Number(d.date.slice(0, 4)),
      tempMean: d.tempMean,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      precipitation: d.precipitation,
    }))
}

export interface RecordEntry { date: string; value: number }
export interface Records {
  hottest: RecordEntry | null
  coldest: RecordEntry | null
  wettest: RecordEntry | null
  windiest: RecordEntry | null
}

/** Extreme days over the whole series. */
export function computeRecords(series: WeatherSeries): Records {
  let hottest: RecordEntry | null = null
  let coldest: RecordEntry | null = null
  let wettest: RecordEntry | null = null
  let windiest: RecordEntry | null = null
  for (const d of series.days) {
    if (d.tempMax !== null && (hottest === null || d.tempMax > hottest.value)) hottest = { date: d.date, value: d.tempMax }
    if (d.tempMin !== null && (coldest === null || d.tempMin < coldest.value)) coldest = { date: d.date, value: d.tempMin }
    if (d.precipitation !== null && (wettest === null || d.precipitation > wettest.value)) wettest = { date: d.date, value: d.precipitation }
    if (d.windMax !== null && (windiest === null || d.windMax > windiest.value)) windiest = { date: d.date, value: d.windMax }
  }
  return { hottest, coldest, wettest, windiest }
}

/** Ordinary least-squares fit; returns null if fewer than 2 points. */
export function linearFit(points: [number, number][]): { slope: number; intercept: number } | null {
  const n = points.length
  if (n < 2) return null
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (const [x, y] of points) { sx += x; sy += y; sxy += x * y; sxx += x * x }
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  return { slope, intercept: (sy - slope * sx) / n }
}

export interface ClimateStats {
  years: number
  avgTemp: number | null
  frostDaysPerYear: number | null
  hotDaysPerYear: number | null
}

/** Aggregate climate statistics over the series (frost = tmin<0°C, hot = tmax≥30°C). */
export function climateStats(series: WeatherSeries): ClimateStats {
  const yearsSet = new Set<number>()
  let tempSum = 0, tempCount = 0, frost = 0, hot = 0
  for (const d of series.days) {
    yearsSet.add(Number(d.date.slice(0, 4)))
    if (d.tempMean !== null) { tempSum += d.tempMean; tempCount++ }
    if (d.tempMin !== null && d.tempMin < 0) frost++
    if (d.tempMax !== null && d.tempMax >= 30) hot++
  }
  const years = yearsSet.size
  return {
    years,
    avgTemp: tempCount ? tempSum / tempCount : null,
    frostDaysPerYear: years ? frost / years : null,
    hotDaysPerYear: years ? hot / years : null,
  }
}
