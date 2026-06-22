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
  windSpeedMax: number | null
  windGust: number | null
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
      windSpeedMax: d.windSpeedMax ?? null,
      windGust: d.windGust,
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
    if (d.windGust !== null && (windiest === null || d.windGust > windiest.value)) windiest = { date: d.date, value: d.windGust }
  }
  return { hottest, coldest, wettest, windiest }
}

export interface YearExtreme {
  year: number
  hottest: number | null // max of daily tempMax
  coldest: number | null // min of daily tempMin
  windSpeedMax: number | null // max sustained wind speed
  windGust: number | null // max gust
  wettest: number | null // max daily precipitation
}

/** Per-year extremes over the whole series, sorted by year ascending. */
export function annualExtremes(series: WeatherSeries): YearExtreme[] {
  const byYear = new Map<number, YearExtreme>()
  for (const d of series.days) {
    const year = Number(d.date.slice(0, 4))
    let e = byYear.get(year)
    if (!e) {
      e = { year, hottest: null, coldest: null, windSpeedMax: null, windGust: null, wettest: null }
      byYear.set(year, e)
    }
    if (d.tempMax !== null && (e.hottest === null || d.tempMax > e.hottest)) e.hottest = d.tempMax
    if (d.tempMin !== null && (e.coldest === null || d.tempMin < e.coldest)) e.coldest = d.tempMin
    if (d.windSpeedMax != null && (e.windSpeedMax === null || d.windSpeedMax > e.windSpeedMax)) e.windSpeedMax = d.windSpeedMax
    if (d.windGust !== null && (e.windGust === null || d.windGust > e.windGust)) e.windGust = d.windGust
    if (d.precipitation !== null && (e.wettest === null || d.precipitation > e.wettest)) e.wettest = d.precipitation
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year)
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
