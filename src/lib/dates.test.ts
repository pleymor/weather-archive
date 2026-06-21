import { describe, it, expect } from 'vitest'
import { MIN_DATE, maxDate, toISODate, validateRange, validateSingleDate } from './dates'

const TODAY = new Date('2026-06-21T12:00:00Z')

describe('dates', () => {
  it('toISODate formats UTC date', () => {
    expect(toISODate(new Date('2020-03-05T23:00:00Z'))).toBe('2020-03-05')
  })

  it('maxDate is yesterday', () => {
    expect(maxDate(TODAY)).toBe('2026-06-20')
  })

  it('validateRange accepts a valid range', () => {
    expect(validateRange('2020-01-01', '2020-12-31', TODAY)).toEqual({ ok: true })
  })

  it('rejects start after end', () => {
    const r = validateRange('2020-12-31', '2020-01-01', TODAY)
    expect(r.ok).toBe(false)
  })

  it('rejects dates before 1940', () => {
    expect(validateRange('1939-12-31', '2020-01-01', TODAY).ok).toBe(false)
    expect(MIN_DATE).toBe('1940-01-01')
  })

  it('rejects future dates', () => {
    expect(validateSingleDate('2026-06-21', TODAY).ok).toBe(false)
    expect(validateSingleDate('2026-06-20', TODAY)).toEqual({ ok: true })
  })
})
