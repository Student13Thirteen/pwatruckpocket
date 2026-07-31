# PocketBase schema — PwaTruckPocket

The public demo does not require manual collection creation. PocketBase applies the tracked migration in `pb_migrations/` during startup.

## `users`

Authentication collection for driver login.

```text
name      text required
role      select(driver, office, admin)
language  select(it, ar)
active    bool
```

Public account creation is disabled. The guided setup creates one synthetic demo driver through a local administrator token.

## `stati_viaggio`

```text
autista          text required
stato            text required
orario_locale    text required
posizione_gps    text optional
link_mappa       url optional
note             text optional
client_id        text optional, unique when present
```

Driver-facing list, view and create rules require authentication and require `autista` to match the authenticated user's `name`.

## `fogli_viaggio`

```text
autista          text required
foto_foglio      one JPEG, PNG, WebP or PDF; maximum 15 MB
orario_locale    text required
posizione_gps    text optional
link_mappa       url optional
tipo_documento   text optional
note             text optional
client_id        text optional, unique when present
```

The same driver-scoped rules apply. Update and delete operations are not exposed to drivers by the public demo.

## `telegram_queue`

```text
type          text required
payload_json  text required
status        select(pending, retry, error)
attempts      number
last_error    text optional
```

All API rules are locked. Only server-side PocketBase hooks and superusers may access this collection.

## Idempotency

The browser generates a stable request identifier before sending or queueing an item. A partial unique index on `client_id` prevents a replay from silently creating a second record when the network fails after the server has already accepted the first request.

## Security boundary

Telegram credentials stay in the local `.env` and are read only by the PocketBase hook runtime. They never appear in the PWA template, generated public page, screenshots or synthetic records.
