# Security Notes — PwaTruckPocket

## Secret handling

Never commit:

```text
.env
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID if private
CLOUDFLARE_TOKEN
pb_data/
backup archives
```

## Frontend boundary

The frontend must never contain:

```text
Telegram Bot Token
Cloudflare Tunnel Token
PocketBase admin credentials
```

## PocketBase rules

- Drivers should only create their own status/document records.
- `telegram_queue` should be restricted to superusers/server-side hooks.
- Admin accounts should use strong passwords.

## Operational risks

This project handles operational documents and driver data. Treat uploads, positions and notes as sensitive business data.

## Recommended hardening

- Enable HTTPS through Cloudflare.
- Restrict admin panel access where possible.
- Use strong passwords for PocketBase users.
- Back up `pb_data` regularly.
- Monitor availability with Uptime Kuma.
