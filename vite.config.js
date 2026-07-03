import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const sentryRelease = process.env.SENTRY_RELEASE || process.env.GITHUB_SHA
const shouldUploadSourcemaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT &&
  sentryRelease
)

export default defineConfig({
  build: {
    sourcemap: shouldUploadSourcemaps ? 'hidden' : false,
  },
  plugins: [
    react(),
    shouldUploadSourcemaps && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: sentryRelease,
      },
    }),
  ].filter(Boolean),
  test: {
    environment: 'node',
  },
})
