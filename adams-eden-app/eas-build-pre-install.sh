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

# Try to ensure JAVA_HOME points to a Java 17 installation on Linux runners (EAS build machines)
if [ -z "${JAVA_HOME:-}" ]; then
  CANDIDATES=(
    "/usr/lib/jvm/temurin-17-jdk-amd64"
    "/usr/lib/jvm/temurin-17-jdk"
    "/usr/lib/jvm/java-17-openjdk-amd64"
    "/usr/lib/jvm/java-17-openjdk"
    "/usr/lib/jvm/zulu-17-amd64"
  )
  for d in "${CANDIDATES[@]}"; do
    if [ -d "$d" ]; then
      export JAVA_HOME="$d"
      break
    fi
  done
  if [ -z "${JAVA_HOME:-}" ]; then
    # Heuristic: pick first matching JDK dir containing '17'
    found=$(ls -d /usr/lib/jvm/* 2>/dev/null | grep -E "(17|temurin|zulu)" | head -n1 || true)
    if [ -n "$found" ]; then export JAVA_HOME="$found"; fi
  fi
  if [ -n "${JAVA_HOME:-}" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "[pre-install] Using JAVA_HOME=$JAVA_HOME"
    java -version || true
  else
    echo "[pre-install] WARNING: Could not auto-detect Java 17; Gradle may fail." >&2
  fi
fi

echo "[pre-install] Pre-install hook complete."
