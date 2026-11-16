# KapitalApp - Frontend

Internal dashboard for KapitalApp, Gabriel Zambrano's operating ledger for TikTok creator payout/liquidation workflows in Paraguay.

KapitalApp is not a generic currency-exchange dashboard or a public client CRM. It is used internally by authorized operators to review operations that Gabriel Zambrano, as business owner, or an active collaborator registers through WhatsApp after creators withdraw TikTok earnings to PayPal and the value is liquidated through PayPal, Bank of America, Zelle, USDT, or Paraguayan guaranies.

The frontend gives Gabriel visibility into transactions, commissions, rates, collaborator performance, WhatsApp bot processing, and exportable accounting reports.

## Business Context

The supported workflow is:

1. A TikTok creator earns money from live gifts.
2. The creator withdraws those earnings to PayPal.
3. Gabriel coordinates liquidity through PayPal, Bank of America, Zelle, USDT, or guaranies.
4. Gabriel or an active collaborator records the operation in WhatsApp with `#TRANSACCION`.
5. KapitalApp stores the operation and exposes it in this dashboard for control, review, and accounting exports.

The dashboard is designed for internal operational clarity: what was received, what was delivered, which rate was used, how commissions were calculated, and what needs to be reported to the accountant.

## Overview

Single-page application consumed exclusively by authorized operators. It provides real-time visibility into:

- Daily and monthly operation volume.
- Current USD/PYG rate.
- Transaction history and per-operation commission breakdown.
- Client and collaborator activity.
- CSV, Excel, and PDF accounting exports.
- WhatsApp bot conversations, processing events, and failures.

Authentication is handled by Firebase Auth with Google Sign-In. Only whitelisted email addresses can access the app; the backend enforces this at the API level.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Bundler | Vite 8 |
| Hosting | Azure Static Web Apps (Free tier) |
| Auth | Firebase Auth (Google Sign-In) |
| Realtime | Supabase Realtime via `@supabase/supabase-js` |
| Error monitoring | Sentry (`@sentry/react`, enabled via `VITE_SENTRY_DSN`) |
| Tests | Vitest |
| CI/CD | GitHub Actions -> Azure Static Web Apps Deploy action |

## Screens

| Screen | Route key | Description |
|--------|-----------|-------------|
| Dashboard | `dashboard` | Today metrics, monthly KPIs, daily activity chart, top clients, and collaborator performance |
| Transactions | `transactions` | Paginated operation list with filters and side panel showing full commission/rate breakdown |
| Reports | `reports` | Export operations as CSV, Excel, or PDF with field selector, date presets, and saveable presets |
| Bot WhatsApp | `bot` | Three-panel inbox: contacts, message thread, and processing timeline for every inbound WhatsApp message |
| Settings | `settings` | Collaborator management, allowed users whitelist, and rate configuration |
| Login | n/a | Google Sign-In; redirects to dashboard on success |

## Operator Boundaries

- Primary users: Gabriel Zambrano and authorized collaborators/operators.
- Gabriel is the owner/default operator; collaborators are operational users that can change over time.
- WhatsApp command users are expected to be Gabriel or currently active collaborators, not end clients.
- Client-facing negotiation happens outside the app.
- The dashboard is for internal ledger review, operations monitoring, and accounting exports.

## Project Structure

```text
├── app.jsx             # App shell: auth state, routing, sidebar, realtime subscriptions
├── api.js              # API calls to the backend + formatting helpers
├── config.js           # Reads VITE_* env vars
├── firebase.js         # Firebase Auth initialization
├── icons.jsx           # SVG icon components
├── kapital-brand.jsx   # Logo component
├── tweaks-panel.jsx    # Developer theming panel
├── utils/
│   └── datePresets.js  # Date range presets
├── screens/
│   ├── login.jsx
│   ├── dashboard.jsx
│   ├── transactions.jsx
│   ├── reports.jsx
│   ├── settings.jsx
│   └── bot-whatsapp.jsx
└── styles.css          # Design tokens, layout, and components
```

