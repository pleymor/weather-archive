import type { WeatherDay } from './types'

export interface MergedPoint {
  date: string
  a: number | null
  b: number | null
}

/** Aligns two series by date on their mean temperature (primary series drives the axis). */
export function mergeMeanByDate(a: WeatherDay[], b: WeatherDay[]): MergedPoint[] {
  const bByDate = new Map(b.map((d) => [d.date, d.tempMean]))
  return a.map((d) => ({ date: d.date, a: d.tempMean, b: bByDate.get(d.date) ?? null }))
}

/** Mean of the non-null values of a numeric field across days. */
export function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length === 0) return null
  return nums.reduce((s, v) => s + v, 0) / nums.length
}
