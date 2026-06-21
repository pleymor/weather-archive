import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('renders a date input with min/max bounds', () => {
    render(<DatePicker value="2020-01-01" onChange={() => {}} />)
    const input = screen.getByLabelText(/date/i) as HTMLInputElement
    expect(input.min).toBe('1940-01-01')
    expect(input.type).toBe('date')
  })

  it('calls onChange when a valid date is picked', () => {
    const onChange = vi.fn()
    render(<DatePicker value="2020-01-01" onChange={onChange} />)
    const input = screen.getByLabelText(/date/i)
    fireEvent.change(input, { target: { value: '2021-05-10' } })
    expect(onChange).toHaveBeenLastCalledWith('2021-05-10')
  })

  it('shows an error for a future date', () => {
    render(<DatePicker value="2099-01-01" onChange={() => {}} />)
    expect(screen.getByText(/futur/i)).toBeInTheDocument()
  })
})
