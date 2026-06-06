# Plan de refactorización: estructura profesional + TypeScript

> **Regla de oro:** cero cambios de diseño, cero cambios de comportamiento.
> Cada fase termina con `npm run build` sin errores antes de continuar a la siguiente.

---

## Por qué en este orden

Primero la estructura de carpetas, después TypeScript. Hacerlo al revés significa cambiar rutas de imports dos veces (al mover + al renombrar `.js → .ts`). Haciéndolo en orden: movés los archivos una sola vez, ya al destino final, y después migrás a TS desde ahí.

---

## Estado actual → Estado final

```
ANTES                              DESPUÉS
──────────────────────────────     ──────────────────────────────
/                                  /
├── api.js          (204 lín)      ├── src/
├── app.jsx         (267 lín)      │   ├── api/
├── config.js                      │   │   ├── client.ts      ← fetch wrapper + getToken
├── firebase.js                    │   │   ├── dashboard.ts
├── icons.jsx       (134 lín)      │   │   ├── transactions.ts
├── tweaks-panel.jsx (569 lín)     │   │   ├── reports.ts
├── styles.css      (753 lín)      │   │   ├── rates.ts
├── screens/                       │   │   ├── collaborators.ts
│   ├── login.jsx                  │   │   └── webhook.ts
│   ├── dashboard.jsx              │   ├── components/
│   ├── transactions.jsx           │   │   └── dev/
│   ├── reports.jsx                │   │       └── TweaksPanel.tsx
│   ├── settings.jsx               │   ├── screens/
│   └── bot-whatsapp.jsx           │   │   ├── Login.tsx
├── index.html                     │   │   ├── Dashboard.tsx
├── vite.config.js                 │   │   ├── Transactions.tsx
└── package.json                   │   │   ├── Reports.tsx
                                   │   │   ├── Settings.tsx
                                   │   │   └── BotWhatsApp.tsx
                                   │   ├── types/
                                   │   │   └── index.ts
                                   │   ├── utils/
                                   │   │   └── formatters.ts
                                   │   ├── config.ts
                                   │   ├── firebase.ts
                                   │   ├── icons.tsx
                                   │   ├── styles.css
                                   │   └── app.tsx
                                   ├── index.html         (entry → src/app.tsx)
                                   ├── vite.config.ts
                                   └── package.json
```

---

## Fase 0 — Setup de TypeScript (sin mover nada)

> Solo instalar dependencias y crear archivos de configuración. Ningún archivo de código se toca.

- [ ] Instalar dependencias:
  ```
  npm install -D typescript @types/react @types/react-dom vitest
  ```
