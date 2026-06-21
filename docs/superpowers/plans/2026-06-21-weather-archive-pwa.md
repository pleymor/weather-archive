# Weather Archive PWA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end-only PWA that lets users browse official historical weather data (Open-Meteo) for a place — as charts over a period, or as a detailed card for a single day.

**Architecture:** 100% client-side React app. A pure data layer (API modules + IndexedDB cache) is wrapped by TanStack Query hooks and consumed by two views (Charts, Day) sharing a selected-location context. No backend; deployed as static files. PWA via Workbox precaches app assets; immutable weather data is cached permanently in IndexedDB.

**Tech Stack:** React 19, Vite 8, TypeScript, vite-plugin-pwa (Workbox), Recharts 3, TanStack Query 5, `idb` 8, Vitest 4 + React Testing Library + fake-indexeddb.

## Global Constraints

- Node >= 20.19 (required by Vite 8).
- Data source: Open-Meteo Archive API (`https://archive-api.open-meteo.com/v1/archive`) and Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`). No API key. Reverse-geocoding (coords → name) uses BigDataCloud free client endpoint (`https://api.bigdatacloud.net/data/reverse-geocode-client`), no key.
- Weather variables (daily): `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `precipitation_sum`, `wind_speed_10m_max`.
- Date bounds: earliest `1940-01-01`; latest selectable = yesterday (Archive API has a multi-day lag; we conservatively cap at yesterday).
- Historical data is immutable → IndexedDB cache never expires.
- Geocoding requests use `language=fr`.
- TypeScript strict mode on. All API responses must be normalized into the shared types before reaching the UI.
- TDD: every task writes a failing test first, then minimal code. Commit after each task.

---

## File Structure

```
weather-archive/
├── index.html
├── package.json
├── vite.config.ts            # Vite + PWA + Vitest config
├── tsconfig.json
├── src/
│   ├── main.tsx              # React entry + QueryClient + LocationProvider
│   ├── App.tsx               # Layout, mode tabs, shared LocationSearch
│   ├── lib/
│   │   ├── types.ts          # Location, WeatherDay, WeatherSeries, WeatherVariable
│   │   └── dates.ts          # date bounds + validation helpers
│   ├── api/
│   │   ├── geocoding.ts      # searchLocations(), reverseGeocode()
│   │   └── weather.ts        # fetchWeather() + normalization
│   ├── cache/
│   │   └── weatherCache.ts   # IndexedDB get/put + cache key
│   ├── state/
│   │   └── LocationContext.tsx
│   ├── hooks/
│   │   ├── useGeocoding.ts
│   │   └── useWeather.ts
│   ├── components/
│   │   ├── LocationSearch.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TemperatureChart.tsx
│   │   ├── PrecipitationChart.tsx
│   │   └── WindChart.tsx
│   └── views/
│       ├── ChartsView.tsx
│       └── DayView.tsx
└── test/
    └── setup.ts              # RTL + fake-indexeddb wiring
```

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `test/setup.ts`
- Test: `src/lib/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Vite project with `npm test` (Vitest + jsdom) and `npm run dev` working.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "weather-archive",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.101.0",
    "idb": "^8.0.3",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "recharts": "^3.8.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "fake-indexeddb": "^6.2.5",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.0",
    "vite": "^8.0.0",
    "vite-plugin-pwa": "^1.3.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "test"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`** (PWA added in Task 15; minimal + test config now)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create `test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weather Archive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create minimal `src/App.tsx` and `src/main.tsx`**

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>Weather Archive</h1>
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Write smoke test `src/lib/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Install and run**

Run: `npm install && npm test`
Expected: 1 test file passes, `smoke.test.ts` green.

- [ ] **Step 9: Commit**

```bash
git init && git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest project"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/lib/types.ts`
- Test: `src/lib/types.test.ts`

**Interfaces:**
- Produces:
  - `interface Location { id?: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }`
  - `interface WeatherDay { date: string; tempMax: number | null; tempMin: number | null; tempMean: number | null; precipitation: number | null; windMax: number | null }`
  - `interface WeatherSeries { location: { latitude: number; longitude: number }; startDate: string; endDate: string; days: WeatherDay[] }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import type { Location, WeatherDay, WeatherSeries } from './types'
import { isWeatherSeries } from './types'

describe('types', () => {
  it('isWeatherSeries narrows a valid object', () => {
    const series: WeatherSeries = {
      location: { latitude: 45.75, longitude: 4.85 },
      startDate: '2020-01-01',
      endDate: '2020-01-02',
      days: [
        { date: '2020-01-01', tempMax: 5, tempMin: 1, tempMean: 3, precipitation: 0, windMax: 10 },
      ],
    }
    expect(isWeatherSeries(series)).toBe(true)
    expect(isWeatherSeries({})).toBe(false)
  })

  it('Location and WeatherDay shapes compile', () => {
    const loc: Location = { name: 'Lyon', latitude: 45.75, longitude: 4.85 }
    const day: WeatherDay = { date: '2020-01-01', tempMax: null, tempMin: null, tempMean: null, precipitation: null, windMax: null }
    expect(loc.name).toBe('Lyon')
    expect(day.date).toBe('2020-01-01')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/types.test.ts`
Expected: FAIL — cannot find module `./types` / `isWeatherSeries`.

- [ ] **Step 3: Write `src/lib/types.ts`**

```ts
export interface Location {
  id?: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export interface WeatherDay {
  date: string // YYYY-MM-DD
  tempMax: number | null
  tempMin: number | null
  tempMean: number | null
  precipitation: number | null
  windMax: number | null
}

export interface WeatherSeries {
  location: { latitude: number; longitude: number }
  startDate: string
  endDate: string
  days: WeatherDay[]
}

export function isWeatherSeries(value: unknown): value is WeatherSeries {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.startDate === 'string' &&
    typeof v.endDate === 'string' &&
    Array.isArray(v.days) &&
    typeof v.location === 'object' &&
    v.location !== null
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/types.test.ts
git commit -m "feat: add shared domain types"
```

