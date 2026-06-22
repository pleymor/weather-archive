import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { DateRangePicker } from '../components/DateRangePicker'
import { TemperatureChart } from '../components/TemperatureChart'
import { PrecipitationChart } from '../components/PrecipitationChart'
import { WindChart } from '../components/WindChart'
import { validateRange, maxDate, toISODate } from '../lib/dates'
import { convertDays, tempUnitLabel, windUnitLabel } from '../lib/units'
import { toCSV, downloadText } from '../lib/exportData'
import type { WeatherParams } from '../api/weather'

const PRESETS = [
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
  const { state, setRange } = useAppState()
  const { units } = useSettings()
  const { location, start, end } = state

  const rangeValid = Boolean(start && end) && validateRange(start, end).ok
  const params: WeatherParams | null =
    location && rangeValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: start, endDate: end }
      : null

  const { data, isFetching, isError } = useWeather(params)
  const displayDays = useMemo(() => (data ? convertDays(data.days, units) : []), [data, units])

  if (!location) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📍</div>
        <h2>Choisissez un lieu pour commencer</h2>
        <p>Recherchez une ville ci-dessus pour explorer son historique météo.</p>
      </div>
    )
  }

  function exportCsv() {
    if (!data) return
    downloadText(`meteo_${location!.name}_${start}_${end}.csv`, toCSV(data, units))
  }

  return (
    <section className="charts-view">
      <div className="toolbar">
        <DateRangePicker start={start} end={end} onChange={setRange} />
        <div className="toolbar__actions">
          <div className="presets">
            {PRESETS.map((p) => {
              const r = rangeForDays(p.days)
              const active = start === r.start && end === r.end
              return (
                <button key={p.days} type="button" className={`chip${active ? ' is-active' : ''}`} onClick={() => setRange(r.start, r.end)}>
                  {p.label}
                </button>
              )
            })}
          </div>
          {data && (
            <button type="button" className="chip chip--action" onClick={exportCsv}>⬇ CSV</button>
          )}
        </div>
      </div>

      {!rangeValid && !isFetching && (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__icon">📈</div>
          <p>Sélectionnez une période ou un raccourci pour afficher les graphiques.</p>
        </div>
      )}
      {isFetching && (
        <div className="charts-grid">{[0, 1, 2].map((i) => <div key={i} className="chart chart--skeleton" />)}</div>
      )}
      {isError && <p className="error error--banner">Impossible de récupérer les données. Vérifiez votre connexion et réessayez.</p>}
      {data && !isFetching && (
        <div className="charts-grid">
          <TemperatureChart days={displayDays} unit={tempUnitLabel(units.temp)} />
          <PrecipitationChart days={displayDays} />
          <WindChart days={displayDays} unit={windUnitLabel(units.wind)} />
        </div>
      )}
    </section>
  )
}