- [ ] Crear `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "skipLibCheck": true
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- [ ] Renombrar `vite.config.js` → `vite.config.ts` (solo el nombre, sin cambios internos)
- [ ] Agregar scripts en `package.json`:
  ```json
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
  ```
- [ ] Crear `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'
  export default defineConfig({ test: { environment: 'jsdom' } })
  ```
- [ ] Verificar `npm run build` — debe pasar sin cambios (los `.jsx/.js` siguen en raíz)

---

## Fase 1 — Crear estructura `src/` y mover archivos (aún `.jsx/.js`)

> Mover todos los archivos a su carpeta final. Los archivos siguen siendo JavaScript — no se agrega TypeScript todavía.
> Al terminar esta fase, todos los imports apuntan a la nueva ubicación.

### 1a — Crear carpetas
- [ ] Crear `src/api/`
- [ ] Crear `src/components/dev/`
- [ ] Crear `src/screens/`
- [ ] Crear `src/types/`
- [ ] Crear `src/utils/`

### 1b — Mover archivos de configuración e infraestructura
- [ ] Mover `config.js` → `src/config.js`
- [ ] Mover `firebase.js` → `src/firebase.js`
- [ ] Mover `icons.jsx` → `src/icons.jsx`
- [ ] Mover `styles.css` → `src/styles.css`
- [ ] Mover `tweaks-panel.jsx` → `src/components/dev/TweaksPanel.jsx`

### 1c — Mover screens
- [ ] Mover `screens/login.jsx` → `src/screens/Login.jsx`
- [ ] Mover `screens/dashboard.jsx` → `src/screens/Dashboard.jsx`
- [ ] Mover `screens/transactions.jsx` → `src/screens/Transactions.jsx`
- [ ] Mover `screens/reports.jsx` → `src/screens/Reports.jsx`
- [ ] Mover `screens/settings.jsx` → `src/screens/Settings.jsx`
- [ ] Mover `screens/bot-whatsapp.jsx` → `src/screens/BotWhatsApp.jsx`

### 1d — Mover app.jsx
- [ ] Mover `app.jsx` → `src/app.jsx`

### 1e — Actualizar imports en todos los archivos movidos
Cada archivo tiene imports relativos que apuntan a rutas viejas. Actualizar:

- [ ] `src/firebase.js` — import de `config.js`:
  ```js
  import { FIREBASE_CONFIG } from './config.js'  // igual, mismo nivel
  ```
- [ ] `src/app.jsx` — todos los imports:
  ```js
  import firebase from './firebase.js'
  import { I } from './icons.jsx'
  import { useTweaks, TweaksPanel, ... } from './components/dev/TweaksPanel.jsx'
  import Login from './screens/Login.jsx'
  import Dashboard from './screens/Dashboard.jsx'
  import Transactions from './screens/Transactions.jsx'
  import Reports from './screens/Reports.jsx'
  import Settings from './screens/Settings.jsx'
  import BotWhatsApp from './screens/BotWhatsApp.jsx'
  import './styles.css'   // ← reemplaza el <link> en index.html
  ```
- [ ] `src/screens/Login.jsx`:
  ```js
  import firebase from '../firebase.js'
  import { I } from '../icons.jsx'
  ```
- [ ] `src/screens/Dashboard.jsx`:
  ```js
  import { I } from '../icons.jsx'
  import { fmtUSD, fmtGs, fmtNum, fmtDate, fetchDashboard } from '../api.js'
  ```
  _(api.js aún no se movió — se mueve en Fase 2)_
- [ ] `src/screens/Transactions.jsx` — mismo patrón `'../api.js'`, `'../icons.jsx'`
- [ ] `src/screens/Reports.jsx` — mismo patrón
- [ ] `src/screens/Settings.jsx` — `'../firebase.js'`, `'../api.js'`, `'../icons.jsx'`
- [ ] `src/screens/BotWhatsApp.jsx` — `'../api.js'`, `'../icons.jsx'`
- [ ] `src/components/dev/TweaksPanel.jsx` — verificar si tiene imports propios (no tiene)

### 1f — Actualizar `index.html`
- [ ] Cambiar la línea del script entry point:
  ```html
  <!-- antes -->
  <script type="module" src="/app.jsx"></script>
  <!-- después -->
  <script type="module" src="/src/app.jsx"></script>
  ```
- [ ] Eliminar `<link rel="stylesheet" href="/styles.css"/>` — ahora se importa en `src/app.jsx`

### 1g — Mover `api.js` temporalmente
- [ ] Mover `api.js` → `src/api.js` (archivo completo, sin dividir aún)
- [ ] Actualizar imports en todos los screens: `'../api.js'` → `'./api.js'` desde src/ level
  - Espera — los screens están en `src/screens/`, así que sería `'../api.js'`
  - Confirmar que `src/api.js` importa correctamente: `import firebase from './firebase.js'` y `import { API_BASE_URL } from './config.js'`

### 1h — Verificar
- [ ] `npm run build` — debe pasar sin errores
- [ ] `npm run dev` — abrir la app, verificar que funciona igual que antes
- [ ] Borrar la carpeta `screens/` vacía del root

---

## Fase 2 — Dividir `src/api.js` en módulos por dominio

> Romper el god file en 7 archivos. Sin TypeScript todavía — solo mover funciones.
> Al terminar, `src/api.js` se elimina completamente.

### Contenido de cada archivo nuevo:

- [ ] Crear `src/api/client.js` — funciones internas compartidas:
  ```js
  import firebase from '../firebase.js'
  import { API_BASE_URL } from '../config.js'

  export async function getToken() { ... }        // copiado de api.js
  export async function apiFetch(path, opts) { ... }
  export async function apiJSON(path, opts) { ... }
  ```

- [ ] Crear `src/api/dashboard.js`:
  ```js
  import { apiJSON } from './client.js'
  export async function fetchDashboard(year, month) { ... }
  ```

- [ ] Crear `src/api/transactions.js`:
  ```js
  import { apiFetch, apiJSON } from './client.js'
  export async function fetchTransactions(params) { ... }
  export async function deleteTransaction(id) { ... }
  export function mapTransaction(t) { ... }
  ```

- [ ] Crear `src/api/reports.js`:
  ```js
  import { apiFetch, apiJSON } from './client.js'
  export async function fetchExportPreview(params) { ... }
  export async function fetchExportPresets() { ... }
  export async function saveExportPreset(name, config) { ... }
  export async function deleteExportPreset(id) { ... }
  export async function downloadExport(params) { ... }
  ```

- [ ] Crear `src/api/rates.js`:
  ```js
  import { apiJSON } from './client.js'
  export async function fetchRates() { ... }
  ```

- [ ] Crear `src/api/collaborators.js`:
  ```js
  import { apiFetch, apiJSON } from './client.js'
  export async function fetchCollaborators() { ... }
  export async function createCollaborator(data) { ... }
  export async function updateCollaborator(id, data) { ... }
  export async function deleteCollaborator(id) { ... }
  export const COLABS = [ ... ]
  export function colabBy(id) { ... }
  ```

- [ ] Crear `src/api/webhook.js`:
  ```js
  import { apiJSON } from './client.js'
  export async function fetchWebhookMessages(params) { ... }
  export async function fetchWebhookMessage(id) { ... }
  ```

- [ ] Crear `src/utils/formatters.js` — extraído de `src/api.js`:
  ```js
  export function fmtUSD(n, sign = true) { ... }
  export function fmtGs(n) { ... }
  export function fmtNum(n) { ... }
  export function fmtDate(iso, withTime = false) { ... }
  ```

### Actualizar imports en los screens:

- [ ] `src/screens/Dashboard.jsx`:
  ```js
  import { fmtUSD, fmtGs, fmtNum, fmtDate } from '../utils/formatters.js'
  import { fetchDashboard } from '../api/dashboard.js'
  ```
- [ ] `src/screens/Transactions.jsx`:
  ```js
  import { fmtUSD as fU, fmtGs as fG, fmtDate as fD } from '../utils/formatters.js'
  import { fetchTransactions, mapTransaction, deleteTransaction } from '../api/transactions.js'
  import { colabBy as cBy, COLABS } from '../api/collaborators.js'
  ```
- [ ] `src/screens/Reports.jsx`:
  ```js
  import { fmtUSD as fU, fmtGs as fG, fmtDate as fD } from '../utils/formatters.js'
  import { downloadExport, fetchExportPreview, fetchExportPresets, saveExportPreset, deleteExportPreset } from '../api/reports.js'
  import { COLABS } from '../api/collaborators.js'
  ```
- [ ] `src/screens/Settings.jsx`:
  ```js
  import { fmtUSD } from '../utils/formatters.js'
  import { fetchRates } from '../api/rates.js'
  import { fetchCollaborators, createCollaborator, updateCollaborator, deleteCollaborator } from '../api/collaborators.js'
  ```
- [ ] `src/screens/BotWhatsApp.jsx`:
  ```js
  import { fmtDate } from '../utils/formatters.js'
  import { fetchWebhookMessages, fetchWebhookMessage } from '../api/webhook.js'
  ```
- [ ] `src/app.jsx` — eliminar cualquier import de `api.js` si los tenía

### Limpieza:
- [ ] Eliminar `src/api.js` — ya no existe
- [ ] `npm run build` — debe pasar sin errores
- [ ] `npm run dev` — verificar todas las pantallas funcionan

---

## Fase 3 — Tipos centrales (`src/types/index.ts`)

> Primer archivo TypeScript del proyecto. Define todos los tipos compartidos
> basados en el código existente. Los archivos `.jsx/.js` aún no se tocan.

- [ ] Crear `src/types/index.ts` con:

  **Navegación y UI**
  ```ts
  export type ScreenId = 'dashboard' | 'transactions' | 'reports' | 'bot' | 'settings'
  export type ToastType = 'success' | 'error'
  export type Toast = { id: number; message: string; type: ToastType }
  ```

  **Paginación**
  ```ts
  export type Pagination = { page: number; totalPages: number; total: number; limit: number }
  export type PaginatedResponse<T> = { data: T[]; pagination: Pagination }
  ```

  **Colaboradores**
  ```ts
  export type ColabId = 'gabriel' | 'patty' | 'anael'
  export type Colab = { id: ColabId; name: string; role: string; rate: string; initials: string }
  export type Collaborator = {
    id: number; name: string; basePctUsdTotal: number | null
    txCount: number; status: 'active' | 'inactive'
  }
  ```

  **Transacciones**
  ```ts
  export type Transaction = {
    id: string; rawId: number; fecha: string; cliente: string
    colab: ColabId; colabName: string; usd: number; comPct: number
    neto: number; gs: number; tasa: number; comGabriel: number
    comAnael: number | null; comPatty: number | null
  }
  ```

  **Dashboard**
  ```ts
  export type MetricasHoy = {
    totalTransacciones: number; totalUsd: number; totalGs: number
    comisionGabrielUsd: number; comisionGabrielGs: number
  }
  export type MetricasMes = Omit<MetricasHoy, 'comisionGabrielGs'>
  export type ColaboradorMetrica = { colaborador: string; totalTransacciones: number; totalUsd: number; comisionUsd: number }
  export type ClienteMetrica = { cliente: string; totalTransacciones: number; totalUsd: number }
  export type DiaMetrica = { fecha: string; totalTransacciones: number; totalUsd: number }
  export type DashboardData = {
    hoy: MetricasHoy; mes: MetricasMes; colaboradores: ColaboradorMetrica[]
    topClientes: ClienteMetrica[]; diario: DiaMetrica[]; tasaActual: number | null
  }
  ```

  **Bot WhatsApp**
  ```ts
  export type WhatsappStatus =
    | 'received' | 'ignored_group' | 'rate_limited' | 'parse_error'
    | 'rate_updated' | 'transaction_created' | 'confirmation_sent'
    | 'confirmation_failed' | 'failed'
  export type ParsedType = 'TRANSACCION' | 'TASA' | 'ERROR' | 'AYUDA' | 'HOY' | 'YO'
  export type WebhookMessage = {
    id: number; messageId: string; chatId: string; userName: string | null
    content: string; receivedAt: string; parsedType: ParsedType | null
    status: WhatsappStatus; flowStage: string; transactionId: number | null
    errorMessage: string | null; durationMs: number | null
  }
  export type FlowEvent = {
    id: number; stage: string; status: 'ok' | 'failed' | 'skipped'
    details: Record<string, unknown> | null; createdAt: string
  }
  export type WebhookMessageDetail = { message: WebhookMessage; events: FlowEvent[] }
  ```

  **Reportes**
  ```ts
  export type ExportFormat = 'csv' | 'excel' | 'pdf'
  export type ExportPresetConfig = {
    from?: string; to?: string; colab?: string; cliente?: string
    minAmount?: string; maxAmount?: string; fields?: string[]; fmt?: ExportFormat
  }
  export type ExportPreset = { id: number; name: string; config: ExportPresetConfig }
  export type ExportPreviewResult = { total: number; totalUsd: number; totalGs: number; comisionGabrielUsd: number }
  ```

  **Global `window.showToast`**
  ```ts
  declare global {
    interface Window { showToast?: (message: string, type?: ToastType) => void }
  }
  export {}
  ```

- [ ] `npm run typecheck` — 0 errores (el tsconfig solo incluye `src/**/*.ts`)
- [ ] `npm run build` — debe pasar

---

## Fase 4 — Migrar utilidades y config

> Archivos sin lógica de UI. Los más fáciles de tipar.

- [ ] Renombrar `src/config.js` → `src/config.ts`:
  ```ts
  import type { FirebaseOptions } from 'firebase/app'
  export const FIREBASE_CONFIG: FirebaseOptions = { ... }
  export const API_BASE_URL: string = "..."
  ```

- [ ] Renombrar `src/firebase.js` → `src/firebase.ts` (solo el nombre — el tipo lo da el SDK)

- [ ] Renombrar `src/utils/formatters.js` → `src/utils/formatters.ts`:
  ```ts
  export function fmtUSD(n: number | null | undefined, sign = true): string
  export function fmtGs(n: number | null | undefined): string
  export function fmtNum(n: number): string
  export function fmtDate(iso: string | Date, withTime = false): string
  ```

- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run build` — debe pasar

---

## Fase 5 — Migrar `src/api/`

> Un archivo por vez. Cada uno termina con `npm run build`.

- [ ] Renombrar `src/api/client.js` → `src/api/client.ts`:
  - `getToken(): Promise<string>`
  - `apiFetch(path: string, opts?: RequestInit): Promise<Response>`
  - `apiJSON<T>(path: string, opts?: RequestInit): Promise<T>`

- [ ] Renombrar `src/api/dashboard.ts` (ya `.ts`):
  - `fetchDashboard(year?: number, month?: number): Promise<DashboardData>`

- [ ] Renombrar `src/api/transactions.ts`:
  - `fetchTransactions(params?): Promise<PaginatedResponse<BackendTransaction>>` — tipo raw del backend
  - `deleteTransaction(id: number): Promise<void>`
  - `mapTransaction(t: BackendTransaction): Transaction`

- [ ] Renombrar `src/api/reports.ts`:
  - Tipar todos los parámetros de filtro con un tipo `ExportFilters`
  - `downloadExport(params: ExportFilters & { format: ExportFormat; fields: string[] }): Promise<void>`

- [ ] Renombrar `src/api/rates.ts`:
  - `fetchRates(): Promise<{ rate: number; updatedAt: string }>`

- [ ] Renombrar `src/api/collaborators.ts`:
  - `COLABS: Colab[]`
  - `colabBy(id: string): Colab`
  - `fetchCollaborators(): Promise<Collaborator[]>`
  - `createCollaborator(data: { name: string; basePct: number | null; status?: string }): Promise<Collaborator>`
  - `updateCollaborator(id: number, data: Partial<...>): Promise<Collaborator>`
  - `deleteCollaborator(id: number): Promise<void>`

