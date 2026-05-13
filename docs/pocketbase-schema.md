# PocketBase Schema — PwaTruckPocket

## Collections

### `users`

PocketBase auth collection used for driver login.

Recommended custom fields:

```text
name text
role select(driver, office, admin)
language select(it, ar)
active bool
```

### `stati_viaggio`

Stores trip status updates.

```text
autista          text
stato            text
orario_locale    text
posizione_gps    text
link_mappa       url
note             text optional
```

Recommended rule: authenticated drivers can create records.

### `fogli_viaggio`

Stores uploaded trip documents.

```text
autista          text
foto_foglio      file
orario_locale    text
posizione_gps    text
link_mappa       url
tipo_documento   text optional
note             text optional
```

Recommended rule: authenticated drivers can create records.

### `telegram_queue`

Internal collection used by server-side hooks.

```text
type          text required
payload_json  text required
status        text required
attempts      number default 0
last_error    text optional
```

Recommended rules: superusers only. Drivers should not access this collection directly.

## Security note

Telegram secrets must stay server-side in `.env`. They must never appear in `index.html`, browser code or screenshots.
