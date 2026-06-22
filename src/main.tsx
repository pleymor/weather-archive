import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppStateProvider } from './state/AppStateContext'
import { SettingsProvider } from './state/SettingsContext'
import App from './App'
import { WeatherApiError } from './api/weather'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry rate limits (429) with backoff; give up on other 4xx (won't recover).
      retry: (failureCount, error) => {
        if (error instanceof WeatherApiError) {
          if (error.status === 429) return failureCount < 3
          if (error.status >= 400 && error.status < 500) return false
        }
        return failureCount < 2
      },
      // Exponential backoff, 2s → 4s → 8s, capped at 30s, to let the limit reset.
      retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 30_000),
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppStateProvider syncUrl>
          <App />
        </AppStateProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