- [ ] Renombrar `src/api/webhook.ts`:
  - `fetchWebhookMessages(params?): Promise<PaginatedResponse<WebhookMessage>>`
  - `fetchWebhookMessage(id: number): Promise<WebhookMessageDetail>`

- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run build` — debe pasar

---

## Fase 6 — Migrar `src/icons.tsx`

- [ ] Renombrar `src/icons.jsx` → `src/icons.tsx`
- [ ] Agregar tipo al prop de cada ícono:
  ```tsx
  import type React from 'react'
  type SvgProps = React.SVGProps<SVGSVGElement>
  export const I = {
    Dashboard: (p: SvgProps) => (...),
    // igual para los ~24 íconos restantes
  }
  ```
- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run build`

---

## Fase 7 — Migrar `src/components/dev/TweaksPanel.tsx`

- [ ] Renombrar `TweaksPanel.jsx` → `TweaksPanel.tsx`
- [ ] Tipar `useTweaks<T extends Record<string, unknown>>(defaults: T): [T, (key: keyof T, value: T[keyof T]) => void]`
- [ ] Tipar props de cada componente exportado (`TweaksPanel`, `TweakSection`, `TweakRadio`, `TweakColor`, `TweakToggle`, `TweakSelect`, `TweakRow`, `TweakSlider`, `TweakText`, `TweakNumber`, `TweakButton`)
- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run build`

---

## Fase 8 — Migrar screens (una por una)

> Orden: menor complejidad → mayor. Build después de cada screen.

### 8a — `src/screens/Login.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] Tipar prop `onEnter: () => void`
- [ ] `npm run build`

