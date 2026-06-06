// ===== Kontigo · API client + format helpers =====
import firebase from './firebase.js'
import { API_BASE_URL } from './config.js'

// ── Format helpers ────────────────────────────────────────────────────────────
export function fmtUSD(n, sign = true) {
  if (n == null) return "—";
  return (sign ? "$" : "") + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtGs(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("es-PY").replaceAll(",", ".");
}
export function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
export function fmtDate(iso, withTime = false) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yy}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} · ${hh}:${mn}`;
}

// ── Auth token helper ─────────────────────────────────────────────────────────
async function getToken() {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("No hay sesión activa");
  return user.getIdToken();
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  if (!API_BASE_URL) {
    throw new Error("Falta configurar VITE_API_BASE_URL en el build del frontend");
  }

  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res;
}

async function apiJSON(path, opts) {
  const res = await apiFetch(path, opts);
  return res.json();
}

// ── API calls ─────────────────────────────────────────────────────────────────
export async function fetchDashboard(year, month) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  return apiJSON(`/dashboard?${params}`);
}

export async function fetchTransactions({ page = 1, limit = 50, startDate, endDate, colaborador, cliente } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente) params.set("cliente", cliente);
  return apiJSON(`/transactions?${params}`);
}

export async function fetchWebhookMessages({ page = 1, limit = 50, startDate, endDate, status, parsedType, q } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (parsedType) params.set("parsedType", parsedType);
  if (q) params.set("q", q);
  return apiJSON(`/webhook/messages?${params}`);
}

export async function fetchWebhookMessage(id) {
  return apiJSON(`/webhook/messages/${id}`);
}

export async function fetchRates() {
  return apiJSON("/rates/current");
}

export async function fetchCollaborators() {
  return apiJSON("/collaborators");
}

export async function createCollaborator({ name, basePct, status }) {
  return apiJSON("/collaborators", {
    method: "POST",
    body: JSON.stringify({ name, basePct: basePct ?? null, status: status ?? "active" }),
  });
}

export async function updateCollaborator(id, { name, basePct, status }) {
  return apiJSON(`/collaborators/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, basePct: basePct ?? null, status }),
  });
}

export async function deleteCollaborator(id) {
  await apiFetch(`/collaborators/${id}`, { method: "DELETE" });
}

export async function fetchExportPreview({ startDate, endDate, colaborador, cliente, minAmount, maxAmount } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente)   params.set("cliente", cliente);
  if (minAmount) params.set("minAmount", minAmount);
  if (maxAmount) params.set("maxAmount", maxAmount);
  return apiJSON(`/export/preview?${params}`);
}

export async function fetchExportPresets() {
  return apiJSON("/export/presets");
}

export async function saveExportPreset(name, config) {
  return apiJSON("/export/presets", {
    method: "POST",
    body: JSON.stringify({ name, config }),
  });
}

export async function deleteExportPreset(id) {
  await apiFetch(`/export/presets/${id}`, { method: "DELETE" });
}

export async function deleteTransaction(id) {
  const res = await apiFetch(`/transactions/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
}

export async function downloadExport({ format, startDate, endDate, colaborador, cliente, minAmount, maxAmount, fields }) {
  const params = new URLSearchParams({ format });
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente)   params.set("cliente", cliente);
  if (minAmount) params.set("minAmount", minAmount);
  if (maxAmount) params.set("maxAmount", maxAmount);
  if (fields && fields.length) params.set("fields", fields.join(","));

  const res = await apiFetch(`/export?${params}`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `transacciones.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Map backend Transaction → shape usada por el frontend ────────────────────
export function mapTransaction(t) {
  const colabName = t.colaborador || "Gabriel Zambrano";
  const isOwner = colabName.toLowerCase().includes("gabriel");
  return {
    id: `TX-${t.id}`,
    rawId: t.id,
    fecha: t.fecha,
    cliente: t.cliente,
    colabName,
    usd: Number(t.usdTotal),
    comPct: Number(t.comision),
    neto: Number(t.usdNeto),
    gs: Number(t.montoGs),
    tasa: Number(t.tasaUsada),
    comGabriel: Number(t.montoComisionGabrielUsd),
    comColab: !isOwner ? Number(t.montoColaboradorUsd) : null,
  };
}

export const COLABS = [
  { id: "gabriel", name: "Gabriel Zambrano", role: "Dueño",        rate: "—",   initials: "GZ" },
  { id: "patty",   name: "Patty Acosta",     role: "Colaboradora", rate: "5%",  initials: "PA" },
  { id: "anael",   name: "Anael Ríos",       role: "Colaborador",  rate: "2-5%",initials: "AR" },
];

export function colabBy(id) {
  return COLABS.find(c => c.id === id) || COLABS[0];
}
