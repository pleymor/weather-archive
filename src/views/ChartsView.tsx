import { useState } from 'react'
import { useLocation } from '../state/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { DateRangePicker } from '../components/DateRangePicker'
import { TemperatureChart } from '../components/TemperatureChart'
import { PrecipitationChart } from '../components/PrecipitationChart'
import { WindChart } from '../components/WindChart'
import { validateRange, maxDate, toISODate } from '../lib/dates'
import type { WeatherParams } from '../api/weather'

interface Preset { label: string; days: number }
const PRESETS: Preset[] = [
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
]

function rangeForDays(days: number): { start: string; end: string } {
  const end = maxDate()
  const startDate = new Date(`${end}T00:00:00Z`)
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1))
  return { start: toISODate(startDate), end }
}

export function ChartsView() {
  const { location } = useLocation()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const rangeValid = Boolean(start && end) && validateRange(start, end).ok
  const params: WeatherParams | null =
    location && rangeValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: start, endDate: end }
      : null

  const { data, isFetching, isError } = useWeather(params)

  if (!location) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📍</div>
        <h2>Choisissez un lieu pour commencer</h2>
        <p>Recherchez une ville ci-dessus pour explorer son historique météo.</p>
      </div>
    )
  }

  function applyPreset(days: number) {
    const r = rangeForDays(days)
    setStart(r.start)
    setEnd(r.end)
  }

  return (
    <section className="charts-view">
      <div className="toolbar">
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.days} type="button" className="chip" onClick={() => applyPreset(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!rangeValid && !isFetching && (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__icon">📈</div>
          <p>Sélectionnez une période ou un raccourci pour afficher les graphiques.</p>
        </div>
      )}
      {isFetching && (
        <div className="charts-grid">
          {[0, 1, 2].map((i) => <div key={i} className="chart chart--skeleton" />)}
        </div>
      )}
      {isError && <p className="error error--banner">Impossible de récupérer les données. Vérifiez votre connexion et réessayez.</p>}
      {data && !isFetching && (
        <div className="charts-grid">
          <TemperatureChart days={data.days} />
          <PrecipitationChart days={data.days} />
          <WindChart days={data.days} />
        </div>
      )}
    </section>
  )
}
