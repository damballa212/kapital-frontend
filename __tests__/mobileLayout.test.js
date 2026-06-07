import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

describe('mobile layout safeguards', () => {
  const css = read('styles.css')

  it('prevents flexible inbox controls from overflowing the mobile viewport', () => {
    expect(css).toMatch(/\.inbox-toolbar\s*\{[^}]*min-width:\s*0/s)
    expect(css).toMatch(/\.inbox-search\s*\{[^}]*min-width:\s*0/s)
    expect(css).toMatch(/\.inbox-toolbar\s+\.btn\.icon\s*\{[^}]*flex:\s*0\s+0/s)
  })

  it('forces form controls to fit their containers on mobile', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*900px\)[\s\S]*\.input,\s*\.select/)
    expect(css).toMatch(/@media\s*\(max-width:\s*900px\)[\s\S]*input\[type="date"\]/)
    expect(css).toMatch(/max-width:\s*100%/)
  })

  it('has shared desktop and mobile visibility utilities', () => {
    expect(css).toContain('.mobile-only')
    expect(css).toContain('.desktop-only')
    expect(css).toMatch(/@media\s*\(max-width:\s*900px\)[\s\S]*\.desktop-only\s*\{[^}]*display:\s*none!important/)
  })

  it('keeps collaborators as a compact mobile table instead of cards', () => {
    const settings = read('screens/settings.jsx')
    expect(settings).toContain('collaborators-table')
    expect(settings).not.toContain('collaborator-mobile-list')
    expect(settings).not.toContain('collaborator-card')
  })

  it('keeps transactions as a compact mobile table with priority columns', () => {
    const transactions = read('screens/transactions.jsx')
    expect(transactions).toContain('transactions-table')
    expect(transactions).toContain('optional-col')
    expect(transactions).not.toContain('tx-mobile-list')
    expect(transactions).not.toContain('tx-mobile-card')
  })

  it('uses responsive report classes instead of fixed inline desktop layouts', () => {
    const reports = read('screens/reports.jsx')
    expect(reports).toContain('reports-field-grid')
    expect(reports).toContain('reports-format-grid')
    expect(reports).toContain('reports-preview')
    expect(reports).not.toContain('position:"sticky"')
  })

  it('loads report collaborator filters from the API instead of hardcoded COLABS', () => {
    const reports = read('screens/reports.jsx')
    expect(reports).toContain('fetchCollaborators')
    expect(reports).not.toMatch(/COLABS\s*,/)
    expect(reports).not.toContain('COLABS.map')
  })

  it('labels HOY and YO WhatsApp command types in the inbox', () => {
    const bot = read('screens/bot-whatsapp.jsx')
    expect(bot).toMatch(/HOY:\s*"Resumen hoy"/)
    expect(bot).toMatch(/YO:\s*"Resumen yo"/)
  })

  it('keeps Firebase production config as a fallback when CI secrets are absent', () => {
    const config = read('config.js')
    expect(config).toContain('FIREBASE_HOSTING_CONFIG')
    expect(config).toContain('kapital-app-prod.firebaseapp.com')
    expect(config).toContain('AIzaSyAXH20HY1VDhyLTmohMsKp4n6utSeUEn98')
    expect(config).toMatch(/VITE_FIREBASE_API_KEY\s*\|\|\s*FIREBASE_HOSTING_CONFIG\.apiKey/)
  })

  it('fails fast in config when VITE_API_BASE_URL is missing', () => {
    const config = read('config.js')
    const api = read('api.js')
    expect(config).toContain('Falta configurar VITE_API_BASE_URL')
    expect(config).toMatch(/if\s*\(!apiBaseUrl\)/)
    expect(api).not.toMatch(/if\s*\(!API_BASE_URL\)/)
  })

  it('passes Vite build env values through the deploy workflow', () => {
    const workflow = read('.github/workflows/deploy.yml')
    expect(workflow).toContain('VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}')
    expect(workflow).toContain('VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}')
  })

  it('uses the real Kapital logo asset through shared branding', () => {
    const app = read('app.jsx')
    const login = read('screens/login.jsx')
    const brand = read('kapital-brand.jsx')
    expect(app).toContain("import KapitalBrand from './kapital-brand.jsx'")
    expect(app).toContain('<KapitalBrand')
    expect(app).toContain('brand-logo-loading')
    expect(login).toContain("import KapitalBrand from '../kapital-brand.jsx'")
    expect(login).toContain('<KapitalBrand')
    expect(brand).toContain('src="/kapital-logo-transparent-v2.png"')
    expect(brand).not.toContain('<svg')
    expect(css).toContain('.kapital-brand')
  })

  it('uses mobile-native dashboard layout classes instead of fixed split grids', () => {
    const dashboard = read('screens/dashboard.jsx')
    expect(dashboard).toContain('dashboard-overview-grid')
    expect(dashboard).toContain('dashboard-chart-grid')
    expect(dashboard).toContain('dashboard-performance-table')
    expect(dashboard).toContain('optional-col')
    expect(dashboard).not.toContain('gridTemplateColumns:"2fr 1fr"')
  })
})
