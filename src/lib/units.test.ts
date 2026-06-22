import { describe, it, expect } from 'vitest'
import { convertTemp, convertWind, displayTemp, displayWind, tempUnitLabel, windUnitLabel } from './units'

describe('units', () => {
  it('converts celsius to fahrenheit', () => {
    expect(convertTemp(0, 'F')).toBe(32)
    expect(convertTemp(100, 'F')).toBe(212)
    expect(convertTemp(20, 'C')).toBe(20)
  })

  it('converts km/h to m/s and mph', () => {
    expect(convertWind(36, 'ms')).toBeCloseTo(10, 5)
    expect(convertWind(160.9344, 'mph')).toBeCloseTo(100, 3)
    expect(convertWind(50, 'kmh')).toBe(50)
  })

  it('exposes unit labels', () => {
    expect(tempUnitLabel('F')).toBe('°F')
    expect(tempUnitLabel('C')).toBe('°C')
    expect(windUnitLabel('ms')).toBe('m/s')
    expect(windUnitLabel('mph')).toBe('mph')
    expect(windUnitLabel('kmh')).toBe('km/h')
  })

  it('display helpers round and handle null', () => {
    expect(displayTemp(20.04, 'C')).toBe(20)
    expect(displayTemp(20, 'F')).toBe(68)
    expect(displayTemp(null, 'F')).toBeNull()
    expect(displayWind(36.04, 'ms')).toBe(10)
    expect(displayWind(null, 'mph')).toBeNull()
  })
})
