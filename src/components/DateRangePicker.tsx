import { MIN_DATE, maxDate, validateRange } from '../lib/dates'

export function DateRangePicker({
  start, end, onChange,
}: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const result = start && end ? validateRange(start, end) : { ok: true as const }
  return (
    <div className="date-range-picker">
      <label>
        Début
        <input type="date" min={MIN_DATE} max={maxDate()} value={start}
          onChange={(e) => onChange(e.target.value, end)} />
      </label>
      <label>
        Fin
        <input type="date" min={MIN_DATE} max={maxDate()} value={end}
          onChange={(e) => onChange(start, e.target.value)} />
      </label>
      {!result.ok && <p className="error">{result.error}</p>}
    </div>
  )
}
