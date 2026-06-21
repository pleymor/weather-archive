export const MIN_DATE = '1940-01-01'

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
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
