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
echo "[pre-install] Probing installed JDKs under /usr/lib/jvm:"
ls -la /usr/lib/jvm || true
if [ -z "${JAVA_HOME:-}" ]; then
  # Prefer Temurin/Zulu 17, fallback to any directory with 17 in the name
  mapfile -t CANDIDATES < <(ls -d /usr/lib/jvm/* 2>/dev/null | grep -E "(temurin|zulu).*17|java-17|jdk-17" || true)
  for d in "${CANDIDATES[@]}"; do
    if [ -d "$d" ]; then
      export JAVA_HOME="$d"
      break
    fi
  done
  if [ -z "${JAVA_HOME:-}" ]; then
    echo "[pre-install] No obvious Java 17 found. Falling back to system default (may be JDK 11)." >&2
  fi
fi
if [ -n "${JAVA_HOME:-}" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "[pre-install] Using JAVA_HOME=$JAVA_HOME"
  java -version || true
  # Also set Gradle-specific override for reliability
  if grep -q "^org\.gradle\.java\.home=" android/gradle.properties; then
    sed -i.bak "s|^org\.gradle\.java\.home=.*$|org.gradle.java.home=$JAVA_HOME|" android/gradle.properties || true
  else
    echo "org.gradle.java.home=$JAVA_HOME" >> android/gradle.properties
  fi
  echo "[pre-install] Set org.gradle.java.home in android/gradle.properties"
fi

echo "[pre-install] Pre-install hook complete."

# Enforce Java 17 before proceeding to expensive steps
EFFECTIVE_JAVA_VER=$(java -version 2>&1 | head -n1 || true)
echo "[pre-install] Detected: $EFFECTIVE_JAVA_VER"
if echo "$EFFECTIVE_JAVA_VER" | grep -q 'version "17'; then
  echo "[pre-install] Java 17 confirmed. Proceeding."
else
  echo "[pre-install] ERROR: Java 17 not detected. Aborting early to avoid wasting build minutes." >&2
  exit 1
fi