### 8b — `src/screens/Dashboard.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] `Metric` props: `{ label: string; value: string | number; unit?: string; sub?: string; tone?: string; deltaUp?: string }`
- [ ] `BarChart` props: `{ daily: DiaMetrica[] }`
- [ ] `Dashboard`: `React.FC` sin props
- [ ] `npm run build`

### 8c — `src/screens/Transactions.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] `TxDetail` props: `{ tx: Transaction; onClose: () => void; onDelete: (rawId: number) => void }`
- [ ] Estado `result`: `{ data: Transaction[]; pagination: Pagination } | null`
- [ ] `Transactions`: `React.FC` sin props
- [ ] `npm run build`

### 8d — `src/screens/Reports.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] `ALL_FIELDS: Array<{ key: string; label: string }>`
- [ ] Estado `preview: ExportPreviewResult | null`
- [ ] Estado `presets: ExportPreset[]`
- [ ] Estado `fmt: ExportFormat`
- [ ] `Reports`: `React.FC` sin props
- [ ] `npm run build`

### 8e — `src/screens/Settings.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] Importar tipo de usuario Firebase:
  ```ts
  import type firebase from 'firebase/compat/app'
  type SettingsProps = { user: firebase.User }
  ```
- [ ] `modal`: `null | { mode: 'create' } | { mode: 'edit'; colab: Collaborator }`
- [ ] `form`: `{ name: string; basePct: string; status: 'active' | 'inactive' }`
- [ ] `npm run build`

