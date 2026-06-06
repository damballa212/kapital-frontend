// ===== Kontigo · Reports screen =====
import React from 'react'
import { I } from '../icons.jsx'
import {
  fmtUSD as fU, fmtGs as fG, fmtDate as fD,
  downloadExport, fetchExportPreview, fetchExportPresets, saveExportPreset, deleteExportPreset,
  fetchCollaborators, fetchClients,
} from '../api.js'
import { getDatePresets } from '../utils/datePresets.js'

const ALL_FIELDS = [
  { key: "id",                  label: "ID" },
  { key: "fecha",               label: "Fecha" },
  { key: "cliente",             label: "Cliente" },
  { key: "colaborador",         label: "Colaborador" },
  { key: "usd_total",           label: "USD Total" },
  { key: "comision",            label: "Comisión %" },
  { key: "usd_neto",            label: "USD Neto" },
  { key: "monto_gs",            label: "Monto Gs" },
  { key: "com_colaborador_usd", label: "Com. Colaborador USD" },
  { key: "com_gabriel_usd",     label: "Com. Gabriel USD" },
  { key: "com_colaborador_gs",  label: "Com. Colaborador Gs" },
  { key: "com_gabriel_gs",      label: "Com. Gabriel Gs" },
  { key: "tasa_usada",          label: "Tasa Usada" },
  { key: "observaciones",       label: "Observaciones" },
];

const DEFAULT_FIELDS = ["fecha","cliente","colaborador","usd_total","comision","usd_neto","monto_gs","com_gabriel_usd","tasa_usada"];

function Reports() {
  const today    = new Date().toISOString().split("T")[0];
  const firstDay = today.slice(0,8) + "01";

  const [from,       setFrom]       = React.useState(firstDay);
  const [to,         setTo]         = React.useState(today);
  const [colab,      setColab]      = React.useState("");
  const [cliente,    setCliente]    = React.useState("");
  const [minAmount,  setMinAmount]  = React.useState("");
  const [maxAmount,  setMaxAmount]  = React.useState("");
  const [fields, setFields] = React.useState(DEFAULT_FIELDS);
  const [fmt, setFmt] = React.useState("excel");
  const [loading, setLoading] = React.useState(false);
  const [preview,        setPreview]        = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [presets,      setPresets]      = React.useState([]);
  const [collabs,      setCollabs]      = React.useState([]);
  const [saveModal,    setSaveModal]    = React.useState(false);
  const [presetName,   setPresetName]   = React.useState("");
  const [savingPreset, setSavingPreset] = React.useState(false);

  const [clientSuggestions, setClientSuggestions] = React.useState([]);
  const [showSuggestions,   setShowSuggestions]   = React.useState(false);
  const clientRef = React.useRef(null);

  React.useEffect(() => {
    fetchExportPresets().then(setPresets).catch(() => {});
    fetchCollaborators()
      .then(res => setCollabs(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setPreviewLoading(true);
    setPreview(null);
    const t = setTimeout(() => {
      fetchExportPreview({ startDate: from, endDate: to, colaborador: colab || undefined, cliente: cliente || undefined, minAmount: minAmount || undefined, maxAmount: maxAmount || undefined })
        .then(setPreview)
        .catch(() => {})
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [from, to, colab, cliente, minAmount, maxAmount]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (cliente.trim().length >= 2) {
        fetchClients(cliente).then(res => {
          setClientSuggestions(Array.isArray(res) ? res : []);
          setShowSuggestions(true);
        }).catch(() => {});
      } else {
        setClientSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [cliente]);

  React.useEffect(() => {
    function onClickOutside(e) {
      if (clientRef.current && !clientRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggleField(key) {
    setFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function selectAllFields()   { setFields(ALL_FIELDS.map(f => f.key)); }
  function selectDefaultFields(){ setFields(DEFAULT_FIELDS); }

  async function handleDownload() {
    if (!fields.length) { alert("Seleccioná al menos un campo."); return; }
    setLoading(true);
    try {
      await downloadExport({ format: fmt, startDate: from, endDate: to, colaborador: colab || undefined, cliente: cliente || undefined, minAmount: minAmount || undefined, maxAmount: maxAmount || undefined, fields });
    } catch(e) { alert("Error al exportar: " + e.message); }
    finally { setLoading(false); }
  }

  async function handleSavePreset() {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    try {
      const config = { from, to, colab, cliente, minAmount, maxAmount, fields, fmt };
      const saved = await saveExportPreset(presetName.trim(), config);
      setPresets(prev => [saved, ...prev]);
      setSaveModal(false);
      setPresetName("");
    } catch(e) { alert("Error al guardar: " + e.message); }
    finally { setSavingPreset(false); }
  }

  function applyPreset(p) {
    const c = p.config;
    if (c.from)       setFrom(c.from);
    if (c.to)         setTo(c.to);
    if (c.colab   !== undefined) setColab(c.colab);
    if (c.cliente !== undefined) setCliente(c.cliente);
    if (c.minAmount !== undefined) setMinAmount(c.minAmount);
    if (c.maxAmount !== undefined) setMaxAmount(c.maxAmount);
    if (c.fields)     setFields(c.fields);
    if (c.fmt)        setFmt(c.fmt);
  }

  async function handleDeletePreset(id) {
    await deleteExportPreset(id).catch(() => {});
    setPresets(prev => prev.filter(p => p.id !== id));
  }

  function applyDatePreset(f, t) { setFrom(f); setTo(t); }
  const datePresets = getDatePresets();

  return (
    <div className="content">
      <div className="grid grid-split" style={{gap:18, alignItems:"start"}}>

        {/* ── Columna izquierda: configuración ── */}
        <div style={{display:"flex", flexDirection:"column", gap:14}}>

          <div className="card" style={{padding:16}}>
            <div className="row between" style={{marginBottom: presets.length ? 10 : 0}}>
              <div className="card-title" style={{fontSize:13}}>Configuraciones guardadas</div>
              <button className="btn ghost" style={{fontSize:11, padding:"3px 10px"}} onClick={() => setSaveModal(true)}>
                + Guardar actual
              </button>
            </div>
            {presets.length === 0 ? (
              <div className="muted tiny" style={{padding:"6px 0"}}>Ninguna guardada aún — configurá los filtros y presioná "+ Guardar actual".</div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:6}}>
                {presets.map(p => (
                  <div key={p.id} className="row between" style={{padding:"8px 10px", background:"var(--bg-soft)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontWeight:500, fontSize:13}}>{p.name}</div>
                      <div className="muted tiny">{p.config.fmt?.toUpperCase()} · {p.config.fields?.length ?? "—"} campos</div>
                    </div>
                    <div className="row" style={{gap:6}}>
                      <button className="btn ghost" style={{padding:"4px 10px", fontSize:12}} onClick={() => applyPreset(p)}>Aplicar</button>
                      <button className="btn ghost" style={{padding:"4px 8px", color:"var(--danger)"}} onClick={() => handleDeletePreset(p.id)}>
                        <I.X width="11" height="11"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{padding:18}}>
            <div className="card-title" style={{fontSize:13, marginBottom:12}}>1 · Filtros</div>
            <div className="row wrap" style={{gap:6, marginBottom:10}}>
              {datePresets.map(([label, f, t]) => (
                <button key={label} className={`btn${f===from&&t===to?" primary":""}`}
                  style={{fontSize:12, padding:"4px 10px"}}
                  onClick={() => applyDatePreset(f, t)}>{label}</button>
              ))}
            </div>
            <div className="grid grid-2" style={{gap:10, marginBottom:12}}>
              <div className="field">
                <label className="field-label">Desde</label>
                <input className="input mono" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">Hasta</label>
                <input className="input mono" type="date" value={to} onChange={e=>setTo(e.target.value)}/>
              </div>
            </div>
            <div className="grid grid-2" style={{gap:10, marginBottom:12}}>
              <div className="field">
                <label className="field-label">Colaborador</label>
                <select className="select" value={colab} onChange={e=>setColab(e.target.value)}>
                  <option value="">Todos</option>
                  {collabs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="field" style={{position:"relative"}} ref={clientRef}>
                <label className="field-label">Cliente</label>
                <input className="input" type="text" value={cliente}
                  onChange={e => { setCliente(e.target.value); }}
                  onFocus={() => { if (clientSuggestions.length) setShowSuggestions(true); }}
                  placeholder="Buscar cliente…"
                  autoComplete="off"/>
                {showSuggestions && clientSuggestions.length > 0 && (
                  <div style={{position:"absolute", top:"100%", left:0, right:0, zIndex:20, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", boxShadow:"0 4px 12px rgba(0,0,0,0.1)", marginTop:2, maxHeight:200, overflowY:"auto"}}>
                    {clientSuggestions.map(c => (
                      <button key={c.name} onMouseDown={e => { e.preventDefault(); setCliente(c.name); setShowSuggestions(false); }}
                        style={{display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"8px 12px", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontSize:13, color:"var(--text)"}}>
                        <span>{c.name}</span>
                        <span className="muted tiny">{c.txCount} tx</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-2" style={{gap:10}}>
              <div className="field">
                <label className="field-label">Monto mín. USD</label>
                <input className="input mono" type="number" min="0" value={minAmount} onChange={e=>setMinAmount(e.target.value)} placeholder="0.00"/>
              </div>
              <div className="field">
                <label className="field-label">Monto máx. USD</label>
                <input className="input mono" type="number" min="0" value={maxAmount} onChange={e=>setMaxAmount(e.target.value)} placeholder="∞"/>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:18}}>
            <div className="reports-column-header">
              <div className="card-title" style={{fontSize:13}}>2 · Columnas a incluir</div>
              <div className="row" style={{gap:6}}>
                <button className="btn ghost" style={{fontSize:11, padding:"3px 8px"}} onClick={selectDefaultFields}>Por defecto</button>
                <button className="btn ghost" style={{fontSize:11, padding:"3px 8px"}} onClick={selectAllFields}>Todas</button>
              </div>
            </div>
            <div className="reports-field-grid">
              {ALL_FIELDS.map(f => (
                <label key={f.key} style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13}}>
                  <input type="checkbox" checked={fields.includes(f.key)} onChange={() => toggleField(f.key)}
                    style={{accentColor:"var(--accent)", width:14, height:14}}/>
                  <span style={{color: fields.includes(f.key) ? "var(--text)" : "var(--text-muted)"}}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:18}}>
            <div className="card-title" style={{fontSize:13, marginBottom:12}}>3 · Formato</div>
            <div className="reports-format-grid">
              {[["csv","CSV","Texto plano"],["excel","Excel","3 hojas + totales"],["pdf","PDF","Profesional"]].map(([k, name, sub]) => (
                <button key={k} className="btn reports-format-option" onClick={() => setFmt(k)}
                  style={{
                    background: fmt===k ? "var(--accent-dim)" : "var(--surface)",
                    borderColor: fmt===k ? "var(--accent)"    : "var(--border)",
                    color:       fmt===k ? "var(--accent)"    : "var(--text)"}}>
                  <div style={{fontWeight:600, fontSize:13}}>{name}</div>
                  <div className="tiny" style={{color: fmt===k ? "var(--accent)" : "var(--text-muted)"}}>{sub}</div>
                </button>
              ))}
            </div>
            <div className="reports-action-row">
              <button className="btn primary" onClick={handleDownload} disabled={loading || !fields.length}
                style={{flex:1, justifyContent:"center", padding:"10px 14px", fontSize:14, opacity: loading ? 0.7 : 1}}>
                <I.Download width="14" height="14"/> {loading ? "Generando…" : "Descargar reporte"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: preview real ── */}
        <div className="card flush reports-preview">
          <div className="card-header">
            <div>
              <div className="card-title">Vista previa</div>
              <div className="card-sub">{from.split("-").reverse().join("/")} → {to.split("-").reverse().join("/")}</div>
            </div>
            <I.Receipt width="16" height="16" style={{color:"var(--text-dim)"}}/>
          </div>
          <div className="card-body">
            {previewLoading && (
              <div className="muted tiny" style={{padding:"20px 0", textAlign:"center"}}>Calculando…</div>
            )}
            {!previewLoading && preview && (
              <>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:28, fontWeight:600, letterSpacing:"-0.02em", lineHeight:1}}>
                    {preview.total.toLocaleString("es-PY")}
                  </div>
                  <div className="muted tiny" style={{marginTop:4}}>transacciones en el rango</div>
                </div>
                <div className="grid" style={{gap:0}}>
                  <div className="kv"><span className="kv-label">USD movido</span><span className="kv-val">{fU(preview.totalUsd, true)}</span></div>
                  <div className="kv"><span className="kv-label">Gs entregados</span><span className="kv-val">{fG(preview.totalGs)} Gs</span></div>
                  <div className="kv"><span className="kv-label">Comisión Gabriel</span><span className="kv-val">{fU(preview.comisionGabrielUsd, true)}</span></div>
                </div>
                <div className="divider"/>
                <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8}}>Columnas seleccionadas ({fields.length})</div>
                <div className="row wrap" style={{gap:5}}>
                  {fields.map(k => {
                    const f = ALL_FIELDS.find(x => x.key === k);
                    return f ? <span key={k} className="badge mono" style={{fontSize:10}}>{f.label}</span> : null;
                  })}
                </div>
              </>
            )}
            {!previewLoading && !preview && (
              <div className="muted tiny" style={{padding:"20px 0", textAlign:"center"}}>Sin datos para este rango</div>
            )}
          </div>
        </div>
      </div>

      {saveModal && (
        <>
          <div className="panel-overlay" onClick={() => setSaveModal(false)}/>
          <div className="panel" style={{maxWidth:360}}>
            <div className="panel-header">
              <div className="panel-title">Guardar configuración</div>
              <button className="btn ghost icon" onClick={() => setSaveModal(false)}><I.X width="14" height="14"/></button>
            </div>
            <div className="panel-body">
              <div className="field" style={{marginBottom:16}}>
                <label className="field-label">Nombre</label>
                <input className="input" type="text" value={presetName} onChange={e=>setPresetName(e.target.value)}
                  placeholder="Ej: Cierre mensual, Reporte Patty…" autoFocus/>
              </div>
              <div className="muted tiny" style={{marginBottom:16}}>
                Se guardará: {fmt.toUpperCase()}, {fields.length} columnas, filtros actuales.
              </div>
              <button className="btn primary" style={{width:"100%", justifyContent:"center"}}
                onClick={handleSavePreset} disabled={!presetName.trim() || savingPreset}>
                {savingPreset ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports
