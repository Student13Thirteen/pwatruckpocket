# 🚚 Fleet Driver Management PWA

A Progressive Web App for fleet driver management, built with **PocketBase**, **Vanilla HTML/CSS/JavaScript**, **Cloudflare Tunnel**, and **Telegram notifications**.

This project is designed for transport companies whose drivers use mobile networks that may be unstable or slow. The app allows drivers to send trip status updates and upload trip documents while keeping data stored in PocketBase and sending office notifications through Telegram.

---

## ✨ Key Features

- **📱 Progressive Web App**  
  Installable on Android and iOS as a mobile app.

- **🔐 Driver Authentication**  
  Drivers log in through PocketBase authentication.

- **📍 Trip Status Updates**  
  Drivers can send real-time trip statuses with timestamp and GPS position.

- **📄 Document Uploads**  
  Drivers can upload photos, PDFs, delivery notes, trip sheets, and other travel documents.

- **📥 Offline Queue**  
  If the connection is weak or unavailable, submissions are saved locally and retried later.

- **🧩 Image Compression**  
  Images are compressed before upload to improve performance on mobile networks.

- **🤖 Telegram Notifications**  
  Telegram alerts are sent from PocketBase hooks, not from the frontend.

- **🌍 Bilingual Interface**  
  Italian and Arabic interface for drivers.

- **☁️ Cloudflare Tunnel**  
  Public access without router port forwarding.

---

## 🏗️ Architecture

```text
Driver phone
   ↓
PWA frontend
   ↓
PocketBase API
   ↓
PocketBase hook
   ↓
telegram_queue collection
   ↓
Telegram group notification
```

Network path:

```text
Internet → Cloudflare Edge → cloudflared tunnel → PocketBase container:8090
```

The frontend only communicates with PocketBase.

Telegram is handled server-side by PocketBase hooks. This keeps the Telegram Bot Token outside the browser and avoids making the driver wait for Telegram delivery.

---

## 📁 Repository Structure

```text
pwatruckpocket/
├── cloudflared/
│   └── config.yml
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── pb_hooks/
│   └── telegram.pb.js
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── docker-compose.yml
├── index.html
├── manifest.json
└── sw.js
```

---

## ⚠️ Important Before Deployment

Before deploying, replace this placeholder inside `index.html`:

```js
const PB_URL = 'INSERT_URL_HERE';
```

with your public PocketBase URL:

```js
const PB_URL = 'https://your-domain.example.com';
```

Do not commit real credentials or runtime data:

```text
.env
pb_data/
Telegram Bot Token
Cloudflare Tunnel Token
database files
backup archives
```

---

## 🚀 Requirements

You need:

- Docker
- Docker Compose
- A domain managed by Cloudflare
- A Cloudflare Zero Trust Tunnel
- A Telegram Bot Token from BotFather
- A Telegram chat ID for the dispatch/group chat

---

## ⚙️ Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
nano .env
```

Example `.env`:

```env
PUBLIC_BASE_URL=https://your-domain.example.com

TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

CLOUDFLARE_TOKEN=your_cloudflare_tunnel_token_here
```

Explanation:

| Variable | Description |
|---|---|
| `PUBLIC_BASE_URL` | Public URL used by drivers and by Telegram file links |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat or group ID |
| `CLOUDFLARE_TOKEN` | Cloudflare Tunnel token |

Never commit the real `.env` file.

---

## 🐳 Docker Deployment

Start the stack:

```bash
docker compose up -d
```

View logs:

```bash
docker compose logs -f
```

View only recent logs:

```bash
docker compose logs --tail=80 -f
```

Restart all containers:

```bash
docker compose restart
```

Stop the stack:

```bash
docker compose down
```

Check running containers:

```bash
docker compose ps
```

---

## ☁️ Cloudflare Tunnel

The app is exposed through `cloudflared`, without opening router ports.

Recommended route:

```text
https://your-domain.example.com → http://pocketbase:8090
```

The Cloudflare tunnel token must be stored in `.env`:

```env
CLOUDFLARE_TOKEN=your_cloudflare_tunnel_token_here
```

The tunnel configuration lives in:

```text
cloudflared/config.yml
```

---

## 🧱 PocketBase Collections

The app expects these PocketBase collections:

```text
users
stati_viaggio
fogli_viaggio
telegram_queue
```

---

## 📍 Collection: `stati_viaggio`

This collection stores trip status updates.

Required fields:

```text
autista          text
stato            text
orario_locale    text
posizione_gps    text
link_mappa       url
```

Recommended API rules depend on your setup, but authenticated drivers must be able to create records.

---

## 📄 Collection: `fogli_viaggio`

This collection stores uploaded trip documents.

Required fields:

```text
autista          text
foto_foglio      file
orario_locale    text
posizione_gps    text
link_mappa       url
```

Authenticated drivers must be able to create records.

---

## 📬 Collection: `telegram_queue`

Create a base collection named:

```text
telegram_queue
```

Required fields:

```text
type          text      required
payload_json  text      required
status        text      required
attempts      number    default 0, no decimals
last_error    text
```

Recommended API rules:

```text
List/Search rule: Superusers only
View rule:        Superusers only
Create rule:      Superusers only
Update rule:      Superusers only
Delete rule:      Superusers only
```

Drivers should not access this collection directly.

---

## 🤖 Telegram Integration

Telegram notifications are handled by:

```text
pb_hooks/telegram.pb.js
```

The frontend does not contain the Telegram bot token.

The flow is:

```text
Driver submits status/document
        ↓