---

## Task 3: Date bounds & validation

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `const MIN_DATE = '1940-01-01'`
  - `function maxDate(today?: Date): string` — returns yesterday as `YYYY-MM-DD`.
  - `function toISODate(d: Date): string`
  - `function validateRange(start: string, end: string, today?: Date): { ok: true } | { ok: false; error: string }`
  - `function validateSingleDate(date: string, today?: Date): { ok: true } | { ok: false; error: string }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { MIN_DATE, maxDate, toISODate, validateRange, validateSingleDate } from './dates'

const TODAY = new Date('2026-06-21T12:00:00Z')

describe('dates', () => {
  it('toISODate formats UTC date', () => {
    expect(toISODate(new Date('2020-03-05T23:00:00Z'))).toBe('2020-03-05')
  })

  it('maxDate is yesterday', () => {
    expect(maxDate(TODAY)).toBe('2026-06-20')
  })

  it('validateRange accepts a valid range', () => {
    expect(validateRange('2020-01-01', '2020-12-31', TODAY)).toEqual({ ok: true })
  })

  it('rejects start after end', () => {
    const r = validateRange('2020-12-31', '2020-01-01', TODAY)
    expect(r.ok).toBe(false)
  })

  it('rejects dates before 1940', () => {
    expect(validateRange('1939-12-31', '2020-01-01', TODAY).ok).toBe(false)
  })

  it('rejects future dates', () => {
    expect(validateSingleDate('2026-06-21', TODAY).ok).toBe(false)
    expect(validateSingleDate('2026-06-20', TODAY)).toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/dates.ts`**

```ts
export const MIN_DATE = '1940-01-01'

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function maxDate(today: Date = new Date()): string {
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return toISODate(yesterday)
}

type Result = { ok: true } | { ok: false; error: string }

function inBounds(date: string, max: string): Result {
  if (date < MIN_DATE) return { ok: false, error: `Date trop ancienne (min ${MIN_DATE}).` }
  if (date > max) return { ok: false, error: 'La date ne peut pas être dans le futur.' }
  return { ok: true }
}

export function validateSingleDate(date: string, today: Date = new Date()): Result {
  return inBounds(date, maxDate(today))
}

export function validateRange(start: string, end: string, today: Date = new Date()): Result {
  const max = maxDate(today)
  const s = inBounds(start, max)
  if (!s.ok) return s
  const e = inBounds(end, max)
  if (!e.ok) return e
  if (start > end) return { ok: false, error: 'La date de début doit précéder la date de fin.' }
  return { ok: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts
git commit -m "feat: add date bounds and validation helpers"
```

---

## Task 4: Weather API module + normalization

**Files:**
- Create: `src/api/weather.ts`
- Test: `src/api/weather.test.ts`

**Interfaces:**
- Consumes: `WeatherSeries`, `WeatherDay` from `src/lib/types.ts`.
- Produces:
  - `const WEATHER_DAILY_VARS = ['temperature_2m_max','temperature_2m_min','temperature_2m_mean','precipitation_sum','wind_speed_10m_max'] as const`
  - `function buildWeatherUrl(params: { latitude: number; longitude: number; startDate: string; endDate: string }): string`
  - `function normalizeArchiveResponse(raw: unknown, params): WeatherSeries`
  - `async function fetchWeather(params, fetchFn?): Promise<WeatherSeries>`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest'
import { buildWeatherUrl, normalizeArchiveResponse, fetchWeather } from './weather'

const PARAMS = { latitude: 45.75, longitude: 4.85, startDate: '2020-01-01', endDate: '2020-01-02' }

const RAW = {
  latitude: 45.75,
  longitude: 4.85,
  daily: {
    time: ['2020-01-01', '2020-01-02'],
    temperature_2m_max: [6.1, 7.2],
    temperature_2m_min: [1.0, 2.0],
    temperature_2m_mean: [3.5, 4.6],
    precipitation_sum: [0.0, 1.2],
    wind_speed_10m_max: [12.0, 18.5],
  },
}

describe('weather api', () => {
  it('builds an archive url with all daily vars', () => {
    const url = buildWeatherUrl(PARAMS)
    expect(url).toContain('archive-api.open-meteo.com/v1/archive')
    expect(url).toContain('latitude=45.75')
    expect(url).toContain('start_date=2020-01-01')
    expect(url).toContain('temperature_2m_mean')
    expect(url).toContain('precipitation_sum')
    expect(url).toContain('wind_speed_10m_max')
    expect(url).toContain('timezone=auto')
  })

  it('normalizes raw response into WeatherSeries', () => {
    const series = normalizeArchiveResponse(RAW, PARAMS)
    expect(series.days).toHaveLength(2)
    expect(series.days[0]).toEqual({
      date: '2020-01-01', tempMax: 6.1, tempMin: 1.0, tempMean: 3.5, precipitation: 0.0, windMax: 12.0,
    })
    expect(series.startDate).toBe('2020-01-01')
  })

  it('maps missing values to null', () => {
    const raw = { daily: { time: ['2020-01-01'], temperature_2m_max: [null], temperature_2m_min: [null], temperature_2m_mean: [null], precipitation_sum: [null], wind_speed_10m_max: [null] } }
    const series = normalizeArchiveResponse(raw, PARAMS)
    expect(series.days[0].tempMax).toBeNull()
  })

  it('fetchWeather calls fetch and returns normalized data', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => RAW })
    const series = await fetchWeather(PARAMS, fakeFetch as unknown as typeof fetch)
    expect(fakeFetch).toHaveBeenCalledOnce()
    expect(series.days).toHaveLength(2)
  })

  it('fetchWeather throws on non-ok response', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchWeather(PARAMS, fakeFetch as unknown as typeof fetch)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/weather.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/api/weather.ts`**

```ts
import type { WeatherDay, WeatherSeries } from '../lib/types'

export const WEATHER_DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'wind_speed_10m_max',
] as const

