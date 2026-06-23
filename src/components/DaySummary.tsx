import { displayTemp, displayWind, tempUnitLabel, windUnitLabel, type Units } from '../lib/units'
import type { WeatherDay } from '../lib/types'

const fmt = (v: number | null, unit: string) => (v === null ? '—' : `${v} ${unit}`)

/** Compact one-line summary of a day's headline metrics. */
export function DaySummary({ day, units }: { day: WeatherDay; units: Units }) {
  const t = tempUnitLabel(units.temp)
  const w = windUnitLabel(units.wind)
  const items = [
    { icon: '🔥', label: 'Max', value: fmt(displayTemp(day.tempMax, units.temp), t) },
    { icon: '🌡️', label: 'Moyenne', value: fmt(displayTemp(day.tempMean, units.temp), t) },
    { icon: '❄️', label: 'Min', value: fmt(displayTemp(day.tempMin, units.temp), t) },
    { icon: '🌧️', label: 'Précip.', value: fmt(day.precipitation, 'mm') },
    { icon: '💨', label: 'Rafales', value: fmt(displayWind(day.windGust, units.wind), w) },
  ]
  return (
    <dl className="day-summary">
      {items.map((i) => (
        <div key={i.label} className="day-summary__item">
          <span className="day-summary__icon" aria-hidden="true">{i.icon}</span>
          <dd className="day-summary__value">{i.value}</dd>
          <dt className="day-summary__label">{i.label}</dt>
        </div>
      ))}
    </dl>
  )
}
