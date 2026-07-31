# PwaTruckPocket

[![Public repository quality](https://github.com/Student13Thirteen/pwatruckpocket/actions/workflows/quality.yml/badge.svg)](https://github.com/Student13Thirteen/pwatruckpocket/actions/workflows/quality.yml)

**Offline-first driver operations for trip status, mobile documents and unreliable connectivity.**

PwaTruckPocket connects a driver on the road with an office workflow. A status or document is sent immediately when possible, stored durably on the device when the network is unstable, then replayed when connectivity returns.

```text
Driver action
   -> local validation and optional GPS
   -> immediate upload or IndexedDB queue
   -> PocketBase record and file storage
   -> server-side notification queue
   -> optional Telegram notification
```

The public repository is a self-contained synthetic demo. PocketBase, its schema, the browser PWA and a demo driver are created from the repository; no company data or operational credential is included.

## One guided command

Prerequisites: Docker Engine and Docker Compose v2.

```bash
git clone https://github.com/Student13Thirteen/pwatruckpocket.git
cd pwatruckpocket
bash pwatruckpocket setup
```

The setup asks only for the application name, local port and access mode. It then:

- generates unique encryption and account credentials;
- builds a pinned PocketBase runtime;
- applies the versioned schema migrations;
- serves the PWA from the same origin as the API;
- creates a synthetic demo driver;
- waits for the health check;
- prints the URL and login.

Local mode needs no domain, Telegram bot or Cloudflare account. Remote access and Telegram are optional.

## Operations CLI

| Command | Purpose |
|---|---|
| `bash pwatruckpocket setup` | guided first installation |
| `bash pwatruckpocket start` | build and start the stack |
| `bash pwatruckpocket stop` | stop containers without deleting data |
| `bash pwatruckpocket status` | show container and health state |
| `bash pwatruckpocket doctor` | verify Docker, Compose, health and demo login |
| `bash pwatruckpocket logs pocketbase` | follow PocketBase logs |
| `bash pwatruckpocket backup` | create a consistent `pb_data` archive |
| `bash pwatruckpocket update` | back up, rebuild and restart |
| `bash pwatruckpocket demo` | print the three-minute demo path |
| `bash pwatruckpocket credentials` | show the local synthetic login |

## Three-minute demo

```bash
bash pwatruckpocket doctor
bash pwatruckpocket demo
```

Then:

1. log in with the generated demo driver;
2. send a trip status;
3. upload a synthetic image or PDF;
4. switch the browser offline and submit another item;
5. reconnect and synchronize the local queue;
6. open History and verify that the driver sees only their own records.

## What it demonstrates

### Mobile workflow

- authenticated driver access;
- predefined trip milestones;
- optional geolocation with cached fallback;
- image and PDF submission;
- personal activity history;
- Italian and Arabic interface with RTL support.

### Resilience

- IndexedDB queue for pending records and files;
- retry with timeout, exponential backoff and jitter;
- visible connection and queue state;
- stable client IDs and backend uniqueness constraints;
- image resizing and JPEG compression before upload;
- API requests excluded from the service-worker cache.

### Server-side boundary

- browser code contains no Telegram credential;
- PocketBase hooks enqueue notifications after successful writes;
- a scheduled worker retries a bounded batch;
- Telegram failure does not invalidate the operational record;
- the notification integration can remain disabled for a local demo.

## Architecture

![PwaTruckPocket architecture](docs/architecture.svg)

```text
browser PWA / internal Android shell
                 |
                 | same-origin HTTPS or local HTTP
                 v
              PocketBase
       users | statuses | documents
                 |
                 | private hook
                 v
      optional Telegram retry queue
```

The stable internal Android APK `v1.0.1` additionally demonstrates Android share-target handling, native PDF integration, downloads and update discovery. The signed APK and production configuration are intentionally excluded.

## Reproducible schema

The repository tracks a PocketBase migration that creates:

```text
users
stati_viaggio
fogli_viaggio
telegram_queue
```

Driver-facing rules scope list, view and create operations to the authenticated driver's name. `client_id` uniqueness reduces duplicate submissions after ambiguous network failures. See [`docs/pocketbase-schema.md`](docs/pocketbase-schema.md).

## Optional remote access

During setup choose Cloudflare Tunnel mode, create a remotely managed tunnel and route its Public Hostname service to:

```text
http://pocketbase:8090
```

The token is stored only in the local `.env`. The tunnel service is not started in local mode.

## Clean-room validation

Every pull request:

- validates public files and the sensitive-data boundary;
- checks Bash and JavaScript syntax;
- runs ShellCheck;
- builds the pinned PocketBase image;
- starts an empty stack;
- applies migrations;
- creates a synthetic administrator and driver;
- authenticates the driver;
- creates and reads a status record;
- confirms anonymous records are blocked;
- destroys the temporary environment.

## Repository map

```text
pwatruckpocket/
|- pwatruckpocket             # setup and operations CLI
|- Dockerfile
|- docker-entrypoint.sh
|- docker-compose.yml
|- index.html                 # browser PWA template
|- manifest.json
|- sw.js
|- pb_migrations/             # reproducible schema
|- pb_hooks/                  # private notification queue
|- scripts/                   # validation and smoke test
`- docs/
```

## Scope and authorship

This is a focused internal operations tool, not a generic fleet-management SaaS. Development was AI-assisted. The contribution represented here is workflow design, configuration, integration, deployment, testing, troubleshooting, documentation and iterative verification; the repository does not claim that every line was written manually without assistance.

## Security boundary

Never commit:

- `.env` or deployment tokens;
- PocketBase runtime data;
- uploaded operational documents;
- real driver or company records;
- Android signing material or production APKs;
- backups or private endpoints.

See [`docs/security.md`](docs/security.md).

## Documentation

- [`docs/deployment.md`](docs/deployment.md) — local and remote setup
- [`docs/pocketbase-schema.md`](docs/pocketbase-schema.md) — versioned schema and access rules
- [`docs/architecture.md`](docs/architecture.md) — component and queue boundaries
- [`docs/runbook.md`](docs/runbook.md) — routine operations
- [`docs/troubleshooting.md`](docs/troubleshooting.md) — recovery guide
- [`docs/android-release.md`](docs/android-release.md) — stable internal APK evidence

## License

MIT for the files published in this repository. The internal Android binary and production configuration are excluded.
