#!/bin/sh

set -o errexit
set -o nounset
set -o pipefail

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL environment variable must be set}"
: "${VITE_TANSTACK_BASE_URL:?VITE_TANSTACK_BASE_URL environment variable must be set}"
: "${VITE_BASE_URL:?VITE_BASE_URL environment variable must be set}"

if [ "$VITE_API_BASE_URL" = "__VITE_API_BASE_URL__" ]; then
  echo "ERROR: VITE_API_BASE_URL is still a placeholder. Set the actual value."
  exit 1
fi

if [ "$VITE_TANSTACK_BASE_URL" = "__VITE_TANSTACK_BASE_URL__" ]; then
  echo "ERROR: VITE_TANSTACK_BASE_URL is still a placeholder. Set the actual value."
  exit 1
fi

if [ "$VITE_BASE_URL" = "__VITE_BASE_URL__" ]; then
  echo "ERROR: VITE_BASE_URL is still a placeholder. Set the actual value."
  exit 1
fi

normalize_base_path() {
  local value="$1"

  if [ -z "$value" ] || [ "$value" = "/" ]; then
    printf '/'
    return
  fi

  case "$value" in
    /*) ;;
    *) value="/$value" ;;
  esac

  case "$value" in
    */) ;;
    *) value="$value/" ;;
  esac

  printf '%s' "$value"
}

replace_placeholder() {
  local placeholder="$1"
  local value="$2"

  local escaped_value
  escaped_value=$(printf '%s' "$value" | sed -e 's/[&|]/\\&/g')

  find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' \) -exec sed -i "s|$placeholder|$escaped_value|g" {} +
}

raw_base="${VITE_BASE_URL:-}"
if [ -z "$raw_base" ] || [ "$raw_base" = "__VITE_BASE_URL__" ]; then
  raw_base="/"
fi

sanitized_base=$(normalize_base_path "$raw_base")

replace_placeholder "__VITE_API_BASE_URL__" "$VITE_API_BASE_URL"
replace_placeholder "__VITE_BASE_URL__" "$sanitized_base"
replace_placeholder "__VITE_TANSTACK_BASE_URL__" "$VITE_TANSTACK_BASE_URL"

exec "$@"