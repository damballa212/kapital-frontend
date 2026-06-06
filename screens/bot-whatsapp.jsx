// ===== Kontigo · WhatsApp inbox =====
import React from 'react'
import { I } from '../icons.jsx'
import { fetchConversations, fetchWebhookMessages, fetchWebhookMessage, fmtDate } from '../api.js'

function useIsMobile() {
  const [mobile, setMobile] = React.useState(
    () => window.matchMedia('(max-width: 900px)').matches
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const handler = e => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

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
  ERROR:       "Ayuda",
}

// Human-readable flow stages for Gabriel (no technical jargon)
const STAGE_LABELS = {
  received:            { text: "Mensaje recibido",                    ok: true },
  ignored_group:       { text: "Mensaje de grupo ignorado",           ok: null },
  ignored_duplicate:   { text: "Mensaje duplicado ignorado",          ok: null },
  rate_limited:        { text: "Límite de mensajes alcanzado",        ok: false },
  parse_error:         { text: "Mensaje no reconocido",               ok: false },
  rate_updated:        { text: "Tasa actualizada",                    ok: true },
  transaction_created: { text: "Transacción registrada",              ok: true },
  hoy_sent:            { text: "Resumen enviado",                     ok: true },
  yo_sent:             { text: "Resumen enviado",                     ok: true },
  confirmation_sent:   { text: "Confirmación enviada por WhatsApp",   ok: true },
  confirmation_failed: { text: "No se pudo enviar por WhatsApp",      ok: false },
  failed:              { text: "Error al procesar",                   ok: false },
}

function safeParseDetails(d) {
  if (!d) return null
  if (typeof d === 'string') { try { return JSON.parse(d) } catch { return null } }
  return d
}

function stageLabel(stage, status, details) {
  const d = safeParseDetails(details)
  if (stage === 'parsed') {
    // ERROR type = comando #AYUDA (intencional), no es un error real de parseo
    if (d?.type === 'ERROR') return { text: 'Solicitud de ayuda recibida', ok: true }
    if (status === 'failed' || status === 'skipped') return { text: "No se pudo interpretar el mensaje", ok: false }
    const tipo = TYPE_LABELS[d?.type] || d?.type || ''
    return { text: `Identificado como ${tipo.toLowerCase()}`, ok: true }
  }
  if (stage === 'transaction_created' && d?.transactionId) {
    return { text: `TX-${d.transactionId} registrada en el sistema`, ok: true }
  }
  if (stage === 'rate_updated' && d?.tasa) {
    return { text: `Tasa actualizada a ${Number(d.tasa).toLocaleString('es-PY')} Gs/USD`, ok: true }
  }
  return STAGE_LABELS[stage] || { text: stage, ok: status === 'ok' }
}

function initialsFromName(name) {
  return (name || "?").split(/[ @._-]/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase()
}

function formatPhone(chatId) {
  return chatId?.replace("@s.whatsapp.net", "").replace("@g.us", " (grupo)") || chatId
}

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "—", tone: "" }
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>
}

// ─── Panel 1: Contact list ────────────────────────────────────────────────

function ConversationRow({ conv, active, onSelect }) {
  const time = new Date(conv.lastActivity).toTimeString().slice(0, 5)
  const name = conv.userName || formatPhone(conv.chatId)

  return (
    <button className={`inbox-row ${active ? "active" : ""}`} onClick={() => onSelect(conv)}>
      <span className="avatar inbox-avatar">{initialsFromName(name)}</span>
      <span className="inbox-row-main">
        <span className="row between" style={{gap: 8}}>
          <span className="inbox-sender">{name}</span>
          <span className="muted tiny mono">{time}</span>
        </span>
        <span className="inbox-preview">{conv.lastContent}</span>
        <span className="row" style={{gap: 5, marginTop: 6}}>
          <span className="badge">{conv.totalMessages} msgs</span>
          {conv.failedCount > 0 && <span className="badge danger">{conv.failedCount} error{conv.failedCount > 1 ? "es" : ""}</span>}
          {conv.successCount > 0 && <span className="badge green">{conv.successCount} ok</span>}
        </span>
      </span>
    </button>
  )
}

// ─── Panel 2: Message thread ──────────────────────────────────────────────

