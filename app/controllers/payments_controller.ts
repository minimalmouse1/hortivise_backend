// start/controllers/PaymentsController.ts
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import type { HttpContext } from '@adonisjs/core/http'
import stripe from '@vbusatta/adonis-stripe/services/main'
import { CustomerService } from '#services/customer_service'
import { charge, chargeResponse, verifyResponse } from '#validators/payment'
import logger from '@adonisjs/core/services/logger'

export default class PaymentsController {
  private service = new CustomerService()
  private stripe = stripe.api

  /**
   * @charge
   * @summary Charge customer
   * @description Charge the customer based on the provided price ID using one-time payment mode.
   * @requestBody <charge>
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<chargeResponse>"}
   * @responseBody 400 - {"code": 400, "message": "Recurring price cannot be charged with mode: payment. Use a one-time price."} - Validation error
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */

  async charge({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await charge.validate(data)

    try {
      const price = await this.stripe.prices.retrieve(payload.priceId)
      if (price.recurring) {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Recurring price cannot be charged with mode: payment. Use a one-time price.',
        })
      }

      const existingCustomers = await this.service.Search({
        field: 'email',
        value: payload.customerEmail,
      })

      let customerId: string
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const newCustomer = await this.service.Create({
          params: { email: payload.customerEmail },
        })
        customerId = newCustomer.id
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        success_url: payload?.success_url
          ? `${payload.success_url}?session_id={CHECKOUT_SESSION_ID}`
          : 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: payload?.cancel_url || 'http://localhost:3000/cancel',
        line_items: [
          {
            price: payload.priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',

        metadata: {
          customer_email: payload.customerEmail,
          price_id: payload.priceId,
        },
      })

      const validated = await chargeResponse.validate({ session_url: session.url })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error(`response ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @verify
   * @summary Verify checkout session after success
   * @description Retrieve session details and confirm payment status
   * @paramQuery session_id - The session_id of the payment - @type(string)
   * @responseBody 200 - { "code": 200, "message": "Payment confirmed", result: "<verifyResponse>" }
   * @responseBody 400 - { "code": 400, "message": "Missing session_id" }
   * @responseBody 400 - { "code": 400, "message": "Payment incomplete or failed" }
   * @responseBody 500 - { "code": 500, "message": "Internal server error" }
   */

  async verify({ request, response }: HttpContext) {
    const sessionId = request.qs().session_id

    if (!sessionId) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: 'Missing session_id',
      })
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        const validated = await verifyResponse.validate({
          id: session.id,
          currency: session.currency,
          created: session.created,
          email: session.customer_details?.email,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          payment_status: session.payment_status,
        })
        return response.ok({
          code: HttpCodes.OK,
          message: 'Payment confirmed',
          result: validated,
        })
      } else {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Payment incomplete or failed',
          result: {
            id: session.id,
            currency: session.currency,
            created: session.created,
            email: session.customer_details?.email,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            payment_status: session.payment_status,
          },
        })
      }
    } catch (err) {
      logger.error(`verify error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }
}
