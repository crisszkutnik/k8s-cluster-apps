#!/bin/sh

set -o errexit
set -o nounset
set -o pipefail

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL environment variable must be set}"
: "${VITE_TANSTACK_BASE_URL:?VITE_TANSTACK_BASE_URL environment variable must be set}"

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

  find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' \) -print0 |
    while IFS= read -r -d '' file; do
      sed -i "s|$placeholder|$escaped_value|g" "$file"
    done
}

write_nginx_config() {
  cat <<'EOF' >/etc/nginx/conf.d/default.conf
server {
  listen 80;
  listen [::]:80;

  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location /healthz {
    add_header Content-Type text/plain;
    return 200 'ok';
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF
}

raw_base="${VITE_BASE_URL:-}"
if [ -z "$raw_base" ] || [ "$raw_base" = "__VITE_BASE_URL__" ]; then
  raw_base="/"
fi

sanitized_base=$(normalize_base_path "$raw_base")

write_nginx_config

replace_placeholder "__VITE_API_BASE_URL__" "$VITE_API_BASE_URL"
replace_placeholder "__VITE_BASE_URL__" "$sanitized_base"
replace_placeholder "__VITE_TANSTACK_BASE_URL__" "$VITE_TANSTACK_BASE_URL"

exec "$@"