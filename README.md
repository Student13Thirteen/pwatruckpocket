# pwatruckpocket
A Progressive Web App for fleet management. Built with PocketBase, featuring offline support and automated Telegram alerts

# 🚚 Fleet Driver Management PWA

An offline-first Progressive Web Application (PWA) built to digitize and automate daily trip logs for company drivers. Powered by a lightweight **PocketBase** backend and integrated with **Telegram APIs** for real-time dispatch notifications.

## ✨ Key Features

- **📱 PWA & Offline-Ready:** Fully installable on iOS/Android devices. Uses Service Workers (`sw.js`) to cache assets and allow the app to load even in dead zones.
- **🔐 Secure Authentication:** Built-in user login leveraging PocketBase's auth store.
- **📄 Document Uploads:** Drivers can directly upload trip logs, delivery notes, and PDF files from their smartphones.
- **🤖 Telegram Automation:** Whenever a new trip log is submitted, the app automatically triggers a Telegram Bot to send a real-time push notification to the dispatch group chat.
- **⚡ Lightweight Backend:** Designed to run on a self-hosted PocketBase instance (SQLite + Go), requiring zero complex server configuration.

## 🛠️ Tech Stack

- **Frontend:** Pure HTML5, Vanilla JavaScript, CSS3
- **PWA:** Web App Manifest, Service Workers
- **Backend / BaaS:** [PocketBase](https://pocketbase.io/)
- **Integrations:** Telegram Bot API

## 🚀 How to Run Locally

Since the frontend is completely decoupled, you can run this app locally in just a few steps:

1. Download the latest version of [PocketBase](https://pocketbase.io/).
2. Clone this repository into the `pb_public` directory of your PocketBase installation:
   ```bash
   git clone https://github.com/Student13Thirteen/pwatruckpocket.git pb_public
   ```
3. Start the PocketBase server:
   ```bash
   ./pocketbase serve
   ```
4. Open your browser and navigate to `http://127.0.0.1:8090`.

### ⚙️ Environment Setup
To enable Telegram notifications, open the code and replace the dummy strings with your actual Telegram Bot credentials:
```javascript
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const CHAT_ID = "YOUR_CHAT_ID_HERE";
```

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
