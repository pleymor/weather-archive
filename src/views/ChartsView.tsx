import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useWeather } from '../hooks/useWeather'
import { useNormals } from '../hooks/useNormals'
import { TemperatureChart } from '../components/TemperatureChart'
import { PrecipitationChart } from '../components/PrecipitationChart'
import { WindChart } from '../components/WindChart'
import { AnomalyChart } from '../components/AnomalyChart'
import { ComparisonChart } from '../components/ComparisonChart'
import { CompareControl } from '../components/CompareControl'
import { mergeMeanByDate } from '../lib/compare'
import { apiErrorMessage } from '../lib/apiError'
import { validateRange } from '../lib/dates'
import { convertDays, displayTemp, displayWind, displayTempDelta, tempUnitLabel, windUnitLabel } from '../lib/units'
import { enrichWithNormals, meanAnomaly } from '../lib/climate'
import { toCSV, downloadText } from '../lib/exportData'
import type { WeatherParams } from '../api/weather'
import type { WeatherDay } from '../lib/types'

type ChartDay = WeatherDay & { normalMean?: number | null; anomaly?: number | null }

export function ChartsView() {
  const { state } = useAppState()
  const { units } = useSettings()
  const { location, start, end } = state

  const rangeValid = Boolean(start && end) && validateRange(start, end).ok
  const params: WeatherParams | null =
    location && rangeValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: start, endDate: end }
      : null

  const { data, isFetching, isError, error } = useWeather(params)

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

  // Climate normals are always shown (no toggle).
  const normalsQuery = useNormals(location, !!data)
  const normals = normalsQuery.data

  const enriched = useMemo(
    () => (data && normals ? enrichWithNormals(data.days, normals) : null),
    [data, normals],
  )

  const chartDays = useMemo<ChartDay[]>(() => {
    if (!data) return []
    if (enriched) {
      return enriched.map((d) => ({
        date: d.date,
        tempMax: displayTemp(d.tempMax, units.temp),
        tempMin: displayTemp(d.tempMin, units.temp),
        tempMean: displayTemp(d.tempMean, units.temp),
        precipitation: d.precipitation,
        windGust: displayWind(d.windGust, units.wind),
        normalMean: displayTemp(d.normalMean, units.temp),
        anomaly: displayTempDelta(d.anomaly, units.temp),
      }))
    }
    return convertDays(data.days, units)
  }, [data, units, enriched])

  const anomalyAvg = useMemo(
    () => (enriched ? displayTempDelta(meanAnomaly(enriched), units.temp) : null),
    [enriched, units.temp],
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
  const normalsReady = !!enriched

  return (
    <section className="charts-view">
      <CompareControl />

      {anomalyAvg !== null && (
        <div className={`anomaly-banner ${anomalyAvg >= 0 ? 'anomaly-banner--warm' : 'anomaly-banner--cool'}`}>
          <strong>{anomalyAvg >= 0 ? '+' : ''}{anomalyAvg} {t}</strong>
          <span>en moyenne {anomalyAvg >= 0 ? 'au-dessus' : 'en dessous'} de la normale 1991-2020 sur la période</span>
        </div>
      )}

      {!rangeValid && !isFetching && (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__icon">📈</div>
          <p>Choisissez une période via 📅 dans la barre en haut pour afficher les graphiques.</p>
        </div>
      )}
      {isFetching && (
        <div className="charts-grid">{[0, 1, 2].map((i) => <div key={i} className="chart chart--skeleton" />)}</div>
      )}
      {isError && <p className="error error--banner">{apiErrorMessage(error)}</p>}
      {data && !isFetching && (
        <>
          <div className="charts-grid">
            {merged && state.compare && (
              <ComparisonChart data={merged} labelA={location.name} labelB={state.compare.name} unit={t} />
            )}
            <TemperatureChart days={chartDays} unit={t} showNormal={normalsReady} />
            {normalsReady && <AnomalyChart days={chartDays} unit={t} />}
            <PrecipitationChart days={chartDays} />
            <WindChart days={chartDays} unit={windUnitLabel(units.wind)} />
          </div>
          <div className="charts-view__footer">
            <button type="button" className="chip chip--action" onClick={exportCsv}>⬇ Exporter en CSV</button>
          </div>
        </>
      )}
    </section>
  )
}
