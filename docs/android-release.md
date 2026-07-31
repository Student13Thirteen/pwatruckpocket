# Stable Android release — PwaTruckPocket

This document records what was verified from the supplied stable APK. It deliberately separates observed binary evidence from assumptions about source code or deployment.

## Artifact reviewed

| Property | Verified value |
|---|---|
| Artifact type | signed Android APK |
| File label | `NETFLEET_STABLE_V_1.0.apk` |
| Package | `biz.netfleet.autisti` |
| Version name | `1.0.1` |
| Version code | `2` |
| Main activity | `biz.netfleet.autisti.MainActivity` |
| Embedded app shell | `assets/netfleet_index.html` |

The filename says `V_1.0`, while the package metadata identifies version `1.0.1`. The package metadata is used as the release version in this documentation.

## Verified native capabilities

Inspection of the manifest, resources, embedded web asset and application bytecode found support for:

- internet and network-state access;
- coarse and fine location permissions;
- receiving shared images and PDFs through Android intents;
- an Android JavaScript bridge exposed to the embedded app;
- forwarding shared files from Android to the web workflow;
- previewing PDFs through a native renderer;
- opening local files and remote file URLs;
- download handling;
- checking a remote update manifest;
- downloading and launching an APK installation flow;
- serving the bundled app shell from local Android assets;
- handling WebView file selection and geolocation prompts.

Representative bridge methods include:

```text
checkForAppUpdate
clearCurrentDocumentFile
openCurrentDocumentFile
openFileUrl
openLocalFile
pageReady
renderPdfPreview
```

The embedded web application also exposes callbacks for shared-file reception, native PDF preview completion and native error reporting.

## Embedded web workflow

The stable APK contains a newer workflow than a basic browser wrapper. Observed functionality includes:

- Italian and Arabic localization with RTL layout;
- status submission and document upload;
- optional note field;
- file preview and removal before submission;
- native PDF preview fallback;
- local queue status and explicit sync command;
- automatic image compression;
- retry policy with timeouts and exponential backoff;
- incoming Android share handling;
- application update controls.

## Public/private boundary

The reviewed APK contains deployment-specific origins for the operational backend and update service. Publishing that binary would expose internal topology and would be inappropriate even without credentials.

The repository therefore publishes:

- the public PWA implementation;
- architecture and operational documentation;
- configuration placeholders;
- the server-side notification hook;
- a precise description of native behavior.

It does not publish:

- the stable production APK;
- production backend or update endpoints;
- signed release keys;
- production records and uploaded documents;
- private Android source unless a separately sanitized edition is prepared.

## What this artifact proves

The APK is evidence that PwaTruckPocket progressed beyond a browser mock-up into an internally distributable Android workflow with native file integration and update handling.

It does not, by itself, prove:

- broad production scale;
- public Play Store distribution;
- complete security assurance;
- sole authorship of every underlying library or generated component;
- ownership of all operational infrastructure.

## Reproducibility status

The browser-facing implementation and backend integration are documented in this repository. A fully reproducible Android build would additionally require a sanitized Android source tree, build configuration and a non-production signing procedure. Until those are published, the APK should be described as a verified stable internal release rather than a reproducible public release.