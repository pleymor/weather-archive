import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { useNormals } from '../hooks/useNormals'
import { DateRangePicker } from '../components/DateRangePicker'
import { TemperatureChart } from '../components/TemperatureChart'
import { PrecipitationChart } from '../components/PrecipitationChart'
import { WindChart } from '../components/WindChart'
import { AnomalyChart } from '../components/AnomalyChart'
import { ComparisonChart } from '../components/ComparisonChart'
import { CompareControl } from '../components/CompareControl'
import { mergeMeanByDate } from '../lib/compare'
import { validateRange, maxDate, toISODate } from '../lib/dates'
import { convertDays, displayTemp, displayWind, displayTempDelta, tempUnitLabel, windUnitLabel } from '../lib/units'
import { enrichWithNormals, meanAnomaly } from '../lib/climate'
import { toCSV, downloadText } from '../lib/exportData'
import type { WeatherParams } from '../api/weather'
import type { WeatherDay } from '../lib/types'

type ChartDay = WeatherDay & { normalMean?: number | null; anomaly?: number | null }

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
  const [showNormals, setShowNormals] = useState(false)

  const rangeValid = Boolean(start && end) && validateRange(start, end).ok
  const params: WeatherParams | null =
    location && rangeValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: start, endDate: end }
      : null

  const { data, isFetching, isError } = useWeather(params)

  const compareParams: WeatherParams | null =
    location && state.compare && rangeValid
      ? { latitude: state.compare.latitude, longitude: state.compare.longitude, startDate: start, endDate: end }
      : null
  const compareQuery = useWeather(compareParams)
  const merged = useMemo(
    () => (data && state.compare && compareQuery.data
      ? mergeMeanByDate(convertDays(data.days, units), convertDays(compareQuery.data.days, units))
      : null),
    [data, compareQuery.data, state.compare, units],
  )

  const normalsQuery = useNormals(location, showNormals && !!data)
  const normals = normalsQuery.data

  const enriched = useMemo(
    () => (data && normals ? enrichWithNormals(data.days, normals) : null),
    [data, normals],
  )

  const chartDays = useMemo<ChartDay[]>(() => {
    if (!data) return []
    if (showNormals && enriched) {
      return enriched.map((d) => ({
        date: d.date,
        tempMax: displayTemp(d.tempMax, units.temp),
        tempMin: displayTemp(d.tempMin, units.temp),
        tempMean: displayTemp(d.tempMean, units.temp),
        precipitation: d.precipitation,
        windMax: displayWind(d.windMax, units.wind),
        normalMean: displayTemp(d.normalMean, units.temp),
        anomaly: displayTempDelta(d.anomaly, units.temp),
      }))
    }
    return convertDays(data.days, units)
  }, [data, units, showNormals, enriched])

  const anomalyAvg = useMemo(
    () => (showNormals && enriched ? displayTempDelta(meanAnomaly(enriched), units.temp) : null),
    [showNormals, enriched, units.temp],
  )

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

  const t = tempUnitLabel(units.temp)
  const normalsReady = showNormals && enriched

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
          <button type="button" className={`chip${showNormals ? ' is-active' : ''}`} aria-pressed={showNormals} onClick={() => setShowNormals((v) => !v)}>
            📏 Normales
          </button>
          {data && <button type="button" className="chip chip--action" onClick={exportCsv}>⬇ CSV</button>}
        </div>
      </div>

      <div className="compare-row"><CompareControl /></div>

      {normalsReady && anomalyAvg !== null && (
        <div className={`anomaly-banner ${anomalyAvg >= 0 ? 'anomaly-banner--warm' : 'anomaly-banner--cool'}`}>
          <strong>{anomalyAvg >= 0 ? '+' : ''}{anomalyAvg} {t}</strong>
          <span>en moyenne {anomalyAvg >= 0 ? 'au-dessus' : 'en dessous'} de la normale 1991-2020 sur la période</span>
        </div>
      )}
      {showNormals && normalsQuery.isFetching && <p className="loading">Calcul des normales (1991-2020)…</p>}

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
          {merged && state.compare && (
            <ComparisonChart data={merged} labelA={location.name} labelB={state.compare.name} unit={t} />
          )}
          <TemperatureChart days={chartDays} unit={t} showNormal={!!normalsReady} />
          {normalsReady && <AnomalyChart days={chartDays} unit={t} />}
          <PrecipitationChart days={chartDays} />
          <WindChart days={chartDays} unit={windUnitLabel(units.wind)} />
        </div>
      )}
    </section>
  )
}
