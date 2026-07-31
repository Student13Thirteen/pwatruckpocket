#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -f .env
}
trap cleanup EXIT

show_diagnostics() {
  printf '\n--- docker compose ps ---\n' >&2
  docker compose ps -a >&2 || true
  printf '\n--- PocketBase logs ---\n' >&2
  docker compose logs --no-color --tail=250 pocketbase >&2 || true
}
trap 'show_diagnostics' ERR

cat > .env <<'ENV'
DEPLOYMENT_MODE="local"
PB_VERSION="0.39.9"
PB_BIND_ADDRESS="127.0.0.1"
PB_PORT="18090"
PUBLIC_BASE_URL="http://127.0.0.1:18090"
APP_DISPLAY_NAME="PwaTruckPocket CI"
PB_ENCRYPTION_KEY="1234567890abcdef1234567890abcdef"
PB_SUPERUSER_EMAIL="admin@example.com"
PB_SUPERUSER_PASSWORD="CI_admin_password_1234"
DEMO_DRIVER_NAME="Mario Demo"
DEMO_DRIVER_EMAIL="driver@example.com"
DEMO_DRIVER_PASSWORD="CI_driver_password_1234"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
CLOUDFLARE_TOKEN=""
ENV

docker compose config --quiet
docker compose up -d --build pocketbase

healthy=false
for _ in $(seq 1 80); do
  if curl -fsS http://127.0.0.1:18090/api/health >/dev/null 2>&1; then
    healthy=true
    break
  fi
  if [[ "$(docker compose ps -q pocketbase 2>/dev/null)" == "" ]]; then
    break
  fi
  sleep 2
done

[[ "$healthy" == true ]]
curl -fsS http://127.0.0.1:18090/ | grep -q 'PwaTruckPocket CI'

ADMIN_RESPONSE="$(curl -fsS http://127.0.0.1:18090/api/collections/_superusers/auth-with-password \
  -H 'Content-Type: application/json' \
  --data '{"identity":"admin@example.com","password":"CI_admin_password_1234"}')"
ADMIN_TOKEN="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])' <<<"$ADMIN_RESPONSE")"

curl -fsS http://127.0.0.1:18090/api/collections/users/records \
  -H "Authorization: $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"email":"driver@example.com","password":"CI_driver_password_1234","passwordConfirm":"CI_driver_password_1234","name":"Mario Demo","role":"driver","language":"it","active":true}' >/dev/null

DRIVER_RESPONSE="$(curl -fsS http://127.0.0.1:18090/api/collections/users/auth-with-password \
  -H 'Content-Type: application/json' \
  --data '{"identity":"driver@example.com","password":"CI_driver_password_1234"}')"
DRIVER_TOKEN="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])' <<<"$DRIVER_RESPONSE")"

curl -fsS http://127.0.0.1:18090/api/collections/stati_viaggio/records \
  -H "Authorization: $DRIVER_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"autista":"Mario Demo","stato":"CI smoke test","orario_locale":"31/07/2026 14:00","posizione_gps":"synthetic","client_id":"ci-status-001"}' >/dev/null

COUNT="$(curl -fsS 'http://127.0.0.1:18090/api/collections/stati_viaggio/records?perPage=10' \
  -H "Authorization: $DRIVER_TOKEN" | python3 -c 'import json,sys; print(json.load(sys.stdin)["totalItems"])')"
[[ "$COUNT" == "1" ]]

ANON_COUNT="$(curl -fsS 'http://127.0.0.1:18090/api/collections/stati_viaggio/records?perPage=10' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["totalItems"])')"
[[ "$ANON_COUNT" == "0" ]]

trap - ERR
echo 'Clean-room smoke test passed.'
