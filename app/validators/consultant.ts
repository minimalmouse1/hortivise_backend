import vine from '@vinejs/vine'

/*
 * Validates the consultant create action
 */

export const createConsultant = vine.compile(
  vine.object({
    first_name: vine.string(),
    email: vine.string().email(),
  })
)

/*
 * Validates the consultant response action
 */

export const consultantResponse = vine.compile(
  vine.object({
    id: vine.string(),
    created: vine.number(),
    onboarded: vine.boolean(),
    first_name: vine.string(),
    email: vine.string().email(),
    default_currency: vine.string(),
    stripe_account_id: vine.string(),
  })
)