function ThreadMessage({ message, active, onSelect }) {
  const time = new Date(message.receivedAt).toTimeString().slice(0, 5)
  const isError = ["failed", "confirmation_failed", "parse_error", "rate_limited"].includes(message.status)

  return (
    <div className={`thread-item ${active ? "active" : ""}`} onClick={() => onSelect(message)}>
      {/* Incoming: Gabriel's message (left) */}
      <div className="chat-bubble incoming">
        <div className="chat-bubble-text">{message.content}</div>
        <div className="chat-bubble-time">{time}</div>
      </div>

      {/* Outgoing: bot's response preview (right) */}
      {message.responseText ? (
        <div className={`chat-bubble outgoing ${isError ? "unsent" : ""}`}>
          <div className="chat-bubble-text">{message.responseText.split('\n')[0]}</div>
          <div className="chat-bubble-time">
            {isError ? "⚠ no enviado" : "enviado"}
          </div>
        </div>
      ) : (
        message.parsedType && (
          <div className="chat-bubble outgoing unsent">
            <div className="chat-bubble-text muted tiny">Sin respuesta registrada</div>
          </div>
        )
      )}

      <div className="thread-item-tags">
        {statusBadge(message.status)}
        {message.parsedType && TYPE_LABELS[message.parsedType] && (
          <span className="badge">{TYPE_LABELS[message.parsedType]}</span>
        )}
        {message.transactionId && <span className="badge mono">TX-{message.transactionId}</span>}
      </div>
    </div>
  )
}

// ─── Panel 3: Message detail ──────────────────────────────────────────────

