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

Create `pb_hooks/telegram.pb.js`:
```javascript
// pb_hooks/telegram.pb.js
// Netfleet Autisti - Telegram queue stabile senza funzioni globali

console.log("[telegram] telegram.pb.js caricato - versione autosufficiente v2");

onRecordAfterCreateSuccess(function (e) {
    e.next();

    try {
        var TELEGRAM_QUEUE_COLLECTION = "telegram_queue";

        function escapeHtml(value) {
            return String(value || "").replace(/[&<>'"]/g, function (c) {
                var map = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    "\"": "&quot;"
                };
                return map[c];
            });
        }

        function mapLinkHtml(record) {
            var link = String(record.get("link_mappa") || "");
            var gps = String(record.get("posizione_gps") || "");

            if (link.indexOf("https://www.google.com/maps?q=") === 0 || link.indexOf("https://maps.google.") === 0) {
                return "<a href=\"" + escapeHtml(link) + "\">Apri in Maps</a>";
            }

            if (gps) {
                return escapeHtml(gps);
            }

            return "N/D";
        }

        var payload = {
            kind: "stato",
            collection: "stati_viaggio",
            recordId: e.record.id,
            text:
                "Nuovo Aggiornamento Viaggio\n" +
                "Autista: <code>" + escapeHtml(e.record.get("autista") || "Sconosciuto") + "</code>\n" +
                "Stato: " + escapeHtml(e.record.get("stato") || "Non specificato") + "\n" +
                "Orario: " + escapeHtml(e.record.get("orario_locale") || "N/D") + "\n" +
                "Posizione: " + mapLinkHtml(e.record)
        };

        var collection = $app.findCollectionByNameOrId(TELEGRAM_QUEUE_COLLECTION);
        var queueRecord = new Record(collection);

        queueRecord.set("type", "stato");
        queueRecord.set("payload_json", JSON.stringify(payload));
        queueRecord.set("status", "pending");
        queueRecord.set("attempts", 0);
        queueRecord.set("last_error", "");

        $app.save(queueRecord);

        console.log("[telegram] Notifica stato aggiunta in coda:", e.record.id);
    } catch (err) {
        console.error("[telegram] Errore hook stati_viaggio:", err);
    }
}, "stati_viaggio");


onRecordAfterCreateSuccess(function (e) {
    e.next();

    try {
        var TELEGRAM_QUEUE_COLLECTION = "telegram_queue";

        function escapeHtml(value) {
            return String(value || "").replace(/[&<>'"]/g, function (c) {
                var map = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    "\"": "&quot;"
                };
                return map[c];
            });
        }

        function firstFileName(value) {
            if (!value) return "";
            if (Array.isArray(value)) {
                return value.length > 0 ? String(value[0]) : "";
            }
            return String(value);
        }

        function mapLinkHtml(record) {
            var link = String(record.get("link_mappa") || "");
            var gps = String(record.get("posizione_gps") || "");

            if (link.indexOf("https://www.google.com/maps?q=") === 0 || link.indexOf("https://maps.google.") === 0) {
                return "<a href=\"" + escapeHtml(link) + "\">Apri in Maps</a>";
            }

            if (gps) {
                return escapeHtml(gps);
            }

            return "N/D";
        }

        var fileName = firstFileName(e.record.get("foto_foglio"));

        if (!fileName) {
            console.log("[telegram] Documento senza file, notifica saltata:", e.record.id);
            return;
        }

        var payload = {
            kind: "documento",
            collection: "fogli_viaggio",
            recordId: e.record.id,
            fileName: fileName,
            caption:
                "Nuovo Documento Viaggio\n" +
                "Autista: <code>" + escapeHtml(e.record.get("autista") || "Sconosciuto") + "</code>\n" +
                "Orario: " + escapeHtml(e.record.get("orario_locale") || "N/D") + "\n" +
                "Posizione: " + mapLinkHtml(e.record)
        };

        var collection = $app.findCollectionByNameOrId(TELEGRAM_QUEUE_COLLECTION);
        var queueRecord = new Record(collection);

        queueRecord.set("type", "documento");
        queueRecord.set("payload_json", JSON.stringify(payload));
        queueRecord.set("status", "pending");
        queueRecord.set("attempts", 0);
        queueRecord.set("last_error", "");

        $app.save(queueRecord);

        console.log("[telegram] Notifica documento aggiunta in coda:", e.record.id);
    } catch (err) {
        console.error("[telegram] Errore hook fogli_viaggio:", err);
    }
}, "fogli_viaggio");


cronAdd("telegram_queue_worker", "* * * * *", function () {
    var TELEGRAM_QUEUE_COLLECTION = "telegram_queue";
    var PUBLIC_BASE_URL = $os.getenv("PUBLIC_BASE_URL") || "INSERT_URL_HERE";
    var TELEGRAM_BOT_TOKEN = $os.getenv("TELEGRAM_BOT_TOKEN") || "BOT_TOKEN";
    var TELEGRAM_CHAT_ID = $os.getenv("TELEGRAM_CHAT_ID") || "CHAT_ID";
    var MAX_ATTEMPTS = 8;

    function isTelegramConfigured() {
        return TELEGRAM_BOT_TOKEN &&
            TELEGRAM_BOT_TOKEN !== "INSERISCI_QUI_IL_TOKEN_TELEGRAM" &&
            TELEGRAM_CHAT_ID;
    }

    function firstFileName(value) {
        if (!value) return "";
        if (Array.isArray(value)) {
            return value.length > 0 ? String(value[0]) : "";
        }
        return String(value);
    }

    function makeFileUrl(record, fileName) {
        var base = PUBLIC_BASE_URL.replace(/\/$/, "");
        return base + "/api/files/" + record.collection().id + "/" + record.id + "/" + encodeURIComponent(fileName);
    }

    function sendTelegramJson(method, body) {
        if (!isTelegramConfigured()) {
            throw new Error("Telegram non configurato: inserisci TELEGRAM_BOT_TOKEN nel file o nelle variabili ambiente.");
        }

        var res = $http.send({
            url: "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/" + method,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
            timeout: 60
        });

        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error("Telegram HTTP " + res.statusCode + ": " + String(res.raw || res.body || "").slice(0, 500));
        }

        return res;
    }

    function sendStatus(payload) {
        return sendTelegramJson("sendMessage", {
            chat_id: TELEGRAM_CHAT_ID,
            text: payload.text,
            parse_mode: "HTML",
            disable_web_page_preview: false
        });
    }

    function sendDocument(payload) {
        var record = $app.findRecordById(payload.collection, payload.recordId);
        var fileName = firstFileName(payload.fileName || record.get("foto_foglio"));

        if (!fileName) {
            return sendTelegramJson("sendMessage", {
                chat_id: TELEGRAM_CHAT_ID,
                text: payload.caption + "\n\nFile non trovato nel record PocketBase.",
                parse_mode: "HTML",
                disable_web_page_preview: false
            });
        }

        var fileUrl = makeFileUrl(record, fileName);
        var lower = fileName.toLowerCase();

        var isImage =
            lower.indexOf(".jpg") > -1 ||
            lower.indexOf(".jpeg") > -1 ||
            lower.indexOf(".png") > -1 ||
            lower.indexOf(".webp") > -1 ||
            lower.indexOf(".gif") > -1;

        var method = isImage ? "sendPhoto" : "sendDocument";
        var fieldName = isImage ? "photo" : "document";

        var body = {
            chat_id: TELEGRAM_CHAT_ID,
            caption: payload.caption,
            parse_mode: "HTML"
        };

        body[fieldName] = fileUrl;

        return sendTelegramJson(method, body);
    }

    function sendTelegramPayload(payload) {
        if (payload.kind === "stato") {
            return sendStatus(payload);
        }

        if (payload.kind === "documento") {
            return sendDocument(payload);
        }

        throw new Error("Tipo payload sconosciuto: " + payload.kind);
    }

    var queue = [];

    try {
        queue = $app.findRecordsByFilter(
            TELEGRAM_QUEUE_COLLECTION,
            "status = 'pending' || status = 'retry'",
            "created",
            5,
            0
        );
    } catch (err) {
        console.error("[telegram] Cron non attivo o telegram_queue non leggibile:", err);
        return;
    }

    for (var i = 0; i < queue.length; i++) {
        var item = queue[i];
        var attempts = Number(item.get("attempts") || 0);

        try {
            var payload = JSON.parse(String(item.get("payload_json") || "{}"));

            sendTelegramPayload(payload);

            $app.delete(item);

            console.log("[telegram] Notifica inviata e rimossa dalla coda:", payload.kind, payload.recordId);
        } catch (err) {
            var nextAttempts = attempts + 1;

            item.set("attempts", nextAttempts);
            item.set("last_error", String(err).slice(0, 1000));
            item.set("status", nextAttempts >= MAX_ATTEMPTS ? "error" : "retry");

            $app.save(item);

            console.error("[telegram] Invio Telegram fallito. Tentativo:", nextAttempts, "id coda:", item.id, err);
        }
    }
});
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

## 📈 Monitoring & Alerts
This service is actively monitored using a self-hosted **Uptime Kuma** instance. 
It performs health checks every 5 minutes and sends real-time push notifications via a Telegram Bot in case of downtime. 

For more details on the monitoring infrastructure and setup, check out my dedicated repository:
👉 **[Homelab Monitoring with Uptime Kuma](https://github.com/Student13Thirteen/uptimemonitoring)**

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
