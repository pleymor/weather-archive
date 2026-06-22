import { WeatherApiError } from '../api/weather'

/** A user-facing message for a failed weather query, with a specific case for rate limits. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof WeatherApiError && error.status === 429) {
    return "Limite de requêtes Open-Meteo atteinte (quota journalier). Les données récentes restent accessibles ; l'historique ancien se débloque après la réinitialisation du quota — réessayez plus tard."
  }
  return 'Impossible de récupérer les données. Vérifiez votre connexion et réessayez.'
}