### 8f — `src/screens/BotWhatsApp.tsx`
- [ ] Renombrar `.jsx` → `.tsx`
- [ ] `STATUS_META`: `Record<WhatsappStatus, { label: string; tone: string }>`
- [ ] `TYPE_LABELS`: `Partial<Record<ParsedType, string>>`
- [ ] `MessageRow` props: `{ message: WebhookMessage; active: boolean; onSelect: (m: WebhookMessage) => void }`
- [ ] `Timeline` props: `{ events?: FlowEvent[] }`
- [ ] `InboxDetail` props tipados completamente
- [ ] `npm run build`

---

## Fase 9 — Migrar `src/app.tsx`

> El más complejo — se hace último cuando todos los imports ya tienen tipos.

- [ ] Renombrar `src/app.jsx` → `src/app.tsx`
- [ ] Importar `ScreenId`, `Toast`, `ToastType` desde `./types`
- [ ] Tipar `TWEAK_DEFAULTS`:
  ```ts
  type TweakDefaults = { accent: string | [string, string, string]; startScreen: ScreenId }
  ```
- [ ] Tipar `ACCENT_PRESETS: [string, string, string][]`
- [ ] Tipar props de `ThemeToggle`, `Sidebar`, `MobileTabs`
- [ ] El usuario Firebase es `firebase.User | false | null` — tipar `user` en `App` correctamente
- [ ] Actualizar `index.html`:
  ```html
  <script type="module" src="/src/app.tsx"></script>
  ```
- [ ] `npm run typecheck` — **0 errores en todo el proyecto**
- [ ] `npm run build`

---

## Fase 10 — CI/CD

- [ ] Actualizar `.github/workflows/deploy.yml`:
  ```yaml
  - name: Install dependencies
    run: npm install

  - name: Type check
    run: npm run typecheck

  - name: Build
    run: npm run build
  ```
- [ ] Push y verificar que el Action pasa en GitHub

---

## Fase 11 — Tests

- [ ] Crear `src/utils/formatters.test.ts`:
  - [ ] `fmtUSD(1234.5)` → `"$1,234.50"`
  - [ ] `fmtUSD(null)` → `"—"`
  - [ ] `fmtUSD(0, false)` → `"0.00"`
  - [ ] `fmtGs(7300)` → `"7.300"`
  - [ ] `fmtGs(null)` → `"—"`
  - [ ] `fmtDate("2025-05-25T00:00:00.000Z", false)` → formato `dd/mm/yyyy`
  - [ ] `fmtDate("2025-05-25T15:30:00.000Z", true)` → incluye hora `HH:MM`

- [ ] Crear `src/api/transactions.test.ts` para `mapTransaction`:
  - [ ] `colaborador: "Patty Acosta"` → `colab: "patty"`, `comPatty !== null`, `comAnael === null`
  - [ ] `colaborador: "Gabriel Zambrano"` → `colab: "gabriel"`, `comAnael === null`, `comPatty === null`
  - [ ] `colaborador: "Anael Ríos"` → `colab: "anael"`, `comAnael !== null`, `comPatty === null`
  - [ ] `colaborador: null` → `colab: "gabriel"`
  - [ ] `id` tiene formato `"TX-{n}"`
  - [ ] Los campos numéricos son `number`, no `string`

- [ ] Agregar `npm test` al workflow de CI (antes del build)
- [ ] Confirmar que todos los tests pasan: `npm test`

---

## Checklist final antes de merge

- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run build` — build exitoso
- [ ] `npm test` — todos los tests pasan
- [ ] `npm run dev` — la app corre igual que antes
- [ ] Login funciona
- [ ] Dashboard carga métricas
- [ ] Transacciones — filtros, tabla, panel de detalle, eliminar
- [ ] Reportes — preview, descarga, presets
- [ ] Configuración — tasa, colaboradores CRUD, cerrar sesión
- [ ] Bot WhatsApp — inbox, detalle de mensaje, timeline
- [ ] Tema claro/oscuro funciona
- [ ] Mobile responsive sin cambios
- [ ] GitHub Actions pasa (typecheck + test + build)

---

## Notas

**`noUnusedLocals: true`** puede marcar variables usadas solo en JSX. Revisar caso por caso — nunca deshabilitar la regla globalmente.

**Firebase compat SDK** incluye sus tipos — no requiere `@types/firebase`. El tipo del usuario es `firebase.User`.

**`window.showToast`** declarado como global en `src/types/index.ts` elimina todos los `.?()` con error de tipo.

**Cada fase es atómica**: si `npm run build` falla al terminar una fase, no avanzar. Corregir ahí.
