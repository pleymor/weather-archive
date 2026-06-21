# Weather Archive — PWA de consultation des archives météo

**Date :** 2026-06-21
**Statut :** Design validé

## 1. Objectif

Application web progressive (PWA) permettant de consulter les archives météo
historiques à partir de données officielles, en commençant par la France (mais
techniquement extensible au monde entier).

Deux usages principaux :

1. **Explorer une période** — afficher des diagrammes (température, précipitations,
   vent) pour un lieu donné sur une plage de dates.
2. **Retrouver un jour précis** — afficher la météo détaillée d'un lieu à une date
   donnée.

## 2. Source de données

**Open-Meteo** (gratuit, sans clé API, CORS supporté) :

- **Historical Weather / Archive API** (`archive-api.open-meteo.com`) — données
  historiques remontant à 1940, basées sur des réanalyses (ERA5) qui intègrent les
  données officielles.
- **Geocoding API** (`geocoding-api.open-meteo.com`) — recherche de lieu par nom,
  autocomplétion, et reverse-geocoding (coordonnées → nom).

Les données historiques sont **immuables** : une fois récupérées, elles peuvent être
mises en cache indéfiniment.

## 3. Périmètre fonctionnel (MVP)

### Sélection de lieu
- Recherche par nom avec autocomplétion (Geocoding API).
- Bouton « ma position actuelle » via `navigator.geolocation`, suivi d'un
  reverse-geocoding pour afficher le nom du lieu.
- Le lieu sélectionné est partagé entre les deux modes de l'app.

### Variables météo couvertes
Le trio essentiel :
- **Température** — min / max / moyenne par jour.
- **Précipitations**.
- **Vent**.

L'architecture reste extensible vers d'autres variables (humidité, ensoleillement,
pression…) ultérieurement.

### Mode 1 — Graphiques (période)
- Sélecteur de plage de dates (bornée : 1940 → hier).
- Trois graphiques : température (min/max/moy), précipitations, vent.

### Mode 2 — Un jour donné
- Sélecteur de date unique (bornée : 1940 → hier).
- « Fiche du jour » : valeurs détaillées des trois familles de données.

## 4. Architecture & stack

PWA **100 % front-end**, sans backend. Open-Meteo est appelé directement depuis le
client. Hébergement statique (Netlify / GitHub Pages / Vercel), zéro coût serveur.

- **React 18 + Vite + TypeScript**
- **vite-plugin-pwa** (Workbox) — service worker + manifeste installable
- **Recharts** — graphiques
- **TanStack Query** — appels API, cache mémoire, états loading/error, retry
- **IndexedDB** (via `idb`) — cache persistant des données météo
- **CSS** — modules CSS ou Tailwind (à trancher en implémentation, sans impact archi)

## 5. Structure & composants

Séparation stricte : la couche données ne connaît rien de React (testable seule),
les vues consomment des hooks qui orchestrent cache + API.

### Couche données (logique pure)
- `api/geocoding.ts` — recherche de lieu + reverse-geocoding.
  Entrée : texte ou coordonnées → sortie : `Location[]` (`{nom, lat, lon, pays, admin}`).
- `api/weather.ts` — appel Archive API.
  Entrée : `{lat, lon, dateDébut, dateFin, variables}` → sortie : données normalisées.
- `cache/weatherCache.ts` — couche IndexedDB.
  Clé = `lat|lon|début|fin|variables`. Lit/écrit les données immuables.
- `lib/types.ts` — types partagés (`Location`, `WeatherDay`, `WeatherSeries`).

### État partagé
- Le **lieu sélectionné** est conservé au niveau de l'app (contexte React léger),
  partagé entre les deux modes.

### Hooks d'orchestration
- `useGeocoding` — recherche de lieu (cache + API via TanStack Query).
- `useWeather` — données météo : interroge IndexedDB d'abord, puis l'API si absent.

### Couche UI
- `App.tsx` — layout, navigation entre les deux modes, barre de sélection de lieu commune.
- `components/LocationSearch.tsx` — recherche + autocomplétion + bouton géolocalisation.
- `views/ChartsView.tsx` — sélecteur de période + 3 graphiques.
  - `components/TemperatureChart.tsx`
  - `components/PrecipitationChart.tsx`
  - `components/WindChart.tsx`
- `views/DayView.tsx` — sélecteur de date + fiche du jour.
- `components/DateRangePicker.tsx` et `components/DatePicker.tsx` — sélection de dates
  bornées (1940 → hier).

## 6. Flux de données

1. L'utilisateur choisit lieu + période → construction d'une clé de cache.
2. `useWeather` interroge d'abord **IndexedDB**. Trouvé → affichage immédiat.
3. Absent → appel **Archive API** → normalisation → écriture IndexedDB → affichage.
4. Données immuables → le cache n'expire jamais (sauf purge manuelle).

## 7. Stratégie offline (PWA)

- **Assets de l'app** (JS/CSS/HTML/icônes) : précachés par Workbox → l'app se lance
  hors-ligne.
- **Geocoding API** : `NetworkFirst` (tolère le cache mais privilégie le réseau).
- **Données météo** : gérées par IndexedDB côté app (pas par le SW) → contrôle fin et
  permanence du cache.
- **Manifeste PWA** : nom, icônes, couleur de thème, installable mobile/desktop.

## 8. Gestion des erreurs

| Cas | Comportement |
|-----|--------------|
| Lieu introuvable / pas de correspondance géocodage | Message clair |
| Période invalide (date future, début > fin) | Validation avant appel |
| Hors-ligne + données non cachées | Bandeau « hors-ligne, données indisponibles » |
| Erreur API (rate limit, 5xx) | Message + bouton réessayer (retry TanStack Query) |
| Géolocalisation refusée | Repli silencieux sur la recherche par nom |

## 9. Stratégie de tests

- **Unitaires (Vitest)** : couche données pure — normalisation des réponses API,
  construction des clés de cache, validation des dates. Fetch mockés.
- **Composants (React Testing Library)** : `LocationSearch` (autocomplétion), vues
  (états loading/error/données).
- **Cache** : lecture/écriture IndexedDB (`fake-indexeddb`).
- Pas d'E2E pour le MVP (ajoutable ultérieurement avec Playwright).

## 10. Hors périmètre (MVP)

- Carte interactive de sélection de lieu (cliquer sur une carte).
- Variables météo au-delà du trio température/pluie/vent.
- Source Météo-France Open Data (CSV) en complément.
- Tests end-to-end.
- Comparaison multi-lieux ou multi-périodes.
