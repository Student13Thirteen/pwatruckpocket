#!/bin/sh
set -eu

PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-http://127.0.0.1:8090}"
APP_DISPLAY_NAME="${APP_DISPLAY_NAME:-PwaTruckPocket Drivers}"

case "$APP_DISPLAY_NAME" in
  *[!A-Za-z0-9À-ÿ._\ -]*)
    echo "APP_DISPLAY_NAME contains unsupported characters." >&2
    exit 1
    ;;
esac

escape_sed() {
  printf '%s' "$1" | sed 's/[\\&|]/\\&/g'
}

cp /pb/template/index.html /pb/pb_public/index.html
sed -i \
  -e "s|INSERT_URL_HERE|$(escape_sed "$PUBLIC_BASE_URL")|g" \
  -e "s|App Autisti Netfleet|$(escape_sed "$APP_DISPLAY_NAME")|g" \
  -e "s|Netfleet Autisti|$(escape_sed "$APP_DISPLAY_NAME")|g" \
  -e "s|const USE_CLIENT_ID_FIELD = false;|const USE_CLIENT_ID_FIELD = true;|" \
  /pb/pb_public/index.html

exec /pb/pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=/pb/pb_data \
  --hooksDir=/pb/pb_hooks \
  --migrationsDir=/pb/pb_migrations \
  --publicDir=/pb/pb_public \
  --encryptionEnv=PB_ENCRYPTION_KEY
