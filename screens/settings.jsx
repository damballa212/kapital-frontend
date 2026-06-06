// ===== Kontigo · Settings screen =====
import React from 'react'
import { I } from '../icons.jsx'
import firebase from '../firebase.js'
import { fmtUSD, fetchRates, fetchCollaborators, createCollaborator, updateCollaborator, deleteCollaborator } from '../api.js'

function Settings({ user }) {
  const [rateData, setRateData] = React.useState(null);
  const [colabs, setColabs] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Modal state
  const [modal, setModal] = React.useState(null); // null | { mode: 'create' } | { mode: 'edit', colab: {} }
  const [form, setForm] = React.useState({ name: '', basePct: '', status: 'active' });
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState(null);

  React.useEffect(() => {
    Promise.all([fetchRates(), fetchCollaborators()])
      .then(([r, c]) => { setRateData(r); setColabs(c); })
      .catch(e => setError(e.message));
  }, []);

  const displayName = user?.displayName || "Usuario";
  const email = user?.email || "";
  const initials = displayName.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
  const loginMethod = user?.providerData?.[0]?.providerId === "google.com" ? "Google · OAuth" : "Email / Contraseña";

  const tasa = rateData?.rate ?? null;
  const tasaFecha = rateData?.fecha ?? rateData?.updatedAt ?? null;

  function openCreate() {
    setForm({ name: '', basePct: '', status: 'active' });
    setFormError(null);
    setModal({ mode: 'create' });
  }

  function openEdit(colab) {
    setForm({
      name: colab.name,
      basePct: colab.basePctUsdTotal != null ? String(colab.basePctUsdTotal) : '',
      status: colab.status || 'active',
    });
    setFormError(null);
    setModal({ mode: 'edit', colab });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return; }
    const basePct = form.basePct !== '' ? parseFloat(form.basePct) : null;
    if (basePct !== null && (isNaN(basePct) || basePct < 0 || basePct > 100)) {
      setFormError('El porcentaje debe estar entre 0 y 100');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === 'create') {
        const nuevo = await createCollaborator({ name: form.name.trim(), basePct, status: form.status });
        setColabs(prev => [...(prev || []), nuevo].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const updated = await updateCollaborator(modal.colab.id, { name: form.name.trim(), basePct, status: form.status });
        setColabs(prev => prev.map(c => c.id === modal.colab.id ? updated : c));
      }
      closeModal();
      window.showToast?.('Colaborador guardado');
    } catch (e) {
      setFormError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${modal.colab.name}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await deleteCollaborator(modal.colab.id);
      setColabs(prev => prev.filter(c => c.id !== modal.colab.id));
      closeModal();
      window.showToast?.('Colaborador eliminado');
    } catch (e) {
      setFormError(e.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  const pctLabel = (colab) => {
    if (colab.basePctUsdTotal === null || colab.basePctUsdTotal === undefined) return 'Variable (override)';
    if (colab.basePctUsdTotal === 0) return 'Recibe el resto (dueño)';
    return `${colab.basePctUsdTotal}%`;
  };

  return (
    <div className="content">
      {error && (
        <div style={{padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", marginBottom:18, border:"1px solid var(--danger)"}}>
          Error al cargar configuración: {error}
        </div>
      )}

      {/* Tasa actual */}
      <div className="grid grid-split" style={{gap:18, marginBottom:18}}>
        <div className="card" style={{padding:24}}>
          <div className="row between" style={{marginBottom:8}}>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em"}}>Tasa actual</div>
            <span className="badge green"><span style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/> Vigente</span>
          </div>
          {tasa == null ? (
            <div className="muted tiny" style={{padding:"16px 0"}}>Cargando tasa…</div>
          ) : (
            <>
              <div className="row" style={{gap:12, alignItems:"baseline", marginBottom:6}}>
                <div className="mono" style={{fontSize:14, color:"var(--text-muted)"}}>1 USD</div>
                <div className="mono" style={{fontSize:14, color:"var(--text-dim)"}}>=</div>
                <div className="mono" style={{fontSize:48, fontWeight:500, letterSpacing:"-0.03em", lineHeight:1}}>
                  {Number(tasa).toLocaleString("es-PY").replaceAll(",",".")} <span style={{fontSize:18, color:"var(--text-muted)"}}>Gs</span>
                </div>
              </div>
              {tasaFecha && (
                <div className="muted tiny" style={{marginBottom:20}}>
                  Actualizada el {new Date(tasaFecha).toLocaleString("es-PY")}
                </div>
              )}
            </>
          )}
          <div className="card" style={{padding:14, background:"var(--bg-soft)", border:"1px dashed var(--border-strong)"}}>
            <div className="row" style={{gap:10, alignItems:"flex-start"}}>
              <I.WhatsApp width="18" height="18" style={{color:"var(--accent)", flexShrink:0, marginTop:2}}/>
              <div>
                <div style={{fontWeight:500, marginBottom:4, fontSize:13.5}}>La tasa se actualiza desde WhatsApp</div>
                <div className="muted tiny">Enviá <span className="mono badge" style={{padding:"1px 6px"}}>#TASA 7350</span> al bot para fijar una nueva tasa. Esta pantalla es solo lectura.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comandos del bot */}
        <div className="card" style={{padding:22}}>
          <div className="card-title" style={{marginBottom:4}}>Bot de WhatsApp</div>
          <div className="page-sub" style={{marginBottom:18}}>Comandos disponibles</div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {[
              ["#TRANSACCION", "Registrar una nueva transacción"],
              ["#TASA",        "Actualizar la tasa USD → Gs"],
              ["#HOY",         "Resumen del día (transacciones + comisión)"],
              ["#YO",          "Tus comisiones del mes actual"],
              ["#AYUDA",       "Ver todos los formatos"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="row between" style={{padding:"10px 12px", background:"var(--bg-soft)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)"}}>
                <span className="mono" style={{fontWeight:500, fontSize:13}}>{cmd}</span>
                <span className="muted tiny">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colaboradores */}
      <div className="card flush" style={{marginBottom:18}}>
        <div className="card-header">
          <div>
            <div className="card-title">Colaboradores</div>
            <div className="card-sub">Personas autorizadas a registrar transacciones</div>
          </div>
          <button className="btn sm" onClick={openCreate} style={{flexShrink:0}}>
            <I.Plus width="13" height="13"/> Nuevo
          </button>
        </div>
        <div className="table-scroll"><table className="table collaborators-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Comisión base</th>
              <th className="num">Transacciones</th>
              <th>Estado</th>
              <th className="optional-col"/>
            </tr>
          </thead>
          <tbody>
            {colabs == null && (
              <tr><td colSpan={5} style={{textAlign:"center", padding:24, color:"var(--text-muted)"}}>Cargando…</td></tr>
            )}
            {colabs && colabs.length === 0 && (
              <tr><td colSpan={5} style={{textAlign:"center", padding:24, color:"var(--text-muted)"}}>Sin colaboradores registrados</td></tr>
            )}
            {colabs && colabs.map((c) => {
              const name = c.name || "—";
              const initials2 = name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
              const txCount = c.txCount ?? "—";
              const active = (c.status || 'active') === 'active';
              return (
                <tr key={c.id} onClick={() => openEdit(c)}>
                  <td>
                    <div className="row" style={{gap:10}}>
                      <span className="avatar">{initials2}</span>
                      <div style={{fontWeight:500}}>{name}</div>
                    </div>
                  </td>
                  <td className="mono tiny" style={{color:"var(--text-muted)"}}>{pctLabel(c)}</td>
                  <td className="num">{txCount}</td>
                  <td>
                    {active
                      ? <span className="badge green"><span style={{width:5,height:5,borderRadius:"50%",background:"currentColor"}}/> Activo</span>
                      : <span className="badge" style={{opacity:0.5}}>Inactivo</span>
                    }
                  </td>
                  <td className="optional-col" style={{width:40, textAlign:"right"}}>
                    <button className="btn ghost icon" onClick={(e) => { e.stopPropagation(); openEdit(c); }} title="Editar" style={{fontSize:13}}>
                      ✎
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* Cuenta */}
      <div className="card" style={{padding:22, maxWidth:480}}>
        <div className="card-title" style={{marginBottom:4}}>Cuenta</div>
        <div className="page-sub" style={{marginBottom:18}}>Tu sesión actual</div>
        <div className="row" style={{gap:12, marginBottom:18}}>
          {user?.photoURL
            ? <img src={user.photoURL} referrerPolicy="no-referrer" style={{width:48, height:48, borderRadius:"50%", objectFit:"cover"}} />
            : <span className="avatar" style={{width:48, height:48, fontSize:18}}>{initials}</span>
          }
          <div>
            <div style={{fontWeight:500, fontSize:14}}>{displayName}</div>
            <div className="muted tiny">{email}</div>
          </div>
        </div>
        <div className="kv"><span className="kv-label">Iniciado vía</span><span className="kv-val">{loginMethod}</span></div>
        <div className="kv"><span className="kv-label">Zona horaria</span><span className="kv-val">America/Asuncion</span></div>
        <div className="divider"/>
        <button className="btn ghost" style={{color:"var(--danger)"}}
          onClick={() => firebase.auth().signOut()}>
          <I.Logout width="13" height="13"/> Cerrar sesión
        </button>
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:200
        }}>
          <div className="card" style={{width:"100%", maxWidth:420, padding:24, margin:16}}>
            <div className="row between" style={{marginBottom:18}}>
              <div style={{fontWeight:600, fontSize:15}}>
                {modal.mode === 'create' ? 'Nuevo colaborador' : 'Editar colaborador'}
              </div>
              <button className="btn ghost icon" onClick={closeModal} disabled={saving}>
                <I.X width="14" height="14"/>
              </button>
            </div>

            {formError && (
              <div style={{padding:"10px 12px", color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius-sm)", marginBottom:14, fontSize:13}}>
                {formError}
              </div>
            )}

            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label className="muted tiny" style={{display:"block", marginBottom:5}}>Nombre *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Ej: Patty Acosta"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="muted tiny" style={{display:"block", marginBottom:5}}>
                  Comisión base (%) — dejar vacío para override por mensaje
                </label>
                <input
                  className="input"
                  type="number"
                  min="0" max="100" step="0.1"
                  value={form.basePct}
                  onChange={e => setForm(f => ({...f, basePct: e.target.value}))}
                  placeholder="Ej: 5"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="muted tiny" style={{display:"block", marginBottom:5}}>Estado</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setForm(f => ({...f, status: e.target.value}))}
                  disabled={saving}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="row" style={{gap:8, marginTop:20, justifyContent:"flex-end"}}>
              {modal.mode === 'edit' && (
                <button className="btn ghost" style={{color:"var(--danger)", marginRight:"auto"}} onClick={handleDelete} disabled={saving}>
                  <I.Trash2 width="13" height="13"/> Eliminar
                </button>
              )}
              <button className="btn ghost" onClick={closeModal} disabled={saving}>Cancelar</button>
              <button className="btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings
