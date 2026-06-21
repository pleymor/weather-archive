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
