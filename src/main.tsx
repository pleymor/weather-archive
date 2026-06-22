import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppStateProvider } from './state/AppStateContext'
import { SettingsProvider } from './state/SettingsContext'
import App from './App'

const queryClient = new QueryClient()

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
