import vine from '@vinejs/vine'

/*
 * Validates the product's creation action
 */

export const create = vine.compile(
  vine.object({
    name: vine.string(),
    description: vine.string().maxLength(200).optional(),
    price: vine.number(),
    active: vine.boolean().optional(),
  })
)

/*
 * Validates the product's update action
 */

export const update = vine.compile(
  vine.object({
    name: vine.string().optional(),
    description: vine.string().maxLength(200).optional(),
    price: vine.number().optional(),
    active: vine.boolean().optional(),
  })
)

/*
 * Validates the product's response action
 */

export const productResponse = vine.compile(
  vine.object({
    name: vine.string(),
    active: vine.boolean(),
    price_id: vine.string(),
    product_id: vine.string(),
    description: vine.string().maxLength(200).optional(),
  })
)
