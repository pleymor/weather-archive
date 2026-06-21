import { MIN_DATE, maxDate, validateRange } from '../lib/dates'

export function DateRangePicker({
  start, end, onChange,
}: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const result = start && end ? validateRange(start, end) : { ok: true as const }
  return (
    <div className="field-group">
      <div className="field-row">
        <label className="field">
          <span className="field__label">Début</span>
          <input type="date" min={MIN_DATE} max={maxDate()} value={start}
            onChange={(e) => onChange(e.target.value, end)} />
        </label>
        <span className="field-row__arrow" aria-hidden="true">→</span>
        <label className="field">
          <span className="field__label">Fin</span>
          <input type="date" min={MIN_DATE} max={maxDate()} value={end}
            onChange={(e) => onChange(start, e.target.value)} />
        </label>
      </div>
      {!result.ok && <p className="error">{result.error}</p>}
    </div>
  )
}
