// Diverging cold→hot ramp (RdYlBu reversed).
const STOPS = ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c']

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

/** Maps t∈[0,1] to a color along the ramp. */
export function rampColor(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(x))
  const f = x - i
  const [r1, g1, b1] = hexToRgb(STOPS[i])
  const [r2, g2, b2] = hexToRgb(STOPS[i + 1])
  return `rgb(${lerp(r1, r2, f)}, ${lerp(g1, g2, f)}, ${lerp(b1, b2, f)})`
}

/** Maps a value to a color given the data range. Returns a neutral grey if no range. */
export function colorFor(value: number, min: number, max: number): string {
  if (max <= min) return rampColor(0.5)
  return rampColor((value - min) / (max - min))
}

export { STOPS }
