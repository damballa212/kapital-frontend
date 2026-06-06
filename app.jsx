// ===== Kontigo · App shell =====
import React from 'react'
import ReactDOM from 'react-dom/client'
import firebase from './firebase.js'
import { I } from './icons.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakSelect } from './tweaks-panel.jsx'
import Login from './screens/login.jsx'
import Dashboard from './screens/dashboard.jsx'
import Transactions from './screens/transactions.jsx'
import Reports from './screens/reports.jsx'
import Settings from './screens/settings.jsx'
import BotWhatsApp from './screens/bot-whatsapp.jsx'

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#4ade80", "#16382a", "#052e17"],
  "startScreen": "dashboard"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = [
  ["#4ade80","#16382a","#052e17"],
  ["#f5c451","#3a2e10","#3d2b04"],
  ["#60a5fa","#0f2748","#0a1a3d"],
  ["#a78bfa","#231743","#1a0f3a"],
];

function applyAccent(palette) {
  document.documentElement.style.setProperty("--accent", palette[0]);
  document.documentElement.style.setProperty("--accent-dim", palette[1]);
  document.documentElement.style.setProperty("--accent-text", palette[2]);
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle">
      <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")} title="Modo claro">
        <I.Sun width="14" height="14"/>
      </button>
      <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")} title="Modo oscuro">
        <I.Moon width="14" height="14"/>
      </button>
    </div>
  );
}

function Sidebar({ screen, setScreen, onLogout, user }) {
  const items = [
    { id: "dashboard",    label: "Dashboard",    icon: I.Dashboard },
    { id: "transactions", label: "Transacciones", icon: I.List },
    { id: "reports",      label: "Reportes",      icon: I.Report },
    { id: "settings",     label: "Configuración", icon: I.Settings },
    { id: "bot",          label: "Bot WhatsApp",  icon: I.WhatsApp },
  ];

  const displayName = user?.displayName || "Usuario";
  const initials = displayName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">K</span>
        <div>
          <div className="brand-name">Kapital</div>
          <div className="brand-sub">Casa de cambios</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">Operación</div>
        {items.map(it => {
          const Ico = it.icon;
          const active = screen === it.id;
          return (
            <div key={it.id} className={`nav-item ${active ? "active" : ""}`} onClick={() => setScreen(it.id)}>
              <Ico className="ico"/>
              <span>{it.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-row">
          {user?.photoURL
            ? <img src={user.photoURL} referrerPolicy="no-referrer" style={{width:32, height:32, borderRadius:"50%", objectFit:"cover", flexShrink:0}} />
            : <span className="avatar">{initials}</span>
          }
          <div style={{flex:1, minWidth:0}}>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.email || ""}</div>
          </div>
          <button className="btn ghost icon" onClick={onLogout} title="Cerrar sesión">
            <I.Logout width="14" height="14"/>
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileTabs({ screen, setScreen }) {
  const items = [
    { id: "dashboard",    label: "Inicio",   icon: I.Dashboard },
    { id: "transactions", label: "Movs",     icon: I.List },
    { id: "reports",      label: "Reportes", icon: I.Report },
    { id: "bot",          label: "Bot",      icon: I.WhatsApp },
    { id: "settings",     label: "Config",   icon: I.Settings },
  ];
  return (
    <div className="mobile-tabs">
      {items.map(it => {
        const Ico = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} className={`mobile-tab ${active ? "active" : ""}`} onClick={() => setScreen(it.id)}>
            <Ico className="ico"/>
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    window.showToast = (message, type = "success") => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
  }, []);

  if (!toasts.length) return null;
  return (
    <div style={{position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:8}}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" && <I.Check width="14" height="14"/>}
          {t.type === "error"   && <I.X    width="14" height="14"/>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [theme, setTheme] = React.useState(() => localStorage.getItem("kontigo-theme") || "dark");
  const [user, setUser] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [screen, setScreen] = React.useState(tweaks.startScreen || "dashboard");

  React.useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged(u => {
      setUser(u || false);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kontigo-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const acc = tweaks.accent;
    const palette = Array.isArray(acc) ? acc : (ACCENT_PRESETS.find(p => p[0] === acc) || ACCENT_PRESETS[0]);
    applyAccent(palette);
  }, [tweaks.accent]);

  async function handleLogout() {
    await firebase.auth().signOut();
    setUser(false);
  }

  const titles = {
    dashboard:    { t: "Dashboard",       s: "Métricas del negocio" },
    transactions: { t: "Transacciones",   s: "Historial completo de operaciones" },
    reports:      { t: "Reportes",        s: "Exportá datos filtrados" },
    bot:          { t: "Bot WhatsApp",     s: "Mensajes entrantes y estado del flujo" },
    settings:     { t: "Configuración",   s: "Tasas, colaboradores y cuenta" },
  };

  if (!authReady) {
    return (
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:16}}>
        <div className="brand-mark" style={{width:48, height:48, fontSize:24}}>K</div>
        <div className="muted tiny">Verificando sesión…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onEnter={() => {}}/>
        <TweaksPanel title="Tweaks">
          <TweakSection label="Tema">
            <TweakRadio label="Modo" value={theme} onChange={v => setTheme(v)} options={[{value:"dark", label:"Oscuro"},{value:"light", label:"Claro"}]}/>
          </TweakSection>
          <TweakSection label="Acento">
            <TweakColor label="Color" value={tweaks.accent} onChange={v => setTweak("accent", v)} options={ACCENT_PRESETS}/>
          </TweakSection>
        </TweaksPanel>
      </>
    );
  }

  const Screen = {
    dashboard:    Dashboard,
    transactions: Transactions,
    reports:      Reports,
    bot:          BotWhatsApp,
    settings:     Settings,
  }[screen];

  const title = titles[screen];

  return (
    <>
      <div className="app">
        <Sidebar screen={screen} setScreen={setScreen} onLogout={handleLogout} user={user}/>
        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <div>
                <div className="page-title">{title.t}</div>
                <div className="page-sub">{title.s}</div>
              </div>
            </div>
            <div className="topbar-right">
              <ThemeToggle theme={theme} setTheme={setTheme}/>
            </div>
          </header>
          <Screen user={user}/>
        </main>
        <MobileTabs screen={screen} setScreen={setScreen}/>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema">
          <TweakRadio label="Modo" value={theme} onChange={v => setTheme(v)} options={[{value:"dark", label:"Oscuro"},{value:"light", label:"Claro"}]}/>
        </TweakSection>
        <TweakSection label="Acento">
          <TweakColor label="Color" value={tweaks.accent} onChange={v => setTweak("accent", v)} options={ACCENT_PRESETS}/>
        </TweakSection>
        <TweakSection label="Navegación">
          <TweakSelect label="Pantalla" value={screen} onChange={v => setScreen(v)} options={[
            {value:"dashboard",    label:"Dashboard"},
            {value:"transactions", label:"Transacciones"},
            {value:"reports",      label:"Reportes"},
            {value:"bot",          label:"Bot WhatsApp"},
            {value:"settings",     label:"Configuración"},
          ]}/>
        </TweakSection>
      </TweaksPanel>
      <ToastContainer/>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
