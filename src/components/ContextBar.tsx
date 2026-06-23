import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import {
  formatShortDate, validateRange, validateSingleDate, maxDate, rangeForDays,
} from '../lib/dates'
import type { AppState } from '../lib/urlState'
import { LocationSearch } from './LocationSearch'
import { DatePicker } from './DatePicker'
import { DateRangePicker } from './DateRangePicker'

const PRESETS = [
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
]

function singleLabel(d: string): string {
  return `${formatShortDate(d)} ${d.slice(0, 4)}`
}

function dateSummary(state: AppState): string | null {
  if (state.mode === 'charts') {
    return state.start && state.end && validateRange(state.start, state.end).ok
      ? `${formatShortDate(state.start)} → ${singleLabel(state.end)}`
      : null
  }
  const d = state.date && validateSingleDate(state.date).ok ? state.date : maxDate()
  return singleLabel(d)
}

function DateEditor({ onDone }: { onDone: () => void }) {
  const { state, setDate, setRange } = useAppState()
  if (state.mode === 'charts') {
    return (
      <div className="date-editor">
        <DateRangePicker start={state.start} end={state.end} onChange={setRange} />
        <div className="presets">
          {PRESETS.map((p) => {
            const r = rangeForDays(p.days)
            const active = state.start === r.start && state.end === r.end
            return (
              <button key={p.days} type="button" className={`chip${active ? ' is-active' : ''}`}
                onClick={() => { setRange(r.start, r.end); onDone() }}>
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  const d = state.date && validateSingleDate(state.date).ok ? state.date : maxDate()
  return <DatePicker value={d} onChange={(v) => { setDate(v); onDone() }} />
}

/** Sticky bar showing — and editing — the current location and date/period. */
export function ContextBar() {
  const { state } = useAppState()
  const [open, setOpen] = useState<'loc' | 'date' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const date = dateSummary(state)
  return (
    <div className="context-bar" ref={ref}>
      <div className="context-bar__row">
        <button type="button" className="context-bar__chip" aria-expanded={open === 'loc'}
          onClick={() => setOpen((o) => (o === 'loc' ? null : 'loc'))}>
          📍 {state.location ? state.location.name : 'Choisir un lieu'}
        </button>
        {state.location && (
          <>
            <span className="context-bar__sep" aria-hidden="true">·</span>
            <button type="button" className="context-bar__chip context-bar__chip--date" aria-expanded={open === 'date'}
              onClick={() => setOpen((o) => (o === 'date' ? null : 'date'))}>
              📅 {date ?? 'Choisir une période'}
            </button>
          </>
        )}
      </div>

      {open === 'loc' && (
        <div className="context-bar__pop">
          <LocationSearch onSelect={() => setOpen(null)} />
        </div>
      )}
      {open === 'date' && (
        <div className="context-bar__pop">
          <DateEditor onDone={() => setOpen(null)} />
        </div>
      )}
    </div>
  )
}
