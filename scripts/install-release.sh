#!/usr/bin/env bash
set -euo pipefail

deploy_path="${1:?deploy path is required}"
release_id="${2:?release id is required}"

if [[ ! "$release_id" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]; then
  printf 'Invalid release id: %s\n' "$release_id" >&2
  exit 1
fi

releases_dir="$deploy_path/releases"
shared_dir="$deploy_path/shared"
archive="$shared_dir/.incoming-$release_id.tar.gz"
incoming="$releases_dir/.incoming-$release_id"
release="$releases_dir/$release_id"

test -d "$releases_dir"
test -d "$shared_dir"
test -f "$archive"
test ! -e "$incoming"
test ! -e "$release"

cleanup_stale_incoming() {
  local canonical_releases_dir canonical_shared_dir candidate candidate_parent name

  canonical_releases_dir="$(cd "$releases_dir" && pwd -P)"
  canonical_shared_dir="$(cd "$shared_dir" && pwd -P)"
  shopt -s nullglob

  for candidate in "$shared_dir"/.incoming-*.tar.gz; do
    [[ "$candidate" == "$archive" ]] && continue
    name="${candidate##*/}"
    [[ "$name" =~ ^\.incoming-[0-9a-f]{40}-[0-9]+-[0-9]+\.tar\.gz$ ]] || continue
    candidate_parent="$(cd "$(dirname "$candidate")" && pwd -P)"
    [[ "$candidate_parent" == "$canonical_shared_dir" ]] || continue
    rm -f -- "$candidate"
  done

  for candidate in "$releases_dir"/.incoming-*; do
    [[ "$candidate" == "$incoming" ]] && continue
    name="${candidate##*/}"
    [[ "$name" =~ ^\.incoming-[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || continue
    candidate_parent="$(cd "$(dirname "$candidate")" && pwd -P)"
    [[ "$candidate_parent" == "$canonical_releases_dir" ]] || continue
    [[ -d "$candidate" || -L "$candidate" ]] || continue
    rm -rf -- "$candidate"
  done

  shopt -u nullglob
}

cleanup_stale_incoming

cleanup() {
  if [[ -f "$archive" ]]; then
    rm -f -- "$archive"
  fi
  if [[ -d "$incoming" ]]; then
    rm -rf -- "$incoming"
  fi
}
trap cleanup EXIT

available_kb="$(df -Pk "$deploy_path" | awk 'NR == 2 { print $4 }')"
archive_kb="$(du -k "$archive" | awk '{ print $1 }')"
required_kb="$((archive_kb * 3 + 524288))"

if (( available_kb < required_kb )); then
  printf 'Insufficient disk space: %d KiB available, %d KiB required.\n' \
    "$available_kb" "$required_kb" >&2
  exit 1
fi

mkdir "$incoming"
tar -xzf "$archive" -C "$incoming"
test -f "$incoming/index.html"
mv "$incoming" "$release"
rm -f -- "$archive"
trap - EXIT

printf 'Installed release %s\n' "$release_id"
