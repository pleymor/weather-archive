# Weather Archive

PWA de consultation des archives météo officielles (France et au-delà), à partir
des données [Open-Meteo](https://open-meteo.com/). En ligne :
**https://archivesmeteo.pleymor.com**

Deux modes :

- **Graphiques** — température (min/max/moy), précipitations et vent d'un lieu sur
  une période.
- **Un jour donné** — la météo détaillée d'un lieu à une date précise.

## Stack

React 19 · Vite 8 · TypeScript · TanStack Query · Recharts · IndexedDB (`idb`) ·
vite-plugin-pwa (Workbox). 100 % front-end, sans backend.

## Données

- Archive API : `https://archive-api.open-meteo.com/v1/archive` (historique depuis 1940).
- Geocoding : `https://geocoding-api.open-meteo.com/v1/search`.
- Reverse-geocoding (géolocalisation) : BigDataCloud (gratuit, sans clé).

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
