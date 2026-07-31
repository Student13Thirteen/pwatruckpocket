# Security Notes — PwaTruckPocket

PwaTruckPocket handles operational documents, driver identity data and optional location. These are sensitive business data even when they are not classified as special-category personal data.

This document describes boundaries and known controls. It is not a claim of formal security certification.

## Never commit

```text
.env
config.js with a production origin
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID when private
CLOUDFLARE_TOKEN
PocketBase admin credentials
pb_data/
pb_migrations generated from production state
backup archives
uploaded documents
Android signing keys
production APK files
private update-manifest URLs
```

## Frontend boundary

The public client may know only what it needs to call the user-facing API:

- public PocketBase origin;
- the authenticated user's token;
- the driver's own selected data and files;
- public collection names and permitted fields.

It must never contain:

- Telegram bot credentials;
- Cloudflare tunnel credentials;
- PocketBase superuser credentials;
- signing material;
- unrestricted backend tokens;
- production backups or seed data.

## Stable APK boundary

The reviewed Android APK contains deployment-specific backend and update origins. Those are not authentication secrets, but they reveal private operational topology and should not be published unnecessarily.

For this reason:

- the APK is documented but not committed;
- its endpoints are not copied into public documentation;
- screenshots and examples must use synthetic data;
- a future public Android build should use a sanitized configuration and separate update channel.

## Authentication and authorization

Recommended PocketBase rules:

### `users`

- drivers authenticate only as ordinary users;
- public registration is disabled unless explicitly required;
- profile fields are minimized.

### `stati_viaggio`

- creation requires authentication;
- `user_id` must match the authenticated user;
- list/view rules return only the user's own records;
- update/delete are disabled or tightly restricted according to the business workflow.

### `fogli_viaggio`

- creation requires authentication;
- records and files are scoped to the authenticated user where appropriate;
- file types and maximum size are constrained;
- update/delete rules reflect document-retention requirements.

### `telegram_queue`

- no ordinary client list, view, create, update or delete access;
- only server-side hooks and superusers manage queue items.

## Offline queue considerations

The browser queue may temporarily store:

- status payloads;
- notes;
- coordinates;
- document blobs;
- authentication context needed for replay.

Risks and mitigations:

| Risk | Mitigation |
|---|---|
| Shared or lost device | device lock, short sessions and operational logout policy |
| Persistent sensitive documents | remove queue items after successful upload and avoid indefinite retention |
| Duplicate replay | stable `client_id` and unique backend constraint |
| Stale authentication | stop replay on auth failure and require login renewal |
| Script access to queue | restrictive Content Security Policy when deployment permits; minimize third-party code |

The current implementation uses browser storage for operational simplicity. It does not claim encrypted application-level storage at rest.

## File handling

- accept only the document and image formats required by the workflow;
- enforce size and MIME constraints on the backend, not only in the UI;
- generate server-side filenames or sanitize user-provided names;
- do not render untrusted HTML from notes or filenames;
- serve files with safe content types and download headers;
- scan documents if the risk model and operating environment require it;
- establish a retention and deletion policy.

## Location data

Location capture should be:

- visible to the driver;
- requested only during an operational action;
- optional or justified by a documented business requirement;
- retained no longer than needed;
- accessible only to authorized office users.

The client uses a time-bounded request and may retain a recent last-known position for fallback. Deployment policy should define whether that cache is acceptable on shared devices.

## Telegram integration

Telegram credentials remain in environment variables and are used only by the PocketBase hook worker.

Additional controls:

- use a dedicated bot;
- restrict the destination chat;
- rotate the token after suspected exposure;
- avoid sending more document metadata than operationally necessary;
- cap error text stored in `last_error`;
- monitor items entering terminal `error` state;
- remember that Telegram becomes an external data processor/channel for transmitted content.

## Cloudflare and network exposure

- expose PocketBase through an outbound tunnel rather than router port forwarding;
- keep the database/runtime port bound to loopback where appropriate;
- protect administrative routes separately from the driver API;
- enable MFA on the Cloudflare account;
- restrict origin access so it cannot bypass the intended edge path;
- review logs without retaining unnecessary document or credential content.

## Android update flow

A private self-update mechanism adds supply-chain risk. A production process should ensure:

- the update manifest is served over HTTPS;
- the APK URL is controlled by the same trusted release process;
- update metadata cannot be modified by unauthorized users;
- mandatory updates are used sparingly;
- the installed package verifies through Android signing continuity;
- release keys are backed up and access-controlled;
- old or compromised artifacts can be withdrawn.

The current binary demonstrates update functionality; this repository does not claim that the private release pipeline has undergone an independent audit.

## Operational hardening checklist

- [ ] apply least-privilege collection rules;
- [ ] configure unique `client_id` where offline replay is enabled;
- [ ] set upload type and size limits server-side;
- [ ] disable public PocketBase administration exposure;
- [ ] configure backups and perform restore tests;
- [ ] monitor availability and queue errors;
- [ ] rotate Telegram and Cloudflare credentials periodically;
- [ ] document data retention for files, positions and logs;
- [ ] test logout and lost-device procedures;
- [ ] review the Android update channel and signing process;
- [ ] remove production URLs and data from public artifacts.

## Incident response starting points

### Suspected token exposure

1. rotate the affected token;
2. restart or reload the dependent service;
3. inspect logs and queue records for anomalous use;
4. invalidate sessions where relevant;
5. document the event and corrective action.

### Lost driver device

1. disable the user account;
2. revoke active sessions where supported;
3. assess whether queued documents or cached positions may remain locally;
4. reset credentials before device reuse;
5. record the incident according to company policy.

### Unexpected public artifact

1. remove the artifact or make the repository private;
2. assume exposed endpoints and embedded values were copied;
3. rotate any actual credential found;
4. inspect Git history, not only the current branch;
5. publish a sanitized replacement only after review.