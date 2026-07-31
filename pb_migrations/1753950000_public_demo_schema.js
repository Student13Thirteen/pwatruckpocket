migrate((app) => {
  function exists(name) {
    try {
      app.findCollectionByNameOrId(name)
      return true
    } catch (_) {
      return false
    }
  }

  if (!exists("users")) {
    const users = new Collection({
      type: "auth",
      name: "users",
      listRule: "id = @request.auth.id",
      viewRule: "id = @request.auth.id",
      createRule: null,
      updateRule: "id = @request.auth.id",
      deleteRule: null,
      fields: [
        { name: "name", type: "text", required: true, max: 120 },
        { name: "role", type: "select", required: true, maxSelect: 1, values: ["driver", "office", "admin"] },
        { name: "language", type: "select", required: true, maxSelect: 1, values: ["it", "ar"] },
        { name: "active", type: "bool", required: false }
      ],
      passwordAuth: {
        enabled: true,
        identityFields: ["email"]
      }
    })
    app.save(users)
  }

  if (!exists("stati_viaggio")) {
    const statuses = new Collection({
      type: "base",
      name: "stati_viaggio",
      listRule: "@request.auth.id != '' && autista = @request.auth.name",
      viewRule: "@request.auth.id != '' && autista = @request.auth.name",
      createRule: "@request.auth.id != '' && autista = @request.auth.name",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "autista", type: "text", required: true, max: 120 },
        { name: "stato", type: "text", required: true, max: 240 },
        { name: "orario_locale", type: "text", required: true, max: 120 },
        { name: "posizione_gps", type: "text", required: false, max: 240 },
        { name: "link_mappa", type: "url", required: false },
        { name: "note", type: "text", required: false, max: 1000 },
        { name: "client_id", type: "text", required: false, max: 120 }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_stati_viaggio_client_id ON stati_viaggio (client_id) WHERE client_id != ''"
      ]
    })
    app.save(statuses)
  }

  if (!exists("fogli_viaggio")) {
    const documents = new Collection({
      type: "base",
      name: "fogli_viaggio",
      listRule: "@request.auth.id != '' && autista = @request.auth.name",
      viewRule: "@request.auth.id != '' && autista = @request.auth.name",
      createRule: "@request.auth.id != '' && autista = @request.auth.name",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "autista", type: "text", required: true, max: 120 },
        {
          name: "foto_foglio",
          type: "file",
          required: true,
          maxSelect: 1,
          maxSize: 15728640,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"]
        },
        { name: "orario_locale", type: "text", required: true, max: 120 },
        { name: "posizione_gps", type: "text", required: false, max: 240 },
        { name: "link_mappa", type: "url", required: false },
        { name: "tipo_documento", type: "text", required: false, max: 120 },
        { name: "note", type: "text", required: false, max: 1000 },
        { name: "client_id", type: "text", required: false, max: 120 }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_fogli_viaggio_client_id ON fogli_viaggio (client_id) WHERE client_id != ''"
      ]
    })
    app.save(documents)
  }

  if (!exists("telegram_queue")) {
    const queue = new Collection({
      type: "base",
      name: "telegram_queue",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "type", type: "text", required: true, max: 80 },
        { name: "payload_json", type: "text", required: true, max: 20000 },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["pending", "retry", "error"] },
        { name: "attempts", type: "number", required: false, min: 0, max: 100 },
        { name: "last_error", type: "text", required: false, max: 2000 }
      ],
      indexes: ["CREATE INDEX idx_telegram_queue_status ON telegram_queue (status)"]
    })
    app.save(queue)
  }
}, (app) => {
  ;["telegram_queue", "fogli_viaggio", "stati_viaggio", "users"].forEach((name) => {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch (_) {
      // Collection already absent.
    }
  })
})
