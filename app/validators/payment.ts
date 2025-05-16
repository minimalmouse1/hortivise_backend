import vine from '@vinejs/vine'

/*
 * Validates the checkout session action
 */

export const charge = vine.compile(
  vine.object({
    customerEmail: vine.string().email(),
    priceId: vine.string().maxLength(250).startsWith('price_'),
    success_url: vine.string().optional(),
    cancel_url: vine.string().optional(),
  })
)

/*
 * Validates the checkout session response action
 */

export const chargeResponse = vine.compile(
  vine.object({
    id: vine.string(),
    session_url: vine.string().url(),
  })
)

/*
 * Validates the verify session response action
 */

export const verifyResponse = vine.compile(
  vine.object({
    id: vine.string().maxLength(1000).startsWith('cs_'),
    currency: vine.string(),
    created: vine.number(),
    email: vine.string().email(),
    amount: vine.number(),
    payment_status: vine.string(),
    payment_intent: vine.string().startsWith('pi_'),
  })
)

/*
 * Validates the refund action
 */

export const refund = vine.compile(
  vine.object({
    payment_intent: vine.string().startsWith('pi_'),
  })
)

/*
 * Validates the partial refund action
 */

export const partialRefund = vine.compile(
  vine.object({
    payment_intent: vine.string().startsWith('pi_'),
    percentage: vine.number().min(1).max(100).optional(),
  })
)

/*
 * Validates the refund response action
 */

export const refundResponse = vine.compile(
  vine.object({
    id: vine.string(),
    status: vine.string(),
    amount: vine.number(),
    created: vine.number(),
    currency: vine.string(),
    charge: vine.string(),
    payment_intent: vine.string(),
    balance_transaction: vine.string(),
  })
)
