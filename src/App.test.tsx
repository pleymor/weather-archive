import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationProvider } from './state/LocationContext'
import { SettingsProvider } from './state/SettingsContext'
import App from './App'

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <LocationProvider><App /></LocationProvider>
      </SettingsProvider>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('defaults to the charts mode and can switch to day mode', async () => {
    renderApp()
    expect(screen.getByRole('tab', { name: /graphiques/i })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: /jour/i }))
    expect(screen.getByRole('tab', { name: /jour/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the location search from the context bar', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('button', { name: /choisir un lieu/i }))
    expect(screen.getByLabelText(/rechercher un lieu/i)).toBeInTheDocument()
  })
})
