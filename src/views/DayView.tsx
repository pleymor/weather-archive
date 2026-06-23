import { useEffect, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { useHourly } from '../hooks/useHourly'
import { HourlyForecast } from '../components/HourlyForecast'
import { RecordsHistory } from '../components/RecordsHistory'
import { validateSingleDate, formatLongDate, maxDate } from '../lib/dates'
import { apiErrorMessage } from '../lib/apiError'
import { displayTemp, displayWind, tempUnitLabel, windUnitLabel } from '../lib/units'
import type { WeatherParams } from '../api/weather'

function fmt(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`
}

interface Stat { icon: string; label: string; value: string; tint: string }

export function DayView() {
  const { state, setDate } = useAppState()
  const { units } = useSettings()
  const { location, date } = state
  const [showRecords, setShowRecords] = useState(false)

  // Default to today (Open-Meteo serves provisional values for the current day).
  useEffect(() => {
    if (!date) setDate(maxDate())
  }, [date, setDate])

  const dateValid = Boolean(date) && validateSingleDate(date).ok
  const params: WeatherParams | null =
    location && dateValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: date, endDate: date }
      : null

  const { data, isFetching, isError, error } = useWeather(params)
  const day = data?.days[0]
  const hourly = useHourly(location, dateValid ? date : '')

  if (!location) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📍</div>
        <h2>Choisissez un lieu pour commencer</h2>
        <p>Recherchez une ville ci-dessus, puis choisissez une date.</p>
      </div>
    )
  }

  const t = tempUnitLabel(units.temp)
  const w = windUnitLabel(units.wind)
  const stats: Stat[] = day
    ? [
        { icon: '🔥', label: 'Température max', value: fmt(displayTemp(day.tempMax, units.temp), t), tint: 'orange' },
        { icon: '❄️', label: 'Température min', value: fmt(displayTemp(day.tempMin, units.temp), t), tint: 'sky' },
        { icon: '🌡️', label: 'Température moyenne', value: fmt(displayTemp(day.tempMean, units.temp), t), tint: 'indigo' },
        { icon: '🌧️', label: 'Précipitations', value: fmt(day.precipitation, 'mm'), tint: 'cyan' },
        { icon: '💨', label: 'Rafales', value: fmt(displayWind(day.windGust, units.wind), w), tint: 'teal' },
      ]
    : []

  return (
    <section className="day-view">
      {!dateValid && !isFetching && (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__icon">📅</div>
          <p>Choisissez une date pour voir le temps qu'il faisait.</p>
        </div>
      )}
      {isFetching && (
        <div className="stat-grid">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="stat stat--skeleton" />)}</div>
      )}
      {isError && <p className="error error--banner">{apiErrorMessage(error)}</p>}
      {day && !isFetching && (
        <>
          <h2 className="day-view__title">{formatLongDate(day.date)}</h2>
          <dl className="stat-grid">
            {stats.map((s) => (
              <div key={s.label} className={`stat stat--${s.tint}`}>
                <span className="stat__icon">{s.icon}</span>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          {hourly.data && hourly.data.length > 0 && (
            <>
              <h3 className="day-view__subtitle">Heure par heure</h3>
              <HourlyForecast hours={hourly.data} units={units} />
            </>
          )}

          <div className="disclosure">
            <button type="button" className="disclosure__toggle" aria-expanded={showRecords}
              onClick={() => setShowRecords((v) => !v)}>
              <span>📜 Records &amp; histoire du lieu</span>
              <span className="disclosure__chevron" aria-hidden="true">{showRecords ? '▾' : '▸'}</span>
            </button>
            {showRecords && <RecordsHistory location={location} date={date} />}
          </div>
        </>
      )}
    </section>
  )
}
