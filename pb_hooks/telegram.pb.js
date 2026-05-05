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
