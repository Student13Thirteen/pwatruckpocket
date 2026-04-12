# 🚚 Fleet Driver Management PWA

A Progressive Web App for fleet management. Built with **PocketBase**, featuring automated Telegram alerts and bilingual support.

## ✨ Key Features

- **📱 PWA:** Fully installable on iOS/Android — works offline
- **🔐 Secure Authentication:** Built-in user login via PocketBase's auth store
- **📄 Document Uploads:** Drivers can upload trip logs, delivery notes, and PDFs directly from their smartphones
- **🤖 Telegram Automation:** Every new trip log submission triggers a Telegram Bot notification to the dispatch group chat
- **⚡ Lightweight Backend:** PocketBase (SQLite + Go) — zero complex server configuration
- **🌍 Bilingual Support:** Dual language interface

## 🏗️ Architecture

```
Internet → Cloudflare Edge → cloudflared (tunnel) → pocketbase:8090
                                                      (no exposed router ports)
```

- **Frontend:** Pure HTML5, Vanilla JS, CSS3 served directly by PocketBase from `pb_public/`
- **Backend:** PocketBase handles auth, database, file storage, and hooks
- **Tunnel:** Cloudflare Zero Trust — no open firewall ports, built-in SSL

## 📁 Repository Structure

```
pwatruckpocket/
├── index.html
├── manifest.json
├── sw.js                   # Service Worker (offline support)
├── docker-compose.yml
├── cloudflared/
│   └── config.yml          # Tunnel keepalive settings
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- A domain managed via Cloudflare
- A Cloudflare Zero Trust account (free tier)
- A Telegram Bot token (from [@BotFather](https://t.me/botfather))

### Local Development (no Docker)

1. Download the latest [PocketBase binary](https://pocketbase.io/docs/)
2. Clone this repo into the `pb_public` folder:
   ```bash
   git clone https://github.com/Student13Thirteen/pwatruckpocket.git pb_public
   ```
3. Start PocketBase:
   ```bash
   ./pocketbase serve
   ```
4. Open `http://127.0.0.1:8090`

### Production Deployment (Docker + Cloudflare Tunnel)

**1. Clone the repository:**
```bash
git clone https://github.com/Student13Thirteen/pwatruckpocket.git
cd pwatruckpocket
```

**2. Create your environment file:**
```bash
cp .env.example .env
nano .env
```

**3. Set up the Cloudflare Tunnel:**
- Go to Cloudflare Zero Trust Dashboard → Networks → Tunnels
- Create a new tunnel and route it to `http://pocketbase-app:8090`
- Copy your tunnel **token** and **ID**
- Paste the token into `.env` and the ID into `cloudflared/config.yml`

**4. Deploy:**
```bash
docker compose up -d
```

**5. First access:**

Navigate to `https://yourdomain.com/_/` to complete PocketBase admin setup.

## ⚙️ Telegram Integration

The Telegram notification is triggered from a **PocketBase Hook** (`pb_hooks/`), not from the frontend. This keeps your Bot Token server-side and never exposed in the browser source.

Create `pb_hooks/notify.js`:
```javascript
onRecordAfterCreateRequest((e) => {
    const BOT_TOKEN = $os.getenv("TELEGRAM_BOT_TOKEN");
    const CHAT_ID = $os.getenv("TELEGRAM_CHAT_ID");

    $http.send({
        url: `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: `📦 New trip log submitted by: ${e.record.get("driver_name")}`
        })
    });
}, "your_collection_name")
```

Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to your `.env` — PocketBase picks them up automatically.

## 🔧 Useful Commands

```bash
# View live logs
docker compose logs -f

# Restart PocketBase
docker restart pocketbase-app

# Backup data
tar -czf backup_pb_$(date +%Y%m%d).tar.gz ./pb_data
```

## 💾 Backup

```bash
# Stop the container
docker stop pocketbase-app

# Archive all data (database + uploads)
tar -czf backup_pb_$(date +%Y%m%d).tar.gz ./pb_data

# Restart
docker start pocketbase-app
```

Then download the archive via SCP using your **local IP**, not the Cloudflare tunnel, for large files.

## 🛡️ Security Notes

- **Never commit `.env`** — it contains your Telegram credentials and Cloudflare token
- Keep Telegram credentials in `.env` and read them via PocketBase hooks — never hardcode them in frontend JS
- The Cloudflare tunnel token grants access to your tunnel — treat it like a private key

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla JS, CSS3 |
| PWA | Web App Manifest, Service Workers |
| Backend | [PocketBase](https://pocketbase.io/) |
| Database | SQLite (bundled with PocketBase) |
| Tunnel | Cloudflare Zero Trust (`cloudflared`) |
| Notifications | Telegram Bot API |

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