## Realtime Updates

The app uses Supabase Realtime to refresh data automatically when PostgreSQL changes. Three channels are subscribed on login:

- `transactions` table -> refreshes Transactions and Dashboard.
- `global_rate` table -> refreshes Dashboard rate badge.
- `whatsapp_inbound_messages` table -> refreshes Bot WhatsApp inbox.

Each subscription carries an `rtKeys` prop down to screens, which trigger `useEffect` refetches when the key changes.

## WhatsApp Bot Monitor

The Bot WhatsApp screen (`bot-whatsapp.jsx`) is an internal operations inbox:

1. **Contacts panel** - conversations from the last 7 days with message counts, error badges, and success counts.
2. **Thread panel** - up to 30 messages at a time, oldest to newest, with stable pagination for older messages.
3. **Detail panel** - full message processing timeline: received, normalized, parsed, transaction created, confirmation sent, or failure captured.

This screen exists to audit the bot and debug operational failures, not to run customer support chat.

## Transaction Review

Transactions show the operational and accounting details Gabriel needs:

- Client name.
- Collaborator/operator attribution.
- USD amount.
- Commission percentage.
- USD/PYG rate used.
- Guaranies delivered.
- Gabriel and collaborator commission amounts.
- Original WhatsApp message context when available.

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

# Sentry (optional; enabled when DSN is present)
VITE_SENTRY_DSN=
VITE_SENTRY_RELEASE=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=0
```

Sentry sends frontend errors to the `kapital-frontend` project. Tracing and Session Replay default to `0` to stay conservative on free-tier usage; raise the sample rates only when actively debugging.

## Local Development

Prerequisites: Node.js 24 LTS, npm, and a running backend API.

```bash
# Install dependencies
npm install

# Copy and fill env
cp .env.example .env.local

# Start dev server
npm run dev
# App available at http://localhost:5173
```

## Running Tests

```bash
npm test
npm run test:watch
```

## Deployment

Pull requests run `npm ci`, `npm test`, and a Vite build on a standard
GitHub-hosted Linux runner with Node.js 24. Verification has read-only repository
permissions, uses a non-routable API URL, and receives no production secrets.
It produces a compilation check, not a functional preview of production.
Documentation-only changes are skipped and a newer update to the same PR cancels
its previous verification. No build artifacts or dependency caches are uploaded.

Production deployment runs on every push to `main` or manual dispatch via GitHub Actions:

1. Install dependencies with `npm ci`.
2. Run the existing test suite with `npm test`; failures stop deployment.
3. Build with Vite using GitHub-provided `VITE_*` secrets.
4. Upload source maps to Sentry when `SENTRY_AUTH_TOKEN` is configured.
5. Deploy `dist/` to Azure Static Web Apps.

Deployment jobs are serialized without cancelling a running deployment and have a
20-minute timeout. Verification on PRs has a separate 15-minute timeout.

Required GitHub secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

The workflow also expects Firebase `VITE_FIREBASE_*` secrets for production auth configuration.

Optional GitHub secret: `SENTRY_AUTH_TOKEN`. When present, the Vite build uploads hidden source maps to Sentry using org `darks-matter-co` and project `kapital-frontend`. Without it, source map upload is skipped and the build still succeeds.

## Export Formats

Available from the Reports screen:

| Format | Description |
|--------|-------------|
| CSV | Plain text, UTF-8 |
| Excel | `.xlsx` with Transactions, Summary, and By Collaborator sheets |
| PDF | A4 landscape report with KPI cards, collaborator breakdown, and paginated transaction detail |

Field selection is configurable per export. Filter presets can be saved and reused.

## Production Monitoring

- Frontend errors are sent to Sentry project `kapital-frontend` when `VITE_SENTRY_DSN` is present.
- Sentry source maps are uploaded in CI when `SENTRY_AUTH_TOKEN` is configured.
- Sentry is connected to Linear so new or regressed production errors can create Linear issues automatically.
