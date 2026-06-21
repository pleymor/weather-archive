import { MIN_DATE, maxDate, validateSingleDate } from '../lib/dates'

export function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const result = value ? validateSingleDate(value) : { ok: true as const }
  return (
    <div className="field-group">
      <label className="field">
        <span className="field__label">Date</span>
        <input
          type="date"
          min={MIN_DATE}
          max={maxDate()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {!result.ok && <p className="error">{result.error}</p>}
    </div>
  )
}
