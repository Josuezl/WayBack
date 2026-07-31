#!/usr/bin/env bash
set -euo pipefail

deploy_path="${1:?deploy path is required}"
release_id="${2:?release id is required}"
healthcheck_host="${3:?health-check host is required}"

if [[ ! "$release_id" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]; then
  printf 'Invalid release id: %s\n' "$release_id" >&2
  exit 1
fi

releases_dir="$deploy_path/releases"
release="$releases_dir/$release_id"
previous=""

atomic_replace() {
  local source_path="$1"
  local target_path="$2"

  if mv -Tf "$source_path" "$target_path" 2>/dev/null; then
    return
  fi
  mv -fh "$source_path" "$target_path"
}

test -d "$release"
test -f "$release/index.html"

if [[ -L "$deploy_path/current" ]]; then
  previous="$(readlink "$deploy_path/current")"
fi

ln -sfn "releases/$release_id" "$deploy_path/current.next"
atomic_replace "$deploy_path/current.next" "$deploy_path/current"

health_body=""
health_failed=0
if ! health_body="$(curl -fsSL --max-time 20 \
  --resolve "$healthcheck_host:80:127.0.0.1" \
  --resolve "$healthcheck_host:443:127.0.0.1" \
  "http://$healthcheck_host/")"; then
  health_failed=1
elif [[ "$health_body" != *'<title>WayBack'* ]]; then
  health_failed=1
fi

if (( health_failed == 1 )); then
  if [[ -n "$previous" ]]; then
    ln -sfn "$previous" "$deploy_path/current.rollback"
    atomic_replace "$deploy_path/current.rollback" "$deploy_path/current"
    printf 'Health check failed; rollback restored %s\n' "$previous" >&2
  else
    rm -f -- "$deploy_path/current"
    printf 'Health check failed and no previous release exists\n' >&2
  fi
  exit 1
fi

printf 'Activated release %s\n' "$release_id"
printf 'Pruning releases older than the newest five:\n'

current_real="$(cd "$deploy_path/current" && pwd -P)"
releases_real="$(cd "$releases_dir" && pwd -P)"
release_number=0

while IFS= read -r candidate; do
  release_number="$((release_number + 1))"
  if (( release_number <= 5 )); then
    continue
  fi

  candidate="${candidate%/}"
  test -d "$candidate"
  test ! -L "$candidate"
  candidate_real="$(cd "$candidate" && pwd -P)"

  if [[ "$(dirname "$candidate_real")" != "$releases_real" ]]; then
    printf 'Refusing to prune release outside %s: %s\n' \
      "$releases_real" "$candidate_real" >&2
    exit 1
  fi
  if [[ "$candidate_real" == "$current_real" ]]; then
    printf 'Refusing to prune active release: %s\n' "$candidate_real" >&2
    exit 1
  fi

  printf '%s\n' "$(basename "$candidate_real")"
  rm -rf -- "$candidate_real"
done < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d \
  ! -name '.incoming-*' -exec ls -1dt {} +)
