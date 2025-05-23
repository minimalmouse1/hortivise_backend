import env from '#start/env'
import { defineConfig } from '@vbusatta/adonis-stripe'

export default defineConfig({
  /*
  |--------------------------------------------------------------
  | Stripe API Key
  |--------------------------------------------------------------
  | Your Stripe API key for authenticating requests.
  */
  apiKey: env.get('STRIPE_API_KEY'),

  /*
  |--------------------------------------------------------------
  | Webhook Secret
  |--------------------------------------------------------------
  | Required if you handle Stripe webhooks to validate incoming requests.
  */
  webhookSecret: env.get('STRIPE_WEBHOOK_SECRET'),

  /*
  |--------------------------------------------------------------------------
  | Stripe API Version (optional)
  |--------------------------------------------------------------------------
  | Specify a fixed API version to avoid unexpected changes. Defaults to the
  | latest version if not provided.
  */
  // apiVersion: env.get('STRIPE_API_VERSION'),

  /*
  |--------------------------------------------------------------
  | Optional Configuration
  |--------------------------------------------------------------
  | Uncomment the following options to customize the Stripe client.
  */
  // maxNetworkRetries: 1,      // Retry failed requests (default: 1)
  // timeout: 80000,            // Request timeout in ms (default: 80s)
  // telemetry: true,           // Send latency metrics to Stripe
  // host: 'api.stripe.com',    // Custom API host
  // port: 443,                 // Custom API port
  // protocol: 'https',         // Custom API protocol
  // appInfo: {}                // App information for Stripe
  // httpAgent: null,           // Custom HTTP agent for proxies
  // httpClient: null,          // Custom HTTP client
  // stripeAccount: null,       // Stripe Connect account ID
})
