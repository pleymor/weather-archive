import { MONTH_NAMES_FR, daysInMonth, toISODate } from '../lib/dates'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Picks a day of the year (month + day) for the "this day across years" view.
 * The year is irrelevant here, so it's hidden: we keep whatever year `value`
 * already carries (or the current year) and only edit month and day.
 */
export function MonthDayPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const effective = value || toISODate(new Date())
  const year = effective.slice(0, 4)
  const month = Number(effective.slice(5, 7))
  const day = Number(effective.slice(8, 10))

  const emit = (m: number, d: number) => {
    const clamped = Math.min(d, daysInMonth(m))
    onChange(`${year}-${pad(m)}-${pad(clamped)}`)
  }

  return (
    <div className="field-group">
      <div className="field-row">
        <label className="field">
          <span className="field__label">Mois</span>
          <select value={month} onChange={(e) => emit(Number(e.target.value), day)}>
            {MONTH_NAMES_FR.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Jour</span>
          <select value={day} onChange={(e) => emit(month, Number(e.target.value))}>
            {Array.from({ length: daysInMonth(month) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
