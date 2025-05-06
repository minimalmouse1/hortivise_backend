import { defineConfig } from '@foadonis/openapi'

export default defineConfig({
  ui: 'swagger',
  document: {
    info: {
      title: 'Stripe Payment Module',
      version: '1.0.0',
    },
  },
})
