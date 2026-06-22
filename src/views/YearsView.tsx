import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useFullHistory } from '../hooks/useFullHistory'
import { ThisDayChart, type ThisDayDatum } from '../components/ThisDayChart'
import { monthDay, thisDayAcrossYears, computeRecords, climateStats, linearFit, annualExtremes } from '../lib/insights'
import { displayTemp, displayWind, tempUnitLabel, windUnitLabel } from '../lib/units'
import { formatLongDate, toISODate, formatShortDate } from '../lib/dates'

export function YearsView() {
  const { state } = useAppState()
  const { units } = useSettings()
  const { location, date } = state
  const md = monthDay(date || toISODate(new Date()))

  const history = useFullHistory(location)
  const series = history.data

  const yearValues = useMemo(() => (series ? thisDayAcrossYears(series, md) : []), [series, md])

  const annual = useMemo(() => (series ? annualExtremes(series) : []), [series])

  // Builds a year/value/trend series from any per-year rows, converting units.
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

  if (!location) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📍</div>
        <h2>Choisissez un lieu pour commencer</h2>
        <p>Recherchez une ville pour explorer ses records et son histoire climatique.</p>
      </div>
    )
  }

  const t = tempUnitLabel(units.temp)
  const w = windUnitLabel(units.wind)

  return (
    <section className="years-view">
      {history.isLoading && (
        <>
          <p className="loading">Chargement de l'historique complet (depuis 1940)… cela peut prendre quelques secondes la première fois.</p>
          <div className="charts-grid"><div className="chart chart--skeleton" /></div>
        </>
      )}
      {history.isError && <p className="error error--banner">Impossible de récupérer l'historique. Réessayez.</p>}

      {series && (
        <>
          <h2 className="day-view__title">Le {formatShortDate(`2000-${md}`)} à travers les années</h2>
          <div className="charts-grid charts-grid--pair">
            <ThisDayChart data={maxData} unit={t} mid={midOf(maxData)} title="Température maximale" icon="🔥" accent="#f97316" />
            <ThisDayChart data={minData} unit={t} mid={midOf(minData)} title="Température minimale" icon="❄️" accent="#0ea5e9" />
            <ThisDayChart data={windSpeedData} unit={w} mid={midOf(windSpeedData)} title="Vitesse du vent max" icon="🌬️" accent="#14b8a6" />
            <ThisDayChart data={windGustData} unit={w} mid={midOf(windGustData)} title="Rafales max" icon="💨" accent="#0d9488" />
          </div>

          <h2 className="day-view__title">Records par année</h2>
          <p className="years-view__hint">L'extrême de chaque année, toutes dates confondues (indépendant du jour ci-dessus).</p>
          <div className="charts-grid charts-grid--pair">
            <ThisDayChart data={annualTemp.hottest} unit={t} mid={midOf(annualTemp.hottest)} title="Jour le plus chaud" icon="🔥" accent="#f97316" />
            <ThisDayChart data={annualTemp.coldest} unit={t} mid={midOf(annualTemp.coldest)} title="Jour le plus froid" icon="❄️" accent="#0ea5e9" />
            <ThisDayChart data={annualWind.speed} unit={w} mid={midOf(annualWind.speed)} title="Vitesse du vent max" icon="🌬️" accent="#14b8a6" />
            <ThisDayChart data={annualWind.gust} unit={w} mid={midOf(annualWind.gust)} title="Rafale max" icon="💨" accent="#0d9488" />
            <ThisDayChart data={annualRain} unit="mm" mid={midOf(annualRain)} title="Jour le plus pluvieux" icon="🌧️" accent="#38bdf8" />
          </div>

          {records && (
            <>
              <h2 className="day-view__title">Records absolus depuis {stats?.years ? `${series.days[0].date.slice(0, 4)}` : '1940'}</h2>
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
              <h2 className="day-view__title">Synthèse climatique</h2>
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
    </section>
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
