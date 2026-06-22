import { useEffect } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { DatePicker } from '../components/DatePicker'
import { validateSingleDate, formatLongDate, maxDate } from '../lib/dates'
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

  // Default to the most recent available day (yesterday — today isn't in the archive yet).
  useEffect(() => {
    if (!date) setDate(maxDate())
  }, [date, setDate])

  const dateValid = Boolean(date) && validateSingleDate(date).ok
  const params: WeatherParams | null =
    location && dateValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: date, endDate: date }
      : null

  const { data, isFetching, isError } = useWeather(params)
  const day = data?.days[0]

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
      <div className="toolbar">
        <DatePicker value={date} onChange={setDate} />
      </div>

      {!dateValid && !isFetching && (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__icon">📅</div>
          <p>Choisissez une date pour voir le temps qu'il faisait.</p>
        </div>
      )}
      {isFetching && (
        <div className="stat-grid">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="stat stat--skeleton" />)}</div>
      )}
      {isError && <p className="error error--banner">Impossible de récupérer les données. Vérifiez votre connexion et réessayez.</p>}
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
        </>
      )}
    </section>
  )
}
