# Architecture — PwaTruckPocket

## Goal

Provide a simple mobile workflow for drivers to send trip status updates and documents to the office.

## Components

| Component | Role |
|---|---|
| `index.html` | PWA frontend and mobile UI |
| `sw.js` | Static asset caching for installable PWA behavior |
| `manifest.json` | PWA metadata and icons |
| PocketBase | Auth, database, file storage and API |
| `pb_hooks/telegram.pb.js` | Server-side notification hook and queue worker |
| Cloudflare Tunnel | Secure public access without router port forwarding |
| Telegram | Office/group notification channel |

## Data flow

```text
Driver submits status/document
        │
        ▼
PWA validates input and sends request to PocketBase
        │
        ▼
PocketBase stores record/file
        │
        ▼
PocketBase hook creates/sends Telegram queue notification
        │
        ▼
Office receives alert in Telegram group
```

## Offline flow

When the network is unavailable, the frontend stores pending submissions locally and retries later.

## Portfolio value

This project connects a real logistics workflow with a simple backend, server-side alerts, mobile-first UX and reliability thinking.
