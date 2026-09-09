#!/usr/bin/env bash
# Rewrite Artifactory resolved URLs in bun.locl to the public npm registry.
# Used by CI, release, Sonar, Docker workflow, and Dockerfile build stages.
set -euo pipefail

ROOT="${1:-.}"
shift || true

if [[ "$#" -gt 0 ]]; then
  DIRS=("$@")
else
  DIRS="$(pwd)"
fi

ARTIFACTORY_PREFIX='https://repox.jfrog.io/artifactory/api/npm/npm/'
PUBLIC_REGISTRY='https://registry.npmjs.org/'

rewrite_lock() {
  local lockfile="$1"
  if [[ ! -f "$lockfile" ]]; then
    return 0
  fi
  if [[ "$(uname)" = "Darwin" ]]; then
    sed -i '' "s|${ARTIFACTORY_PREFIX}|${PUBLIC_REGISTRY}|g" "$lockfile"
  else
    sed -i "s|${ARTIFACTORY_PREFIX}|${PUBLIC_REGISTRY}|g" "$lockfile"
  fi
}

for dir in "${DIRS[@]}"; do
  workdir="${ROOT%/}/${dir}"
  if [[ ! -d "$workdir" ]]; then
    echo "normalize-bun-lock-registry: directory not found: ${workdir}" >&2
    exit 1
  fi

  rm -f "${workdir}/.npmrc"
  rewrite_lock "${workdir}/bun.lock"
done

echo "normalize-npm-lock-registry: ok (${DIRS[*]})"
