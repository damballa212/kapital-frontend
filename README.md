# Kapital — Frontend

Management dashboard for Kapital, a currency exchange (casa de cambios) operation. Built with React 18 + Vite, deployed on Azure Static Web Apps.

## Overview

Single-page application consumed exclusively by authorized operators. Provides real-time visibility into transactions, exchange rates, commissions, collaborator performance, and the WhatsApp bot activity log.

Authentication is handled by Firebase Auth (Google Sign-In). Only whitelisted email addresses can access the app — the backend enforces this at the API level.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 (no build-time JSX transform — plain Vite + `@vitejs/plugin-react`) |
| Bundler | Vite 8 |
| Hosting | Azure Static Web Apps (Free tier) |
| Auth | Firebase Auth (Google Sign-In) |
| Realtime | Supabase Realtime (Postgres `LISTEN/NOTIFY` via `@supabase/supabase-js`) |
| Tests | Vitest |
| CI/CD | GitHub Actions → Azure Static Web Apps Deploy action |

## Screens

| Screen | Route key | Description |
|--------|-----------|-------------|
| Dashboard | `dashboard` | Today's metrics, monthly KPIs, daily activity bar chart, top clients, collaborator performance table |
| Transactions | `transactions` | Paginated transaction list with filters; side panel with full commission breakdown per transaction |
| Reports | `reports` | Export transactions as CSV, Excel, or PDF with field selector, date presets, and saveable filter presets |
| Bot WhatsApp | `bot` | Three-panel inbox: contacts → message thread → message detail with processing flow timeline |
| Settings | `settings` | Collaborator management (create, edit, deactivate), allowed users whitelist, rate configuration |
| Login | — | Google Sign-In; redirects to dashboard on success |

## Project Structure

```
├── app.jsx             # App shell: auth state, routing, sidebar, realtime subscriptions
├── api.js              # All API calls to the backend + formatting helpers
├── config.js           # Reads VITE_* env vars
├── firebase.js         # Firebase Auth initialization
├── icons.jsx           # SVG icon components
├── kapital-brand.jsx   # Logo component
├── tweaks-panel.jsx    # Developer theming panel (accent color, dark/light mode)
├── utils/
│   └── datePresets.js  # Date range presets (today, this week, this month, etc.)
├── screens/
│   ├── login.jsx
│   ├── dashboard.jsx
│   ├── transactions.jsx
│   ├── reports.jsx
│   ├── settings.jsx
│   └── bot-whatsapp.jsx
└── styles.css          # Single CSS file — design tokens, layout, components
```

## Realtime Updates

The app uses Supabase Realtime to refresh data automatically when the database changes. Three channels are subscribed on login:

- `transactions` table → refreshes Transactions screen and Dashboard
- `global_rate` table → refreshes Dashboard rate badge
- `whatsapp_inbound_messages` table → refreshes Bot WhatsApp inbox

Each subscription carries a `rtKeys` prop down to screens, which trigger `useEffect` refetches when the key changes.

## WhatsApp Bot Monitor

The Bot WhatsApp screen (`bot-whatsapp.jsx`) is a three-panel inbox:

1. **Contacts panel** — lists all conversations from the last 7 days with message counts, error badges, and success counts.
2. **Thread panel** — shows up to 30 messages at a time (oldest→newest, auto-scrolled to bottom). "Mostrar mensajes anteriores" button loads older pages without losing scroll position.
3. **Detail panel** — displays the full message processing timeline (received → parsed → transaction created → confirmation sent/failed) with timestamps and structured details per step.

## Environment Variables

```env
VITE_API_BASE_URL=https://your-backend-url
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Firebase (for Auth)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Local Development

**Prerequisites:** Node.js 20+, npm, a running instance of the backend API.

```bash
# Install dependencies
npm install

# Copy and fill env
cp .env.example .env.local  # add your values

# Start dev server
npm run dev
# App available at http://localhost:5173
```

## Running Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

## Deployment

CI/CD runs on every push to `main` via GitHub Actions:

1. Install dependencies (`npm ci`)
2. Build with Vite (`npm run build`) — injects `VITE_*` secrets from GitHub
3. Deploy `dist/` to Azure Static Web Apps

Required GitHub secrets: `AZURE_STATIC_WEB_APPS_API_TOKEN`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Export Formats

Available from the Reports screen:

| Format | Description |
|--------|-------------|
| CSV | Plain text, UTF-8 |
| Excel | `.xlsx` — Transactions sheet with totals row, Summary sheet, By Collaborator sheet |
| PDF | A4 landscape — executive summary with KPI cards, collaborator breakdown, paginated transaction detail |

Field selection is configurable per export. Filter presets can be saved and reused.
