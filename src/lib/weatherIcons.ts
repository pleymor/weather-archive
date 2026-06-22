/** Maps a WMO weather code (+ day/night) to a weather emoji. */
export function weatherIcon(code: number | null, isDay: boolean): string {
  if (code === null) return '·'
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code === 1) return isDay ? '🌤️' : '🌙'
  if (code === 2) return isDay ? '⛅' : '☁️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️' // drizzle
  if (code >= 61 && code <= 67) return '🌧️' // rain
  if (code >= 71 && code <= 77) return '🌨️' // snow
  if (code >= 80 && code <= 82) return '🌦️' // rain showers
  if (code === 85 || code === 86) return '🌨️' // snow showers
  if (code >= 95) return '⛈️' // thunderstorm
  return '☁️'
}

/** Short French description of a WMO weather code. */
export function weatherLabel(code: number | null): string {
  if (code === null) return '—'
  if (code === 0) return 'Ciel dégagé'
  if (code <= 2) return 'Peu nuageux'
  if (code === 3) return 'Couvert'
  if (code === 45 || code === 48) return 'Brouillard'
  if (code >= 51 && code <= 57) return 'Bruine'
  if (code >= 61 && code <= 67) return 'Pluie'
  if (code >= 71 && code <= 77) return 'Neige'
  if (code >= 80 && code <= 82) return 'Averses'
  if (code === 85 || code === 86) return 'Averses de neige'
  if (code >= 95) return 'Orage'
  return 'Nuageux'
}
