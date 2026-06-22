import { useState } from 'react'
import { useSettings } from '../state/SettingsContext'
import type { TempUnit, WindUnit } from '../lib/units'

export function HeaderControls() {
  const { units, setUnits } = useSettings()
  const [copied, setCopied] = useState(false)

  function share() {
    const url = window.location.href
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1800) },
      () => {},
    )
  }

  return (
    <div className="header-controls">
      <div className="seg" role="group" aria-label="Unité de température">
        {(['C', 'F'] as TempUnit[]).map((u) => (
          <button key={u} type="button" aria-pressed={units.temp === u}
            className={units.temp === u ? 'is-active' : ''} onClick={() => setUnits({ ...units, temp: u })}>
            °{u}
          </button>
        ))}
      </div>
      <select className="seg-select" aria-label="Unité de vent" value={units.wind}
        onChange={(e) => setUnits({ ...units, wind: e.target.value as WindUnit })}>
        <option value="kmh">km/h</option>
        <option value="ms">m/s</option>
        <option value="mph">mph</option>
      </select>
      <button type="button" className="share-btn" onClick={share}>
        {copied ? '✓ Copié' : '🔗 Partager'}
      </button>
    </div>
  )
}
