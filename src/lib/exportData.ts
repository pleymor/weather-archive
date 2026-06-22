import type { WeatherSeries } from './types'
import { displayTemp, displayWind, tempUnitLabel, windUnitLabel, type Units } from './units'

/** Builds a CSV document (semicolon-separated, FR-friendly) from a weather series. */
export function toCSV(series: WeatherSeries, units: Units): string {
  const t = tempUnitLabel(units.temp)
  const w = windUnitLabel(units.wind)
  const header = ['Date', `Temp max (${t})`, `Temp min (${t})`, `Temp moy (${t})`, 'Précipitations (mm)', `Vent max (${w})`]
  const rows = series.days.map((d) => [
    d.date,
    fmt(displayTemp(d.tempMax, units.temp)),
    fmt(displayTemp(d.tempMin, units.temp)),
    fmt(displayTemp(d.tempMean, units.temp)),
    fmt(d.precipitation),
    fmt(displayWind(d.windMax, units.wind)),
  ])
  return [header, ...rows].map((r) => r.join(';')).join('\n')
}

function fmt(value: number | null): string {
  return value === null ? '' : String(value)
}

/** Triggers a browser download of arbitrary text content. */
export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Rasterizes an inline <svg> element to a PNG download. Best-effort. */
export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, scale = 2): void {
  const rect = svg.getBoundingClientRect()
  const width = rect.width || 640
  const height = rect.height || 320
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const data = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
    }
    URL.revokeObjectURL(url)
  }
  img.src = url
}
