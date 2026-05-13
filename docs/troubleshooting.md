# Troubleshooting — PwaTruckPocket

## Login does not work

- Check `PB_URL` in `index.html`.
- Check that the user exists in PocketBase.
- Check PocketBase logs:

```bash
docker compose logs --tail=100 pocketbase
```

## Telegram notification does not arrive

Check `.env`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Then check logs:

```bash
docker compose logs --tail=200 pocketbase
```

Check `telegram_queue` for failed records and `last_error`.

## Upload fails on mobile

Possible causes:

- file too large
- weak network
- PocketBase collection rule does not allow create
- field name mismatch
- Cloudflare upload limit / timeout

Check browser console and PocketBase logs.

## App does not update on phone

Update the cache version in `sw.js` and reload/reinstall the PWA.

## Public URL does not load

Check tunnel route:

```text
Public hostname → http://pocketbase:8090
```

Check tunnel logs:

```bash
docker compose logs --tail=100 tunnel
```
