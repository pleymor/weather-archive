import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../hooks/useWeather', () => ({ useWeather: vi.fn() }))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider, useLocation } from '../state/LocationContext'
import { SettingsProvider } from '../state/SettingsContext'
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
      <SettingsProvider>
        <LocationProvider>{children}</LocationProvider>
      </SettingsProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('DayView', () => {
  it('renders a detail card with the day values', async () => {
    vi.mocked(useWeather).mockReturnValue({
      data: { location: { latitude: 45.75, longitude: 4.85 }, startDate: '2020-01-01', endDate: '2020-01-01',
        days: [{ date: '2020-01-01', tempMax: 6.1, tempMin: 1, tempMean: 3, precipitation: 0.5, windGust: 12 }] },
      isFetching: false, isError: false,
    } as never)
    render(<><SetLocation loc={{ name: 'Lyon', latitude: 45.75, longitude: 4.85 }} /><DayView /></>, { wrapper })
    screen.getByText('set-loc').click()
    expect(await screen.findByText(/6.1/)).toBeInTheDocument()
    expect(screen.getByText(/0.5/)).toBeInTheDocument()
  })
})
