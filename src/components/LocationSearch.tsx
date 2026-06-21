import { useEffect, useRef, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'
import { useLocation } from '../state/LocationContext'
import { reverseGeocode } from '../api/geocoding'
import type { Location } from '../lib/types'

export function LocationSearch() {
  const { setLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data: results = [], isFetching } = useGeocoding(debounced)

  function choose(loc: Location) {
    setLocation(loc)
    setQuery(loc.name)
    setOpen(false)
  }

  function useMyPosition() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        choose(loc)
        setLocating(false)
      },
      () => setLocating(false),
    )
  }

  const showDropdown = open && (isFetching || results.length > 0 || debounced.trim().length >= 2)

  return (
    <div className="location-search" ref={rootRef}>
      <div className="location-search__field">
        <svg className="location-search__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          role="textbox"
          placeholder="Rechercher une ville…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          aria-label="Rechercher un lieu"
        />
        {query && (
          <button type="button" className="location-search__clear" aria-label="Effacer" onClick={() => { setQuery(''); setDebounced(''); setOpen(false) }}>
            ×
          </button>
        )}
        <button type="button" className="location-search__geo" onClick={useMyPosition} aria-label="Ma position" title="Ma position">
          {locating ? (
            <span className="spinner" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </button>
      </div>

      {showDropdown && (
        <ul className="location-results">
          {isFetching && results.length === 0 && <li className="location-results__status">Recherche…</li>}
          {!isFetching && results.length === 0 && debounced.trim().length >= 2 && (
            <li className="location-results__status">Aucun lieu trouvé.</li>
          )}
          {results.map((r) => (
            <li key={r.id ?? `${r.latitude},${r.longitude}`}>
              <button type="button" onClick={() => choose(r)}>
                <svg className="location-results__pin" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="location-results__text">
                  <strong>{r.name}</strong>
                  <small>{[r.admin1, r.country].filter(Boolean).join(', ')}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
