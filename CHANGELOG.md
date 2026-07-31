# Changelog

## 1.0.1 — stable internal Android release

Verified from the supplied signed APK:

- packaged Android WebView shell with embedded local app assets;
- Android share target for images and PDFs;
- native document opening and PDF preview bridge;
- file chooser and download handling;
- geolocation permission integration;
- in-app update check and APK installation flow;
- incoming shared-file hand-off to the web workflow;
- Italian and Arabic UI support;
- offline queue, manual sync and connectivity indicators;
- image compression, retries, timeout and backoff behavior;
- status, document, notes and history workflows.

The production APK and deployment endpoints remain private.

## Public repository refresh — 2026-07-31

- repositioned the project around the real driver-operations problem;
- documented the two-stage resilience design;
- added a verified Android release report;
- added a visual architecture diagram;
- expanded public/private security boundaries;
- refreshed PWA branding and cache metadata;
- excluded APKs, signing material and deployment-specific configuration from Git.

## Earlier public version

- added operational documentation: architecture, deployment, runbook, troubleshooting and security notes;
- added PocketBase Telegram notification queue and worker;
- added Docker Compose and Cloudflare Tunnel templates.