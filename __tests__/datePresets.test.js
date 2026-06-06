import { describe, it, expect } from 'vitest'
import { getDatePresets } from '../utils/datePresets.js'

// Crea una fecha UTC fija para que los tests no dependan de la hora local.
// Usamos 15:00 UTC = 11:00am Paraguay (UTC-4) — nunca cruza medianoche.
function utcNoon(isoDate) {
  return new Date(`${isoDate}T15:00:00.000Z`)
}

describe('getDatePresets', () => {

  // ── "Hoy" ──────────────────────────────────────────────────────────────────

  it('Hoy: from y to son la fecha de hoy', () => {
    const now = utcNoon('2026-05-25')
    const presets = Object.fromEntries(getDatePresets(now).map(([k, f, t]) => [k, { f, t }]))
    expect(presets['Hoy'].f).toBe('2026-05-25')
    expect(presets['Hoy'].t).toBe('2026-05-25')
  })

  // ── "Esta semana" ─────────────────────────────────────────────────────────

  it('Esta semana: domingo → lunes de la semana actual', () => {
    const now = utcNoon('2026-05-24') // domingo (May 24 = Dom, May 25 = Lun)
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-05-18') // lunes anterior
    expect(t).toBe('2026-05-24')
  })

  it('Esta semana: lunes → el mismo lunes', () => {
    const now = utcNoon('2026-05-18') // lunes
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-05-18')
    expect(t).toBe('2026-05-18')
  })

  it('Esta semana: martes', () => {
    const now = utcNoon('2026-05-19') // martes
    const [, f] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-05-18') // lunes
  })

  it('Esta semana: miércoles', () => {
    const now = utcNoon('2026-05-20') // miércoles
    const [, f] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-05-18')
  })

  it('Esta semana: sábado', () => {
    const now = utcNoon('2026-05-23') // sábado
    const [, f] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-05-18')
  })

  it('Esta semana: lunes cruza al mes anterior', () => {
    // Hoy es martes 2 de junio → lunes fue 1 de junio (no cruza mes, ok)
    // Hoy es miércoles 1 de julio → lunes fue 29 de junio
    const now = utcNoon('2026-07-01') // miércoles
    const [, f] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2026-06-29') // lunes en el mes anterior
  })

  it('Esta semana: semana cruza año nuevo', () => {
    // 1 de enero 2026 es jueves
    const now = utcNoon('2026-01-01') // jueves
    const [, f] = getDatePresets(now).find(([k]) => k === 'Esta semana')
    expect(f).toBe('2025-12-29') // lunes 29 dic 2025
  })

  // ── "Mes actual" ──────────────────────────────────────────────────────────

  it('Mes actual: from es el 1 del mes, to es hoy', () => {
    const now = utcNoon('2026-05-25')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes actual')
    expect(f).toBe('2026-05-01')
    expect(t).toBe('2026-05-25')
  })

  it('Mes actual: el 1 del mes, from y to son el mismo día', () => {
    const now = utcNoon('2026-06-01')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes actual')
    expect(f).toBe('2026-06-01')
    expect(t).toBe('2026-06-01')
  })

  // ── "Mes pasado" ──────────────────────────────────────────────────────────

  it('Mes pasado: mayo → abril completo', () => {
    const now = utcNoon('2026-05-25')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes pasado')
    expect(f).toBe('2026-04-01')
    expect(t).toBe('2026-04-30')
  })

  it('Mes pasado: enero → diciembre del año anterior', () => {
    const now = utcNoon('2026-01-15')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes pasado')
    expect(f).toBe('2025-12-01')
    expect(t).toBe('2025-12-31')
  })

  it('Mes pasado: marzo → febrero (28 días, año no bisiesto)', () => {
    const now = utcNoon('2026-03-10')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes pasado')
    expect(f).toBe('2026-02-01')
    expect(t).toBe('2026-02-28')
  })

  it('Mes pasado: marzo → febrero de año bisiesto (29 días)', () => {
    const now = utcNoon('2025-03-10') // 2024 fue bisiesto, pero el mes pasado es feb 2025
    // 2025 no es bisiesto
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes pasado')
    expect(f).toBe('2025-02-01')
    expect(t).toBe('2025-02-28')
  })

  it('Mes pasado: marzo 2024 → febrero 2024 (año bisiesto, 29 días)', () => {
    const now = utcNoon('2024-03-10')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Mes pasado')
    expect(f).toBe('2024-02-01')
    expect(t).toBe('2024-02-29') // 2024 sí es bisiesto
  })

  // ── "Últimos 90 días" ──────────────────────────────────────────────────────

  it('Últimos 90 días: from es exactamente 90 días atrás', () => {
    const now = utcNoon('2026-05-25')
    const [, f, t] = getDatePresets(now).find(([k]) => k === 'Últimos 90 días')
    expect(t).toBe('2026-05-25')
    // 2026-05-25 − 90 días = 2026-02-24
    expect(f).toBe('2026-02-24')
  })

  it('Últimos 90 días: cruza año nuevo', () => {
    const now = utcNoon('2026-02-01')
    const [, f] = getDatePresets(now).find(([k]) => k === 'Últimos 90 días')
    // 2026-02-01 − 90 días = 2025-11-03
    expect(f).toBe('2025-11-03')
  })

  // ── Invariantes generales ─────────────────────────────────────────────────

  it('todas las fechas tienen formato YYYY-MM-DD', () => {
    const now = utcNoon('2026-05-25')
    for (const [, f, t] of getDatePresets(now)) {
      expect(f).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('from siempre es ≤ to en todos los presets', () => {
    const now = utcNoon('2026-05-25')
    for (const [label, f, t] of getDatePresets(now)) {
      expect(f <= t, `${label}: from (${f}) debería ser ≤ to (${t})`).toBe(true)
    }
  })

  it('from ≤ to en domingo (caso que fallaba antes del fix)', () => {
    const sunday = utcNoon('2026-05-24') // domingo real
    for (const [label, f, t] of getDatePresets(sunday)) {
      expect(f <= t, `${label} en domingo: from (${f}) > to (${t})`).toBe(true)
    }
  })

  it('devuelve exactamente 5 presets', () => {
    expect(getDatePresets(utcNoon('2026-05-25'))).toHaveLength(5)
  })

  it('los labels son exactamente los esperados', () => {
    const labels = getDatePresets(utcNoon('2026-05-25')).map(([k]) => k)
    expect(labels).toEqual(['Hoy', 'Esta semana', 'Mes actual', 'Mes pasado', 'Últimos 90 días'])
  })
})
