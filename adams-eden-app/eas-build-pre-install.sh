#!/usr/bin/env bash
set -euo pipefail

echo "[pre-install] Ensuring clean, writable working directory..."

# Ensure we own and can write everything (best-effort)
chmod -R u+rwX . || true

# If node_modules exists (dir, file, or symlink), remove it to avoid EACCES/mode issues
if [ -L node_modules ] || [ -f node_modules ] || [ -d node_modules ]; then
  echo "[pre-install] Removing existing node_modules (if any)"
  rm -rf node_modules || true
fi

# Recreate node_modules with correct permissions
mkdir -p node_modules
chmod -R u+rwX node_modules || true

echo "[pre-install] Environment info:"
uname -a || true
node -v || true
npm -v || true
yarn -v || true

echo "[pre-install] Pre-install hook complete."
