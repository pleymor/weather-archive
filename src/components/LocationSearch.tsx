import { useEffect, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'
import { useLocation } from '../state/LocationContext'
import { reverseGeocode } from '../api/geocoding'
import type { Location } from '../lib/types'

export function LocationSearch() {
  const { location, setLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const { data: results = [], isFetching } = useGeocoding(debounced)

  function choose(loc: Location) {
    setLocation(loc)
    setQuery(loc.name)
    setOpen(false)
  }

  function useMyPosition() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      choose(loc)
    })
  }

  return (
    <div className="location-search">
      <input
        type="text"
        role="textbox"
        placeholder="Rechercher un lieu…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        aria-label="Rechercher un lieu"
      />
      <button type="button" onClick={useMyPosition}>Ma position</button>
      {open && (isFetching || results.length > 0) && (
        <ul className="location-results">
          {results.map((r) => (
            <li key={r.id ?? `${r.latitude},${r.longitude}`}>
              <button type="button" onClick={() => choose(r)}>
                {r.name}{r.admin1 ? `, ${r.admin1}` : ''}{r.country ? ` (${r.country})` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      {location && <p className="location-current">Lieu : {location.name}</p>}
    </div>
  )
}
