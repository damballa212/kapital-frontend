// ===== Kontigo · Dashboard screen =====
import React from 'react'
import { I } from '../icons.jsx'
import { fmtUSD, fmtGs, fmtNum, fmtDate, fetchDashboard } from '../api.js'

function Metric({ label, value, unit, sub, tone, deltaUp }) {
  return (
    <div className="card">
      <div className="metric">
        <div className="metric-label">
          <span className={`dot ${tone || ""}`}></span>
          {label}
        </div>
        <div className="metric-value mono">
          {value}<span className="unit">{unit}</span>
        </div>
        <div className="metric-foot">
          {deltaUp != null && <span className="delta-up row"><I.ArrowUp width="11" height="11"/> {deltaUp}</span>}
          {sub && <span className="muted">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function BarChart({ daily }) {
  const values = daily.map(d => Number(d.totalUsd));
  const max = Math.max(...values, 1);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="chart">
        {values.map((v, i) => {
          const h = (v / max) * 100;
          const isToday = daily[i]?.fecha === todayStr;
          const cls = v === 0 ? "" : isToday ? "today" : "has";
          return (
            <div key={i} className={`bar ${cls}`} style={{ height: `${h}%` }}
              title={v ? `${daily[i].fecha}: ${fmtUSD(v, true)}` : `${daily[i]?.fecha}: sin movimientos`}/>
          );
        })}
      </div>
      <div className="chart-x">
        <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>31</span>
      </div>
    </div>
  );
}

function Dashboard({ rtKeys }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const now = new Date();
    fetchDashboard(now.getFullYear(), now.getMonth() + 1)
      .then(setData)
      .catch(e => setError(e.message));
  }, [rtKeys?.tx, rtKeys?.rate]);

  if (error) return (
    <div className="content">
      <div style={{padding:24, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", border:"1px solid var(--danger)"}}>
        Error al cargar el dashboard: {error}
      </div>
    </div>
  );

  if (!data) return (
    <div className="content">
      <div className="grid grid-4" style={{marginBottom:18}}>
        {[1,2,3,4].map(i => <div key={i} className="card" style={{height:100, opacity:0.4}}/>)}
      </div>
      <div style={{textAlign:"center", color:"var(--text-muted)", padding:40}}>Cargando métricas…</div>
    </div>
  );

  const { hoy, mes, colaboradores, topClientes, diario } = data;
  const now = new Date();
  const fechaHoy = now.toLocaleDateString("es-PY", { weekday:"long", day:"numeric", month:"long" });
  const mesNombre = now.toLocaleDateString("es-PY", { month:"long", year:"numeric" });
  const totalUsdMes = colaboradores.reduce((s, c) => s + Number(c.totalUsd), 0);

  return (
    <div className="content">
      {/* HOY */}
      <div className="row between" style={{marginBottom:14}}>
        <div className="page-sub" style={{textTransform:"uppercase", letterSpacing:"0.08em", fontSize:11}}>
          Hoy · {fechaHoy}
        </div>
        <div className="row" style={{gap:6}}>
          <span className="badge green"><span style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/> En vivo</span>
          <span className="badge mono">Tasa {data.tasaActual ? Number(data.tasaActual).toLocaleString("es-PY").replaceAll(",",".") : "—"} Gs</span>
        </div>
      </div>

      <div className="grid grid-4 dashboard-overview-grid" style={{marginBottom:18}}>
        <Metric label="Transacciones" tone="green" value={hoy.totalTransacciones} sub="hoy"/>
        <Metric label="USD movido" tone="gold" value={fmtUSD(hoy.totalUsd, true)} sub="hoy"/>
        <Metric label="Gs entregados" value={fmtGs(hoy.totalGs)} unit=" Gs" sub="hoy"/>
        <Metric label="Comisión Gabriel" tone="gold" value={fmtUSD(hoy.comisionGabrielUsd, true)} sub={`≈ ${fmtGs(hoy.comisionGabrielGs)} Gs`}/>
      </div>

      {/* MES */}
      <div className="row between" style={{marginBottom:14}}>
        <div className="page-sub" style={{textTransform:"uppercase", letterSpacing:"0.08em", fontSize:11}}>
          Mes actual · {mesNombre}
        </div>
      </div>
      <div className="grid grid-3 dashboard-overview-grid" style={{marginBottom:18}}>
        <Metric label="Transacciones del mes" tone="green" value={mes.totalTransacciones} sub="este mes"/>
        <Metric label="USD movido este mes" tone="gold" value={fmtUSD(mes.totalUsd, true)} sub="este mes"/>
        <Metric label="Comisión Gabriel · Mes" tone="gold" value={fmtUSD(mes.comisionGabrielUsd, true)} sub="todas las fuentes"/>
      </div>

      {/* Chart + Top clientes */}
      <div className="grid dashboard-chart-grid" style={{marginBottom:18}}>
        <div className="card flush">
          <div className="card-header">
            <div>
              <div className="card-title">Actividad diaria</div>
              <div className="card-sub">USD movido por día · mes actual</div>
            </div>
            <div className="row" style={{gap:14, fontSize:11.5, color:"var(--text-muted)"}}>
              <span className="row"><span className="tone green"/> Movimientos</span>
              <span className="row"><span className="tone gold"/> Hoy</span>
            </div>
          </div>
          <div className="card-body">
            {diario.length > 0 ? <BarChart daily={diario}/> : <div className="muted tiny" style={{padding:24,textAlign:"center"}}>Sin datos</div>}
          </div>
        </div>

        <div className="card flush">
          <div className="card-header">
            <div>
              <div className="card-title">Top clientes</div>
              <div className="card-sub">Mes actual</div>
            </div>
            <span className="badge"><I.Users width="11" height="11"/> {topClientes.length}</span>
          </div>
          <div className="card-body" style={{paddingTop:4, paddingBottom:4}}>
            {topClientes.slice(0, 5).map((c, i) => (
              <div className="client-row" key={c.cliente}>
                <span className="client-rank">{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div className="client-name">{c.cliente}</div>
                  <div className="client-meta">{c.totalTransacciones} transacciones</div>
                </div>
                <span/>
                <span className="client-amount">{fmtUSD(c.totalUsd, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colab table */}
      <div className="card flush">
        <div className="card-header">
          <div>
            <div className="card-title">Performance de colaboradores</div>
            <div className="card-sub">Mes actual · ordenado por USD movido</div>
          </div>
        </div>
        <div className="table-scroll"><table className="table dashboard-performance-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th className="num">Transacciones</th>
              <th className="num">USD movido</th>
              <th className="num optional-col">Comisión USD</th>
              <th className="optional-col">Participación</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map(c => {
              const share = totalUsdMes > 0 ? Math.round((Number(c.totalUsd) / totalUsdMes) * 100) : 0;
              const initials = c.colaborador.split(" ").map(p => p[0]).slice(0,2).join("");
              return (
                <tr key={c.colaborador}>
                  <td>
                    <div className="row" style={{gap:10}}>
                      <span className="avatar" style={{width:26,height:26,fontSize:11}}>{initials}</span>
                      <span style={{fontWeight:500}}>{c.colaborador}</span>
                    </div>
                  </td>
                  <td className="num">{c.totalTransacciones}</td>
                  <td className="num">{fmtUSD(c.totalUsd, true)}</td>
                  <td className="num optional-col">
                    <span style={{color: Number(c.comisionUsd) > 0 ? "var(--accent)" : "var(--text-dim)"}}>
                      {Number(c.comisionUsd) > 0 ? fmtUSD(c.comisionUsd, true) : "—"}
                    </span>
                  </td>
                  <td className="optional-col">
                    <div className="row" style={{gap:8}}>
                      <div style={{width:120, height:5, background:"var(--surface-2)", borderRadius:99, overflow:"hidden"}}>
                        <div style={{width:`${share}%`, height:"100%", background:"var(--accent)"}}/>
                      </div>
                      <span className="mono tiny" style={{color:"var(--text-muted)", width:30}}>{share}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

export default Dashboard
