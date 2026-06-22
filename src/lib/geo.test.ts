import { describe, it, expect } from 'vitest'
import { featureBounds, makeProjection, pathFor, centroid, pointInFeature, type GeoFeature } from './geo'

const SQUARE: GeoFeature = {
  type: 'Feature',
  properties: { code: '01', nom: 'Carré' },
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] },
}

describe('geo', () => {
  it('computes bounds', () => {
    expect(featureBounds([SQUARE])).toEqual([0, 0, 2, 2])
  })

  it('projects within the viewport and flips latitude', () => {
    const project = makeProjection([0, 0, 2, 2], 100, 100, 0)
    const [, yTop] = project(1, 2) // max lat -> top (small y)
    const [, yBot] = project(1, 0)
    expect(yTop).toBeLessThan(yBot)
  })

  it('builds a closed path', () => {
    const project = makeProjection([0, 0, 2, 2], 100, 100, 0)
    const d = pathFor(SQUARE, project)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('computes a centroid inside the shape', () => {
    const [lon, lat] = centroid(SQUARE)
    expect(lon).toBeGreaterThan(0)
    expect(lat).toBeGreaterThan(0)
  })

  it('tests point in feature', () => {
    expect(pointInFeature(1, 1, SQUARE)).toBe(true)
    expect(pointInFeature(5, 5, SQUARE)).toBe(false)
  })
})
