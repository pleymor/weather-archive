import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TemperatureChart } from './TemperatureChart'
import type { WeatherDay } from '../lib/types'

const DAYS: WeatherDay[] = [
  { date: '2020-01-01', tempMax: 6, tempMin: 1, tempMean: 3, precipitation: 0, windGust: 12 },
  { date: '2020-01-02', tempMax: 7, tempMin: 2, tempMean: 4, precipitation: 1, windGust: 18 },
]

describe('TemperatureChart', () => {
  it('renders a chart wrapper reporting the number of points', () => {
    render(<TemperatureChart days={DAYS} />)
    expect(screen.getByTestId('temperature-chart')).toHaveAttribute('data-points', '2')
  })

  it('shows an empty message when there is no data', () => {
    render(<TemperatureChart days={[]} />)
    expect(screen.getByText(/aucune donnée/i)).toBeInTheDocument()
  })
})
