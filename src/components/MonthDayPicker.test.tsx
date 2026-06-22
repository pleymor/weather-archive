import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MonthDayPicker } from './MonthDayPicker'

describe('MonthDayPicker', () => {
  it('shows month and day selects, no year', () => {
    render(<MonthDayPicker value="2020-07-14" onChange={() => {}} />)
    expect((screen.getByLabelText(/mois/i) as HTMLSelectElement).value).toBe('7')
    expect((screen.getByLabelText(/jour/i) as HTMLSelectElement).value).toBe('14')
  })

  it('preserves the year when changing the month', () => {
    const onChange = vi.fn()
    render(<MonthDayPicker value="2020-07-14" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/mois/i), { target: { value: '3' } })
    expect(onChange).toHaveBeenLastCalledWith('2020-03-14')
  })

  it('allows February 29', () => {
    render(<MonthDayPicker value="2020-02-15" onChange={() => {}} />)
    expect(screen.getByRole('option', { name: '29' })).toBeInTheDocument()
  })

  it('clamps the day when switching to a shorter month', () => {
    const onChange = vi.fn()
    render(<MonthDayPicker value="2020-01-31" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/mois/i), { target: { value: '2' } })
    expect(onChange).toHaveBeenLastCalledWith('2020-02-29')
  })
})
