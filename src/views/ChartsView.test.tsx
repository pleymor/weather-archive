import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../hooks/useWeather', () => ({ useWeather: vi.fn() }))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider, useLocation } from '../state/LocationContext'
import { SettingsProvider } from '../state/SettingsContext'
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
      <SettingsProvider>
        <LocationProvider>{children}</LocationProvider>
      </SettingsProvider>
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
        days: [{ date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windGust: 12 }] },
      isFetching: false, isError: false,
    } as never)
    render(<><SetLocation loc={{ name: 'Lyon', latitude: 45.75, longitude: 4.85 }} /><ChartsView /></>, { wrapper })
    screen.getByText('set-loc').click()
    expect(await screen.findByTestId('temperature-chart')).toBeInTheDocument()
    expect(screen.getByTestId('precipitation-chart')).toBeInTheDocument()
    expect(screen.getByTestId('wind-chart')).toBeInTheDocument()
  })
})
