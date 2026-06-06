// ===== Kontigo · WhatsApp inbox =====
import React from 'react'
import { I } from '../icons.jsx'
import { fetchConversations, fetchWebhookMessages, fmtDate } from '../api.js'

const STATUS_META = {
  received:            { label: "Recibido",      tone: "" },
  ignored_group:       { label: "Grupo",         tone: "" },
  ignored_duplicate:   { label: "Duplicado",     tone: "" },
  rate_limited:        { label: "Limitado",      tone: "danger" },
  parse_error:         { label: "No entendido",  tone: "danger" },
  rate_updated:        { label: "Tasa",          tone: "green" },
  transaction_created: { label: "TX creada",     tone: "green" },
  confirmation_sent:   { label: "Enviado",       tone: "green" },
  confirmation_failed: { label: "Sin confirmar", tone: "danger" },
  failed:              { label: "Falló",         tone: "danger" },
}

const TYPE_LABELS = {
  TRANSACCION: "Transacción",
  TASA:        "Tasa",
  HOY:         "Resumen hoy",
  YO:          "Resumen yo",
  ERROR:       "Ayuda / Error",
}

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "—", tone: "" }
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>
}

function initialsFromName(name) {
  return (name || "?").split(/[ @._-]/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase()
}

function formatPhone(chatId) {
  return chatId?.replace("@s.whatsapp.net", "").replace("@g.us", " (grupo)") || chatId
}

// ─── Conversation list item ────────────────────────────────────────────────

function ConversationRow({ conv, active, onSelect }) {
  const time = new Date(conv.lastActivity).toTimeString().slice(0, 5)
  const name = conv.userName || formatPhone(conv.chatId)
  const initials = initialsFromName(name)
  const lastMeta = STATUS_META[conv.lastStatus] || { tone: "" }

  return (
    <button className={`inbox-row ${active ? "active" : ""}`} onClick={() => onSelect(conv)}>
      <span className="avatar inbox-avatar">{initials}</span>
      <span className="inbox-row-main">
        <span className="row between" style={{gap: 8}}>
          <span className="inbox-sender">{name}</span>
          <span className="muted tiny mono">{time}</span>
        </span>
        <span className="inbox-preview">{conv.lastContent}</span>
        <span className="row" style={{gap: 6, marginTop: 7}}>
          <span className="badge">{conv.totalMessages} msg</span>
          {conv.failedCount > 0 && <span className="badge danger">{conv.failedCount} error</span>}
          {conv.successCount > 0 && <span className="badge green">{conv.successCount} ok</span>}
        </span>
      </span>
    </button>
  )
}

// ─── Message bubble in thread ──────────────────────────────────────────────

function MessageBubble({ message }) {
  const time = fmtDate(message.receivedAt, true)
  const typeMeta = TYPE_LABELS[message.parsedType]
  const isError = ["failed", "confirmation_failed", "parse_error", "rate_limited"].includes(message.status)

  // Extract clean error text
  let errorText = message.errorMessage
  if (errorText) {
    // Try to extract just the Evolution API status line
    const match = errorText.match(/Evolution API error (\d+)/)
    if (match) errorText = `Sin respuesta por WhatsApp (Evolution API ${match[1]})`
  }

  return (
    <div className="msg-bubble-wrap">
      <div className="msg-bubble">
        <div className="msg-content">{message.content}</div>
        <div className="msg-meta">
          <span className="muted tiny mono">{time}</span>
        </div>
      </div>

      <div className="msg-tags">
        {statusBadge(message.status)}
        {typeMeta && <span className="badge">{typeMeta}</span>}
        {message.transactionId && (
          <span className="badge mono">TX-{message.transactionId}</span>
        )}
        {message.durationMs != null && (
          <span className="muted tiny">{Math.round(message.durationMs)} ms</span>
        )}
      </div>

      {isError && errorText && (
        <div className="msg-error">{errorText}</div>
      )}
    </div>
  )
}

// ─── Thread (right panel) ─────────────────────────────────────────────────

function ConversationThread({ conv, messages, loading, error }) {
  if (!conv) {
    return (
      <div className="inbox-empty">
        <I.WhatsApp width="28" height="28"/>
        <div>Seleccioná un contacto</div>
        <span className="muted tiny">Los mensajes aparecen aquí.</span>
      </div>
    )
  }

  const name = conv.userName || formatPhone(conv.chatId)
  const phone = formatPhone(conv.chatId)

  return (
    <div className="inbox-thread">
      <div className="inbox-detail-head">
        <div className="row" style={{gap: 10, minWidth: 0}}>
          <span className="avatar">{initialsFromName(name)}</span>
          <div style={{minWidth: 0}}>
            <div style={{fontWeight: 600}}>{name}</div>
            <div className="muted tiny mono">{phone}</div>
          </div>
        </div>
        <span className="muted tiny">{conv.totalMessages} mensajes</span>
      </div>

      <div className="inbox-thread-scroll">
        {loading && <div className="inbox-empty" style={{padding: 24}}>Cargando…</div>}
        {!loading && error && <div className="inbox-empty" style={{color: "var(--danger)", padding: 24}}>{error}</div>}
        {!loading && !error && messages.length === 0 && (
          <div className="inbox-empty" style={{padding: 24}}>Sin mensajes en el período.</div>
        )}
        {!loading && messages.slice().reverse().map(m => (
          <MessageBubble key={m.id} message={m}/>
        ))}
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────

function BotWhatsApp({ rtKeys }) {
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [q, setQ] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Conversations list
  const [conversations, setConversations] = React.useState([])
  const [convsLoading, setConvsLoading] = React.useState(false)
  const [convsError, setConvsError] = React.useState(null)

  // Selected conversation + its messages
  const [selected, setSelected] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [msgsLoading, setMsgsLoading] = React.useState(false)
  const [msgsError, setMsgsError] = React.useState(null)

  // Load conversations
  React.useEffect(() => {
    setConvsLoading(true); setConvsError(null)
    fetchConversations({ startDate: sevenDaysAgo, endDate: today, q: q || undefined })
      .then(res => setConversations(res.data || []))
      .catch(e => setConvsError(e.message))
      .finally(() => setConvsLoading(false))
  }, [q, refreshKey, rtKeys?.webhook])

  // Load messages for selected conversation
  React.useEffect(() => {
    if (!selected) return
    setMsgsLoading(true); setMsgsError(null); setMessages([])
    fetchWebhookMessages({
      chatId: selected.chatId,
      limit: 100,
      startDate: sevenDaysAgo,
      endDate: today,
    })
      .then(res => setMessages(res.data || []))
      .catch(e => setMsgsError(e.message))
      .finally(() => setMsgsLoading(false))
  }, [selected?.chatId, refreshKey, rtKeys?.webhook])

  const setupRequired = /pendiente de migracion|503/.test(convsError || "")

  return (
    <div className="content inbox-content">
      <div className="inbox-shell">
        {/* ── Left: conversation list ── */}
        <aside className="inbox-list">
          <div className="inbox-toolbar">
            <div className="input inbox-search">
              <I.Search width="13" height="13"/>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar contacto…"
              />
            </div>
            <button className="btn icon" title="Actualizar" onClick={() => setRefreshKey(k => k + 1)}>
              <I.Refresh width="14" height="14"/>
            </button>
          </div>

          {setupRequired && (
            <div className="inbox-setup">
              Falta aplicar la migración del monitor WhatsApp en la base de producción.
            </div>
          )}
          {convsError && !setupRequired && (
            <div className="inbox-setup" style={{color: "var(--danger)", borderColor: "var(--danger)"}}>
              {convsError}
            </div>
          )}

          <div className="inbox-list-scroll">
            {convsLoading && <div className="inbox-empty">Cargando contactos…</div>}
            {!convsLoading && !convsError && conversations.length === 0 && (
              <div className="inbox-empty">Sin actividad en los últimos 7 días</div>
            )}
            {!convsLoading && conversations.map(conv => (
              <ConversationRow
                key={conv.chatId}
                conv={conv}
                active={selected?.chatId === conv.chatId}
                onSelect={c => { setSelected(c); setMessages([]) }}
              />
            ))}
          </div>
        </aside>

        {/* ── Right: thread ── */}
        <section className="inbox-reader">
          <ConversationThread
            conv={selected}
            messages={messages}
            loading={msgsLoading}
            error={msgsError}
          />
        </section>
      </div>
    </div>
  )
}

export default BotWhatsApp
