import { useEffect, useRef, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'
import { useLocation } from '../state/LocationContext'
import { reverseGeocode } from '../api/geocoding'
import { getFavorites, getRecents, toggleFavorite, addRecent, locationKey } from '../lib/storage'
import type { Location } from '../lib/types'

function subtitle(loc: Location): string {
  return [loc.admin1, loc.country].filter(Boolean).join(', ')
}

export function LocationSearch() {
  const { setLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [favorites, setFavorites] = useState<Location[]>(() => getFavorites())
  const [recents, setRecents] = useState<Location[]>(() => getRecents())
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
  const searching = debounced.trim().length >= 2
  const favKeys = new Set(favorites.map(locationKey))

  function choose(loc: Location) {
    setLocation(loc)
    setRecents(addRecent(loc))
    setQuery(loc.name)
    setOpen(false)
  }

  function star(loc: Location, e: React.MouseEvent) {
    e.stopPropagation()
    setFavorites(toggleFavorite(loc))
  }

  function useMyPosition() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => { choose(await reverseGeocode(pos.coords.latitude, pos.coords.longitude)); setLocating(false) },
      () => setLocating(false),
    )
  }

  function renderItem(loc: Location) {
    const fav = favKeys.has(locationKey(loc))
    return (
      <li key={locationKey(loc)}>
        <button type="button" className="location-results__item" onClick={() => choose(loc)}>
          <svg className="location-results__pin" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="location-results__text"><strong>{loc.name}</strong><small>{subtitle(loc)}</small></span>
        </button>
        <button type="button" className={`location-results__star${fav ? ' is-fav' : ''}`} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={fav} onClick={(e) => star(loc, e)}>
          {fav ? '★' : '☆'}
        </button>
      </li>
    )
  }

  const showDropdown = open && (searching || favorites.length > 0 || recents.length > 0)

  return (
    <div className="location-search" ref={rootRef}>
      <div className="location-search__field">
        <svg className="location-search__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" role="textbox" placeholder="Rechercher une ville…" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          aria-label="Rechercher un lieu" />
        {query && (
          <button type="button" className="location-search__clear" aria-label="Effacer" onClick={() => { setQuery(''); setDebounced(''); }}>×</button>
        )}
        <button type="button" className="location-search__geo" onClick={useMyPosition} aria-label="Ma position" title="Ma position">
          {locating ? <span className="spinner" /> : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>
          )}
        </button>
      </div>

      {showDropdown && (
        <div className="location-results">
          {searching ? (
            <ul>
              {isFetching && results.length === 0 && <li className="location-results__status">Recherche…</li>}
              {!isFetching && results.length === 0 && <li className="location-results__status">Aucun lieu trouvé.</li>}
              {results.map(renderItem)}
            </ul>
          ) : (
            <>
              {favorites.length > 0 && (
                <><p className="location-results__head">★ Favoris</p><ul>{favorites.map(renderItem)}</ul></>
              )}
              {recents.length > 0 && (
                <><p className="location-results__head">Récents</p><ul>{recents.map(renderItem)}</ul></>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
