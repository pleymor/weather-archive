import type { HourlyPoint } from '../api/hourly'
import { weatherIcon, weatherLabel } from '../lib/weatherIcons'
import { displayTemp, type Units } from '../lib/units'

/** Forecast-style hour-by-hour strip: icon + temperature for each hour of the day. */
export function HourlyForecast({ hours, units }: { hours: HourlyPoint[]; units: Units }) {
  if (hours.length === 0) return null
  return (
    <div className="hourly" role="list" aria-label="Prévisions heure par heure">
      {hours.map((h) => {
        const t = displayTemp(h.temp, units.temp)
        const rain = h.precip != null && h.precip >= 0.1
        return (
          <div
            key={h.time}
            role="listitem"
            className="hourly__cell"
            title={`${h.hour}h — ${weatherLabel(h.code)}${t != null ? `, ${t}°` : ''}`}
          >
            <span className="hourly__hour">{h.hour}h</span>
            <span className="hourly__icon" aria-hidden="true">{weatherIcon(h.code, h.isDay)}</span>
            <span className="hourly__temp">{t == null ? '—' : `${Math.round(t)}°`}</span>
            <span className={`hourly__precip${rain ? ' is-wet' : ''}`}>
              {rain ? `${h.precip!.toFixed(1)} mm` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
