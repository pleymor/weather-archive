import { useMemo, useState } from 'react'
import { useSettings } from '../state/SettingsContext'
import { useDecade } from '../hooks/useDecade'
import { ThisDayChart, type ThisDayDatum } from './ThisDayChart'
import { monthDay, thisDayAcrossYears, computeRecords, climateStats, linearFit, annualExtremes } from '../lib/insights'
import { displayTemp, displayWind, tempUnitLabel, windUnitLabel } from '../lib/units'
import { formatLongDate, toISODate, formatShortDate } from '../lib/dates'
import { apiErrorMessage } from '../lib/apiError'
import type { Location } from '../lib/types'

const MIN_DECADE = 1940
const CURRENT_DECADE = Math.floor(new Date().getUTCFullYear() / 10) * 10

/** Records & climate history for a location, one decade at a time. Mounted lazily
 *  (only when its disclosure is open) so it never fetches until the user asks. */
export function RecordsHistory({ location, date }: { location: Location; date: string }) {
  const { units } = useSettings()
  const md = monthDay(date || toISODate(new Date()))
  const [decade, setDecade] = useState(CURRENT_DECADE)

  const history = useDecade(location, decade)
  const series = history.data

  const yearValues = useMemo(() => (series ? thisDayAcrossYears(series, md) : []), [series, md])
  const annual = useMemo(() => (series ? annualExtremes(series) : []), [series])

  function build<T extends { year: number }>(
    rows: T[],
    pick: (r: T) => number | null,
    convert: (v: number | null) => number | null,
  ): ThisDayDatum[] {
    const pts = rows.filter((r) => pick(r) !== null).map((r) => [r.year, pick(r) as number] as [number, number])
    const fit = linearFit(pts)
    return rows.map((r) => ({
      year: r.year,
      value: convert(pick(r)),
      trend: fit ? convert(fit.slope * r.year + fit.intercept) : null,
    }))
  }

  const { maxData, minData } = useMemo(() => {
    const toTemp = (v: number | null) => displayTemp(v, units.temp)
    return { maxData: build(yearValues, (y) => y.tempMax, toTemp), minData: build(yearValues, (y) => y.tempMin, toTemp) }
  }, [yearValues, units.temp])

  const { windSpeedData, windGustData } = useMemo(() => {
    const toWind = (v: number | null) => displayWind(v, units.wind)
    return {
      windSpeedData: build(yearValues, (y) => y.windSpeedMax, toWind),
      windGustData: build(yearValues, (y) => y.windGust, toWind),
    }
  }, [yearValues, units.wind])

  const id = (v: number | null) => v
  const annualTemp = useMemo(() => {
    const toTemp = (v: number | null) => displayTemp(v, units.temp)
    return { hottest: build(annual, (y) => y.hottest, toTemp), coldest: build(annual, (y) => y.coldest, toTemp) }
  }, [annual, units.temp])
  const annualWind = useMemo(() => {
    const toWind = (v: number | null) => displayWind(v, units.wind)
    return { speed: build(annual, (y) => y.windSpeedMax, toWind), gust: build(annual, (y) => y.windGust, toWind) }
  }, [annual, units.wind])
  const annualRain = useMemo(() => build(annual, (y) => y.wettest, id), [annual])

  const midOf = (data: ThisDayDatum[]): number => {
    const vals = data.map((d) => d.value).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  const records = useMemo(() => (series ? computeRecords(series) : null), [series])
  const stats = useMemo(() => (series ? climateStats(series) : null), [series])

  const t = tempUnitLabel(units.temp)
  const w = windUnitLabel(units.wind)
  const decadeLabel = `années ${decade}`

  return (
    <div className="records-history">
      <div className="decade-nav">
        <button type="button" className="chip" onClick={() => setDecade((d) => d - 10)} disabled={decade <= MIN_DECADE}>
          ◀ {decade - 10}s
        </button>
        <span className="decade-nav__label">Années {decade}–{decade + 9}</span>
        <button type="button" className="chip" onClick={() => setDecade((d) => d + 10)} disabled={decade >= CURRENT_DECADE}>
          {decade + 10}s ▶
        </button>
      </div>

      {history.isLoading && (
        <>
          <p className="loading">Chargement des {decadeLabel}…</p>
          <div className="charts-grid"><div className="chart chart--skeleton" /></div>
        </>
      )}
      {history.isError && <p className="error error--banner">{apiErrorMessage(history.error)}</p>}

      {series && (
        <>
          <h3 className="day-view__subtitle">Le {formatShortDate(`2000-${md}`)} à travers les {decadeLabel}</h3>
          <div className="charts-grid charts-grid--pair">
            <ThisDayChart data={maxData} unit={t} mid={midOf(maxData)} title="Température maximale" icon="🔥" accent="#f97316" />
            <ThisDayChart data={minData} unit={t} mid={midOf(minData)} title="Température minimale" icon="❄️" accent="#0ea5e9" />
            <ThisDayChart data={windSpeedData} unit={w} mid={midOf(windSpeedData)} title="Vitesse du vent max" icon="🌬️" accent="#14b8a6" />
            <ThisDayChart data={windGustData} unit={w} mid={midOf(windGustData)} title="Rafales max" icon="💨" accent="#0d9488" />
          </div>

          <h3 className="day-view__subtitle">Records par année</h3>
          <p className="years-view__hint">L'extrême de chaque année de la décennie, toutes dates confondues.</p>
          <div className="charts-grid charts-grid--pair">
            <ThisDayChart data={annualTemp.hottest} unit={t} mid={midOf(annualTemp.hottest)} title="Jour le plus chaud" icon="🔥" accent="#f97316" />
            <ThisDayChart data={annualTemp.coldest} unit={t} mid={midOf(annualTemp.coldest)} title="Jour le plus froid" icon="❄️" accent="#0ea5e9" />
            <ThisDayChart data={annualWind.speed} unit={w} mid={midOf(annualWind.speed)} title="Vitesse du vent max" icon="🌬️" accent="#14b8a6" />
            <ThisDayChart data={annualWind.gust} unit={w} mid={midOf(annualWind.gust)} title="Rafale max" icon="💨" accent="#0d9488" />
            <ThisDayChart data={annualRain} unit="mm" mid={midOf(annualRain)} title="Jour le plus pluvieux" icon="🌧️" accent="#38bdf8" />
          </div>

          {records && (
            <>
              <h3 className="day-view__subtitle">Records de la décennie {decade}</h3>
              <dl className="stat-grid">
                <RecordTile icon="🔥" label="Jour le plus chaud" rec={records.hottest} unit={t} tint="orange" conv={(v) => displayTemp(v, units.temp)} />
                <RecordTile icon="❄️" label="Jour le plus froid" rec={records.coldest} unit={t} tint="sky" conv={(v) => displayTemp(v, units.temp)} />
                <RecordTile icon="🌧️" label="Jour le plus pluvieux" rec={records.wettest} unit="mm" tint="cyan" conv={(v) => v} />
                <RecordTile icon="💨" label="Jour le plus venté" rec={records.windiest} unit={w} tint="teal" conv={(v) => displayWind(v, units.wind)} />
              </dl>
            </>
          )}

          {stats && (
            <>
              <h3 className="day-view__subtitle">Synthèse climatique {decade}–{decade + 9}</h3>
              <dl className="stat-grid">
                <div className="stat stat--indigo"><span className="stat__icon">🌡️</span><dt>Température moyenne</dt><dd>{stats.avgTemp === null ? '—' : `${displayTemp(stats.avgTemp, units.temp)} ${t}`}</dd></div>
                <div className="stat stat--sky"><span className="stat__icon">🧊</span><dt>Jours de gel / an</dt><dd>{stats.frostDaysPerYear === null ? '—' : Math.round(stats.frostDaysPerYear)}</dd></div>
                <div className="stat stat--orange"><span className="stat__icon">☀️</span><dt>Jours ≥ 30°C / an</dt><dd>{stats.hotDaysPerYear === null ? '—' : Math.round(stats.hotDaysPerYear)}</dd></div>
                <div className="stat stat--teal"><span className="stat__icon">📅</span><dt>Années couvertes</dt><dd>{stats.years}</dd></div>
              </dl>
            </>
          )}
        </>
      )}
    </div>
  )
}

function RecordTile({
  icon, label, rec, unit, tint, conv,
}: { icon: string; label: string; rec: { date: string; value: number } | null; unit: string; tint: string; conv: (v: number) => number | null }) {
  return (
    <div className={`stat stat--${tint}`}>
      <span className="stat__icon">{icon}</span>
      <dt>{label}</dt>
      <dd>{rec ? `${conv(rec.value)} ${unit}` : '—'}</dd>
      {rec && <p className="stat__sub">{formatLongDate(rec.date)}</p>}
    </div>
  )
}