export interface WeatherParams {
  latitude: number
  longitude: number
  startDate: string
  endDate: string
}

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

export function buildWeatherUrl(p: WeatherParams): string {
  const q = new URLSearchParams({
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    start_date: p.startDate,
    end_date: p.endDate,
    daily: WEATHER_DAILY_VARS.join(','),
    timezone: 'auto',
  })
  return `${ARCHIVE_URL}?${q.toString()}`
}

function num(arr: unknown, i: number): number | null {
  if (!Array.isArray(arr)) return null
  const v = arr[i]
  return typeof v === 'number' ? v : null
}

export function normalizeArchiveResponse(raw: unknown, p: WeatherParams): WeatherSeries {
  const daily = (raw as { daily?: Record<string, unknown> })?.daily ?? {}
  const time = Array.isArray(daily.time) ? (daily.time as string[]) : []
  const days: WeatherDay[] = time.map((date, i) => ({
    date,
    tempMax: num(daily.temperature_2m_max, i),
    tempMin: num(daily.temperature_2m_min, i),
    tempMean: num(daily.temperature_2m_mean, i),
    precipitation: num(daily.precipitation_sum, i),
    windMax: num(daily.wind_speed_10m_max, i),
  }))
  return {
    location: { latitude: p.latitude, longitude: p.longitude },
    startDate: p.startDate,
    endDate: p.endDate,
    days,
  }
}

