import vine from '@vinejs/vine'

/*
 * Validates the checkout sesstion action
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
 * Validates the checkout sesstion response action
 */

export const chargeResponse = vine.compile(
  vine.object({
    session_url: vine.string().url(),
  })
)

/*
 * Validates the checkout sesstion response action
 */

export const verifyResponse = vine.compile(
  vine.object({
    id: vine.string().maxLength(1000).startsWith('cs_'),
    currency: vine.string(),
    created: vine.number(),
    email: vine.string().email(),
    amount: vine.number(),
    payment_status: vine.string(),
  })
)
