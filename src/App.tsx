import { ContextBar } from './components/ContextBar'
import { ChartsView } from './views/ChartsView'
import { DayView } from './views/DayView'
import { YearsView } from './views/YearsView'
import { MapView } from './views/MapView'
import { useAppState } from './state/AppStateContext'
import type { AppMode } from './lib/urlState'
import './App.css'

const TABS: { mode: AppMode; icon: string; label: string }[] = [
  { mode: 'charts', icon: '📈', label: 'Graphiques' },
  { mode: 'day', icon: '📅', label: 'Jour' },
  { mode: 'years', icon: '📜', label: 'Records' },
  { mode: 'map', icon: '🗺️', label: 'Carte' },
]

function renderView(mode: AppMode) {
  if (mode === 'day') return <DayView />
  if (mode === 'years') return <YearsView />
  if (mode === 'map') return <MapView />
  return <ChartsView />
}

export default function App() {
  const { state, setMode } = useAppState()
  return (
    <div className="app">
      <div className="aurora" aria-hidden="true" />
      <header className="app-header">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">⛅</span>
          <div>
            <h1>Archives Météo</h1>
            <p className="brand__tag">Le climat passé, partout en France</p>
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Mode d'affichage">
        {TABS.map((t) => (
          <button key={t.mode} role="tab" aria-selected={state.mode === t.mode} onClick={() => setMode(t.mode)}>
            <span className="tab__icon" aria-hidden="true">{t.icon}</span>
            <span className="tab__label">{t.label}</span>
          </button>
        ))}
      </nav>

      <ContextBar />

      <main className="app-main">{renderView(state.mode)}</main>

      <footer className="app-footer">
        Données <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · archives depuis 1940
      </footer>
    </div>
  )
}
