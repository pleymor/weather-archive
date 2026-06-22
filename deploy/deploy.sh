#!/usr/bin/env bash
# Manual deploy fallback. Normally deployment happens automatically via
# .github/workflows/deploy.yml on push to main.
# Usage: ./deploy/deploy.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$DIR/deploy.config.sh"
if [ ! -f "$CONFIG" ]; then
  echo "Missing $CONFIG — copy deploy.config.example.sh and fill in HOST/WEBROOT." >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG"

echo "==> Building"
npm run build

echo "==> Syncing dist/ to ${HOST}:${WEBROOT}"
rsync -az --delete dist/ "${HOST}:${WEBROOT}/"

echo "==> Done."
