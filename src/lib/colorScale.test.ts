import { describe, it, expect } from 'vitest'
import { rampColor, colorFor, STOPS } from './colorScale'

describe('colorScale', () => {
  it('anchors the ramp at its endpoints', () => {
    expect(rampColor(0)).toBe('rgb(44, 123, 182)') // first stop #2c7bb6
    expect(rampColor(1)).toBe('rgb(215, 25, 28)') // last stop #d7191c
  })

  it('clamps out-of-range t', () => {
    expect(rampColor(-1)).toBe(rampColor(0))
    expect(rampColor(2)).toBe(rampColor(1))
  })

  it('maps a value within a range', () => {
    expect(colorFor(0, 0, 10)).toBe(rampColor(0))
    expect(colorFor(10, 0, 10)).toBe(rampColor(1))
    expect(colorFor(5, 0, 10)).toBe(rampColor(0.5))
  })

  it('returns a neutral mid color for an empty range', () => {
    expect(colorFor(5, 5, 5)).toBe(rampColor(0.5))
    expect(STOPS.length).toBe(5)
  })
})
