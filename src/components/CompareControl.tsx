import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { useGeocoding } from '../hooks/useGeocoding'
import type { Location } from '../lib/types'

export function CompareControl() {
  const { state, setCompare } = useAppState()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
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

  const { data: results = [] } = useGeocoding(debounced)

  function choose(loc: Location) {
    setCompare(loc)
    setQuery('')
    setDebounced('')
    setOpen(false)
  }

  if (state.compare) {
    return (
      <div className="compare-control">
        <span className="compare-chip">
          ⚖️ Comparé à <strong>{state.compare.name}</strong>
          <button type="button" aria-label="Retirer la comparaison" onClick={() => setCompare(null)}>×</button>
        </span>
      </div>
    )
  }

  return (
    <div className="compare-control" ref={rootRef}>
      <input type="text" className="compare-input" placeholder="⚖️ Comparer à une autre ville…" value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
        aria-label="Comparer à un autre lieu" />
      {open && results.length > 0 && (
        <div className="location-results">
          <ul>
            {results.map((r) => (
              <li key={r.id ?? `${r.latitude},${r.longitude}`}>
                <button type="button" className="location-results__item" onClick={() => choose(r)}>
                  <svg className="location-results__pin" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span className="location-results__text"><strong>{r.name}</strong><small>{[r.admin1, r.country].filter(Boolean).join(', ')}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
