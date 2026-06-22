import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppState } from '../state/AppStateContext'
import { useSettings } from '../state/SettingsContext'
import { useChoropleth } from '../hooks/useChoropleth'
import { DatePicker } from '../components/DatePicker'
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
  const { state, setLocation, setMode, setDate } = useAppState()
  const { units } = useSettings()
  const [region, setRegion] = useState<GeoFeature | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  // A single day (defaults to today; Open-Meteo serves provisional current-day values).
  const day = state.date && validateSingleDate(state.date).ok ? state.date : maxDate()

  const regionsQuery = useQuery({ queryKey: ['geo', 'regions'], staleTime: Infinity, gcTime: Infinity, queryFn: () => fetchGeo('/geo/regions.geojson') })
  const deptsQuery = useQuery({ queryKey: ['geo', 'departements'], enabled: region !== null, staleTime: Infinity, gcTime: Infinity, queryFn: () => fetchGeo('/geo/departements.geojson') })

  const displayed: GeoFeature[] = useMemo(() => {
    if (region && deptsQuery.data) return deptsQuery.data.filter((d) => pointInFeature(...centroid(d), region))
    return regionsQuery.data ?? []
  }, [region, deptsQuery.data, regionsQuery.data])

  const choropleth = useChoropleth(displayed, day)
  const values = choropleth.data

  const [vmin, vmax] = useMemo(() => {
    if (!values) return [0, 0]
    const nums = [...values.values()].filter((v): v is number => v !== null)
    return nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]
  }, [values])

  const project = useMemo(() => (displayed.length ? makeProjection(featureBounds(displayed), W, H) : null), [displayed])
  const t = tempUnitLabel(units.temp)

  function onPick(f: GeoFeature) {
    if (!region) { setRegion(f); return }
    const [lon, lat] = centroid(f)
    setLocation({ name: f.properties.nom, latitude: lat, longitude: lon, admin1: region.properties.nom, country: 'France' })
    setMode('charts')
  }

  const hovered = hover && values ? { nom: displayed.find((f) => f.properties.code === hover)?.properties.nom, value: values.get(hover) ?? null } : null

  return (
    <section className="map-view">
      <div className="toolbar">
        <DatePicker value={day} onChange={setDate} />
        <p className="years-view__hint">Carte de la température maximale du {formatLongDate(day)}.</p>
      </div>

      <div className="map-head">
        {region ? (
          <button type="button" className="chip" onClick={() => setRegion(null)}>← Toutes les régions</button>
        ) : (
          <p className="years-view__hint">Cliquez une région pour zoomer sur ses départements, puis un département pour l'ouvrir.</p>
        )}
        <span className="map-info">{hovered?.nom ? `${hovered.nom} — ${hovered.value === null ? '—' : `${displayTemp(hovered.value, units.temp)} ${t}`}` : (region ? region.properties.nom : 'France')}</span>
      </div>

      {(regionsQuery.isLoading || (region && deptsQuery.isLoading) || choropleth.isFetching) && (
        <p className="loading">Chargement de la carte…</p>
      )}
      {(regionsQuery.isError || choropleth.isError) && <p className="error error--banner">Impossible de charger la carte. Réessayez.</p>}

      {project && (
        <div className="map-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" role="img" aria-label="Carte de France">
            {displayed.map((f) => {
              const v = values?.get(f.properties.code) ?? null
              const fill = v === null ? 'var(--surface-2)' : colorFor(v, vmin, vmax)
              return (
                <path key={f.properties.code} d={pathFor(f, project)} fill={fill}
                  className={`map-region${hover === f.properties.code ? ' is-hover' : ''}`}
                  onMouseEnter={() => setHover(f.properties.code)} onMouseLeave={() => setHover(null)}
                  onClick={() => onPick(f)}>
                  <title>{f.properties.nom}{v !== null ? ` — ${displayTemp(v, units.temp)} ${t}` : ''}</title>
                </path>
              )
            })}
          </svg>
          {values && vmax > vmin && (
            <div className="map-legend">
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
