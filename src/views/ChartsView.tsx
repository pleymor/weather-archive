import { useState } from 'react'
import { useLocation } from '../state/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { DateRangePicker } from '../components/DateRangePicker'
import { TemperatureChart } from '../components/TemperatureChart'
import { PrecipitationChart } from '../components/PrecipitationChart'
import { WindChart } from '../components/WindChart'
import { validateRange } from '../lib/dates'
import type { WeatherParams } from '../api/weather'

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

  if (!location) return <p className="hint">Choisissez un lieu pour commencer.</p>

  return (
    <section className="charts-view">
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
      {isFetching && <p className="loading">Chargement…</p>}
      {isError && <p className="error">Impossible de récupérer les données. Réessayez.</p>}
      {data && (
        <>
          <TemperatureChart days={data.days} />
          <PrecipitationChart days={data.days} />
          <WindChart days={data.days} />
        </>
      )}
    </section>
  )
}