PocketBase saves record
        ↓
PocketBase hook creates telegram_queue record
        ↓
Cron worker sends Telegram notification
        ↓
Queue record is deleted after successful delivery
```

If Telegram fails, the queue record remains in `telegram_queue` with:

```text
status
attempts
last_error
```

This makes delivery more reliable and avoids blocking the driver app when Telegram is slow or unavailable.

---

## 📱 PWA Behavior

The app includes:

```text
manifest.json
sw.js
icons/
```

The service worker caches static frontend files only.

PocketBase API requests, login, uploads, and files are not cached by the service worker.

When you make major frontend changes, update the cache version inside `sw.js`, for example:

```js
const CACHE_NAME = 'netfleet-autisti-v5';
```

This helps installed phones receive the new version.

---

## 📥 Offline Queue

The frontend uses IndexedDB to store pending requests when the connection is unstable.

If the driver has weak or missing connection:

- status updates are saved locally
- documents are saved locally
- the app retries when the connection comes back
- the driver can manually press the queue sync button

This improves reliability on mobile networks.

---

## 🧩 Image Compression

Images are compressed before upload to reduce mobile data usage and upload time.

Default frontend settings:

```js
const IMAGE_MAX_SIDE = 1600;
const IMAGE_JPEG_QUALITY = 0.72;
```

You can lower these values if drivers often work with very weak connections.

---

## 🔐 Security Notes

Do not commit:

```text
.env
pb_data/
real Telegram Bot Token
real Telegram Chat ID, if you want to keep it private
real Cloudflare Tunnel Token
database files
backup archives
```

Telegram credentials must stay server-side through environment variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

The frontend must never contain:

```text
Telegram Bot Token
Cloudflare Tunnel Token
PocketBase admin credentials
```

---

## 💾 Backup

Before changing production files, back up PocketBase data:

```bash
docker compose stop

tar -czf backup_pb_$(date +%Y%m%d_%H%M).tar.gz ./pb_data ./pb_hooks ./pb_public

docker compose start
```

For large backups, download them with SCP over the local network instead of through the Cloudflare tunnel.

Example:

```bash
scp user@server-local-ip:/path/to/backup_pb_YYYYMMDD_HHMM.tar.gz .
```

---

## 🔧 Useful Commands

View live logs:

```bash
docker compose logs -f
```

View recent logs:

```bash
docker compose logs --tail=80 -f
```

Restart everything:

```bash
docker compose restart
```

Restart only PocketBase:

```bash
docker compose restart pocketbase
```

Check containers:

```bash
docker compose ps
```

Stop containers:

```bash
docker compose down
```

Start containers:

```bash
docker compose up -d
```

---

## ✅ Production Checklist

Before going live:

- [ ] Replace `INSERT_URL_HERE` in `index.html`
- [ ] Create `.env` from `.env.example`
- [ ] Set `PUBLIC_BASE_URL`
- [ ] Set `TELEGRAM_BOT_TOKEN`
- [ ] Set `TELEGRAM_CHAT_ID`
- [ ] Set `CLOUDFLARE_TOKEN`
- [ ] Add `pb_hooks/telegram.pb.js`
- [ ] Add PWA icons in `icons/`
- [ ] Create PocketBase collections
- [ ] Create `telegram_queue`
- [ ] Check API rules
- [ ] Run `docker compose up -d`
- [ ] Test login
- [ ] Test status update
- [ ] Test document upload
- [ ] Check Telegram notification
- [ ] Check that `telegram_queue` is emptied after successful delivery

---

## 🧪 Testing

### Test status update

1. Log in as a driver
2. Send a trip status
3. Check `stati_viaggio`
4. Check `telegram_queue`
5. Confirm Telegram notification arrives

### Test document upload

1. Log in as a driver
2. Upload a photo or PDF
3. Check `fogli_viaggio`
4. Confirm the file is saved
5. Confirm Telegram notification arrives

### Test offline behavior

1. Open the app
2. Disable mobile data or Wi-Fi
3. Send a status or document
4. Confirm the app saves it in the queue
5. Re-enable connection
6. Confirm the queue is sent automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla JavaScript, CSS3 |
| PWA | Web App Manifest, Service Worker, IndexedDB |
| Backend | PocketBase |
| Database | SQLite |
| File Storage | PocketBase file storage |
| Tunnel | Cloudflare Tunnel |
| Notifications | Telegram Bot API |
| Deployment | Docker Compose |

---

## 📈 Monitoring

Recommended monitoring:

- Uptime Kuma
- Cloudflare tunnel health checks
- Telegram downtime alerts
- PocketBase container logs

Basic health check URL:

```text
https://your-domain.example.com/api/health
```

---

## 📝 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.
