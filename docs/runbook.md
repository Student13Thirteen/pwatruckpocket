# Runbook — PwaTruckPocket

## Daily checks

```bash
docker compose ps
docker compose logs --tail=80 pocketbase
docker compose logs --tail=80 tunnel
```

## Test Telegram hook

1. Submit a status from a test user.
2. Confirm record in `stati_viaggio`.
3. Confirm Telegram notification.
4. Check `telegram_queue` for failed records.

## Restart services

```bash
docker compose restart pocketbase
docker compose restart tunnel
```

## Backup PocketBase data

```bash
docker compose stop pocketbase
tar -czf backup_pb_$(date +%Y%m%d_%H%M).tar.gz pb_data pb_hooks pb_public 2>/dev/null || true
docker compose start pocketbase
```

## After frontend changes

Update cache version in `sw.js`, for example:

```js
const CACHE_NAME = 'netfleet-autisti-v6';
```

Then test on a phone with the installed PWA.
