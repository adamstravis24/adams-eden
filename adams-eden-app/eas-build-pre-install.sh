#!/usr/bin/env bash
set -euo pipefail

echo "[pre-install] Ensuring write permissions for working directory..."
chmod -R u+rwX . || true

if [ -e node_modules ]; then
  echo "[pre-install] Fixing permissions on existing node_modules..."
  chmod -R u+rwX node_modules || true
fi

echo "[pre-install] Environment info:"
uname -a || true
node -v || true
npm -v || true
yarn -v || true

echo "[pre-install] Done."
