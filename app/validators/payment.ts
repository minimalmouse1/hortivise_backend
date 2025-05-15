import vine from '@vinejs/vine'

/*
 * Validates the product's creation action
 */

export const charge = vine.compile(
  vine.object({
    customerEmail: vine.string().email(),
    priceId: vine.string().maxLength(250).startsWith('price_'),
  })
)
