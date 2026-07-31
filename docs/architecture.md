# Architecture — PwaTruckPocket

## Goal

Provide drivers with a low-friction way to send trip milestones and travel documents from mobile devices while preserving submissions across unstable connections and keeping operational credentials out of the client.

![Architecture diagram](architecture.svg)

## System boundaries

| Component | Responsibility |
|---|---|
| Browser PWA | UI, authentication, validation, local queue, retry and history |
| Android shell | share target, file bridge, PDF preview, downloads, permissions and updates |
| Cloudflare Tunnel | outbound-only public access to the backend |
| PocketBase | authentication, records, files and server-side hooks |
| Telegram queue hook | decouples stored records from notification delivery |
| Telegram | office notification channel |

## Core online flow

```text
Driver
  |
  | submits status or document
  v
PWA / Android shell
  |
  | authenticated HTTPS request
  v
PocketBase
  |
  |- stores record or file
  `- after-create hook creates telegram_queue item
           |
           | scheduled worker, bounded batch
           v
       Telegram API
           |
           v
       Office chat
```

The operational record is stored before the Telegram worker runs. Notification delivery is therefore a separate concern rather than part of the driver's critical transaction.

## Offline flow

```text
Submission attempted
  |
  | network unavailable or retryable failure
  v
IndexedDB pending queue
  |
  |- stable client-generated ID
  |- payload and compressed file
  `- creation timestamp / retry count
           |
           | browser online event or manual sync
           v
      replay in creation order
           |
           |- success -> remove local item
           `- failure -> retain for later retry
```

This design addresses two different failure domains:

1. **mobile transport failure**, handled in IndexedDB;
2. **notification-channel failure**, handled by `telegram_queue` in PocketBase.

A unique `client_id` field can be enabled in the backend schema so a request replay remains idempotent even when the client cannot determine whether the previous attempt reached the server.

## Android shell

The stable Android package embeds the web app as a local asset and exposes a controlled JavaScript bridge. The bridge is used only for capabilities that a browser PWA cannot provide consistently across devices.

### Native responsibilities

- receive Android `SEND` intents for images and PDFs;
- copy or encode the incoming document for the embedded web workflow;
- open local and remote documents with Android handlers;
- render the first page of a PDF for preview;
- handle file chooser and downloads;
- mediate location permission requests;
- check a remote update manifest;
- download an APK and start the installation flow;
- serve the local app shell and logo assets.

### Web/native contract

Representative methods exposed by Android:

```text
AndroidBridge.checkForAppUpdate(...)
AndroidBridge.clearCurrentDocumentFile()
AndroidBridge.openCurrentDocumentFile()
AndroidBridge.openFileUrl(...)
AndroidBridge.openLocalFile(...)
AndroidBridge.pageReady()
AndroidBridge.renderPdfPreview(...)
```

Representative callbacks exposed by the web app:

```text
NetfleetNativeBridge.receiveSharedFile(...)
NetfleetNativeBridge.receivePdfPreview(...)
NetfleetNativeBridge.receivePdfPreviewError(...)
NetfleetNativeBridge.receiveNativeError(...)
```

The callback object retains the legacy internal name because it is part of the current Android contract. The public portfolio name remains PwaTruckPocket.

## Client reliability controls

### Retry policy

Network calls use:

- explicit timeouts;
- retries only for transport errors and retryable HTTP statuses;
- exponential delay;
- jitter to avoid synchronized retries;
- no blind retry for authentication, permission or validation failures.

### Image preparation

Mobile images may be resized and recompressed before upload. The original file is retained when processing fails or compression would not reduce its size.

### Position handling

Geolocation is time-bounded. A recent cached position can be used when the new lookup fails, preventing GPS acquisition from blocking the entire workflow.

### Caching boundary

The service worker caches only the app shell and static assets. API requests, authentication calls and uploads are deliberately excluded to avoid stale operational data or replaying sensitive responses from a cache.

## Backend notification queue

The PocketBase hook creates a queue item after a status or document record is saved. The scheduled worker:

1. reads a small batch of `pending` or `retry` items;
2. rebuilds the Telegram payload;
3. sends a message, image or document reference;
4. deletes the queue item after success;
5. increments attempts and stores a bounded error message after failure;
6. moves the item to `error` after the maximum attempt count.

This is intentionally simpler than a general message broker. For the expected internal scale, a PocketBase collection provides visibility and recoverability without introducing another service.

## Security boundaries

```text
Public client
  - user credentials and auth token
  - selected file and optional position
  - public API origin

Server-side only
  - Telegram bot token
  - operations chat identifier
  - Cloudflare tunnel token
  - PocketBase administration
  - production data and backups

Private release pipeline
  - Android signing material
  - update manifest endpoint
  - production APK
```

## Trade-offs

### Why PocketBase

PocketBase keeps the internal deployment compact: authentication, records, file storage and hooks live in one operational component. The trade-off is that collection rules and migrations require careful management as the workflow grows.

### Why two queues

The local queue protects against mobile connectivity loss. The server queue protects against Telegram failures. Combining them would couple unrelated failure modes and make troubleshooting harder.

### Why an Android shell instead of a complete native rewrite

The shell preserves one workflow implementation while adding Android capabilities where they materially improve the driver's experience. The trade-off is a web/native bridge that must remain narrow, documented and backward-compatible.

## Observability and troubleshooting

Useful checkpoints are:

```text
1. Browser / WebView console and network status
2. IndexedDB pending queue count
3. PocketBase record and API logs
4. telegram_queue status, attempts and last_error
5. PocketBase hook / cron logs
6. Telegram API response
7. Android download or file-opening logs
```

The runbook and troubleshooting guide map common failures to these boundaries.