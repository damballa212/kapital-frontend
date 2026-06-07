// ===== Kontigo · Login screen =====
import React from 'react'
import firebase from '../firebase.js'
import { I } from '../icons.jsx'

function Login({ onEnter }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function loginWithGoogle() {
    setError(""); setLoading(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      onEnter();
    } catch (e) {
      setError(e.message || "Error al iniciar con Google");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithEmail() {
    if (!email || !password) { setError("Completá email y contraseña"); return; }
    setError(""); setLoading(true);
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      onEnter();
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "No existe una cuenta con ese email",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/invalid-email": "Email inválido",
        "auth/too-many-requests": "Demasiados intentos. Esperá un momento.",
      };
      setError(msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      {/* Art side */}
      <div className="login-art">
        <div className="brand" style={{padding: 0}}>
          <img src="/kapital-logo.png" alt="Kapital" className="brand-logo"/>
          <div className="brand-sub">Casa de cambios · Paraguay</div>
        </div>

        <div style={{position:"relative", zIndex:1}}>
          <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.08em", marginBottom: 10}}>Tasa de hoy</div>
          <div className="rate-display mono">
            7.300<span className="small"> Gs/USD</span>
          </div>
          <div className="divider"/>
          <div className="row" style={{gap: 32, flexWrap:"wrap"}}>
            <div>
              <div className="muted tiny" style={{marginBottom:4}}>Sistema</div>
              <div className="mono" style={{fontSize:18, fontWeight:500}}>activo</div>
            </div>
            <div>
              <div className="muted tiny" style={{marginBottom:4}}>Bot WhatsApp</div>
              <div className="mono" style={{fontSize:18, fontWeight:500}}>online</div>
            </div>
          </div>
        </div>

        <div className="tiny muted" style={{position:"relative", zIndex:1}}>
          Acceso solo por invitación · Las cuentas autorizadas son gestionadas por Gabriel.
        </div>

        <div className="tape"/>
      </div>

      {/* Form side */}
      <div className="login-form-wrap">
        <div className="login-card">
          <div>
            <div style={{fontSize:24, fontWeight:600, letterSpacing:"-0.02em", marginBottom:6}}>Iniciar sesión</div>
            <div className="muted">Bienvenido de vuelta. Ingresá para ver tus métricas.</div>
          </div>

          {error && (
            <div style={{padding:"10px 14px", background:"var(--danger-dim)", border:"1px solid var(--danger)", borderRadius:"var(--radius-sm)", color:"var(--danger)", fontSize:13}}>
              {error}
            </div>
          )}

          <button className="btn" onClick={loginWithGoogle} disabled={loading}
            style={{justifyContent:"center", padding:"10px 14px", fontSize:14, gap:10, opacity: loading ? 0.7 : 1}}>
            <I.Google width="16" height="16"/> Continuar con Google
          </button>

          <div className="row" style={{gap:12, color:"var(--text-dim)"}}>
            <div style={{flex:1, height:1, background:"var(--border)"}}/>
            <span className="tiny">o con email</span>
            <div style={{flex:1, height:1, background:"var(--border)"}}/>
          </div>

          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="gabriel@kapital.py" style={{padding:"9px 12px"}}
              onKeyDown={e => e.key === "Enter" && loginWithEmail()}/>
          </div>
          <div className="field">
            <div className="row between">
              <label className="field-label">Contraseña</label>
            </div>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••••" style={{padding:"9px 12px"}}
              onKeyDown={e => e.key === "Enter" && loginWithEmail()}/>
          </div>

          <button className="btn primary" onClick={loginWithEmail} disabled={loading}
            style={{justifyContent:"center", padding:"10px 14px", fontSize:14, opacity: loading ? 0.7 : 1}}>
            {loading ? "Ingresando…" : "Entrar"}
          </button>

          <div className="tiny muted" style={{textAlign:"center"}}>
            Sin registro público · acceso solo por invitación
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login
