# Deployment — PwaTruckPocket

## Prerequisites

- Linux host or workstation;
- Docker Engine;
- Docker Compose v2;
- `curl` for setup verification.

A local demo requires no domain, Cloudflare account or Telegram bot.

## Guided local installation

```bash
git clone https://github.com/Student13Thirteen/pwatruckpocket.git
cd pwatruckpocket
bash pwatruckpocket setup
```

Choose local mode. The script generates credentials, builds PocketBase, applies the tracked schema migration, creates the synthetic driver and waits for the health endpoint.

Verify:

```bash
bash pwatruckpocket doctor
bash pwatruckpocket credentials
bash pwatruckpocket demo
```

## Remote access through Cloudflare Tunnel

Create a remotely managed Cloudflare Tunnel. Configure its Public Hostname service as:

```text
http://pocketbase:8090
```

Run setup and choose Cloudflare mode. Enter the public HTTPS URL and tunnel token when requested. The token remains in the local `.env`; the tunnel container is activated only for remote mode.

## Optional Telegram notifications

Setup can store a Telegram bot token and chat identifier. When left blank, operational records and the local demo continue to work; notification records remain a separate optional integration.

## Existing installation

The migration is additive and applies automatically when PocketBase starts. Before moving an existing runtime into this repository layout:

1. create a tested backup of `pb_data`;
2. compare collection fields and access rules;
3. test the migration on a copy;
4. never point the public demo at production records.

## Remove the demo

```bash
bash pwatruckpocket stop
rm -rf pb_data backups .env
```

This deletes local runtime data. It does not affect any remote production deployment unless that data was deliberately copied into this directory.
