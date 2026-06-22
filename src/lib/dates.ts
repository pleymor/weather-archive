export const MIN_DATE = '1940-01-01'

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Full French month names, index 0 = January. */
export const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Number of days in a 1-based month, using a leap year so February allows 29. */
export function daysInMonth(month: number): number {
  return new Date(Date.UTC(2000, month, 0)).getUTCDate()
}

/** Formats an ISO date (YYYY-MM-DD) to a short French label, e.g. "5 janv." */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const month = MONTHS_FR[Number(m) - 1] ?? ''
  return `${Number(d)} ${month}`
}

/** Formats an ISO date to a full French label, e.g. "lundi 5 janvier 2020". */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (Number.isNaN(date.getTime())) return iso // not an ISO date — show as-is
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export function maxDate(today: Date = new Date()): string {
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return toISODate(yesterday)
}

type Result = { ok: true } | { ok: false; error: string }

function inBounds(date: string, max: string): Result {
  if (date < MIN_DATE) return { ok: false, error: `Date trop ancienne (min ${MIN_DATE}).` }
  if (date > max) return { ok: false, error: 'La date ne peut pas être dans le futur.' }
  return { ok: true }
}

export function validateSingleDate(date: string, today: Date = new Date()): Result {
  return inBounds(date, maxDate(today))
}

export function validateRange(start: string, end: string, today: Date = new Date()): Result {
  const max = maxDate(today)
  const s = inBounds(start, max)
  if (!s.ok) return s
  const e = inBounds(end, max)
  if (!e.ok) return e
  if (start > end) return { ok: false, error: 'La date de début doit précéder la date de fin.' }
  return { ok: true }
}
