import { MIN_DATE, maxDate, validateSingleDate } from '../lib/dates'

export function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const result = value ? validateSingleDate(value) : { ok: true as const }
  return (
    <div className="date-picker">
      <label>
        Date
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
