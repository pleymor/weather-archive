import { useState } from 'react'
import { LocationSearch } from './components/LocationSearch'
import { ChartsView } from './views/ChartsView'
import { DayView } from './views/DayView'
import { useLocation } from './state/LocationContext'
import './App.css'

type Mode = 'charts' | 'day'

function CurrentLocation() {
  const { location } = useLocation()
  if (!location) return null
  return (
    <p className="current-location">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
      </svg>
      {location.name}
    </p>
  )
}

export default function App() {
  const [mode, setMode] = useState<Mode>('charts')
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
        <LocationSearch />
        <CurrentLocation />
      </header>

      <nav className="tabs" role="tablist" aria-label="Mode d'affichage">
        <span className={`tabs__thumb tabs__thumb--${mode}`} aria-hidden="true" />
        <button role="tab" aria-selected={mode === 'charts'} onClick={() => setMode('charts')}>
          📈 Graphiques
        </button>
        <button role="tab" aria-selected={mode === 'day'} onClick={() => setMode('day')}>
          📅 Un jour donné
        </button>
      </nav>

      <main className="app-main">{mode === 'charts' ? <ChartsView /> : <DayView />}</main>

      <footer className="app-footer">
        Données <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · archives depuis 1940
      </footer>
    </div>
  )
}
