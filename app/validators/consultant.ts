import vine from '@vinejs/vine'

/*
 * Validates the consultant create action
 */

export const createConsultant = vine.compile(
  vine.object({
    phone: vine.string(),
    last_name: vine.string(),
    country: vine.string(),
    first_name: vine.string(),
    email: vine.string().email(),
    gender: vine.enum(['male', 'female']),
  })
)

/*
 * Validates the consultant response action
 */

export const consultantResponse = vine.compile(
  vine.object({
    id: vine.string(),
    phone: vine.string(),
    gender: vine.string(),
    country: vine.string(),
    created: vine.number(),
    last_name: vine.string(),
    onboarded: vine.boolean(),
    first_name: vine.string(),
    email: vine.string().email(),
    default_currency: vine.string(),
    stripe_account_id: vine.string(),
  })
)
