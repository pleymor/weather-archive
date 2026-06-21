import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { WeatherSeries } from '../lib/types'
import type { WeatherParams } from '../api/weather'

interface WeatherDB extends DBSchema {
  weather: { key: string; value: WeatherSeries }
}

const DB_NAME = 'weather-archive'
const STORE = 'weather'

let dbPromise: Promise<IDBPDatabase<WeatherDB>> | null = null

function db(): Promise<IDBPDatabase<WeatherDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WeatherDB>(DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore(STORE)
      },
    })
  }
  return dbPromise
}

export function cacheKey(p: WeatherParams): string {
  const lat = p.latitude.toFixed(4).replace(/\.?0+$/, '')
  const lon = p.longitude.toFixed(4).replace(/\.?0+$/, '')
  return `${lat}|${lon}|${p.startDate}|${p.endDate}`
}

export async function getCachedWeather(p: WeatherParams): Promise<WeatherSeries | undefined> {
  return (await db()).get(STORE, cacheKey(p))
}

export async function putCachedWeather(p: WeatherParams, series: WeatherSeries): Promise<void> {
  await (await db()).put(STORE, series, cacheKey(p))
}
