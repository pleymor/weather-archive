import { LocationSearch } from './components/LocationSearch'
import { HeaderControls } from './components/HeaderControls'
import { ChartsView } from './views/ChartsView'
import { DayView } from './views/DayView'
import { YearsView } from './views/YearsView'
import { useAppState } from './state/AppStateContext'
import type { AppMode } from './lib/urlState'
import './App.css'

const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'charts', label: '📈 Graphiques' },
  { mode: 'day', label: '📅 Un jour donné' },
  { mode: 'years', label: '📜 Records & histoire' },
]

function renderView(mode: AppMode) {
  if (mode === 'day') return <DayView />
  if (mode === 'years') return <YearsView />
  return <ChartsView />
}

function CurrentLocation() {
  const { state } = useAppState()
  if (!state.location) return null
  return (
    <p className="current-location">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
      </svg>
      {state.location.name}
    </p>
  )
}

export default function App() {
  const { state, setMode } = useAppState()
  return (
    <div className="app">
      <div className="aurora" aria-hidden="true" />
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <span className="brand__logo" aria-hidden="true">⛅</span>
            <div>
              <h1>Archives Météo</h1>
              <p className="brand__tag">Le climat passé, partout en France</p>
            </div>
          </div>
          <HeaderControls />
        </div>
        <LocationSearch />
        <CurrentLocation />
      </header>

      <nav className="tabs" role="tablist" aria-label="Mode d'affichage">
        {TABS.map((t) => (
          <button key={t.mode} role="tab" aria-selected={state.mode === t.mode} onClick={() => setMode(t.mode)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">{renderView(state.mode)}</main>

      <footer className="app-footer">
        Données <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · archives depuis 1940
      </footer>
    </div>
  )
}