export async function fetchWeather(
  p: WeatherParams,
  fetchFn: typeof fetch = fetch,
): Promise<WeatherSeries> {
  const res = await fetchFn(buildWeatherUrl(p))
  if (!res.ok) throw new Error(`Erreur API météo (${res.status})`)
  const raw = await res.json()
  return normalizeArchiveResponse(raw, p)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/api/weather.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/weather.ts src/api/weather.test.ts
git commit -m "feat: add Open-Meteo archive weather fetch + normalization"
```

---

## Task 5: Geocoding API module

**Files:**
- Create: `src/api/geocoding.ts`
- Test: `src/api/geocoding.test.ts`

**Interfaces:**
- Consumes: `Location` from `src/lib/types.ts`.
- Produces:
  - `async function searchLocations(query: string, fetchFn?): Promise<Location[]>`
  - `async function reverseGeocode(lat: number, lon: number, fetchFn?): Promise<Location>`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest'
import { searchLocations, reverseGeocode } from './geocoding'

describe('geocoding', () => {
  it('returns empty array for short queries without calling fetch', async () => {
    const f = vi.fn()
    expect(await searchLocations('a', f as unknown as typeof fetch)).toEqual([])
    expect(f).not.toHaveBeenCalled()
  })

  it('maps search results to Location[]', async () => {
    const raw = { results: [
      { id: 1, name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France', admin1: 'Auvergne-Rhône-Alpes' },
    ] }
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => raw })
    const out = await searchLocations('Lyon', f as unknown as typeof fetch)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France' })
    expect((f.mock.calls[0][0] as string)).toContain('geocoding-api.open-meteo.com/v1/search')
    expect((f.mock.calls[0][0] as string)).toContain('language=fr')
  })

  it('returns empty array when results is missing', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    expect(await searchLocations('Zzz', f as unknown as typeof fetch)).toEqual([])
  })

  it('reverseGeocode builds a Location from bigdatacloud response', async () => {
    const raw = { city: 'Lyon', countryName: 'France', principalSubdivision: 'Auvergne-Rhône-Alpes' }
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => raw })
    const loc = await reverseGeocode(45.75, 4.85, f as unknown as typeof fetch)
    expect(loc).toMatchObject({ name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France' })
  })

  it('reverseGeocode falls back to coordinates as name on failure', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const loc = await reverseGeocode(45.75, 4.85, f as unknown as typeof fetch)
    expect(loc.latitude).toBe(45.75)
    expect(loc.name).toContain('45.75')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/geocoding.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/api/geocoding.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/api/geocoding.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/geocoding.ts src/api/geocoding.test.ts
git commit -m "feat: add geocoding search + reverse-geocode"
```

---

## Task 6: IndexedDB weather cache

**Files:**
- Create: `src/cache/weatherCache.ts`
- Test: `src/cache/weatherCache.test.ts`

**Interfaces:**
- Consumes: `WeatherSeries` from `src/lib/types.ts`; `WeatherParams` from `src/api/weather.ts`.
- Produces:
  - `function cacheKey(p: WeatherParams): string` — `"lat|lon|start|end"` rounded to 4 decimals.
  - `async function getCachedWeather(p: WeatherParams): Promise<WeatherSeries | undefined>`
  - `async function putCachedWeather(p: WeatherParams, series: WeatherSeries): Promise<void>`

- [ ] **Step 1: Write the failing test** (fake-indexeddb is loaded via `test/setup.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { cacheKey, getCachedWeather, putCachedWeather } from './weatherCache'
import type { WeatherSeries } from '../lib/types'

const PARAMS = { latitude: 45.7512, longitude: 4.8501, startDate: '2020-01-01', endDate: '2020-01-02' }

const SERIES: WeatherSeries = {
  location: { latitude: 45.7512, longitude: 4.8501 },
  startDate: '2020-01-01',
  endDate: '2020-01-02',
  days: [{ date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windMax: 12 }],
}

describe('weatherCache', () => {
  it('builds a stable rounded key', () => {
    expect(cacheKey(PARAMS)).toBe('45.7512|4.8501|2020-01-01|2020-01-02')
  })

  it('returns undefined when not cached', async () => {
    expect(await getCachedWeather({ ...PARAMS, startDate: '1999-01-01' })).toBeUndefined()
  })

  it('stores and retrieves a series', async () => {
    await putCachedWeather(PARAMS, SERIES)
    const got = await getCachedWeather(PARAMS)
    expect(got).toEqual(SERIES)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/cache/weatherCache.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/cache/weatherCache.ts`**

```ts
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
```

Note: `cacheKey` rounds to 4 decimals then strips trailing zeros, so `45.7512` stays `45.7512` and `45.7500` becomes `45.75`. The test values have no trailing zeros, matching `45.7512|4.8501|...`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/cache/weatherCache.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cache/weatherCache.ts src/cache/weatherCache.test.ts
git commit -m "feat: add IndexedDB weather cache layer"
```

---

## Task 7: Location context (shared state)

**Files:**
- Create: `src/state/LocationContext.tsx`
- Test: `src/state/LocationContext.test.tsx`

**Interfaces:**
- Consumes: `Location` from `src/lib/types.ts`.
- Produces:
  - `function LocationProvider({ children }): JSX.Element`
  - `function useLocation(): { location: Location | null; setLocation: (l: Location | null) => void }`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LocationProvider, useLocation } from './LocationContext'

function Probe() {
  const { location, setLocation } = useLocation()
  return (
    <div>
      <span data-testid="name">{location?.name ?? 'none'}</span>
      <button onClick={() => setLocation({ name: 'Lyon', latitude: 45.75, longitude: 4.85 })}>set</button>
    </div>
  )
}

describe('LocationContext', () => {
  it('shares and updates the selected location', () => {
    render(
      <LocationProvider>
        <Probe />
      </LocationProvider>,
    )
    expect(screen.getByTestId('name')).toHaveTextContent('none')
    act(() => { screen.getByText('set').click() })
    expect(screen.getByTestId('name')).toHaveTextContent('Lyon')
  })

  it('throws when used outside provider', () => {
    expect(() => render(<Probe />)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/LocationContext.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/state/LocationContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Location } from '../lib/types'

interface LocationContextValue {
  location: Location | null
  setLocation: (l: Location | null) => void
}

const Ctx = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const value = useMemo(() => ({ location, setLocation }), [location])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/LocationContext.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/LocationContext.tsx src/state/LocationContext.test.tsx
git commit -m "feat: add shared location context"
```

---

## Task 8: Data hooks (useGeocoding, useWeather)

**Files:**
- Create: `src/hooks/useGeocoding.ts`, `src/hooks/useWeather.ts`
- Test: `src/hooks/useWeather.test.tsx`

**Interfaces:**
- Consumes: `searchLocations` (geocoding), `fetchWeather`/`WeatherParams` (weather), `getCachedWeather`/`putCachedWeather` (cache), TanStack Query.
- Produces:
  - `function useGeocoding(query: string): UseQueryResult<Location[]>`
  - `function useWeather(params: WeatherParams | null): UseQueryResult<WeatherSeries>` — cache-first: checks IndexedDB, then API, then writes back. Disabled when `params` is null.

- [ ] **Step 1: Write the failing test** (cache-first behavior)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/weather', async (orig) => {
  const actual = await orig<typeof import('../api/weather')>()
  return { ...actual, fetchWeather: vi.fn() }
})
vi.mock('../cache/weatherCache', () => ({
  getCachedWeather: vi.fn(),
  putCachedWeather: vi.fn().mockResolvedValue(undefined),
  cacheKey: (p: { startDate: string }) => p.startDate,
}))

import { useWeather } from './useWeather'
import { fetchWeather } from '../api/weather'
import { getCachedWeather, putCachedWeather } from '../cache/weatherCache'

const PARAMS = { latitude: 45.75, longitude: 4.85, startDate: '2020-01-01', endDate: '2020-01-02' }
const SERIES = { location: { latitude: 45.75, longitude: 4.85 }, startDate: '2020-01-01', endDate: '2020-01-02', days: [] }

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => { vi.clearAllMocks() })

