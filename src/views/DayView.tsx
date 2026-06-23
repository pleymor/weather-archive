import { useEffect, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { useHourly } from '../hooks/useHourly'
import { HourlyForecast } from '../components/HourlyForecast'
import { DaySummary } from '../components/DaySummary'
import { RecordsHistory } from '../components/RecordsHistory'
import { validateSingleDate, formatLongDate, maxDate } from '../lib/dates'
import { apiErrorMessage } from '../lib/apiError'
import type { WeatherParams } from '../api/weather'

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
          {hourly.data && hourly.data.length > 0 && (
            <>
              <h3 className="day-view__subtitle">Heure par heure</h3>
              <HourlyForecast hours={hourly.data} units={units} />
            </>
          )}
          <DaySummary day={day} units={units} />

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
