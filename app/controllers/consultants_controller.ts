import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import { createConsultant, consultantResponse } from '#validators/consultant'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import stripe from '@vbusatta/adonis-stripe/services/main'

export default class ConsultantsController {
  private stripe = stripe.api

  /**
   * @list
   * @summary List all consultants (Stripe connected accounts)
   * @description Lists Stripe accounts filtered by type = express
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<consultantResponse[]>" }
   * @responseBody 500 - { code: 500, message: "Internal server error" }
   */

  public async list({ response }: HttpContext) {
    try {
      const accounts = await this.stripe.accounts.list({ limit: 100 })

      const filtered = accounts.data.filter((acc) => acc.type === 'express')

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: filtered,
      })
    } catch (err) {
      logger.error(`list consultants error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @show
   * @summary Show consultant detail by account_id
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<consultantResponse>" }
   * @responseBody 400 - { code: 400, message: "Missing account_id" }
   * @responseBody 500 - { code: 500, message: "Internal server error" }
   */

  public async show({ request, response }: HttpContext) {
    const accountId = request.param('account-id')

    if (!accountId) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: 'Missing account_id',
      })
    }

    try {
      const account = await this.stripe.accounts.retrieve(accountId)

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: account,
      })
    } catch (err) {
      logger.error(`show consultant error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  // /**
  //  * @show
  //  * @summary Show consultant detail by email
  //  * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<consultantResponse>" }
  //  * @responseBody 400 - { code: 400, message: "Missing email" }
  //  * @responseBody 500 - { code: 500, message: "Internal server error" }
  //  */

  // public async showBYEmail({ request, response }: HttpContext) {
  //   const email = request.param('email') || request.qs().email || request.input('email')

  //   if (!email) {
  //     return response.badRequest({
  //       code: HttpCodes.BAD_REQUEST,
  //       message: 'Missing email',
  //     })
  //   }

  //   try {
  //     const accounts = await this.stripe.accounts.list({ limit: 100 })
  //     const matched = accounts.data.find((acct) => acct.email === email)

  //     if (!matched) {
  //       return response.notFound({
  //         code: HttpCodes.NOT_FOUND,
  //         message: 'Consultant not found',
  //       })
  //     }

  //     return response.ok({
  //       code: HttpCodes.OK,
  //       message: HttpResponse.OK,
  //       result: matched,
  //     })
  //   } catch (err) {
  //     logger.error(`show consultant error ==> ${JSON.stringify(err, null, 2)}`)
  //     return response.internalServerError({
  //       code: HttpCodes.INTERNAL_SERVER_ERROR,
  //       message: HttpResponse.INTERNAL_SERVER_ERROR,
  //     })
  //   }
  // }

  /**
   * @create
   * @summary Create consultant and initialize Stripe connected account (escrow setup)
   * @description Saves consultant details and creates an Express connected account in Stripe
   * @requestBody <createConsultant>
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<consultantResponse>" }
   * @responseBody 500 - { "code": 500, "message": "Internal server error" }
   */

  public async create({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await createConsultant.validate(data)

    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: payload.email,
        default_currency: 'usd',
        country: 'US',
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        individual: {
          email: payload.email,
          first_name: payload.first_name,
        },
        metadata: {
          source: 'consultant-onboarding',
        },
      })

      const validated = await consultantResponse.validate({
        id: account.id,
        onboarded: false,
        email: account.email,
        default_currency: 'usd',
        created: account.created,
        stripe_account_id: account.id,
        first_name: account.individual?.first_name,
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error(`create consultant error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @getOnboardingLink
   * @summary Generate onboarding link for connected account
   * @description Returns Stripe onboarding link for the consultant to complete setup
   * @paramQuery account_id - Stripe connected account ID - @type string
   * @responseBody 200 - { code: 200, message: "Request successful", result: onboarding_url }
   * @responseBody 400 - { code: 400, message: "Missing or invalid account_id" }
   */

  public async getOnboardingLink({ request, response }: HttpContext) {
    const accountId = request.qs().account_id

    if (!accountId) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: 'Missing account_id',
      })
    }

    try {
      const link = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: 'https://yourapp.com/onboarding/refresh',
        return_url: 'https://yourapp.com/onboarding/return',
        type: 'account_onboarding',
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: link.url,
      })
    } catch (err) {
      logger.error(`get onboarding link error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @delete
   * @summary Delete consultant Stripe connected account
   * @description Deletes the specified connected account from Stripe
   * @responseBody 200 - { code: 200, message: "Account deleted successfully" }
   * @responseBody 400 - { code: 400, message: "Missing or invalid account_id" }
   * @responseBody 500 - { code: 500, message: "Internal server error" }
   */

  public async delete({ request, response }: HttpContext) {
    const accountId = request.param('account-id')

    if (!accountId) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: 'Missing account_id',
      })
    }

    try {
      const deleted = await this.stripe.accounts.del(accountId)

      return response.ok({
        code: HttpCodes.OK,
        message: 'Account deleted successfully',
        result: deleted,
      })
    } catch (err) {
      logger.error(`delete consultant error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }
}
