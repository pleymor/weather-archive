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
