# PwaTruckPocket — Logistics Operations PWA

A lightweight **Progressive Web App** for transport workflows. Drivers can submit trip status updates and travel documents from mobile devices. Data is stored in **PocketBase**, exposed securely through **Cloudflare Tunnel**, and office notifications are delivered through **Telegram**.

> Portfolio focus: process automation, mobile-first workflows, PocketBase backend, server-side notifications, offline queue and logistics domain knowledge.

## What this project demonstrates

- Practical automation for SME logistics operations
- PWA frontend with offline-aware behavior
- PocketBase authentication and collections
- Document/status capture from mobile devices
- Telegram notifications handled server-side through hooks
- Docker Compose deployment and Cloudflare Tunnel exposure
- Operational documentation: schema, runbook, troubleshooting and security notes

## Architecture

```text
Driver phone
   │
   ▼
PWA frontend
   │ HTTPS
   ▼
Cloudflare Edge / Tunnel
   │
   ▼
PocketBase container
   │
   ├── collections: users, stati_viaggio, fogli_viaggio, telegram_queue
   └── server-side hook → Telegram notification
```

Telegram credentials are never stored in the frontend. Notifications are triggered by PocketBase hooks and environment variables.

## Repository structure

```text
pwatruckpocket/
├── cloudflared/
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── pocketbase-schema.md
│   ├── runbook.md
│   ├── security.md
│   ├── troubleshooting.md
│   └── screenshots/
├── icons/
├── pb_hooks/
├── .env.example
├── docker-compose.yml
├── index.html
├── manifest.json
├── sw.js
└── README.md
```

## Quick start

```bash
git clone https://github.com/Student13Thirteen/pwatruckpocket.git
cd pwatruckpocket
cp .env.example .env
nano .env
docker compose up -d
```

Before production usage, replace the placeholder in `index.html`:

```js
const PB_URL = 'INSERT_URL_HERE';
```

with the public PocketBase URL.

## Required PocketBase collections

```text
users
stati_viaggio
fogli_viaggio
telegram_queue
```

See [`docs/pocketbase-schema.md`](docs/pocketbase-schema.md) for the expected schema and rules.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System flow and component boundaries |
| [`docs/deployment.md`](docs/deployment.md) | Deployment checklist |
| [`docs/pocketbase-schema.md`](docs/pocketbase-schema.md) | Collections and fields |
| [`docs/runbook.md`](docs/runbook.md) | Operational checks and commands |
| [`docs/troubleshooting.md`](docs/troubleshooting.md) | Common issues and fixes |
| [`docs/security.md`](docs/security.md) | Secret handling and hardening notes |

## Useful commands

```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs --tail=100 -f

# Restart PocketBase
docker compose restart pocketbase
```

## Production checklist

- [ ] Replace `INSERT_URL_HERE` in `index.html`
- [ ] Create `.env` from `.env.example`
- [ ] Set `PUBLIC_BASE_URL`
- [ ] Set `TELEGRAM_BOT_TOKEN`
- [ ] Set `TELEGRAM_CHAT_ID`
- [ ] Set `CLOUDFLARE_TOKEN`
- [ ] Create PocketBase collections and API rules
- [ ] Test login
- [ ] Test status submission
- [ ] Test document upload
- [ ] Test Telegram notification
- [ ] Verify offline queue behavior
- [ ] Configure monitoring with Uptime Kuma

## Security notes

Do not commit:

```text
.env
pb_data/
pb_migrations/ generated from production data
Telegram Bot Token
Cloudflare Tunnel Token
backup archives
```

## Related projects

- [DockNextFlare](https://github.com/Student13Thirteen/docknextflare) — private cloud architecture
- [UptimeMonitoring](https://github.com/Student13Thirteen/uptimemonitoring) — service monitoring and alerting

## License

MIT — see [`LICENSE`](LICENSE).
