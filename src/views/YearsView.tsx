import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useFullHistory } from '../hooks/useFullHistory'
import { MonthDayPicker } from '../components/MonthDayPicker'
import { ThisDayChart, type ThisDayDatum } from '../components/ThisDayChart'
import { monthDay, thisDayAcrossYears, computeRecords, climateStats, linearFit } from '../lib/insights'
import { displayTemp, displayWind, tempUnitLabel, windUnitLabel } from '../lib/units'
import { formatLongDate, toISODate, formatShortDate } from '../lib/dates'

export function YearsView() {
  const { state, setDate } = useAppState()
  const { units } = useSettings()
  const { location, date } = state
  const md = monthDay(date || toISODate(new Date()))

  const history = useFullHistory(location)
  const series = history.data

  const yearValues = useMemo(() => (series ? thisDayAcrossYears(series, md) : []), [series, md])

  const { maxData, minData } = useMemo(() => {
    const build = (pick: (y: (typeof yearValues)[number]) => number | null): ThisDayDatum[] => {
      const pts = yearValues
        .filter((y) => pick(y) !== null)
        .map((y) => [y.year, pick(y) as number] as [number, number])
      const fit = linearFit(pts)
      return yearValues.map((y) => ({
        year: y.year,
        value: displayTemp(pick(y), units.temp),
        trend: fit ? displayTemp(fit.slope * y.year + fit.intercept, units.temp) : null,
      }))
    }
    return { maxData: build((y) => y.tempMax), minData: build((y) => y.tempMin) }
  }, [yearValues, units.temp])

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
      <div className="toolbar">
        <MonthDayPicker value={date} onChange={setDate} />
      </div>

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
