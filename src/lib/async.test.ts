import { describe, it, expect } from 'vitest'
import { mapWithConcurrency } from './async'

describe('mapWithConcurrency', () => {
  it('preserves order of results', async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 10)
    expect(out).toEqual([10, 20, 30, 40, 50])
  })

  it('never runs more than `limit` tasks at once', async () => {
    let active = 0
    let peak = 0
    const items = Array.from({ length: 20 }, (_, i) => i)
    await mapWithConcurrency(items, 4, async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 1))
      active--
    })
    expect(peak).toBeLessThanOrEqual(4)
  })

  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 4, async (n) => n)).toEqual([])
  })
})