describe('useWeather', () => {
  it('returns cached data without hitting the API', async () => {
    vi.mocked(getCachedWeather).mockResolvedValue(SERIES)
    const { result } = renderHook(() => useWeather(PARAMS), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(SERIES)
    expect(fetchWeather).not.toHaveBeenCalled()
  })

  it('fetches from API and writes to cache on miss', async () => {
    vi.mocked(getCachedWeather).mockResolvedValue(undefined)
    vi.mocked(fetchWeather).mockResolvedValue(SERIES)
    const { result } = renderHook(() => useWeather(PARAMS), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchWeather).toHaveBeenCalledOnce()
    expect(putCachedWeather).toHaveBeenCalledWith(PARAMS, SERIES)
  })

  it('is disabled when params is null', () => {
    const { result } = renderHook(() => useWeather(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useWeather.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/hooks/useWeather.ts`**

```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchWeather, type WeatherParams } from '../api/weather'
import { getCachedWeather, putCachedWeather, cacheKey } from '../cache/weatherCache'
import type { WeatherSeries } from '../lib/types'

export function useWeather(params: WeatherParams | null): UseQueryResult<WeatherSeries> {
  return useQuery({
    queryKey: ['weather', params ? cacheKey(params) : 'none'],
    enabled: params !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const p = params as WeatherParams
      const cached = await getCachedWeather(p)
      if (cached) return cached
      const series = await fetchWeather(p)
      await putCachedWeather(p, series)
      return series
    },
  })
}
```

- [ ] **Step 4: Write `src/hooks/useGeocoding.ts`**

```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { searchLocations } from '../api/geocoding'
import type { Location } from '../lib/types'

export function useGeocoding(query: string): UseQueryResult<Location[]> {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['geocoding', trimmed],
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 60,
    queryFn: () => searchLocations(trimmed),
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/hooks/useWeather.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useWeather.ts src/hooks/useGeocoding.ts src/hooks/useWeather.test.tsx
git commit -m "feat: add cache-first useWeather and useGeocoding hooks"
```

---

## Task 9: LocationSearch component

**Files:**
- Create: `src/components/LocationSearch.tsx`
- Test: `src/components/LocationSearch.test.tsx`

**Interfaces:**
- Consumes: `useGeocoding`, `useLocation`, `reverseGeocode` from geocoding.
- Produces: `function LocationSearch(): JSX.Element` — text input with debounced autocomplete dropdown + "Ma position" button. Selecting a result calls `setLocation`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

vi.mock('../api/geocoding', () => ({
  searchLocations: vi.fn(),
  reverseGeocode: vi.fn(),
}))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider, useLocation } from '../state/LocationContext'
import { LocationSearch } from './LocationSearch'
import { searchLocations } from '../api/geocoding'

function Harness() {
  const { location } = useLocation()
  return (
    <>
      <LocationSearch />
      <span data-testid="selected">{location?.name ?? 'none'}</span>
    </>
  )
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <LocationProvider>{children}</LocationProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('LocationSearch', () => {
  it('shows suggestions and selects one', async () => {
    vi.mocked(searchLocations).mockResolvedValue([
      { id: 1, name: 'Lyon', latitude: 45.75, longitude: 4.85, country: 'France', admin1: 'ARA' },
    ])
    render(<Harness />, { wrapper })
    await userEvent.type(screen.getByRole('textbox'), 'Lyon')
    const option = await screen.findByText(/Lyon/)
    await userEvent.click(option)
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('Lyon'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/LocationSearch.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/components/LocationSearch.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'
import { useLocation } from '../state/LocationContext'
import { reverseGeocode } from '../api/geocoding'
import type { Location } from '../lib/types'

export function LocationSearch() {
  const { location, setLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const { data: results = [], isFetching } = useGeocoding(debounced)

  function choose(loc: Location) {
    setLocation(loc)
    setQuery(loc.name)
    setOpen(false)
  }

  function useMyPosition() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      choose(loc)
    })
  }

  return (
    <div className="location-search">
      <input
        type="text"
        role="textbox"
        placeholder="Rechercher un lieu…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        aria-label="Rechercher un lieu"
      />
      <button type="button" onClick={useMyPosition}>Ma position</button>
      {open && (isFetching || results.length > 0) && (
        <ul className="location-results">
          {results.map((r) => (
            <li key={r.id ?? `${r.latitude},${r.longitude}`}>
              <button type="button" onClick={() => choose(r)}>
                {r.name}{r.admin1 ? `, ${r.admin1}` : ''}{r.country ? ` (${r.country})` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      {location && <p className="location-current">Lieu : {location.name}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/LocationSearch.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/LocationSearch.tsx src/components/LocationSearch.test.tsx
git commit -m "feat: add LocationSearch with autocomplete + geolocation"
```

---

## Task 10: Date picker components

**Files:**
- Create: `src/components/DatePicker.tsx`, `src/components/DateRangePicker.tsx`
- Test: `src/components/DatePicker.test.tsx`

**Interfaces:**
- Consumes: `MIN_DATE`, `maxDate`, `validateSingleDate`, `validateRange` from `src/lib/dates.ts`.
- Produces:
  - `function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }): JSX.Element`
  - `function DateRangePicker({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }): JSX.Element`
  - Both render native `<input type="date">` with `min={MIN_DATE}` and `max={maxDate()}`, and show a validation error message when invalid.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('renders a date input with min/max bounds', () => {
    render(<DatePicker value="2020-01-01" onChange={() => {}} />)
    const input = screen.getByLabelText(/date/i) as HTMLInputElement
    expect(input.min).toBe('1940-01-01')
    expect(input.type).toBe('date')
  })

  it('calls onChange when a valid date is entered', async () => {
    const onChange = vi.fn()
    render(<DatePicker value="2020-01-01" onChange={onChange} />)
    const input = screen.getByLabelText(/date/i)
    await userEvent.clear(input)
    await userEvent.type(input, '2021-05-10')
    expect(onChange).toHaveBeenLastCalledWith('2021-05-10')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DatePicker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/components/DatePicker.tsx`**

```tsx
import { MIN_DATE, maxDate, validateSingleDate } from '../lib/dates'

export function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const result = value ? validateSingleDate(value) : { ok: true as const }
  return (
    <div className="date-picker">
      <label>
        Date
        <input
          type="date"
          min={MIN_DATE}
          max={maxDate()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {!result.ok && <p className="error">{result.error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/DateRangePicker.tsx`**

```tsx
import { MIN_DATE, maxDate, validateRange } from '../lib/dates'

export function DateRangePicker({
  start, end, onChange,
}: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const result = start && end ? validateRange(start, end) : { ok: true as const }
  return (
    <div className="date-range-picker">
      <label>
        Début
        <input type="date" min={MIN_DATE} max={maxDate()} value={start}
          onChange={(e) => onChange(e.target.value, end)} />
      </label>
      <label>
        Fin
        <input type="date" min={MIN_DATE} max={maxDate()} value={end}
          onChange={(e) => onChange(start, e.target.value)} />
      </label>
      {!result.ok && <p className="error">{result.error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/DatePicker.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/DatePicker.tsx src/components/DateRangePicker.tsx src/components/DatePicker.test.tsx
git commit -m "feat: add date and date-range pickers with bounds"
```

---

## Task 11: Chart components

**Files:**
- Create: `src/components/TemperatureChart.tsx`, `src/components/PrecipitationChart.tsx`, `src/components/WindChart.tsx`
- Test: `src/components/TemperatureChart.test.tsx`

**Interfaces:**
- Consumes: `WeatherDay` from `src/lib/types.ts`; Recharts.
- Produces (each takes `{ days: WeatherDay[] }`):
  - `function TemperatureChart({ days }): JSX.Element` — line chart of tempMin/tempMax/tempMean.
  - `function PrecipitationChart({ days }): JSX.Element` — bar chart of precipitation.
  - `function WindChart({ days }): JSX.Element` — line chart of windMax.

Note: Recharts' `ResponsiveContainer` renders nothing at zero size in jsdom. Each chart wraps its Recharts tree in `ResponsiveContainer` but also renders a `data-testid` wrapper with a text summary (point count) so behavior is testable without measuring layout.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TemperatureChart } from './TemperatureChart'
import type { WeatherDay } from '../lib/types'

const DAYS: WeatherDay[] = [
  { date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windMax: 12 },
  { date: '2020-01-02', tempMax: 7, tempMin: 2, tempMean: 4, precipitation: 1, windMax: 18 },
]

describe('TemperatureChart', () => {
  it('renders a chart wrapper reporting the number of points', () => {
    render(<TemperatureChart days={DAYS} />)
    expect(screen.getByTestId('temperature-chart')).toHaveAttribute('data-points', '2')
  })

  it('shows an empty message when there is no data', () => {
    render(<TemperatureChart days={[]} />)
    expect(screen.getByText(/aucune donnée/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TemperatureChart.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/components/TemperatureChart.tsx`**

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function TemperatureChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="temperature-chart" data-points={days.length} className="chart">
      <h3>Température (°C)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tempMax" name="Max" stroke="#e45756" dot={false} />
          <Line type="monotone" dataKey="tempMean" name="Moyenne" stroke="#4c78a8" dot={false} />
          <Line type="monotone" dataKey="tempMin" name="Min" stroke="#54a24b" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/PrecipitationChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function PrecipitationChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="precipitation-chart" data-points={days.length} className="chart">
      <h3>Précipitations (mm)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="precipitation" name="Précipitations" fill="#4c78a8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/WindChart.tsx`**

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function WindChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="wind-chart" data-points={days.length} className="chart">
      <h3>Vent max (km/h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="windMax" name="Vent max" stroke="#f58518" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/TemperatureChart.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/TemperatureChart.tsx src/components/PrecipitationChart.tsx src/components/WindChart.tsx src/components/TemperatureChart.test.tsx
git commit -m "feat: add temperature, precipitation, and wind charts"
```

---

## Task 12: ChartsView (Mode 1)

**Files:**
- Create: `src/views/ChartsView.tsx`
- Test: `src/views/ChartsView.test.tsx`

**Interfaces:**
- Consumes: `useLocation`, `useWeather`, `DateRangePicker`, the three chart components, `validateRange`.
- Produces: `function ChartsView(): JSX.Element` — prompts to pick a location if none; otherwise shows range picker + charts. Builds `WeatherParams` only when range is valid; passes `null` to `useWeather` otherwise.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../hooks/useWeather', () => ({ useWeather: vi.fn() }))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider, useLocation } from '../state/LocationContext'
import { ChartsView } from './ChartsView'
import { useWeather } from '../hooks/useWeather'
import type { Location } from '../lib/types'

function SetLocation({ loc }: { loc: Location }) {
  const { setLocation } = useLocation()
  return <button onClick={() => setLocation(loc)}>set-loc</button>
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <LocationProvider>{children}</LocationProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('ChartsView', () => {
  it('prompts for a location when none selected', () => {
    vi.mocked(useWeather).mockReturnValue({ data: undefined, isFetching: false, isError: false } as never)
    render(<ChartsView />, { wrapper })
    expect(screen.getByText(/choisissez un lieu/i)).toBeInTheDocument()
  })

  it('renders charts when data is available', async () => {
    vi.mocked(useWeather).mockReturnValue({
      data: { location: { latitude: 45.75, longitude: 4.85 }, startDate: '2020-01-01', endDate: '2020-01-02',
        days: [{ date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windMax: 12 }] },
      isFetching: false, isError: false,
    } as never)
    render(<><SetLocation loc={{ name: 'Lyon', latitude: 45.75, longitude: 4.85 }} /><ChartsView /></>, { wrapper })
    screen.getByText('set-loc').click()
    expect(await screen.findByTestId('temperature-chart')).toBeInTheDocument()
    expect(screen.getByTestId('precipitation-chart')).toBeInTheDocument()
    expect(screen.getByTestId('wind-chart')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/ChartsView.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/views/ChartsView.tsx`**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/ChartsView.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/views/ChartsView.tsx src/views/ChartsView.test.tsx
git commit -m "feat: add ChartsView mode"
```

---

## Task 13: DayView (Mode 2)

**Files:**
- Create: `src/views/DayView.tsx`
- Test: `src/views/DayView.test.tsx`

**Interfaces:**
- Consumes: `useLocation`, `useWeather`, `DatePicker`, `validateSingleDate`, `WeatherDay`.
- Produces: `function DayView(): JSX.Element` — single date → builds a 1-day range (`startDate === endDate`) → renders a detail card from `data.days[0]`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../hooks/useWeather', () => ({ useWeather: vi.fn() }))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider, useLocation } from '../state/LocationContext'
import { DayView } from './DayView'
import { useWeather } from '../hooks/useWeather'
import type { Location } from '../lib/types'

function SetLocation({ loc }: { loc: Location }) {
  const { setLocation } = useLocation()
  return <button onClick={() => setLocation(loc)}>set-loc</button>
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <LocationProvider>{children}</LocationProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('DayView', () => {
  it('renders a detail card with the day values', async () => {
    vi.mocked(useWeather).mockReturnValue({
      data: { location: { latitude: 45.75, longitude: 4.85 }, startDate: '2020-01-01', endDate: '2020-01-01',
        days: [{ date: '2020-01-01', tempMax: 6.1, tempMin: 1, tempMean: 3, precipitation: 0.5, windMax: 12 }] },
      isFetching: false, isError: false,
    } as never)
    render(<><SetLocation loc={{ name: 'Lyon', latitude: 45.75, longitude: 4.85 }} /><DayView /></>, { wrapper })
    screen.getByText('set-loc').click()
    expect(await screen.findByText(/6.1/)).toBeInTheDocument()
    expect(screen.getByText(/0.5/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/DayView.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/views/DayView.tsx`**

```tsx
import { useState } from 'react'
import { useLocation } from '../state/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { DatePicker } from '../components/DatePicker'
import { validateSingleDate } from '../lib/dates'
import type { WeatherParams } from '../api/weather'

function fmt(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`
}

export function DayView() {
  const { location } = useLocation()
  const [date, setDate] = useState('')

  const dateValid = Boolean(date) && validateSingleDate(date).ok
  const params: WeatherParams | null =
    location && dateValid
      ? { latitude: location.latitude, longitude: location.longitude, startDate: date, endDate: date }
      : null

  const { data, isFetching, isError } = useWeather(params)
  const day = data?.days[0]

  if (!location) return <p className="hint">Choisissez un lieu pour commencer.</p>

  return (
    <section className="day-view">
      <DatePicker value={date} onChange={setDate} />
      {isFetching && <p className="loading">Chargement…</p>}
      {isError && <p className="error">Impossible de récupérer les données. Réessayez.</p>}
      {day && (
        <dl className="day-card">
          <div><dt>Température max</dt><dd>{fmt(day.tempMax, '°C')}</dd></div>
          <div><dt>Température min</dt><dd>{fmt(day.tempMin, '°C')}</dd></div>
          <div><dt>Température moyenne</dt><dd>{fmt(day.tempMean, '°C')}</dd></div>
          <div><dt>Précipitations</dt><dd>{fmt(day.precipitation, 'mm')}</dd></div>
          <div><dt>Vent max</dt><dd>{fmt(day.windMax, 'km/h')}</dd></div>
        </dl>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/DayView.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/views/DayView.tsx src/views/DayView.test.tsx
git commit -m "feat: add DayView mode"
```

---

## Task 14: App shell + navigation + providers

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/App.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `LocationSearch`, `ChartsView`, `DayView`, `LocationProvider`, TanStack Query.
- Produces: `function App(): JSX.Element` — header with `LocationSearch`, two mode tabs ("Graphiques" / "Un jour donné"), renders the active view. `main.tsx` wires `QueryClientProvider` + `LocationProvider`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider } from './state/LocationContext'
import App from './App'

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LocationProvider><App /></LocationProvider>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('defaults to the charts mode and can switch to day mode', async () => {
    renderApp()
    expect(screen.getByRole('tab', { name: /graphiques/i })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: /un jour donné/i }))
    expect(screen.getByRole('tab', { name: /un jour donné/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders the location search', () => {
    renderApp()
    expect(screen.getByLabelText(/rechercher un lieu/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — current App has no tabs.

- [ ] **Step 3: Write `src/App.tsx`**

```tsx
import { useState } from 'react'
import { LocationSearch } from './components/LocationSearch'
import { ChartsView } from './views/ChartsView'
import { DayView } from './views/DayView'
import './App.css'

type Mode = 'charts' | 'day'

export default function App() {
  const [mode, setMode] = useState<Mode>('charts')
  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather Archive</h1>
        <LocationSearch />
      </header>
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'charts'} onClick={() => setMode('charts')}>
          Graphiques
        </button>
        <button role="tab" aria-selected={mode === 'day'} onClick={() => setMode('day')}>
          Un jour donné
        </button>
      </nav>
      <main>{mode === 'charts' ? <ChartsView /> : <DayView />}</main>
    </div>
  )
}
```

- [ ] **Step 4: Update `src/main.tsx` to wire providers**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider } from './state/LocationContext'
import App from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <App />
      </LocationProvider>
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 5: Create `src/App.css`** (minimal, functional styling)

```css
:root { font-family: system-ui, sans-serif; color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; }
.app { max-width: 960px; margin: 0 auto; padding: 1rem; }
.app-header h1 { margin: 0 0 0.5rem; font-size: 1.4rem; }
.location-search { position: relative; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.location-search input { flex: 1; min-width: 12rem; padding: 0.5rem; }
.location-results { list-style: none; margin: 0.25rem 0; padding: 0; border: 1px solid #ccc; position: absolute; top: 2.5rem; background: Canvas; z-index: 10; width: 100%; }
.location-results button { display: block; width: 100%; text-align: left; padding: 0.5rem; border: 0; background: none; cursor: pointer; }
.location-results button:hover { background: rgba(127,127,127,0.2); }
.tabs { display: flex; gap: 0.5rem; margin: 1rem 0; }
.tabs button { padding: 0.5rem 1rem; cursor: pointer; }
.tabs button[aria-selected='true'] { font-weight: 700; border-bottom: 2px solid currentColor; }
.date-range-picker, .date-picker { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.date-range-picker label, .date-picker label { display: flex; flex-direction: column; }
.chart { margin-bottom: 2rem; }
.day-card { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; }
.day-card div { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(127,127,127,0.3); padding: 0.25rem 0; }
.day-card dt { font-weight: 600; }
.day-card dd { margin: 0; }
.error { color: #c0392b; }
.hint, .loading { opacity: 0.8; }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full suite + dev sanity check**

Run: `npm test`
Expected: all test files pass.
Run: `npm run build`
Expected: TypeScript compiles, Vite build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/main.tsx src/App.css src/App.test.tsx
git commit -m "feat: add app shell with mode tabs and providers"
```

---

## Task 15: PWA configuration (manifest, service worker, offline)

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder PNGs), `public/apple-touch-icon.png`
- Test: `src/pwa.config.test.ts`

**Interfaces:**
- Consumes: `vite-plugin-pwa`.
- Produces: a buildable PWA — `manifest.webmanifest` + Workbox service worker precaching app assets and runtime-caching the Geocoding API (`NetworkFirst`).

- [ ] **Step 1: Create placeholder icons**

Run (generates simple solid-color PNGs without extra deps, using Node):
```bash
mkdir -p public
node -e "const z=require('zlib');function png(s){const sig=Buffer.from([137,80,78,71,13,10,26,10]);function chunk(t,d){const len=Buffer.alloc(4);len.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const crc=Buffer.alloc(4);crc.writeUInt32BE(require('zlib').crc32?require('zlib').crc32(td)>>>0:0);return Buffer.concat([len,td,crc])}const w=s,h=s;const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;const row=Buffer.concat([Buffer.from([0]),Buffer.concat(Array.from({length:w},()=>Buffer.from([30,80,160])))]);const raw=Buffer.concat(Array.from({length:h},()=>row));const idat=z.deflateSync(raw);return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))])}require('fs').writeFileSync('public/icon-192.png',png(192));require('fs').writeFileSync('public/icon-512.png',png(512));require('fs').writeFileSync('public/apple-touch-icon.png',png(180));console.log('icons written')"
```
Note: if `zlib.crc32` is unavailable on Node 20 (it is experimental), replace the icons with any real 192/512 PNGs later; the build does not require valid CRC for dev, but for a clean asset prefer adding `pwa-assets` or real icons. This step's goal is to have files at the referenced paths.

Expected: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` exist.

- [ ] **Step 2: Write the failing test `src/pwa.config.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import config from '../vite.config'

describe('vite config', () => {
  it('registers the PWA plugin with a manifest', () => {
    const plugins = (config as { plugins?: unknown[] }).plugins ?? []
    const flat = plugins.flat(Infinity) as Array<{ name?: string }>
    const names = flat.map((p) => p?.name).filter(Boolean)
    expect(names.some((n) => String(n).includes('pwa'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/pwa.config.test.ts`
Expected: FAIL — no PWA plugin registered.

- [ ] **Step 4: Update `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Weather Archive',
        short_name: 'WeatherArchive',
        description: 'Consultez les archives météo officielles',
        theme_color: '#1e50a0',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'fr',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'geocoding-api.open-meteo.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/pwa.config.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Build to confirm the service worker + manifest are generated**

Run: `npm run build`
Expected: build succeeds; `dist/manifest.webmanifest` and a generated service worker (`dist/sw.js`) exist.

Run: `ls dist/sw.js dist/manifest.webmanifest`
Expected: both files listed.

- [ ] **Step 7: Add `<link>`/meta to `index.html`** for the apple touch icon and theme color

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1e50a0" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>Weather Archive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Final full verification**

Run: `npm test`
Expected: all test files pass.
Run: `npm run build && npm run preview`
Expected: app serves; in the browser it is installable (manifest detected) and reloads offline after first visit.

- [ ] **Step 9: Commit**

```bash
git add vite.config.ts index.html public/ src/pwa.config.test.ts
git commit -m "feat: configure PWA manifest, service worker, and offline caching"
```

---

## Self-Review Notes

**Spec coverage:**
- Open-Meteo Archive + Geocoding → Tasks 4, 5. ✅
- Location search by name + geolocation → Tasks 5, 9. ✅ (reverse-geocode via BigDataCloud; documented deviation since Open-Meteo has no reverse endpoint).
- Temperature/precipitation/wind → Tasks 4, 11. ✅
- Two modes (charts + day) with shared location → Tasks 7, 12, 13, 14. ✅
- Cache-first IndexedDB, immutable → Tasks 6, 8. ✅
- Offline PWA (precache + NetworkFirst geocoding) → Task 15. ✅
- Error handling (invalid range, API error, geo refused, location not found) → Tasks 3, 5, 9, 12, 13. ✅
- Date bounds 1940 → yesterday → Task 3. ✅
- Tests: Vitest unit + RTL components + fake-indexeddb → all tasks. ✅

**Type consistency:** `WeatherParams` (Task 4) reused verbatim in Tasks 6, 8, 12, 13. `WeatherDay`/`WeatherSeries` (Task 2) consumed unchanged downstream. `cacheKey`/`getCachedWeather`/`putCachedWeather` names consistent across Tasks 6 and 8. `useWeather(params | null)` contract matches its consumers in Tasks 12, 13.

**Known caveat (Task 15 icons):** the inline PNG generator is a best-effort placeholder; if it produces invalid files, substitute real 192/512 PNG icons. Does not affect the test suite, only icon visual quality.
