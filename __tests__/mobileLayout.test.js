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

  it('uses mobile-native dashboard layout classes instead of fixed split grids', () => {
    const dashboard = read('screens/dashboard.jsx')
    expect(dashboard).toContain('dashboard-overview-grid')
    expect(dashboard).toContain('dashboard-chart-grid')
    expect(dashboard).toContain('dashboard-performance-table')
    expect(dashboard).toContain('optional-col')
    expect(dashboard).not.toContain('gridTemplateColumns:"2fr 1fr"')
  })
})
