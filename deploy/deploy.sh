#!/usr/bin/env bash
# Build and deploy the PWA to archivesmeteo.pleymor.com.
# Usage: ./deploy/deploy.sh
set -euo pipefail

HOST="pleymor@pleymor.com"
WEBROOT="/var/www/archivesmeteo"

echo "==> Building"
npm run build

echo "==> Syncing dist/ to ${HOST}:${WEBROOT}"
rsync -az --delete dist/ "${HOST}:${WEBROOT}/"

echo "==> Done. https://archivesmeteo.pleymor.com/"
