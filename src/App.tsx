import { useState } from 'react'
import { LocationSearch } from './components/LocationSearch'
import { ChartsView } from './views/ChartsView'
import { DayView } from './views/DayView'
import './App.css'

type Mode = 'charts' | 'day'

export default function App() {
  const [mode, setMode] = useState<Mode>('charts')
  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather Archive</h1>
        <LocationSearch />
      </header>
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'charts'} onClick={() => setMode('charts')}>
          Graphiques
        </button>
        <button role="tab" aria-selected={mode === 'day'} onClick={() => setMode('day')}>
          Un jour donné
        </button>
      </nav>
      <main>{mode === 'charts' ? <ChartsView /> : <DayView />}</main>
    </div>
  )
}
