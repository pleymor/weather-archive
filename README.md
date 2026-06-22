# Weather Archive

PWA de consultation des archives météo officielles (France et au-delà), à partir
des données [Open-Meteo](https://open-meteo.com/). En ligne :
**https://archivesmeteo.pleymor.com**

Quatre modes :

- **Graphiques** — température (min/max/moy), précipitations et vent d'un lieu sur
  une période ; superposition des **normales 1991-2020** et **écarts à la normale** ;
  **comparaison** avec une autre ville.
- **Un jour donné** — la météo détaillée d'un lieu à une date précise.
- **Records & histoire** — météo d'un jour calendaire à travers toutes les années
  (avec tendance), records absolus et synthèse climatique depuis 1940.
- **Carte** — choroplèthe de France colorée par la température, zoom région →
  départements, clic pour ouvrir un lieu.

Autres fonctionnalités : **URLs partageables** (l'état est dans l'URL), **lieux
favoris & récents**, bascule d'**unités** (°C/°F, km/h / m/s / mph), **export CSV**,
installable en **PWA** avec cache hors-ligne.

## Stack

React 19 · Vite 8 · TypeScript · TanStack Query · Recharts · IndexedDB (`idb`) ·
vite-plugin-pwa (Workbox). 100 % front-end, sans backend.

## Données

- Archive API : `https://archive-api.open-meteo.com/v1/archive` (historique depuis 1940).
- Geocoding : `https://geocoding-api.open-meteo.com/v1/search`.
- Reverse-geocoding (géolocalisation) : BigDataCloud (gratuit, sans clé).
- Fonds de carte : GeoJSON régions/départements simplifiés
  ([gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson)),
  embarqués dans `public/geo/` (aucune tuile externe).

Les données historiques sont immuables et mises en cache de façon permanente dans
IndexedDB ; l'app est installable et consultable hors-ligne pour les requêtes déjà
chargées.

## Développement

```bash
npm install
npm run dev        # serveur de dev
npm test           # suite Vitest
npm run build      # build de production (tsc --noEmit && vite build)
npm run preview    # sert le build de production
```

## Déploiement

```bash
./deploy/deploy.sh   # build + rsync vers le serveur
```

La config nginx de production est dans [`deploy/nginx-archivesmeteo.conf`](deploy/nginx-archivesmeteo.conf).
Le certificat TLS est géré par Certbot (renouvellement automatique).

## Documentation

- Spec : [`docs/superpowers/specs/2026-06-21-weather-archive-pwa-design.md`](docs/superpowers/specs/2026-06-21-weather-archive-pwa-design.md)
- Plan d'implémentation : [`docs/superpowers/plans/2026-06-21-weather-archive-pwa.md`](docs/superpowers/plans/2026-06-21-weather-archive-pwa.md)
