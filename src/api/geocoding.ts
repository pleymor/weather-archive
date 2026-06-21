import type { Location } from '../lib/types'

const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

interface GeoResult {
  id?: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export async function searchLocations(
  query: string,
  fetchFn: typeof fetch = fetch,
): Promise<Location[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const q = new URLSearchParams({ name: trimmed, count: '10', language: 'fr', format: 'json' })
  const res = await fetchFn(`${SEARCH_URL}?${q.toString()}`)
  if (!res.ok) throw new Error(`Erreur géocodage (${res.status})`)
  const data = (await res.json()) as { results?: GeoResult[] }
  if (!Array.isArray(data.results)) return []
  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }))
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  fetchFn: typeof fetch = fetch,
): Promise<Location> {
  const fallback: Location = {
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    latitude: lat,
    longitude: lon,
  }
  try {
    const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'fr' })
    const res = await fetchFn(`${REVERSE_URL}?${q.toString()}`)
    if (!res.ok) return fallback
    const d = (await res.json()) as { city?: string; locality?: string; countryName?: string; principalSubdivision?: string }
    const name = d.city || d.locality
    if (!name) return fallback
    return { name, latitude: lat, longitude: lon, country: d.countryName, admin1: d.principalSubdivision }
  } catch {
    return fallback
  }
}
