import { describe, it, expect } from 'vitest'
import { weatherIcon, weatherLabel } from './weatherIcons'

describe('weatherIcons', () => {
  it('uses sun by day and moon by night for clear skies', () => {
    expect(weatherIcon(0, true)).toBe('☀️')
    expect(weatherIcon(0, false)).toBe('🌙')
  })

  it('maps precipitation and storms', () => {
    expect(weatherIcon(63, true)).toBe('🌧️') // rain
    expect(weatherIcon(73, true)).toBe('🌨️') // snow
    expect(weatherIcon(95, true)).toBe('⛈️') // thunderstorm
    expect(weatherIcon(45, true)).toBe('🌫️') // fog
  })

  it('handles null code', () => {
    expect(weatherIcon(null, true)).toBe('·')
    expect(weatherLabel(null)).toBe('—')
  })

  it('labels codes in French', () => {
    expect(weatherLabel(0)).toBe('Ciel dégagé')
    expect(weatherLabel(3)).toBe('Couvert')
    expect(weatherLabel(95)).toBe('Orage')
  })
})
