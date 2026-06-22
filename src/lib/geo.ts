export interface GeoFeature {
  type: 'Feature'
  properties: { code: string; nom: string }
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] }
}
export interface GeoCollection { type: 'FeatureCollection'; features: GeoFeature[] }

export type Bounds = [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
export type Projector = (lon: number, lat: number) => [number, number]

/** All polygon rings (outer + holes) of a feature, each a list of [lon,lat] points. */
function rings(f: GeoFeature): number[][][] {
  if (f.geometry.type === 'Polygon') return f.geometry.coordinates
  return f.geometry.coordinates.flat()
}

/** Outer rings only (first ring of each polygon). */
function outerRings(f: GeoFeature): number[][][] {
  if (f.geometry.type === 'Polygon') return [f.geometry.coordinates[0]]
  return f.geometry.coordinates.map((poly) => poly[0])
}

export function featureBounds(features: GeoFeature[]): Bounds {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity
  for (const f of features) {
    for (const ring of rings(f)) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
    }
  }
  return [minLon, minLat, maxLon, maxLat]
}

/** Equirectangular projection with longitude scaled by cos(midLat), fit into width×height. */
export function makeProjection(bounds: Bounds, width: number, height: number, pad = 12): Projector {
  const [minLon, minLat, maxLon, maxLat] = bounds
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const x0 = minLon * k
  const geoW = maxLon * k - x0
  const geoH = maxLat - minLat
  const s = Math.min((width - 2 * pad) / geoW, (height - 2 * pad) / geoH)
  const offX = (width - geoW * s) / 2
  const offY = (height - geoH * s) / 2
  return (lon, lat) => [offX + (lon * k - x0) * s, offY + (maxLat - lat) * s]
}

/** Builds an SVG path string for a feature using the projector. */
export function pathFor(f: GeoFeature, project: Projector): string {
  let d = ''
  for (const ring of rings(f)) {
    ring.forEach(([lon, lat], i) => {
      const [x, y] = project(lon, lat)
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    d += 'Z'
  }
  return d
}

/** Average of all vertices — good enough as a representative point for data lookup. */
export function centroid(f: GeoFeature): [number, number] {
  let sx = 0, sy = 0, n = 0
  for (const ring of outerRings(f)) {
    for (const [lon, lat] of ring) { sx += lon; sy += lat; n++ }
  }
  return n ? [sx / n, sy / n] : [0, 0]
}

function inRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Ray-casting point-in-feature test over outer rings. */
export function pointInFeature(lon: number, lat: number, f: GeoFeature): boolean {
  return outerRings(f).some((ring) => inRing(lon, lat, ring))
}
