import { useState } from 'react'
import { useLocation } from '../state/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { DatePicker } from '../components/DatePicker'
import { validateSingleDate } from '../lib/dates'
import type { WeatherParams } from '../api/weather'

function fmt(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`
}

export function DayView() {
  const { location } = useLocation()
  const [date, setDate] = useState('')

  const dateValid = Boolean(date) && validateSingleDate(date).ok
  const params: WeatherParams | null =
    location && dateValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: date, endDate: date }
      : null

  const { data, isFetching, isError } = useWeather(params)
  const day = data?.days[0]

  if (!location) return <p className="hint">Choisissez un lieu pour commencer.</p>

  return (
    <section className="day-view">
      <DatePicker value={date} onChange={setDate} />
      {isFetching && <p className="loading">Chargement…</p>}
      {isError && <p className="error">Impossible de récupérer les données. Réessayez.</p>}
      {day && (
        <dl className="day-card">
          <div><dt>Température max</dt><dd>{fmt(day.tempMax, '°C')}</dd></div>
          <div><dt>Température min</dt><dd>{fmt(day.tempMin, '°C')}</dd></div>
          <div><dt>Température moyenne</dt><dd>{fmt(day.tempMean, '°C')}</dd></div>
          <div><dt>Précipitations</dt><dd>{fmt(day.precipitation, 'mm')}</dd></div>
          <div><dt>Vent max</dt><dd>{fmt(day.windMax, 'km/h')}</dd></div>
        </dl>
      )}
    </section>
  )
}
