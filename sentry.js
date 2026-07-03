import * as Sentry from '@sentry/react'
import { API_BASE_URL } from './config.js'

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()

const numberFromEnv = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const tracesSampleRate = numberFromEnv(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0)
const replaysSessionSampleRate = numberFromEnv(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0)
const replaysOnErrorSampleRate = numberFromEnv(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 0)

const buildTraceTargets = () => {
  const targets = ['localhost']
  try {
    targets.push(new URL(API_BASE_URL).origin)
  } catch {
    // API_BASE_URL is validated in config.js; keep Sentry init resilient anyway.
  }
  return targets
}

if (dsn) {
  const integrations = []

  if (tracesSampleRate > 0) {
    integrations.push(Sentry.browserTracingIntegration())
  }

  if (replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0) {
    integrations.push(Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }))
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    sendDefaultPii: false,
    integrations,
    tracesSampleRate,
    tracePropagationTargets: buildTraceTargets(),
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
  })
}

export { Sentry }
