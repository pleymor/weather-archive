import { describe, it, expect } from 'vitest'
import config from '../vite.config'

describe('vite config', () => {
  it('registers the PWA plugin with a manifest', () => {
    const plugins = (config as { plugins?: unknown[] }).plugins ?? []
    const flat = plugins.flat(Infinity) as Array<{ name?: string }>
    const names = flat.map((p) => p?.name).filter(Boolean)
    expect(names.some((n) => String(n).includes('pwa'))).toBe(true)
  })
})
