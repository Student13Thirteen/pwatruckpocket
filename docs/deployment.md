# Deployment Guide — PwaTruckPocket

## 1. Prerequisites

- Docker and Docker Compose
- Domain managed by Cloudflare
- Cloudflare Zero Trust Tunnel
- Telegram bot token and chat ID

## 2. Environment

```bash
cp .env.example .env
nano .env
```

Required values:

```env
PUBLIC_BASE_URL=https://your-domain.example.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
CLOUDFLARE_TOKEN=your_cloudflare_token
```

## 3. Frontend URL

Open `index.html` and replace:

```js
const PB_URL = 'INSERT_URL_HERE';
```

with:

```js
const PB_URL = 'https://your-domain.example.com';
```

## 4. Start stack

```bash
docker compose up -d
docker compose ps
```

## 5. Cloudflare route

Route your hostname to:

```text
http://pocketbase:8090
```

## 6. PocketBase setup

Create the required collections described in [`pocketbase-schema.md`](pocketbase-schema.md).

## 7. Functional test

1. Create a test driver user.
2. Login from a mobile browser.
3. Submit a status.
4. Upload a small test document/image.
5. Confirm Telegram notification.
6. Check the record in PocketBase.