function MessageDetail({ message, detail, loading }) {
  if (!message) {
    return (
      <div className="inbox-empty">
        <I.WhatsApp width="24" height="24"/>
        <div style={{fontSize: 13}}>Seleccioná un mensaje</div>
        <span className="muted tiny">El detalle aparece aquí.</span>
      </div>
    )
  }

  if (loading) return <div className="inbox-empty" style={{fontSize: 13}}>Cargando…</div>

  const events = detail?.events || []

  return (
    <div className="msg-detail">
      {/* Message bubble */}
      <div className="msg-detail-incoming">
        <div className="chat-bubble incoming" style={{maxWidth: "100%"}}>
          <div className="chat-bubble-text">{message.content}</div>
          <div className="chat-bubble-time">{fmtDate(message.receivedAt, true)}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="msg-detail-section">Flujo del mensaje</div>
      <div className="msg-timeline">
        {events.map(ev => {
          const label = stageLabel(ev.stage, ev.status, ev.details)
          const tone = label.ok === false ? "error" : label.ok === true ? "ok" : "neutral"
          return (
            <div key={ev.id} className={`msg-timeline-step ${tone}`}>
              <div className="msg-timeline-pin">
                <span className="msg-timeline-dot"/>
              </div>
              <div className="msg-timeline-body">
                <span className="msg-timeline-text">{label.text}</span>
                <span className="msg-timeline-time">{new Date(ev.createdAt).toTimeString().slice(0, 5)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bot response */}
      {message.responseText && (
        <>
          <div className="msg-detail-section">Respuesta del bot</div>
          <div className="chat-bubble outgoing" style={{maxWidth: "100%", marginLeft: "auto", marginRight: 0}}>
            <div className="chat-bubble-text" style={{whiteSpace: "pre-wrap"}}>{message.responseText}</div>
            {["confirmation_failed", "failed"].includes(message.status) && (
              <div className="chat-bubble-time" style={{color: "var(--danger)"}}>⚠ No se pudo enviar por WhatsApp</div>
            )}
          </div>
        </>
      )}

      {/* Error */}
      {message.errorMessage && (
        <div className="msg-detail-error">
          {message.errorMessage.includes("Evolution API")
            ? "No se pudo enviar la respuesta por WhatsApp. La transacción sí quedó registrada."
            : message.errorMessage}
        </div>
      )}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────

function BotWhatsApp({ rtKeys }) {
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [q, setQ] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  const [conversations, setConversations] = React.useState([])
  const [convsLoading, setConvsLoading] = React.useState(false)
  const [convsError, setConvsError] = React.useState(null)

  const [selectedConv, setSelectedConv] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [msgsLoading, setMsgsLoading] = React.useState(false)

  const [selectedMsg, setSelectedMsg] = React.useState(null)
  const [detail, setDetail] = React.useState(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  // Mobile navigation: which panel is currently visible
  const [mobilePanel, setMobilePanel] = React.useState('list')
  const isMobile = useIsMobile()

  // Inline styles that hide non-active panels on mobile (guaranteed to override CSS)
  const hide = { display: 'none' }
  const listStyle   = isMobile && mobilePanel !== 'list'   ? hide : undefined
  const threadStyle = isMobile && mobilePanel !== 'thread' ? hide : undefined
  const detailStyle = isMobile && mobilePanel !== 'detail' ? hide : undefined

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
    if (!selectedConv) return
    setMsgsLoading(true); setMessages([]); setSelectedMsg(null); setDetail(null)
    fetchWebhookMessages({ chatId: selectedConv.chatId, limit: 100, startDate: sevenDaysAgo, endDate: today })
      .then(res => setMessages(res.data || []))
      .finally(() => setMsgsLoading(false))
  }, [selectedConv?.chatId, refreshKey, rtKeys?.webhook])

  // Load detail for selected message
  React.useEffect(() => {
    if (!selectedMsg) return
    setDetail(null); setDetailLoading(true)
    fetchWebhookMessage(selectedMsg.id)
      .then(setDetail)
      .finally(() => setDetailLoading(false))
  }, [selectedMsg?.id])

  const setupRequired = /pendiente de migracion|503/.test(convsError || "")

  return (
    <div className="content inbox-content">
      <div className="inbox-shell-3">

        {/* ── Panel 1: Contacts ── */}
        <aside className="inbox-list" style={listStyle}>
          <div className="inbox-toolbar">
            <div className="input inbox-search">
              <I.Search width="13" height="13"/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar contacto…"/>
            </div>
            <button className="btn icon" title="Actualizar" onClick={() => setRefreshKey(k => k + 1)}>
              <I.Refresh width="14" height="14"/>
            </button>
          </div>

          {setupRequired && <div className="inbox-setup">Falta aplicar la migración del monitor WhatsApp.</div>}
          {convsError && !setupRequired && (
            <div className="inbox-setup" style={{color: "var(--danger)", borderColor: "var(--danger)"}}>{convsError}</div>
          )}

          <div className="inbox-list-scroll">
            {convsLoading && <div className="inbox-empty">Cargando…</div>}
            {!convsLoading && !convsError && conversations.length === 0 && (
              <div className="inbox-empty">Sin actividad en los últimos 7 días</div>
            )}
            {!convsLoading && conversations.map(conv => (
              <ConversationRow
                key={conv.chatId}
                conv={conv}
                active={selectedConv?.chatId === conv.chatId}
                onSelect={c => { setSelectedConv(c); setSelectedMsg(null); setDetail(null); setMobilePanel('thread') }}
              />
            ))}
          </div>
        </aside>

        {/* ── Panel 2: Thread ── */}
        <section className="inbox-thread-panel" style={threadStyle}>
          {!selectedConv ? (
            <div className="inbox-empty">
              <I.WhatsApp width="28" height="28"/>
              <div>Seleccioná un contacto</div>
            </div>
          ) : (
            <>
              <div className="inbox-thread-header">
                <button className="inbox-back" onClick={() => setMobilePanel('list')} title="Volver a contactos">
                  <I.ChevronLeft width="18" height="18"/>
                </button>
                <span className="avatar" style={{width:30,height:30,fontSize:11}}>{initialsFromName(selectedConv.userName || formatPhone(selectedConv.chatId))}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{selectedConv.userName || formatPhone(selectedConv.chatId)}</div>
                  <div className="muted tiny mono">{formatPhone(selectedConv.chatId)}</div>
                </div>
              </div>
              <div className="inbox-thread-scroll">
                {msgsLoading && <div className="inbox-empty" style={{padding:24}}>Cargando…</div>}
                {!msgsLoading && messages.slice().reverse().map(m => (
                  <ThreadMessage
                    key={m.id}
                    message={m}
                    active={selectedMsg?.id === m.id}
                    onSelect={msg => { setSelectedMsg(msg); setMobilePanel('detail') }}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── Panel 3: Detail ── */}
        <section className="inbox-detail-panel" style={detailStyle}>
          <div className="inbox-detail-mobile-header">
            <button className="inbox-back" onClick={() => setMobilePanel('thread')} title="Volver al chat">
              <I.ChevronLeft width="18" height="18"/>
            </button>
            <span className="inbox-detail-mobile-title">
              {selectedMsg ? selectedMsg.content.slice(0, 40) : 'Detalle'}
            </span>
          </div>
          <MessageDetail message={selectedMsg} detail={detail} loading={detailLoading}/>
        </section>

      </div>
    </div>
  )
}

export default BotWhatsApp
