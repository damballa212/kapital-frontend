// ===== Kontigo · WhatsApp inbox =====
import React from 'react'
import { I } from '../icons.jsx'
import { fetchWebhookMessages, fetchWebhookMessage, fmtDate } from '../api.js'

const STATUS_META = {
  received: { label: "Recibido", tone: "" },
  ignored_group: { label: "Ignorado", tone: "" },
  rate_limited: { label: "Limitado", tone: "danger" },
  parse_error: { label: "No entendido", tone: "danger" },
  rate_updated: { label: "Tasa", tone: "green" },
  transaction_created: { label: "TX creada", tone: "green" },
  confirmation_sent: { label: "Completado", tone: "green" },
  confirmation_failed: { label: "Sin confirmar", tone: "danger" },
  failed: { label: "Falló", tone: "danger" },
};

const TYPE_LABELS = {
  TRANSACCION: "Transacción",
  TASA: "Tasa",
  HOY: "Resumen hoy",
  YO: "Resumen yo",
  ERROR: "Error",
  AYUDA: "Ayuda",
};

const INBOX_FILTERS = [
  { id: "", label: "Todos" },
  { id: "parse_error", label: "No entendidos" },
  { id: "confirmation_failed", label: "Sin confirmar" },
  { id: "failed", label: "Fallidos" },
  { id: "confirmation_sent", label: "Completados" },
];

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "—", tone: "" };
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function initialsFromMessage(message) {
  const source = message.userName || message.chatId || "?";
  return source.split(/[ @._-]/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

function MessageRow({ message, active, onSelect }) {
  const time = new Date(message.receivedAt).toTimeString().slice(0, 5);
  const sender = message.userName || "Sin nombre";
  const preview = message.errorMessage || message.content;

  return (
    <button className={`inbox-row ${active ? "active" : ""}`} onClick={() => onSelect(message)}>
      <span className="avatar inbox-avatar">{initialsFromMessage(message)}</span>
      <span className="inbox-row-main">
        <span className="row between" style={{gap:8}}>
          <span className="inbox-sender">{sender}</span>
          <span className="muted tiny mono">{time}</span>
        </span>
        <span className="inbox-preview">{preview}</span>
        <span className="row" style={{gap:6, marginTop:7}}>
          {statusBadge(message.status)}
          <span className="badge">{TYPE_LABELS[message.parsedType] || "Entrada"}</span>
          {message.transactionId && <span className="badge mono">TX-{message.transactionId}</span>}
        </span>
      </span>
    </button>
  );
}

function Timeline({ events }) {
  if (!events?.length) {
    return <div className="muted tiny" style={{padding:14}}>Sin eventos registrados.</div>;
  }

  return (
    <div className="inbox-timeline">
      {events.map(ev => (
        <div key={ev.id} className="inbox-event">
          <span className={`inbox-event-dot ${ev.status}`}/>
          <div>
            <div className="row between" style={{gap:12}}>
              <span style={{fontWeight:500}}>{ev.stage}</span>
              <span className="muted tiny mono">{fmtDate(ev.createdAt, true)}</span>
            </div>
            {ev.details && Object.keys(ev.details).length > 0 && (
              <pre className="inbox-json">{JSON.stringify(ev.details, null, 2)}</pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxDetail({ selected, detail, loading, error }) {
  if (!selected) {
    return (
      <div className="inbox-empty">
        <I.WhatsApp width="28" height="28"/>
        <div>Seleccioná un mensaje</div>
        <span className="muted tiny">El detalle del flujo aparece aquí.</span>
      </div>
    );
  }

  if (loading) {
    return <div className="inbox-empty">Cargando mensaje…</div>;
  }

  if (error) {
    return (
      <div className="inbox-empty" style={{color:"var(--danger)"}}>
        {error}
      </div>
    );
  }

  const message = detail?.message || selected;

  return (
    <div className="inbox-detail">
      <div className="inbox-detail-head">
        <div className="row" style={{gap:10, minWidth:0}}>
          <span className="avatar">{initialsFromMessage(message)}</span>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              {message.userName || "Sin nombre"}
            </div>
            <div className="muted tiny mono" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              {message.chatId}
            </div>
          </div>
        </div>
        {statusBadge(message.status)}
      </div>

      <div className="inbox-message-bubble">
        <div style={{whiteSpace:"pre-wrap", lineHeight:1.45}}>{message.content}</div>
        <div className="muted tiny mono" style={{marginTop:10}}>{fmtDate(message.receivedAt, true)}</div>
      </div>

      <div className="inbox-detail-grid">
        <div><span className="muted tiny">Tipo</span><strong>{TYPE_LABELS[message.parsedType] || "Entrada"}</strong></div>
        <div><span className="muted tiny">Etapa</span><strong>{message.flowStage}</strong></div>
        <div><span className="muted tiny">Duración</span><strong>{message.durationMs ? `${Math.round(message.durationMs)} ms` : "—"}</strong></div>
        <div><span className="muted tiny">Transacción</span><strong>{message.transactionId ? `TX-${message.transactionId}` : "—"}</strong></div>
      </div>

      {message.errorMessage && (
        <div className="inbox-error">
          {message.errorMessage}
        </div>
      )}

      <div className="inbox-section-title">Flujo</div>
      <Timeline events={detail?.events || []}/>
    </div>
  );
}

function BotWhatsApp() {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [status, setStatus] = React.useState("");
  const [q, setQ] = React.useState("");
  const [dateFrom] = React.useState(sevenDaysAgo);
  const [dateTo] = React.useState(today);
  const [page, setPage] = React.useState(1);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true); setError(null);
    fetchWebhookMessages({
      page,
      limit: 50,
      startDate: dateFrom,
      endDate: dateTo,
      status: status || undefined,
      q: q || undefined,
    })
      .then(res => {
        setResult(res);
        if (!selected && res.data?.length) setSelected(res.data[0]);
      })
      .catch(e => {
        setResult(null);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [page, status, q, refreshKey]);

  React.useEffect(() => {
    if (!selected) return;
    setDetail(null); setDetailError(null); setDetailLoading(true);
    fetchWebhookMessage(selected.id)
      .then(setDetail)
      .catch(e => setDetailError(e.message))
      .finally(() => setDetailLoading(false));
  }, [selected?.id]);

  function applyStatus(nextStatus) {
    setStatus(nextStatus);
    setPage(1);
  }

  const messages = result?.data || [];
  const pagination = result?.pagination;
  const setupRequired = /pendiente de migracion|503/.test(error || "");

  return (
    <div className="content inbox-content">
      <div className="inbox-shell">
        <aside className="inbox-list">
          <div className="inbox-toolbar">
            <div className="input inbox-search">
              <I.Search width="13" height="13"/>
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Buscar mensajes…"
              />
            </div>
            <button className="btn icon" title="Actualizar" onClick={() => setRefreshKey(k => k + 1)}>
              <I.Refresh width="14" height="14"/>
            </button>
          </div>

          <div className="inbox-tabs">
            {INBOX_FILTERS.map(f => (
              <button key={f.id || "all"} className={status === f.id ? "active" : ""} onClick={() => applyStatus(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {setupRequired && (
            <div className="inbox-setup">
              Falta aplicar la migración del monitor WhatsApp en la base de producción.
            </div>
          )}

          {error && !setupRequired && (
            <div className="inbox-setup" style={{color:"var(--danger)", borderColor:"var(--danger)"}}>
              {error}
            </div>
          )}

          <div className="inbox-list-scroll">
            {loading && <div className="inbox-empty">Cargando mensajes…</div>}
            {!loading && !error && messages.length === 0 && <div className="inbox-empty">Sin mensajes</div>}
            {!loading && messages.map(m => (
              <MessageRow
                key={m.id}
                message={m}
                active={selected?.id === m.id}
                onSelect={setSelected}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="inbox-pager">
              <button className="btn" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>Anterior</button>
              <span className="muted tiny">Página {pagination.page}/{pagination.totalPages}</span>
              <button className="btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Siguiente</button>
            </div>
          )}
        </aside>

        <section className="inbox-reader">
          <InboxDetail selected={selected} detail={detail} loading={detailLoading} error={detailError}/>
        </section>
      </div>
    </div>
  );
}

export default BotWhatsApp
