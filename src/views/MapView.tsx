import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useChoropleth, type CellTemps } from '../hooks/useChoropleth'
import { validateSingleDate, maxDate, formatLongDate } from '../lib/dates'
import { displayTemp, tempUnitLabel } from '../lib/units'
import { featureBounds, makeProjection, pathFor, centroid, pointInFeature, type GeoFeature, type GeoCollection } from '../lib/geo'
import { colorFor, rampColor } from '../lib/colorScale'

const W = 640
const H = 640

async function fetchGeo(url: string): Promise<GeoFeature[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GeoJSON ${res.status}`)
  const data = (await res.json()) as GeoCollection
  return data.features
}

export function MapView() {
  const { state, setLocation, setMode } = useAppState()
  const { units } = useSettings()
  const [region, setRegion] = useState<GeoFeature | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [metric, setMetric] = useState<'min' | 'max'>('max')

  // A single day (defaults to today; Open-Meteo serves provisional current-day values).
  const day = state.date && validateSingleDate(state.date).ok ? state.date : maxDate()

  const regionsQuery = useQuery({ queryKey: ['geo', 'regions'], staleTime: Infinity, gcTime: Infinity, queryFn: () => fetchGeo('/geo/regions.geojson') })
  const deptsQuery = useQuery({ queryKey: ['geo', 'departements'], staleTime: Infinity, gcTime: Infinity, queryFn: () => fetchGeo('/geo/departements.geojson') })

  // Always compute at department level; a region aggregates its departments
  // (min of mins, max of maxes) so it's never cooler/hotter than they are.
  const allDepts = deptsQuery.data ?? []
  const choropleth = useChoropleth(allDepts, day)
  const deptValues = choropleth.data

  const regionValues = useMemo(() => {
    if (!regionsQuery.data || !deptValues) return null
    const m = new Map<string, CellTemps>()
    for (const r of regionsQuery.data) {
      const cells = allDepts
        .filter((d) => pointInFeature(...centroid(d), r))
        .map((d) => deptValues.get(d.properties.code))
        .filter((c): c is CellTemps => Boolean(c))
      const mins = cells.map((c) => c.min).filter((v): v is number => v != null)
      const maxs = cells.map((c) => c.max).filter((v): v is number => v != null)
      m.set(r.properties.code, {
        min: mins.length ? Math.min(...mins) : null,
        max: maxs.length ? Math.max(...maxs) : null,
      })
    }
    return m
  }, [regionsQuery.data, allDepts, deptValues])

  const displayed: GeoFeature[] = useMemo(() => {
    if (region) return allDepts.filter((d) => pointInFeature(...centroid(d), region))
    return regionsQuery.data ?? []
  }, [region, allDepts, regionsQuery.data])

  const values = region ? deptValues : regionValues

  const [vmin, vmax] = useMemo(() => {
    if (!values) return [0, 0]
    const nums = [...values.values()].map((c) => c[metric]).filter((v): v is number => v !== null)
    return nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]
  }, [values, metric])

  const project = useMemo(() => (displayed.length ? makeProjection(featureBounds(displayed), W, H) : null), [displayed])
  const t = tempUnitLabel(units.temp)
  const dt = (v: number | null) => (v === null ? '—' : displayTemp(v, units.temp))

  function onPick(f: GeoFeature) {
    if (!region) { setRegion(f); return }
    const [lon, lat] = centroid(f)
    setLocation({ name: f.properties.nom, latitude: lat, longitude: lon, admin1: region.properties.nom, country: 'France' })
    setMode('charts')
  }

  const hoveredCell = hover && values ? values.get(hover) ?? null : null
  const hoveredNom = hover ? displayed.find((f) => f.properties.code === hover)?.properties.nom : null

  return (
    <section className="map-view">
      <div className="toolbar">
        <p className="years-view__hint">Carte des températures du {formatLongDate(day)}.</p>
        <div className="seg-toggle" role="group" aria-label="Métrique affichée">
          <button type="button" className={`chip${metric === 'min' ? ' is-active' : ''}`} aria-pressed={metric === 'min'} onClick={() => setMetric('min')}>Min</button>
          <button type="button" className={`chip${metric === 'max' ? ' is-active' : ''}`} aria-pressed={metric === 'max'} onClick={() => setMetric('max')}>Max</button>
        </div>
      </div>

      <div className="map-head">
        {region ? (
          <button type="button" className="chip" onClick={() => setRegion(null)}>← Toutes les régions</button>
        ) : (
          <p className="years-view__hint">Cliquez une région pour zoomer sur ses départements, puis un département pour l'ouvrir.</p>
        )}
        <span className="map-info">
          {hoveredNom
            ? `${hoveredNom} — min ${dt(hoveredCell?.min ?? null)} · max ${dt(hoveredCell?.max ?? null)} ${t}`
            : (region ? region.properties.nom : 'France')}
        </span>
      </div>

      {(regionsQuery.isLoading || deptsQuery.isLoading || choropleth.isFetching) && (
        <p className="loading">Chargement de la carte…</p>
      )}
      {(regionsQuery.isError || deptsQuery.isError || choropleth.isError) && <p className="error error--banner">Impossible de charger la carte. Réessayez.</p>}

      {project && (
        <div className="map-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" role="img" aria-label="Carte de France">
            {displayed.map((f) => {
              const c = values?.get(f.properties.code) ?? null
              const mv = c ? c[metric] : null
              const fill = mv === null ? 'var(--surface-2)' : colorFor(mv, vmin, vmax)
              return (
                <path key={f.properties.code} d={pathFor(f, project)} fill={fill}
                  className={`map-region${hover === f.properties.code ? ' is-hover' : ''}`}
                  onMouseEnter={() => setHover(f.properties.code)} onMouseLeave={() => setHover(null)}
                  onClick={() => onPick(f)}>
                  <title>{f.properties.nom}{c ? ` — min ${dt(c.min)} · max ${dt(c.max)} ${t}` : ''}</title>
                </path>
              )
            })}
          </svg>
          {vmax > vmin && (
            <div className="map-legend">
              <span className="map-legend__caption">Temp. {metric}</span>
              <span>{displayTemp(vmin, units.temp)} {t}</span>
              <div className="map-legend__bar" style={{ background: `linear-gradient(90deg, ${rampColor(0)}, ${rampColor(0.5)}, ${rampColor(1)})` }} />
              <span>{displayTemp(vmax, units.temp)} {t}</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
